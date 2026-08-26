import crypto from "node:crypto";
import { and, eq, gt, isNull, like, or, sql } from "drizzle-orm";
import { clientAccessCodes, freeTrialContacts, generationWindows } from "../drizzle/schema";
import { getDb } from "./db";
import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";

export const ACCESS_COOKIE = "metrexpert_access";
export const HOURLY_LIMIT = 5;
export const DAILY_LIMIT = 50;
const ACCESS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const ADMIN_ACCESS_MAX_AGE_MS = 8 * 60 * 60 * 1000;
export const ADMIN_ACCESS_COOKIE = "metrexpert_admin_access";
export const CLIENT_ACCESS_COOKIE = "metrexpert_client_access";
const isTestRuntime = process.env.NODE_ENV === "test" || process.env.VITEST === "true" || Boolean(process.env.VITEST_WORKER_ID) || process.argv.some((argument) => argument.includes("vitest"));
let forceMemoryForTests = false;
const memoryWindows = new Map<string, { count: number; windowStart: number; kind: "hour" | "day" }>();
type MemoryClientCode = { id: number; codeHash: string; clientName: string; monthlyQuota: number; monthlyUsed: number; createdAt: Date; expiresAt: Date; disabledAt: Date | null };
type MemoryFreeTrialContact = { id: number; clientName: string | null; phone: string | null; phoneHash: string | null; email: string | null; emailHash: string | null; trialAt: Date; convertedAt: Date | null; lastWhatsAppContactAt: Date | null; updatedAt: Date };
const memoryClientCodes = new Map<number, MemoryClientCode>();
const memoryFreeTrialContacts = new Map<number, MemoryFreeTrialContact>();
const memoryFreeTrialContactKeys = new Set<string>();
let nextMemoryClientCodeId = 1;
let nextMemoryFreeTrialId = 1;

export function resetSecurityStateForTests() {
  forceMemoryForTests = true;
  memoryWindows.clear();
  memoryClientCodes.clear();
  memoryFreeTrialContacts.clear();
  memoryFreeTrialContactKeys.clear();
  nextMemoryClientCodeId = 1;
  nextMemoryFreeTrialId = 1;
}

function hashClientCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function normalizeTrialPhone(phone: string | undefined) {
  const normalized = phone?.trim().replace(/\D/g, "");
  return normalized || undefined;
}

function normalizeTrialEmail(email: string | undefined) {
  const normalized = email?.trim().toLowerCase();
  return normalized || undefined;
}

function hashTrialContact(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export type FreeTrialReservation =
  | { allowed: true; contactId: number; phone?: string; email?: string }
  | { allowed: false; reason: "already_used" };

export type GenerationQuotaReservation = {
  hourScopeKey: string;
  dayScopeKey: string;
  released: boolean;
};

export async function releaseFreeTrialReservation(reservation: Extract<FreeTrialReservation, { allowed: true }>) {
  if (reservation.contactId <= 0) return;
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  if (db) {
    await db.delete(freeTrialContacts).where(eq(freeTrialContacts.id, reservation.contactId));
    if (reservation.phone) memoryFreeTrialContactKeys.delete(`phone:${reservation.phone}`);
    if (reservation.email) memoryFreeTrialContactKeys.delete(`email:${reservation.email}`);
  } else {
    const contact = memoryFreeTrialContacts.get(reservation.contactId);
    if (contact) {
      memoryFreeTrialContacts.delete(reservation.contactId);
      if (contact.phone) memoryFreeTrialContactKeys.delete(`phone:${contact.phone}`);
      if (contact.email) memoryFreeTrialContactKeys.delete(`email:${contact.email}`);
    }
  }
}

export async function hasUsedFreeTrial(phoneInput: string | undefined, emailInput: string | undefined) {
  const phone = normalizeTrialPhone(phoneInput);
  const email = normalizeTrialEmail(emailInput);
  if (!phone && !email) return false;
  const phoneHash = phone ? hashTrialContact(phone) : undefined;
  const emailHash = email ? hashTrialContact(email) : undefined;
  const keys = [phone ? `phone:${phone}` : null, email ? `email:${email}` : null].filter((key): key is string => Boolean(key));
  if (keys.some((key) => memoryFreeTrialContactKeys.has(key))) return true;
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  if (!db) return false;
  const conditions = [phoneHash ? eq(freeTrialContacts.phoneHash, phoneHash) : undefined, emailHash ? eq(freeTrialContacts.emailHash, emailHash) : undefined, phone ? eq(freeTrialContacts.phone, phone) : undefined, email ? eq(freeTrialContacts.email, email) : undefined].filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));
  if (!conditions.length) return false;
  return (await db.select({ id: freeTrialContacts.id }).from(freeTrialContacts).where(conditions.length === 1 ? conditions[0] : or(...conditions)).limit(1)).length > 0;
}

export async function reserveFreeTrial(
  clientName: string | undefined,
  phoneInput: string | undefined,
  emailInput: string | undefined,
): Promise<FreeTrialReservation> {
  const phone = normalizeTrialPhone(phoneInput);
  const email = normalizeTrialEmail(emailInput);
  if (!phone && !email) throw new Error("Un contact téléphone ou e-mail est requis pour l’essai gratuit.");
  const phoneHash = phone ? hashTrialContact(phone) : undefined;
  const emailHash = email ? hashTrialContact(email) : undefined;
  const contactKeys = [phone ? `phone:${phone}` : null, email ? `email:${email}` : null].filter((key): key is string => Boolean(key));
  if (contactKeys.some((key) => memoryFreeTrialContactKeys.has(key))) return { allowed: false, reason: "already_used" };
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  if (db) {
    const contactConditions = [phoneHash ? eq(freeTrialContacts.phoneHash, phoneHash) : undefined, emailHash ? eq(freeTrialContacts.emailHash, emailHash) : undefined, phone ? eq(freeTrialContacts.phone, phone) : undefined, email ? eq(freeTrialContacts.email, email) : undefined].filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));
    const existing = contactConditions.length ? await db.select({ id: freeTrialContacts.id }).from(freeTrialContacts).where(contactConditions.length === 1 ? contactConditions[0] : or(...contactConditions)).limit(1) : [];

    if (existing.length) return { allowed: false, reason: "already_used" };
    try {
      const inserted = await db.insert(freeTrialContacts).values({ clientName: clientName || null, phone: phone || null, phoneHash: phoneHash || null, email: email || null, emailHash: emailHash || null });
      contactKeys.forEach((key) => memoryFreeTrialContactKeys.add(key));
      return { allowed: true, contactId: Number(inserted[0].insertId), phone, email };
    } catch (error) {
      if (String(error).toLowerCase().includes("duplicate") || String(error).toLowerCase().includes("unique")) return { allowed: false, reason: "already_used" };
      throw error;
    }
  }
  const now = new Date();
  const contact = { id: nextMemoryFreeTrialId++, clientName: clientName || null, phone: phone || null, phoneHash: phoneHash || null, email: email || null, emailHash: emailHash || null, trialAt: now, convertedAt: null, lastWhatsAppContactAt: null, updatedAt: now };
  memoryFreeTrialContacts.set(contact.id, contact);
  contactKeys.forEach((key) => memoryFreeTrialContactKeys.add(key));
  return { allowed: true, contactId: contact.id, phone, email };
}

export async function listFreeTrialContacts() {
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  const rows = db ? await db.select().from(freeTrialContacts).orderBy(freeTrialContacts.trialAt) : Array.from(memoryFreeTrialContacts.values()).sort((a, b) => a.trialAt.getTime() - b.trialAt.getTime());
  return rows.map((record) => ({ id: record.id, clientName: record.clientName || "À compléter", phone: record.phone || "À compléter", email: record.email || "À compléter", trialAt: record.trialAt, convertedAt: record.convertedAt, lastWhatsAppContactAt: record.lastWhatsAppContactAt }));
}

export async function markFreeTrialWhatsAppContacted(id: number) {
  const contactedAt = new Date();
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  if (db) {
    await db.update(freeTrialContacts).set({ lastWhatsAppContactAt: contactedAt }).where(eq(freeTrialContacts.id, id));
    return contactedAt;
  }
  const record = memoryFreeTrialContacts.get(id);
  if (record) {
    record.lastWhatsAppContactAt = contactedAt;
    record.updatedAt = contactedAt;
  }
  return contactedAt;
}

export async function markFreeTrialConverted(id: number) {
  const convertedAt = new Date();
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  if (db) {
    await db.update(freeTrialContacts).set({ convertedAt }).where(eq(freeTrialContacts.id, id));
    return;
  }
  const record = memoryFreeTrialContacts.get(id);
  if (record) {
    record.convertedAt = convertedAt;
    record.updatedAt = convertedAt;
  }
}

function signedToken(prefix: string, value: string) {
  return crypto.createHmac("sha256", ENV.cookieSecret || "metrexpert-access").update(`${prefix}:${value}`).digest("hex");
}

export function isAdminAccessCodeValid(code: string) {
  if (!ENV.adminAccessCode || code.length !== ENV.adminAccessCode.length) return false;
  return crypto.timingSafeEqual(Buffer.from(code), Buffer.from(ENV.adminAccessCode));
}

export function hasValidAdminCookie(ctx: TrpcContext) {
  return Boolean(ENV.adminAccessCode && ctx.req.cookies?.[ADMIN_ACCESS_COOKIE] === signedToken("admin", ENV.adminAccessCode));
}

export function setAdminCookie(ctx: TrpcContext) {
  ctx.res.cookie(ADMIN_ACCESS_COOKIE, signedToken("admin", ENV.adminAccessCode), { httpOnly: true, secure: ENV.isProduction, sameSite: "lax", path: "/", maxAge: ADMIN_ACCESS_MAX_AGE_MS });
}

export function setClientAccessCookie(ctx: TrpcContext, codeHash: string) {
  ctx.res.cookie(CLIENT_ACCESS_COOKIE, signedToken("client", codeHash), { httpOnly: true, secure: ENV.isProduction, sameSite: "lax", path: "/", maxAge: ACCESS_MAX_AGE_MS });
}

async function getClientCodeByHash(codeHash: string) {
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  if (db) return (await db.select().from(clientAccessCodes).where(eq(clientAccessCodes.codeHash, codeHash)).limit(1))[0];
  return memoryClientCodes.get(Array.from(memoryClientCodes.entries()).find(([, code]) => code.codeHash === codeHash)?.[0] ?? -1);
}

export async function verifyClientAccessCode(ctx: TrpcContext, code: string) {
  const record = await getClientCodeByHash(hashClientCode(code));
  if (!record || record.disabledAt || record.expiresAt.getTime() <= Date.now()) return null;
  setClientAccessCookie(ctx, record.codeHash);
  return { clientName: record.clientName, monthlyRemaining: Math.max(0, record.monthlyQuota - record.monthlyUsed), expiresAt: record.expiresAt };
}

export function hasValidClientAccessCookie(ctx: TrpcContext) {
  const token = ctx.req.cookies?.[CLIENT_ACCESS_COOKIE];
  return Boolean(token && Array.from(memoryClientCodes.values()).some((record) => signedToken("client", record.codeHash) === token && !record.disabledAt && record.expiresAt.getTime() > Date.now()));
}

export async function getClientAccessStatus(ctx: TrpcContext) {
  const record = await getClientRecordFromCookie(ctx);
  if (!record) return { unlocked: false as const };
  return { unlocked: true as const, clientName: record.clientName, monthlyRemaining: Math.max(0, record.monthlyQuota - record.monthlyUsed), monthlyQuota: record.monthlyQuota, expiresAt: record.expiresAt };
}

async function getClientRecordFromCookie(ctx: TrpcContext) {
  const token = ctx.req.cookies?.[CLIENT_ACCESS_COOKIE];
  if (!token) return null;
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  if (db) {
    const rows = await db.select().from(clientAccessCodes).where(and(isNull(clientAccessCodes.disabledAt), gt(clientAccessCodes.expiresAt, new Date())));
    return rows.find((record) => signedToken("client", record.codeHash) === token) ?? null;
  }
  return Array.from(memoryClientCodes.values()).find((record) => signedToken("client", record.codeHash) === token && !record.disabledAt && record.expiresAt.getTime() > Date.now()) ?? null;
}

export async function reserveClientMonthlyQuota(ctx: TrpcContext) {
  const record = await getClientRecordFromCookie(ctx);
  if (!record) return { allowed: false as const, reason: "invalid" as const, remaining: 0 };
  if (record.monthlyUsed >= record.monthlyQuota) return { allowed: false as const, reason: "monthly" as const, remaining: 0, clientName: record.clientName };
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  if (db) {
    const result = await db.update(clientAccessCodes).set({ monthlyUsed: sql`${clientAccessCodes.monthlyUsed} + 1` }).where(and(eq(clientAccessCodes.id, record.id), sql`${clientAccessCodes.monthlyUsed} < ${clientAccessCodes.monthlyQuota}`, isNull(clientAccessCodes.disabledAt)));
    const updated = (await db.select().from(clientAccessCodes).where(eq(clientAccessCodes.id, record.id)).limit(1))[0];
    if (!updated || updated.monthlyUsed > updated.monthlyQuota || Number(result[0]?.affectedRows ?? 0) === 0) return { allowed: false as const, reason: "monthly" as const, remaining: 0, clientName: record.clientName };
    return { allowed: true as const, remaining: updated.monthlyQuota - updated.monthlyUsed, clientName: updated.clientName, clientId: updated.id };
  }
  const memory = memoryClientCodes.get(record.id);
  if (!memory || memory.monthlyUsed >= memory.monthlyQuota) return { allowed: false as const, reason: "monthly" as const, remaining: 0, clientName: record.clientName };
  memory.monthlyUsed += 1;
  return { allowed: true as const, remaining: memory.monthlyQuota - memory.monthlyUsed, clientName: memory.clientName, clientId: memory.id };
}

export async function releaseClientMonthlyQuota(clientId: number) {
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  if (db) {
    await db.update(clientAccessCodes).set({ monthlyUsed: sql`GREATEST(${clientAccessCodes.monthlyUsed} - 1, 0)` }).where(and(eq(clientAccessCodes.id, clientId), sql`${clientAccessCodes.monthlyUsed} > 0`));
    return;
  }
  const record = memoryClientCodes.get(clientId);
  if (record) record.monthlyUsed = Math.max(0, record.monthlyUsed - 1);
}

/** Compatibility wrapper for existing callers and tests. */
export async function consumeClientMonthlyQuota(ctx: TrpcContext) {
  const record = await getClientRecordFromCookie(ctx);
  if (!record) return { allowed: false as const, reason: "invalid" as const, remaining: 0 };
  if (record.monthlyUsed >= record.monthlyQuota) return { allowed: false as const, reason: "monthly" as const, remaining: 0, clientName: record.clientName };
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  if (db) {
    await db.update(clientAccessCodes).set({ monthlyUsed: sql`${clientAccessCodes.monthlyUsed} + 1` }).where(and(eq(clientAccessCodes.id, record.id), sql`${clientAccessCodes.monthlyUsed} < ${clientAccessCodes.monthlyQuota}`, isNull(clientAccessCodes.disabledAt)));
    const updated = (await db.select().from(clientAccessCodes).where(eq(clientAccessCodes.id, record.id)).limit(1))[0];
    if (!updated || updated.monthlyUsed > updated.monthlyQuota) return { allowed: false as const, reason: "monthly" as const, remaining: 0, clientName: record.clientName };
    return { allowed: true as const, remaining: updated.monthlyQuota - updated.monthlyUsed, clientName: updated.clientName };
  }
  const memory = memoryClientCodes.get(record.id);
  if (!memory || memory.monthlyUsed >= memory.monthlyQuota) return { allowed: false as const, reason: "monthly" as const, remaining: 0, clientName: record.clientName };
  memory.monthlyUsed += 1;
  return { allowed: true as const, remaining: memory.monthlyQuota - memory.monthlyUsed, clientName: memory.clientName };
}

export async function createClientAccessCode(clientName: string, monthlyQuota: number) {
  const code = `MXP-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
  const codeHash = hashClientCode(code);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt);
  expiresAt.setMonth(expiresAt.getMonth() + 1);
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  if (db) {
    const inserted = await db.insert(clientAccessCodes).values({ codeHash, clientName, monthlyQuota, monthlyUsed: 0, createdAt, expiresAt });
    return { id: Number(inserted[0].insertId), code, clientName, monthlyQuota, monthlyUsed: 0, createdAt, expiresAt, disabledAt: null };
  }
  const record = { id: nextMemoryClientCodeId++, codeHash, clientName, monthlyQuota, monthlyUsed: 0, createdAt, expiresAt, disabledAt: null };
  memoryClientCodes.set(record.id, record);
  return { ...record, code };
}

export async function listClientAccessCodes() {
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  const rows = db ? await db.select().from(clientAccessCodes).orderBy(clientAccessCodes.expiresAt) : Array.from(memoryClientCodes.values());
  return rows.map((record) => ({ id: record.id, clientName: record.clientName, monthlyQuota: record.monthlyQuota, monthlyRemaining: Math.max(0, record.monthlyQuota - record.monthlyUsed), expiresAt: record.expiresAt, disabledAt: record.disabledAt }));
}

export function expireClientAccessCodeForTests(id: number) {
  if (process.env.NODE_ENV !== "test" && process.env.VITEST !== "true") return;
  const record = memoryClientCodes.get(id);
  if (record) record.expiresAt = new Date(Date.now() - 1_000);
}

export async function disableClientAccessCode(id: number) {
  const disabledAt = new Date();
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  if (db) { await db.update(clientAccessCodes).set({ disabledAt }).where(eq(clientAccessCodes.id, id)); return; }
  const record = memoryClientCodes.get(id);
  if (record) record.disabledAt = disabledAt;
}

function accessToken() {
  return crypto.createHmac("sha256", ENV.cookieSecret || "metrexpert-access").update(ENV.accessCode).digest("hex");
}

export function hasValidAccessCookie(ctx: TrpcContext) {
  return Boolean(ENV.accessCode && ctx.req.cookies?.[ACCESS_COOKIE] === accessToken());
}

export function setAccessCookie(ctx: TrpcContext) {
  ctx.res.cookie(ACCESS_COOKIE, accessToken(), {
    httpOnly: true,
    secure: ENV.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE_MS,
  });
}

export function isAccessCodeValid(code: string) {
  if (!ENV.accessCode || code.length !== ENV.accessCode.length) return false;
  return crypto.timingSafeEqual(Buffer.from(code), Buffer.from(ENV.accessCode));
}

export function requestIdentity(ctx: TrpcContext) {
  const forwarded = ctx.req.headers?.["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim();
  return ctx.user?.openId ? `user:${ctx.user.openId}` : `ip:${forwardedIp || ctx.req.ip || "unknown"}`;
}

function bucket(kind: "hour" | "day", now: Date) {
  return kind === "hour" ? now.toISOString().slice(0, 13) : now.toISOString().slice(0, 10);
}

async function increment(scopeKey: string, kind: "hour" | "day", now: Date) {
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  if (db) {
    await db.insert(generationWindows).values({ scopeKey, windowKind: kind, windowStart: now, count: 1 }).onDuplicateKeyUpdate({
      set: { count: sql`${generationWindows.count} + 1` },
    });
    const rows = await db.select({ count: generationWindows.count }).from(generationWindows).where(eq(generationWindows.scopeKey, scopeKey)).limit(1);
    return rows[0]?.count ?? 0;
  }
  const existing = memoryWindows.get(scopeKey);
  const next = existing ? existing.count + 1 : 1;
  memoryWindows.set(scopeKey, { count: next, windowStart: now.getTime(), kind });
  return next;
}

export async function reserveGenerationQuota(ctx: TrpcContext): Promise<{ allowed: true; remaining: number; reservation: GenerationQuotaReservation } | { allowed: false; reason: "hourly" | "daily"; remaining: 0 }> {
  const now = new Date();
  const identity = requestIdentity(ctx);
  const hourScopeKey = `hour:${bucket("hour", now)}:${identity}`;
  const dayScopeKey = `day:${bucket("day", now)}:global`;
  const hourCount = await increment(hourScopeKey, "hour", now);
  if (hourCount > HOURLY_LIMIT) {
    await decrement(hourScopeKey);
    return { allowed: false as const, reason: "hourly", remaining: 0 };
  }
  const dayCount = await increment(dayScopeKey, "day", now);
  if (dayCount > DAILY_LIMIT) {
    await decrement(hourScopeKey);
    await decrement(dayScopeKey);
    return { allowed: false as const, reason: "daily", remaining: 0 };
  }
  return {
    allowed: true as const,
    remaining: Math.min(HOURLY_LIMIT - hourCount, DAILY_LIMIT - dayCount),
    reservation: { hourScopeKey, dayScopeKey, released: false },
  };
}

export async function releaseGenerationQuota(reservation: GenerationQuotaReservation) {
  if (reservation.released) return;
  reservation.released = true;
  await decrement(reservation.hourScopeKey);
  await decrement(reservation.dayScopeKey);
}

/** Compatibility wrapper for existing callers and tests. */
export async function consumeGenerationQuota(ctx: TrpcContext) {
  const result = await reserveGenerationQuota(ctx);
  if (!result.allowed) return result;
  return { allowed: true as const, remaining: result.remaining };
}

async function decrement(scopeKey: string) {
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  if (db) {
    await db.update(generationWindows).set({ count: sql`GREATEST(${generationWindows.count} - 1, 0)` }).where(and(eq(generationWindows.scopeKey, scopeKey), sql`${generationWindows.count} > 0`));
    return;
  }
  const existing = memoryWindows.get(scopeKey);
  if (!existing) return;
  if (existing.count <= 1) memoryWindows.delete(scopeKey);
  else existing.count -= 1;
}

export async function getHourlyQuotaStatus(ctx: TrpcContext) {
  const now = new Date();
  const identity = requestIdentity(ctx);
  const scopeKey = `hour:${bucket("hour", now)}:${identity}`;
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  const hourlyUsed = db
    ? ((await db.select({ count: generationWindows.count }).from(generationWindows).where(eq(generationWindows.scopeKey, scopeKey)).limit(1))[0]?.count ?? 0)
    : (memoryWindows.get(scopeKey)?.count ?? 0);
  return { hourlyUsed, hourlyRemaining: Math.max(0, HOURLY_LIMIT - hourlyUsed), hourlyLimit: HOURLY_LIMIT };
}

export async function getGenerationStats() {
  const now = new Date();
  const db = isTestRuntime || forceMemoryForTests ? null : await getDb();
  if (db) {
    const rows = await db.select({ scopeKey: generationWindows.scopeKey, count: generationWindows.count }).from(generationWindows).where(like(generationWindows.scopeKey, `day:${bucket("day", now)}:%`));
    const dailyTotal = rows.reduce((sum, row) => sum + row.count, 0);
    const global = await db.select({ count: generationWindows.count }).from(generationWindows).where(eq(generationWindows.scopeKey, `day:${bucket("day", now)}:global`)).limit(1);
    return { dailyTotal: global[0]?.count ?? dailyTotal, dailyLimit: DAILY_LIMIT, hourlyLimit: HOURLY_LIMIT };
  }
  const dailyTotal = memoryWindows.get(`day:${bucket("day", now)}:global`)?.count ?? 0;
  return { dailyTotal, dailyLimit: DAILY_LIMIT, hourlyLimit: HOURLY_LIMIT };
}
