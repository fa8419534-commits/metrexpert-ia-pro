import { TRPCError } from "@trpc/server";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { buildEstimateWorkbook, type ProjectEstimate } from "./excel";
import { BTP_JSON_OUTPUT_ENFORCEMENT, BTP_SYSTEM_PROMPT } from "./btpPrompt";
import { parseJsonObjectFromLLM } from "./json";
import { normalizeEstimateAmbiguities } from "./estimateNormalization";
import { createClientAccessCode, DAILY_LIMIT, disableClientAccessCode, getClientAccessStatus, getFreeTrialRetentionDays, getGenerationStats, getHourlyQuotaStatus, hasValidAccessCookie, hasValidAdminCookie, HOURLY_LIMIT, isAccessCodeValid, isAdminAccessCodeValid, listClientAccessCodes, listFreeTrialContacts, markFreeTrialConverted, markFreeTrialWhatsAppContacted, markFreeTrialUnsubscribed, purgeExpiredFreeTrialContacts, releaseClientMonthlyQuota, releaseFreeTrialReservation, releaseGenerationQuota, reserveClientMonthlyQuota, reserveGenerationQuota, reserveFreeTrial, setAccessCookie, setAdminCookie, setFreeTrialRetentionDays, unsubscribeFreeTrialContact, verifyClientAccessCode } from "./security";
import type { GenerationQuotaReservation } from "./security";
import { createPaymentRequest, getClientPaymentHistory, getPaymentProofUrl, getPaymentRequest, listPaymentRequests, reviewPaymentProof, reviewPaymentRequest, uploadPaymentProof } from "./paymentRequests";
import { buildHypotheses, runQuantityChecks } from "./quantityChecks";
import { getLastSuccessfulBackupAt, listPurgeRuns, markSuccessfulBackupAt, recordPurgeRun } from "./opsTracking";

const inFlightGenerationRequests = new Map<string, number>();
const IDEMPOTENCY_KEY_TTL_MS = 10 * 60 * 1000;

export function claimGenerationRequest(idempotencyKey: string) {
  const now = Date.now();
  inFlightGenerationRequests.forEach((createdAt, key) => {
    if (now - createdAt > IDEMPOTENCY_KEY_TTL_MS) inFlightGenerationRequests.delete(key);
  });
  if (inFlightGenerationRequests.has(idempotencyKey)) return false;
  inFlightGenerationRequests.set(idempotencyKey, now);
  return true;
}

export function releaseGenerationRequest(idempotencyKey: string) {
  inFlightGenerationRequests.delete(idempotencyKey);
}

const estimateSchema = {
  type: "object",
  properties: {
    projectTitle: { type: "string" },
    client: { type: "string" },
    location: { type: "string" },
    summary: { type: "string" },
    currency: { type: "string" },
    geometry: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string" }, designation: { type: "string" }, formula: { type: "string", enum: ["linear", "surface", "volume", "count"] }, unit: { type: "string" },
          length: { type: ["number", "null"] }, width: { type: ["number", "null"] }, height: { type: ["number", "null"] }, openingArea: { type: ["number", "null"] }, quantity: { type: ["number", "null"] }, notes: { type: ["string", "null"] },
        },
        required: ["code", "designation", "formula", "unit"], additionalProperties: false,
      },
    },
    measures: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string" },
          designation: { type: "string" },
          unit: { type: "string" },
          quantity: { type: "number" },
          unitPrice: { type: "number" },
          factor: { type: "number" },
          notes: { type: "string" },
        },
        required: ["code", "designation", "unit", "quantity"],
        additionalProperties: false,
      },
    },
  },
  required: ["projectTitle", "geometry", "measures"],
  additionalProperties: false,
} as const;

export const requestSchema = z.object({
  idempotencyKey: z.string().uuid("Identifiant de génération invalide."),
  description: z.string().trim().min(20, "Décrivez le projet avec au moins 20 caractères.").max(50_000),
  geometry: z.array(z.object({
    code: z.string().trim().min(1).max(40),
    designation: z.string().trim().min(1).max(240),
    formula: z.enum(["linear", "surface", "volume", "count"]),
    unit: z.string().trim().min(1).max(20),
    length: z.number().finite().nonnegative().optional(),
    width: z.number().finite().nonnegative().optional(),
    height: z.number().finite().nonnegative().optional(),
    openingArea: z.number().finite().nonnegative().optional(),
    quantity: z.number().finite().nonnegative().optional(),
    notes: z.string().max(500).optional(),
  }).superRefine((value, ctx) => {
    if (value.formula !== "count" && value.length === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["length"], message: "La longueur est requise pour cette formule." });
    if (["surface", "volume"].includes(value.formula) && value.width === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["width"], message: "La largeur est requise pour cette formule." });
    if (value.formula === "volume" && value.height === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["height"], message: "La hauteur est requise pour un volume." });
  })).max(100).optional(),
  clientPhone: z.string().trim().max(80).optional(),
  clientEmail: z.string().trim().max(160).optional(),
  trialPhone: z.string().trim().max(32).optional(),
  trialEmail: z.string().trim().max(160).optional(),
  trialConsent: z.literal(true).optional(),
  verifiedBy: z.string().trim().max(160).optional(),
  validationDate: z.string().trim().max(40).optional(),
  signatureImageDataUrl: z.string().max(2_500_000).optional(),
  stampImageDataUrl: z.string().max(2_500_000).optional(),
  file: z.object({
    name: z.string().max(180),
    mimeType: z.enum(["application/pdf", "image/png", "image/jpeg", "image/webp"]),
    dataUrl: z.string().max(12_000_000),
  }).optional(),
});

function readRasterDimensions(buffer: Buffer, mimeType: "image/png" | "image/jpeg") {
  if (mimeType === "image/png") return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    const segmentLength = buffer.readUInt16BE(offset + 2);
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xc3 || marker >= 0xc5 && marker <= 0xc7 || marker >= 0xc9 && marker <= 0xcb || marker >= 0xcd && marker <= 0xcf;
    if (isStartOfFrame && offset + 8 < buffer.length) return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    if (!segmentLength) break;
    offset += 2 + segmentLength;
  }
  throw new Error("Dimensions JPEG introuvables");
}

export function validateBrandImageDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Les images de signature et de tampon doivent être au format PNG ou JPEG." });
  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (buffer.length > 1_500_000) throw new TRPCError({ code: "BAD_REQUEST", message: "Chaque image de validation doit peser moins de 1,5 Mo." });
  const isPng = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  if ((match[1] === "image/png" && !isPng) || (match[1] === "image/jpeg" && !isJpeg)) throw new TRPCError({ code: "BAD_REQUEST", message: "Le contenu binaire de l’image ne correspond pas à son format déclaré." });
  let dimensions: { width?: number; height?: number };
  try {
    dimensions = readRasterDimensions(buffer, match[1] as "image/png" | "image/jpeg");
  } catch {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Impossible de lire les dimensions de l’image de validation." });
  }
  if (!dimensions.width || !dimensions.height || dimensions.width < 1 || dimensions.height < 1 || dimensions.width > 2400 || dimensions.height > 1600) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Les dimensions de l’image doivent être comprises entre 1×1 et 2400×1600 pixels." });
  }
  return buffer;
}

export function validateUploadedDataUrl(file: { mimeType: string; dataUrl: string }) {
  const match = file.dataUrl.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match || match[1] !== file.mimeType) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier joint est malformé ou son type déclaré est incohérent." });
  }
  let bytes: Buffer;
  try {
    bytes = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  } catch {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier joint ne peut pas être décodé." });
  }
  const isPdf = file.mimeType === "application/pdf" && bytes.subarray(0, 4).toString("ascii") === "%PDF";
  const isPng = file.mimeType === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = file.mimeType === "image/jpeg" && bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  const isWebp = file.mimeType === "image/webp" && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if (!isPdf && !isPng && !isJpeg && !isWebp) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Le contenu du fichier ne correspond pas à son type déclaré." });
  }
  if (bytes.length > 8 * 1024 * 1024) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier joint dépasse la limite de 8 Mo." });
  }
}

function extractTrialClientName(description: string) {
  const match = description.match(/(?:nom du client|client|cliente)\s*[:\-]\s*([^\n,;]{2,160})/i);
  return match?.[1]?.trim() || undefined;
}

function extractText(response: Awaited<ReturnType<typeof invokeLLM>>): string {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.filter((part) => part.type === "text").map((part) => part.text).join("\n");
  return "";
}

function redactDiagnosticText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email-redacted]")
    .replace(/\+?\d[\d\s().-]{7,}/g, "[phone-redacted]");
}

function diagnosticFingerprint(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export type EstimateRequestMetadata = Pick<ProjectEstimate, "clientPhone" | "clientEmail" | "verifiedBy" | "validationDate" | "signatureImageDataUrl" | "stampImageDataUrl" | "trialVersion">;

export async function buildEstimateWorkbookFromRequest(estimate: ProjectEstimate, metadata: EstimateRequestMetadata) {
  return buildEstimateWorkbook({ ...estimate, ...metadata });
}

export function validateEstimate(value: unknown, requestId?: string): ProjectEstimate {
  const optionalText = (max: number) => z.string().max(max).nullish().transform((entry) => entry ?? undefined);
  const optionalNumber = (positive = false) => (positive ? z.number().finite().positive() : z.number().finite().nonnegative()).nullish().transform((entry) => entry ?? undefined);
  const parsed = z.object({
    projectTitle: z.string().min(1).max(240),
    client: optionalText(240),
    location: optionalText(240),
    summary: optionalText(4_000),
    currency: optionalText(12),
    geometry: z.array(z.object({
      code: z.string().min(1).max(40), designation: z.string().min(1).max(240), formula: z.enum(["linear", "surface", "volume", "count"]), unit: z.string().min(1).max(20),
      length: optionalNumber(), width: optionalNumber(), height: optionalNumber(), openingArea: optionalNumber(), quantity: optionalNumber(), notes: optionalText(500),
    })).max(100).optional(),
    measures: z.array(z.object({
      code: z.string().min(1).max(40),
      designation: z.string().min(1).max(500),
      unit: z.string().min(1).max(20),
      quantity: z.number().finite().nonnegative(),
      unitPrice: optionalNumber(),
      factor: optionalNumber(true),
      notes: optionalText(1_000),
    })).min(1).max(500),
  }).safeParse(value);

  if (!parsed.success) {
    console.error("[Estimate] Structured result validation failed", {
      requestId,
      issues: parsed.error.issues.map((issue) => ({ path: issue.path, code: issue.code, message: issue.message })),
    });
    throw new TRPCError({ code: "BAD_REQUEST", message: `La réponse de l’IA est incomplète. Référence : ${requestId || "non disponible"}.` });
  }
  return parsed.data;
}

const adminProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!hasValidAdminCookie(ctx)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Accès administrateur requis." });
  return next();
});

export const appRouter = router({
  system: systemRouter,
  security: router({
    status: publicProcedure.query(async ({ ctx }) => {
      const sharedUnlocked = hasValidAccessCookie(ctx);
      const clientStatus = sharedUnlocked ? { unlocked: false as const } : await getClientAccessStatus(ctx);
      const unlocked = sharedUnlocked || clientStatus.unlocked;
      return {
        unlocked,
        accessType: sharedUnlocked ? "shared" as const : clientStatus.unlocked ? "client" as const : null,
        ...(unlocked ? await getHourlyQuotaStatus(ctx) : {}),
        ...(clientStatus.unlocked ? { clientName: clientStatus.clientName, monthlyRemaining: clientStatus.monthlyRemaining, monthlyQuota: clientStatus.monthlyQuota, expiresAt: clientStatus.expiresAt } : {}),
        ...(ctx.user?.role === "admin" ? await getGenerationStats() : {}),
      };
    }),
    verifyAccessCode: publicProcedure.input(z.object({ accessCode: z.string().min(1).max(200) })).mutation(({ ctx, input }) => {
      if (!isAccessCodeValid(input.accessCode)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Code d’accès invalide." });
      setAccessCookie(ctx);
      return { valid: true as const };
    }),
    verifyClientCode: publicProcedure.input(z.object({ accessCode: z.string().trim().min(8).max(80) })).mutation(async ({ ctx, input }) => {
      const status = await verifyClientAccessCode(ctx, input.accessCode);
      if (!status) throw new TRPCError({ code: "UNAUTHORIZED", message: "Code client invalide, désactivé ou expiré." });
      return { valid: true as const, accessType: "client" as const, ...status };
    }),
    verifyAdminCode: publicProcedure.input(z.object({ accessCode: z.string().min(1).max(200) })).mutation(({ ctx, input }) => {
      if (!isAdminAccessCodeValid(input.accessCode)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Code administrateur invalide." });
      setAdminCookie(ctx);
      return { valid: true as const };
    }),
    adminStatus: publicProcedure.query(({ ctx }) => ({ unlocked: hasValidAdminCookie(ctx) })),
    adminListCodes: adminProcedure.query(() => listClientAccessCodes()),
    adminListPaymentRequests: adminProcedure.query(() => listPaymentRequests()),
    adminGetPaymentProof: adminProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => getPaymentProofUrl(input.id)),
    adminReviewPaymentProof: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["approved", "rejected"]), proofNote: z.string().trim().max(500).optional() })).mutation(({ input }) => reviewPaymentProof(input.id, input.status, input.proofNote)),
    adminReviewPaymentRequest: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["confirmed", "rejected"]), adminNote: z.string().trim().max(500).optional() })).mutation(({ input }) => reviewPaymentRequest(input.id, input.status, input.adminNote)),
    submitPaymentRequest: publicProcedure.input(z.object({ clientName: z.string().trim().min(1).max(160), phone: z.string().trim().min(8).max(32), email: z.string().trim().email().max(320).optional(), planQuota: z.union([z.literal(5), z.literal(15), z.literal(40)]), paymentMethod: z.enum(["wave", "moov", "mtn", "autre"]), paymentReference: z.string().trim().min(3).max(120) })).mutation(({ input }) => createPaymentRequest(input)),
    uploadPaymentProof: publicProcedure.input(z.object({ requestKey: z.string().trim().min(16).max(64), fileName: z.string().trim().min(1).max(160), dataUrl: z.string().max(8 * 1024 * 1024) })).mutation(({ input }) => uploadPaymentProof(input.requestKey, { fileName: input.fileName, dataUrl: input.dataUrl })),
    getPaymentRequest: publicProcedure.input(z.object({ requestKey: z.string().trim().min(16).max(64) })).query(({ input }) => getPaymentRequest(input.requestKey)),
    clientPaymentDashboard: publicProcedure.query(({ ctx }) => getClientPaymentHistory(ctx)),
    adminListFreeTrials: adminProcedure.query(() => listFreeTrialContacts()),
    adminGetFreeTrialRetention: adminProcedure.query(async () => ({ retentionDays: await getFreeTrialRetentionDays() })),
    adminSetFreeTrialRetention: adminProcedure.input(z.object({ retentionDays: z.number().int().min(30).max(730) })).mutation(async ({ input }) => ({ retentionDays: await setFreeTrialRetentionDays(input.retentionDays) })),
    adminGetBackupStatus: adminProcedure.query(async () => ({ lastSuccessfulBackupAt: await getLastSuccessfulBackupAt() })),
    adminMarkBackupSuccessful: adminProcedure.mutation(async () => ({ lastSuccessfulBackupAt: await markSuccessfulBackupAt() })),
    adminListPurgeRuns: adminProcedure.query(async () => listPurgeRuns(100)),
    adminRunHeartbeatCheck: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const code = (await listClientAccessCodes()).find((item) => item.id === input.id);
      if (!code) throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur introuvable dans les accès clients." });
      const expired = Boolean(code.disabledAt) || new Date(code.expiresAt).getTime() <= Date.now();
      return { id: code.id, clientName: code.clientName, status: expired ? "inactive" as const : code.monthlyRemaining > 0 ? "active" as const : "quota" as const, checkedAt: new Date(), monthlyRemaining: code.monthlyRemaining, expiresAt: code.expiresAt };
    }),
    adminPurgeExpiredFreeTrials: adminProcedure.mutation(async () => {
      const startedAt = new Date();
      try {
        const result = await purgeExpiredFreeTrialContacts();
        await recordPurgeRun({ runType: "manual", status: "success", ...result, startedAt, completedAt: new Date() });
        return result;
      } catch (error) {
        const retentionDays = await getFreeTrialRetentionDays();
        await recordPurgeRun({ runType: "manual", status: "failed", deletedCount: 0, retentionDays, cutoff: new Date(Date.now() - retentionDays * 86_400_000), errorMessage: error instanceof Error ? error.message : String(error), startedAt, completedAt: new Date() });
        throw error;
      }
    }),
    adminMarkFreeTrialWhatsAppContacted: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => markFreeTrialWhatsAppContacted(input.id).then((lastWhatsAppContactAt) => ({ success: true as const, lastWhatsAppContactAt }))),
    adminMarkFreeTrialConverted: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => markFreeTrialConverted(input.id).then(() => ({ success: true as const }))),
    adminMarkFreeTrialUnsubscribed: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => markFreeTrialUnsubscribed(input.id).then(() => ({ success: true as const }))),
    adminCreateCode: adminProcedure.input(z.object({ clientName: z.string().trim().min(1).max(160), monthlyQuota: z.union([z.literal(5), z.literal(15), z.literal(40)]), paymentMethod: z.enum(["wave", "moov", "mtn", "autre"]).optional(), paymentReference: z.string().trim().max(120).optional() })).mutation(({ input }) => createClientAccessCode(input.clientName, input.monthlyQuota, input.paymentMethod, input.paymentReference)),
    adminDisableCode: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => disableClientAccessCode(input.id).then(() => ({ success: true as const }))),
    requestUnsubscribe: publicProcedure.input(z.object({ phone: z.string().trim().max(32).optional(), email: z.string().trim().max(160).optional() })).mutation(({ input }) => unsubscribeFreeTrialContact(input.phone, input.email)),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  estimate: router({
    generate: publicProcedure.input(requestSchema).mutation(async ({ ctx, input }) => {
      const requestId = randomUUID();
      if (!claimGenerationRequest(input.idempotencyKey)) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Cette génération est déjà en cours. Patientez avant de réessayer." });
      }
      let quotaReservation: GenerationQuotaReservation | undefined;
      let monthlyClientId: number | undefined;
      let trialReservation: Extract<Awaited<ReturnType<typeof reserveFreeTrial>>, { allowed: true }> | undefined;
      try {
        const sharedUnlocked = hasValidAccessCookie(ctx);
        const clientStatus = sharedUnlocked ? { unlocked: false as const } : await getClientAccessStatus(ctx);
        let isFreeTrial = false;
        if (input.signatureImageDataUrl) validateBrandImageDataUrl(input.signatureImageDataUrl);
        if (input.stampImageDataUrl) validateBrandImageDataUrl(input.stampImageDataUrl);
        if (input.file) validateUploadedDataUrl(input.file);
        if (clientStatus.unlocked) {
          const monthly = await reserveClientMonthlyQuota(ctx);
          if (!monthly.allowed && monthly.reason === "monthly") throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Quota mensuel atteint, contactez-moi pour renouveler votre accès." });
          if (!monthly.allowed) throw new TRPCError({ code: "UNAUTHORIZED", message: "Code client invalide ou expiré." });
          monthlyClientId = monthly.clientId;
        }
        const quota = await reserveGenerationQuota(ctx);
        if (!quota.allowed) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: quota.reason === "hourly" ? `Limite atteinte : ${HOURLY_LIMIT} générations par heure.` : `Quota global atteint : ${DAILY_LIMIT} générations pour aujourd’hui.` });
        }
        quotaReservation = quota.reservation;
        console.info("[Security] Generation reserved", { requestId, remaining: quota.remaining, identity: ctx.user?.openId ? "user" : "ip" });
        if (!sharedUnlocked && !clientStatus.unlocked) {
          if (!input.trialPhone?.trim() && !input.trialEmail?.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "Renseignez votre téléphone ou votre e-mail pour utiliser l’essai gratuit." });
          if (input.trialConsent !== true) throw new TRPCError({ code: "BAD_REQUEST", message: "Votre consentement est requis pour enregistrer vos coordonnées d’essai gratuit." });
          const trial = await reserveFreeTrial(extractTrialClientName(input.description), input.trialPhone, input.trialEmail, new Date());
          if (!trial.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Vous avez déjà utilisé votre essai gratuit. Contactez-moi pour un abonnement au WhatsApp +225 01 51 61 05 12." });
          trialReservation = trial;
          isFreeTrial = true;
        }
        const userContent: Array<Record<string, unknown>> = [{
          type: "text",
          text: `Description du projet :\n${input.description}\n\nDimensions géométriques explicites fournies par l’utilisateur (source prioritaire pour le contrôle, ne pas inventer de dimensions) :\n${JSON.stringify(input.geometry ?? [], null, 2)}\n\nDocument joint : ${input.file?.name || "aucun"}`,
        }];
        if (input.file) {
          if (input.file.mimeType === "application/pdf") {
            userContent.push({ type: "file_url", file_url: { url: input.file.dataUrl, mime_type: input.file.mimeType } });
          } else {
            userContent.push({ type: "image_url", image_url: { url: input.file.dataUrl, detail: "high" } });
          }
        }

        const response = await invokeLLM({
          model: "claude-sonnet-4-6",
          messages: [
            { role: "system", content: `${BTP_SYSTEM_PROMPT}\n${BTP_JSON_OUTPUT_ENFORCEMENT}` },
            { role: "user", content: userContent as never },
          ],
          max_tokens: 12_000,
          response_format: {
            type: "json_schema",
            json_schema: { name: "btp_estimate", strict: true, schema: estimateSchema },
          },
        });
        const raw = extractText(response);
        console.info("[Estimate] Provider text received", {
          requestId,
          contentType: typeof response.choices?.[0]?.message?.content,
          finishReason: response.choices?.[0]?.finish_reason,
          length: raw.length,
          fingerprint: diagnosticFingerprint(raw),
          preview: redactDiagnosticText(raw).slice(0, 4_000),
        });
        let json: unknown;
        try {
          json = parseJsonObjectFromLLM(raw);
        } catch (parseError) {
          console.error("[Estimate] Claude response could not be parsed", {
            requestId,
            length: raw.length,
            fingerprint: diagnosticFingerprint(raw),
            preview: redactDiagnosticText(raw).slice(0, 4_000),
            parseError: parseError instanceof Error ? parseError.message : String(parseError),
          });
          throw new TRPCError({ code: "BAD_REQUEST", message: `La réponse de l’IA n’est pas lisible. Référence : ${requestId}.` });
        }
        const validatedEstimate = validateEstimate(json, requestId);
        const estimate = normalizeEstimateAmbiguities({ ...validatedEstimate, geometry: input.geometry ?? validatedEstimate.geometry });
        const geometryChecks = runQuantityChecks(estimate).filter((check) => (estimate.geometry ?? []).some((dimension) => dimension.code === check.code));
        const workbook = await buildEstimateWorkbookFromRequest(estimate, {
          clientPhone: input.clientPhone || undefined,
          clientEmail: input.clientEmail || undefined,
          verifiedBy: input.verifiedBy || undefined,
          validationDate: input.validationDate || undefined,
          signatureImageDataUrl: input.signatureImageDataUrl || undefined,
          stampImageDataUrl: input.stampImageDataUrl || undefined,
          trialVersion: isFreeTrial,
        });
        return {
          filename: `metrexpert-${Date.now()}.xlsx`,
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          data: workbook.toString("base64"),
          lineCount: estimate.measures.length,
          preview: {
            projectTitle: estimate.projectTitle,
            client: estimate.client || "À compléter",
            location: estimate.location || "À compléter",
            clientPhone: input.clientPhone || "À compléter",
            clientEmail: input.clientEmail || "À compléter",
            verifiedBy: input.verifiedBy || "À compléter",
            validationDate: input.validationDate || "À compléter",
            trialVersion: isFreeTrial,
            currency: estimate.currency || "FCFA",
            summary: estimate.summary || "Résumé non renseigné.",
            hypotheses: estimate.hypotheses?.length ? estimate.hypotheses : buildHypotheses(estimate),
            measures: estimate.measures,
            geometry: estimate.geometry ?? [],
            geometryChecks,
            total: estimate.measures.reduce((sum, item) => sum + item.quantity * (item.factor ?? 1) * (item.unitPrice ?? 0), 0),
          },
        };
      } catch (error) {
        if (trialReservation) await releaseFreeTrialReservation(trialReservation);
        if (monthlyClientId !== undefined) await releaseClientMonthlyQuota(monthlyClientId);
        if (quotaReservation) await releaseGenerationQuota(quotaReservation);
        if (error instanceof TRPCError) throw error;
        console.error("[Estimate] Generation failed", { requestId, error: error instanceof Error ? error.message : String(error) });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La génération a échoué. Votre droit a été restauré ; vous pouvez réessayer." });
      } finally {
        releaseGenerationRequest(input.idempotencyKey);
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
