import { TRPCError } from "@trpc/server";
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
import { createClientAccessCode, DAILY_LIMIT, disableClientAccessCode, getClientAccessStatus, getGenerationStats, getHourlyQuotaStatus, hasValidAccessCookie, hasValidAdminCookie, HOURLY_LIMIT, isAccessCodeValid, isAdminAccessCodeValid, listClientAccessCodes, listFreeTrialContacts, markFreeTrialConverted, markFreeTrialWhatsAppContacted, markFreeTrialUnsubscribed, unsubscribeFreeTrialContact, releaseClientMonthlyQuota, releaseFreeTrialReservation, releaseGenerationQuota, reserveClientMonthlyQuota, reserveGenerationQuota, reserveFreeTrial, setAccessCookie, setAdminCookie, verifyClientAccessCode } from "./security";
import type { GenerationQuotaReservation } from "./security";
import { runQuantityChecks } from "./quantityChecks";

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
          length: { type: "number" }, width: { type: "number" }, height: { type: "number" }, openingArea: { type: "number" }, quantity: { type: "number" }, notes: { type: "string" },
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
        required: ["code", "designation", "unit", "quantity", "unitPrice", "factor", "notes"],
        additionalProperties: false,
      },
    },
  },
  required: ["projectTitle", "client", "location", "summary", "currency", "measures"],
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

export type EstimateRequestMetadata = Pick<ProjectEstimate, "clientPhone" | "clientEmail" | "verifiedBy" | "validationDate" | "signatureImageDataUrl" | "stampImageDataUrl" | "trialVersion">;

export async function buildEstimateWorkbookFromRequest(estimate: ProjectEstimate, metadata: EstimateRequestMetadata) {
  return buildEstimateWorkbook({ ...estimate, ...metadata });
}

export function validateEstimate(value: unknown): ProjectEstimate {
  const parsed = z.object({
    projectTitle: z.string().min(1).max(240),
    client: z.string().max(240).optional(),
    location: z.string().max(240).optional(),
    summary: z.string().max(4_000).optional(),
    currency: z.string().max(12).optional(),
    geometry: z.array(z.object({
      code: z.string().min(1).max(40), designation: z.string().min(1).max(240), formula: z.enum(["linear", "surface", "volume", "count"]), unit: z.string().min(1).max(20),
      length: z.number().finite().nonnegative().optional(), width: z.number().finite().nonnegative().optional(), height: z.number().finite().nonnegative().optional(), openingArea: z.number().finite().nonnegative().optional(), quantity: z.number().finite().nonnegative().optional(), notes: z.string().max(500).optional(),
    })).max(100).optional(),
    measures: z.array(z.object({
      code: z.string().min(1).max(40),
      designation: z.string().min(1).max(500),
      unit: z.string().min(1).max(20),
      quantity: z.number().finite().nonnegative(),
          unitPrice: z.number().finite().nonnegative().optional(),
          factor: z.number().finite().positive().optional(),
          notes: z.string().max(1_000).optional(),
    })).min(1).max(500),
  }).safeParse(value);

  if (!parsed.success) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Le JSON renvoyé par l’IA ne respecte pas le format attendu." });
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
    adminListFreeTrials: adminProcedure.query(() => listFreeTrialContacts()),
    adminMarkFreeTrialWhatsAppContacted: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => markFreeTrialWhatsAppContacted(input.id).then((lastWhatsAppContactAt) => ({ success: true as const, lastWhatsAppContactAt }))),
    adminMarkFreeTrialConverted: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => markFreeTrialConverted(input.id).then(() => ({ success: true as const }))),
    adminMarkFreeTrialUnsubscribed: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => markFreeTrialUnsubscribed(input.id).then(() => ({ success: true as const }))),
    adminCreateCode: adminProcedure.input(z.object({ clientName: z.string().trim().min(1).max(160), monthlyQuota: z.union([z.literal(5), z.literal(15), z.literal(40)]) })).mutation(({ input }) => createClientAccessCode(input.clientName, input.monthlyQuota)),
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
        console.info("[Security] Generation reserved", { remaining: quota.remaining, identity: ctx.user?.openId ? "user" : "ip" });
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
        let json: unknown;
        try {
          json = parseJsonObjectFromLLM(raw);
        } catch (parseError) {
          console.error("[Estimate] Claude response could not be parsed", {
            length: raw.length,
            preview: raw.slice(0, 4_000),
            parseError: parseError instanceof Error ? parseError.message : String(parseError),
          });
          throw new TRPCError({ code: "BAD_REQUEST", message: "La réponse de l’IA n’est pas un JSON valide." });
        }
        const validatedEstimate = validateEstimate(json);
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
            currency: estimate.currency || "FCFA",
            summary: estimate.summary || "Résumé non renseigné.",
            measures: estimate.measures,
            geometry: estimate.geometry ?? [],
            geometryChecks,
          },
        };
      } catch (error) {
        if (trialReservation) await releaseFreeTrialReservation(trialReservation);
        if (monthlyClientId !== undefined) await releaseClientMonthlyQuota(monthlyClientId);
        if (quotaReservation) await releaseGenerationQuota(quotaReservation);
        if (error instanceof TRPCError) throw error;
        console.error("[Estimate] Generation failed", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La génération a échoué. Votre droit a été restauré ; vous pouvez réessayer." });
      } finally {
        releaseGenerationRequest(input.idempotencyKey);
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
