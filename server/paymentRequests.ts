import crypto from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { paymentRequests } from "../drizzle/schema";
import { getDb } from "./db";
import { createClientAccessCode } from "./security";
import { getSubscriptionPlan, type SubscriptionQuota } from "@shared/plans";

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
  const record: MemoryPaymentRequest = { id: nextId++, requestKey, clientName: input.clientName, phone: input.phone, email: input.email || null, planQuota: input.planQuota, amountXof: plan.priceXof, paymentMethod: input.paymentMethod, paymentReference: input.paymentReference, status: "pending", accessCodeId: null, accessCode: null, adminNote: null, createdAt: now, reviewedAt: null };
  memory.set(record.id, record);
  return { ...toPublic(record), alreadySubmitted: false };
}

export async function listPaymentRequests() {
  const db = isTestRuntime ? null : await getDb();
  if (db) return db.select().from(paymentRequests).orderBy(desc(paymentRequests.createdAt));
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
    if (record.status === "confirmed" || record.status === "rejected") return { ...toPublic(record), accessCode: record.accessCode };
    const reviewedAt = new Date();
    if (status === "confirmed") {
      const access = await createClientAccessCode(record.clientName, record.planQuota, record.paymentMethod, record.paymentReference);
      record.accessCodeId = access.id;
      record.accessCode = access.code;
    }
    record.status = status;
    record.adminNote = adminNote || null;
    record.reviewedAt = reviewedAt;
    return { ...toPublic(record), accessCode: record.accessCode };
  }
  const rows = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id)).limit(1);
  const record = rows[0];
  if (!record) throw new Error("Demande introuvable");
  if (record.status !== "pending") return toPublic(record);
  let accessCodeId: number | null = null;
  let accessCode: string | null = null;
  if (status === "confirmed") {
    const access = await createClientAccessCode(record.clientName, record.planQuota, record.paymentMethod, record.paymentReference);
    accessCodeId = access.id;
    accessCode = access.code;
  }
  await db.update(paymentRequests).set({ status, accessCodeId, adminNote: adminNote || null, reviewedAt: new Date() }).where(and(eq(paymentRequests.id, id), eq(paymentRequests.status, "pending")));
  return { ...toPublic({ ...record, status, accessCodeId, adminNote: adminNote || null }), accessCode };
}
