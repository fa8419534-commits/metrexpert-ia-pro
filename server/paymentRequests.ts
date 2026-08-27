import crypto from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { clientAccessCodes, paymentRequests } from "../drizzle/schema";
import { getDb } from "./db";
import { createClientAccessCode, getClientAccessStatus } from "./security";
import { getSubscriptionPlan, type SubscriptionQuota } from "@shared/plans";
import { storageGetSignedUrl, storagePut } from "./storage";

export type PaymentStatus = "pending" | "confirmed" | "rejected";
type MemoryPaymentRequest = {
  id: number;
  requestKey: string;
  clientName: string;
  phone: string;
  email: string | null;
  planQuota: SubscriptionQuota;
  amountXof: number;
  paymentMethod: "wave" | "moov" | "mtn" | "autre";
  paymentReference: string;
  status: PaymentStatus;
  accessCodeId: number | null;
  accessCode: string | null;
  adminNote: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  accessExpiresAt: Date | null;
  proofKey: string | null;
  proofFileName: string | null;
  proofUploadedAt: Date | null;
  proofStatus: "pending" | "approved" | "rejected" | null;
  proofNote: string | null;
};

const memory = new Map<number, MemoryPaymentRequest>();
let nextId = 1;
const isTestRuntime = process.env.NODE_ENV === "test" || process.env.VITEST === "true" || Boolean(process.env.VITEST_WORKER_ID);

export function resetPaymentRequestsForTests() {
  memory.clear();
  nextId = 1;
}

function toPublic(record: any) {
  return {
    id: record.id,
    requestKey: record.requestKey,
    clientName: record.clientName,
    phone: record.phone,
    email: record.email,
    planQuota: record.planQuota,
    amountXof: record.amountXof,
    paymentMethod: record.paymentMethod,
    paymentReference: record.paymentReference,
    status: record.status,
    accessCodeId: record.accessCodeId,
    adminNote: record.adminNote,
    createdAt: record.createdAt,
    reviewedAt: record.reviewedAt,
    proofFileName: record.proofFileName ?? null,
    proofUploadedAt: record.proofUploadedAt ?? null,
    proofStatus: record.proofStatus ?? null,
    proofNote: record.proofNote ?? null,
    hasProof: Boolean(record.proofKey),
  };
}

export async function createPaymentRequest(input: { clientName: string; phone: string; email?: string; planQuota: SubscriptionQuota; paymentMethod: "wave" | "moov" | "mtn" | "autre"; paymentReference: string }) {
  const plan = getSubscriptionPlan(input.planQuota);
  if (!plan) throw new Error("Forfait invalide");
  const duplicate = Array.from(memory.values()).find((item) => item.paymentReference.toLowerCase() === input.paymentReference.toLowerCase());
  if (duplicate) return { ...toPublic(duplicate), alreadySubmitted: true };
  const requestKey = crypto.randomBytes(16).toString("hex");
  const now = new Date();
  const db = isTestRuntime ? null : await getDb();
  if (db) {
    const result = await db.insert(paymentRequests).values({ requestKey, clientName: input.clientName, phone: input.phone, email: input.email || null, planQuota: input.planQuota, amountXof: plan.priceXof, paymentMethod: input.paymentMethod, paymentReference: input.paymentReference, status: "pending", createdAt: now, updatedAt: now });
    return { requestKey, id: Number(result[0].insertId), clientName: input.clientName, planQuota: input.planQuota, amountXof: plan.priceXof, paymentMethod: input.paymentMethod, paymentReference: input.paymentReference, status: "pending" as const, alreadySubmitted: false };
  }
  const record: MemoryPaymentRequest = { id: nextId++, requestKey, clientName: input.clientName, phone: input.phone, email: input.email || null, planQuota: input.planQuota, amountXof: plan.priceXof, paymentMethod: input.paymentMethod, paymentReference: input.paymentReference, status: "pending", accessCodeId: null, accessCode: null, adminNote: null, createdAt: now, reviewedAt: null, accessExpiresAt: null, proofKey: null, proofFileName: null, proofUploadedAt: null, proofStatus: null, proofNote: null };
  memory.set(record.id, record);
  return { ...toPublic(record), alreadySubmitted: false };
}

export async function getClientPaymentHistory(ctx: Parameters<typeof getClientAccessStatus>[0]) {
  const access = await getClientAccessStatus(ctx);
  if (!access.unlocked) return { access, requests: [] };
  const db = isTestRuntime ? null : await getDb();
  if (db) {
    const requests = await db.select().from(paymentRequests).where(eq(paymentRequests.accessCodeId, access.accessCodeId)).orderBy(desc(paymentRequests.createdAt));
    return { access, requests: requests.map(toPublic) };
  }
  return { access, requests: Array.from(memory.values()).filter((request) => request.accessCodeId === access.accessCodeId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map(toPublic) };
}

export async function listPaymentRequests() {
  const db = isTestRuntime ? null : await getDb();
  if (db) { const rows = await db.select().from(paymentRequests).orderBy(desc(paymentRequests.createdAt)); return rows.map(toPublic); }
  return Array.from(memory.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map(toPublic);
}

export async function getPaymentRequest(requestKey: string) {
  const db = isTestRuntime ? null : await getDb();
  if (db) {
    const rows = await db.select().from(paymentRequests).where(eq(paymentRequests.requestKey, requestKey)).limit(1);
    return rows[0] ? toPublic(rows[0]) : null;
  }
  const record = Array.from(memory.values()).find((item) => item.requestKey === requestKey);
  return record ? toPublic(record) : null;
}

export async function reviewPaymentRequest(id: number, status: Exclude<PaymentStatus, "pending">, adminNote?: string) {
  const db = isTestRuntime ? null : await getDb();
  if (!db) {
    const record = memory.get(id);
    if (!record) throw new Error("Demande introuvable");
    if (record.status === "confirmed" || record.status === "rejected") return { ...toPublic(record), accessCode: record.accessCode, expiresAt: record.accessExpiresAt };
    const reviewedAt = new Date();
    if (status === "confirmed") {
      const access = await createClientAccessCode(record.clientName, record.planQuota, record.paymentMethod, record.paymentReference);
      record.accessCodeId = access.id;
      record.accessCode = access.code;
      record.accessExpiresAt = access.expiresAt;
    }
    record.status = status;
    record.adminNote = adminNote || null;
    record.reviewedAt = reviewedAt;
    return { ...toPublic(record), accessCode: record.accessCode, expiresAt: record.accessExpiresAt };
  }
  const rows = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id)).limit(1);
  const record = rows[0];
  if (!record) throw new Error("Demande introuvable");
  if (record.status !== "pending") {
    const access = record.accessCodeId ? (await db.select({ expiresAt: clientAccessCodes.expiresAt }).from(clientAccessCodes).where(eq(clientAccessCodes.id, record.accessCodeId)).limit(1))[0] : undefined;
    return { ...toPublic(record), expiresAt: access?.expiresAt ?? null };
  }
  let accessCodeId: number | null = null;
  let accessCode: string | null = null;
  let expiresAt: Date | null = null;
  if (status === "confirmed") {
    const access = await createClientAccessCode(record.clientName, record.planQuota, record.paymentMethod, record.paymentReference);
    accessCodeId = access.id;
    accessCode = access.code;
    expiresAt = access.expiresAt;
  }
  await db.update(paymentRequests).set({ status, accessCodeId, adminNote: adminNote || null, reviewedAt: new Date() }).where(and(eq(paymentRequests.id, id), eq(paymentRequests.status, "pending")));
  return { ...toPublic({ ...record, status, accessCodeId, adminNote: adminNote || null }), accessCode, expiresAt };
}


function decodePaymentProof(dataUrl: string, fileName: string) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match) throw new Error("La preuve doit être une image PNG, JPEG ou WEBP valide.");
  const mimeType = match[1];
  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (!buffer.length || buffer.length > 5 * 1024 * 1024) throw new Error("La preuve dépasse la limite de 5 Mo.");
  const valid = (mimeType === "image/png" && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (mimeType === "image/jpeg" && buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) ||
    (mimeType === "image/webp" && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP");
  if (!valid) throw new Error("Le contenu de la preuve ne correspond pas au format déclaré.");
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "preuve-paiement";
  return { buffer, mimeType, safeName };
}

export async function uploadPaymentProof(requestKey: string, input: { fileName: string; dataUrl: string }) {
  const record = await getPaymentRequest(requestKey);
  if (!record) throw new Error("Demande de paiement introuvable.");
  const { buffer, mimeType, safeName } = decodePaymentProof(input.dataUrl, input.fileName);
  const db = isTestRuntime ? null : await getDb();
  const uploadedAt = new Date();
  const stored = await storagePut(`payment-proofs/${requestKey}/${safeName}`, buffer, mimeType);
  if (db) {
    await db.update(paymentRequests).set({ proofKey: stored.key, proofFileName: safeName, proofUploadedAt: uploadedAt, proofStatus: "pending", proofNote: null, updatedAt: uploadedAt }).where(eq(paymentRequests.requestKey, requestKey));
  } else {
    const memoryRecord = Array.from(memory.values()).find((item) => item.requestKey === requestKey);
    if (memoryRecord) { memoryRecord.proofKey = stored.key; memoryRecord.proofFileName = safeName; memoryRecord.proofUploadedAt = uploadedAt; memoryRecord.proofStatus = "pending"; memoryRecord.proofNote = null; }
  }
  return { success: true as const, proofFileName: safeName, proofUploadedAt: uploadedAt, proofStatus: "pending" as const };
}

export async function getPaymentProofUrl(id: number) {
  const db = isTestRuntime ? null : await getDb();
  const record = db ? (await db.select().from(paymentRequests).where(eq(paymentRequests.id, id)).limit(1))[0] : Array.from(memory.values()).find((item) => item.id === id);
  if (!record?.proofKey) throw new Error("Aucune preuve de paiement disponible.");
  return { url: await storageGetSignedUrl(record.proofKey), fileName: record.proofFileName, uploadedAt: record.proofUploadedAt, status: record.proofStatus };
}

export async function reviewPaymentProof(id: number, status: "approved" | "rejected", proofNote?: string) {
  const db = isTestRuntime ? null : await getDb();
  const note = proofNote?.trim() || null;
  if (db) {
    await db.update(paymentRequests).set({ proofStatus: status, proofNote: note, updatedAt: new Date() }).where(eq(paymentRequests.id, id));
    return { success: true as const, status, proofNote: note };
  }
  const record = memory.get(id);
  if (!record) throw new Error("Demande de paiement introuvable.");
  if (!record.proofKey) throw new Error("Aucune preuve de paiement disponible.");
  record.proofStatus = status;
  record.proofNote = note;
  return { success: true as const, status, proofNote: note };
}
