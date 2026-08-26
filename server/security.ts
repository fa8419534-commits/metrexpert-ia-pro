import crypto from "node:crypto";
import { eq, like, sql } from "drizzle-orm";
import { generationWindows } from "../drizzle/schema";
import { getDb } from "./db";
import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";

export const ACCESS_COOKIE = "metrexpert_access";
export const HOURLY_LIMIT = 5;
export const DAILY_LIMIT = 50;
const ACCESS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const memoryWindows = new Map<string, { count: number; windowStart: number; kind: "hour" | "day" }>();

export function resetSecurityStateForTests() {
  memoryWindows.clear();
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
  const db = process.env.NODE_ENV === "test" || process.env.VITEST === "true" ? null : await getDb();
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

export async function consumeGenerationQuota(ctx: TrpcContext) {
  const now = new Date();
  const identity = requestIdentity(ctx);
  const hourCount = await increment(`hour:${bucket("hour", now)}:${identity}`, "hour", now);
  if (hourCount > HOURLY_LIMIT) return { allowed: false as const, reason: "hourly", remaining: 0 };
  const dayCount = await increment(`day:${bucket("day", now)}:global`, "day", now);
  if (dayCount > DAILY_LIMIT) return { allowed: false as const, reason: "daily", remaining: 0 };
  return { allowed: true as const, remaining: Math.min(HOURLY_LIMIT - hourCount, DAILY_LIMIT - dayCount) };
}

export async function getGenerationStats() {
  const now = new Date();
  const db = process.env.NODE_ENV === "test" || process.env.VITEST === "true" ? null : await getDb();
  if (db) {
    const rows = await db.select({ scopeKey: generationWindows.scopeKey, count: generationWindows.count }).from(generationWindows).where(like(generationWindows.scopeKey, `day:${bucket("day", now)}:%`));
    const dailyTotal = rows.reduce((sum, row) => sum + row.count, 0);
    const global = await db.select({ count: generationWindows.count }).from(generationWindows).where(eq(generationWindows.scopeKey, `day:${bucket("day", now)}:global`)).limit(1);
    return { dailyTotal: global[0]?.count ?? dailyTotal, dailyLimit: DAILY_LIMIT, hourlyLimit: HOURLY_LIMIT };
  }
  const dailyTotal = memoryWindows.get(`day:${bucket("day", now)}:global`)?.count ?? 0;
  return { dailyTotal, dailyLimit: DAILY_LIMIT, hourlyLimit: HOURLY_LIMIT };
}
