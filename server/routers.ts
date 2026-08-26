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
import { consumeGenerationQuota, DAILY_LIMIT, getGenerationStats, getHourlyQuotaStatus, hasValidAccessCookie, HOURLY_LIMIT, isAccessCodeValid, setAccessCookie } from "./security";

const estimateSchema = {
  type: "object",
  properties: {
    projectTitle: { type: "string" },
    client: { type: "string" },
    location: { type: "string" },
    summary: { type: "string" },
    currency: { type: "string" },
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

const requestSchema = z.object({
  description: z.string().trim().min(20, "Décrivez le projet avec au moins 20 caractères.").max(50_000),
  file: z.object({
    name: z.string().max(180),
    mimeType: z.enum(["application/pdf", "image/png", "image/jpeg", "image/webp"]),
    dataUrl: z.string().max(12_000_000),
  }).optional(),
});

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

function extractText(response: Awaited<ReturnType<typeof invokeLLM>>): string {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.filter((part) => part.type === "text").map((part) => part.text).join("\n");
  return "";
}

export function validateEstimate(value: unknown): ProjectEstimate {
  const parsed = z.object({
    projectTitle: z.string().min(1).max(240),
    client: z.string().max(240).optional(),
    location: z.string().max(240).optional(),
    summary: z.string().max(4_000).optional(),
    currency: z.string().max(12).optional(),
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

export const appRouter = router({
  system: systemRouter,
  security: router({
    status: publicProcedure.query(async ({ ctx }) => {
      const unlocked = hasValidAccessCookie(ctx);
      return {
        unlocked,
        ...(unlocked ? await getHourlyQuotaStatus(ctx) : {}),
        ...(ctx.user?.role === "admin" ? await getGenerationStats() : {}),
      };
    }),
    verifyAccessCode: publicProcedure.input(z.object({ accessCode: z.string().min(1).max(200) })).mutation(({ ctx, input }) => {
      if (!isAccessCodeValid(input.accessCode)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Code d’accès invalide." });
      }
      setAccessCookie(ctx);
      return { valid: true as const };
    }),
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
      try {
        if (!hasValidAccessCookie(ctx)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Déverrouillez l’application avec le code d’accès avant de générer." });
        }
        const quota = await consumeGenerationQuota(ctx);
        if (!quota.allowed) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: quota.reason === "hourly" ? `Limite atteinte : ${HOURLY_LIMIT} générations par heure.` : `Quota global atteint : ${DAILY_LIMIT} générations pour aujourd’hui.` });
        }
        console.info("[Security] Generation accepted", { remaining: quota.remaining, identity: ctx.user?.openId ? "user" : "ip" });
        if (input.file) validateUploadedDataUrl(input.file);
        const userContent: Array<Record<string, unknown>> = [{
          type: "text",
          text: `Description du projet :\n${input.description}\n\nDocument joint : ${input.file?.name || "aucun"}`,
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
        const estimate = normalizeEstimateAmbiguities(validateEstimate(json));
        const workbook = buildEstimateWorkbook(estimate);
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
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Estimate] Generation failed", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La génération a échoué. Vérifiez votre saisie puis réessayez." });
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
