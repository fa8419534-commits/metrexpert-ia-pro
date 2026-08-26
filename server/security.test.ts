import { describe, expect, it, beforeEach, vi } from "vitest";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
});
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { consumeGenerationQuota, DAILY_LIMIT, expireClientAccessCodeForTests, HOURLY_LIMIT, listFreeTrialContacts, markFreeTrialWhatsAppContacted, releaseFreeTrialReservation, releaseGenerationQuota, reserveFreeTrial, reserveGenerationQuota, resetSecurityStateForTests } from "./security";

function context(ip: string): TrpcContext {
  return { user: null, req: { ip, headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("generation security quotas", () => {
  beforeEach(() => resetSecurityStateForTests());

  it(`allows ${HOURLY_LIMIT} generations per IP per hour and blocks the next one`, async () => {
    const ctx = context("198.51.100.10");
    for (let attempt = 0; attempt < HOURLY_LIMIT; attempt += 1) {
      expect((await consumeGenerationQuota(ctx)).allowed).toBe(true);
    }
    const blocked = await consumeGenerationQuota(ctx);
    expect(blocked).toEqual({ allowed: false, reason: "hourly", remaining: 0 });
  });

  it("restores the hourly and daily counters when a reservation is released", async () => {
    const ctx = context("198.51.100.11");
    const reservation = await reserveGenerationQuota(ctx);
    expect(reservation.allowed).toBe(true);
    if (!reservation.allowed) return;
    await releaseGenerationQuota(reservation.reservation);
    for (let attempt = 0; attempt < HOURLY_LIMIT; attempt += 1) expect((await consumeGenerationQuota(ctx)).allowed).toBe(true);
    expect((await consumeGenerationQuota(ctx)).allowed).toBe(false);
  });

  it(`blocks the ${DAILY_LIMIT + 1}th generation globally in the same UTC day`, async () => {
    for (let attempt = 0; attempt < DAILY_LIMIT; attempt += 1) {
      expect((await consumeGenerationQuota(context(`198.51.100.${attempt + 1}`))).allowed).toBe(true);
    }
    expect(await consumeGenerationQuota(context("203.0.113.200"))).toEqual({ allowed: false, reason: "daily", remaining: 0 });
  });

  it("rejects an invalid shared access code", async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as TrpcContext["req"], res: { cookie: () => undefined } as unknown as TrpcContext["res"] });
    await expect(caller.security.verifyAccessCode({ accessCode: "definitely-not-the-code" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});


describe("administration secret configuration", () => {
  it("loads a distinct administrator access code without exposing its value", () => {
    expect(process.env.METREXPERT_ADMIN_ACCESS_CODE).toBeTruthy();
    expect(process.env.METREXPERT_ADMIN_ACCESS_CODE).not.toBe(process.env.METREXPERT_ACCESS_CODE);
  });
});

describe("client access administration", () => {
  beforeEach(() => resetSecurityStateForTests());

  it("creates, lists and disables a client code through the protected admin procedures", async () => {
    const req = { ip: "198.51.100.30", headers: {}, cookies: {} } as TrpcContext["req"];
    const res = { cookie: (_name: string, value: string) => { (req.cookies as Record<string, string>)["metrexpert_admin_access"] = value; } } as unknown as TrpcContext["res"];
    const caller = appRouter.createCaller({ user: null, req, res });
    await caller.security.verifyAdminCode({ accessCode: process.env.METREXPERT_ADMIN_ACCESS_CODE! });
    const created = await caller.security.adminCreateCode({ clientName: "Entreprise test", monthlyQuota: 5 });
    expect(created.code).toMatch(/^MXP-[A-F0-9]{10}$/);
    expect((await caller.security.adminListCodes())[0]).toMatchObject({ clientName: "Entreprise test", monthlyQuota: 5, monthlyRemaining: 5 });
    await caller.security.adminDisableCode({ id: created.id });
    expect((await caller.security.adminListCodes())[0].disabledAt).toBeTruthy();
  });

  it("rejects a client code after its expiration date", async () => {
    const adminReq = { ip: "198.51.100.33", headers: {}, cookies: {} } as TrpcContext["req"];
    const adminRes = { cookie: (_name: string, value: string) => { (adminReq.cookies as Record<string, string>)["metrexpert_admin_access"] = value; } } as unknown as TrpcContext["res"];
    const adminCaller = appRouter.createCaller({ user: null, req: adminReq, res: adminRes });
    await adminCaller.security.verifyAdminCode({ accessCode: process.env.METREXPERT_ADMIN_ACCESS_CODE! });
    const created = await adminCaller.security.adminCreateCode({ clientName: "Client expiré", monthlyQuota: 5 });
    expireClientAccessCodeForTests(created.id);
    const clientReq = { ip: "198.51.100.34", headers: {}, cookies: {} } as TrpcContext["req"];
    const clientRes = { cookie: () => undefined } as unknown as TrpcContext["res"];
    const clientCaller = appRouter.createCaller({ user: null, req: clientReq, res: clientRes });
    await expect(clientCaller.security.verifyClientCode({ accessCode: created.code })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("accepts a client code once and blocks the monthly limit", async () => {
    const adminReq = { ip: "198.51.100.31", headers: {}, cookies: {} } as TrpcContext["req"];
    const adminRes = { cookie: (_name: string, value: string) => { (adminReq.cookies as Record<string, string>)["metrexpert_admin_access"] = value; } } as unknown as TrpcContext["res"];
    const adminCaller = appRouter.createCaller({ user: null, req: adminReq, res: adminRes });
    await adminCaller.security.verifyAdminCode({ accessCode: process.env.METREXPERT_ADMIN_ACCESS_CODE! });
    const created = await adminCaller.security.adminCreateCode({ clientName: "Client quota", monthlyQuota: 5 });
    const clientReq = { ip: "198.51.100.32", headers: {}, cookies: {} } as TrpcContext["req"];
    const clientRes = { cookie: (_name: string, value: string) => { (clientReq.cookies as Record<string, string>)["metrexpert_client_access"] = value; } } as unknown as TrpcContext["res"];
    const clientCaller = appRouter.createCaller({ user: null, req: clientReq, res: clientRes });
    const access = await clientCaller.security.verifyClientCode({ accessCode: created.code });
    expect(access.monthlyRemaining).toBe(5);
    for (let attempt = 0; attempt < 5; attempt += 1) expect((await clientCaller.security.status()).monthlyRemaining).toBe(5);
    const { consumeClientMonthlyQuota } = await import("./security");
    for (let attempt = 0; attempt < 5; attempt += 1) expect((await consumeClientMonthlyQuota({ user: null, req: clientReq, res: clientRes } as TrpcContext)).allowed).toBe(true);
    expect(await consumeClientMonthlyQuota({ user: null, req: clientReq, res: clientRes } as TrpcContext)).toMatchObject({ allowed: false, reason: "monthly" });
  });
});


describe("free trial contacts", () => {
  beforeEach(() => resetSecurityStateForTests());

  it("records the last WhatsApp follow-up for Admin", async () => {
    const reservation = await reserveFreeTrial("Prospect relancé", "2250700000000", undefined);
    expect(reservation.allowed).toBe(true);
    if (!reservation.allowed) return;
    const contactedAt = await markFreeTrialWhatsAppContacted(reservation.contactId);
    const contacts = await listFreeTrialContacts();
    expect(contacts.find((contact) => contact.id === reservation.contactId)?.lastWhatsAppContactAt).toEqual(contactedAt);
  });

  it("releases a reserved trial after a failed generation so the contact can retry", async () => {
    const first = await reserveFreeTrial("Client reprise", "2250700000000", undefined);
    expect(first.allowed).toBe(true);
    if (!first.allowed) return;
    await releaseFreeTrialReservation(first);
    expect(await reserveFreeTrial("Client reprise", "2250700000000", undefined)).toMatchObject({ allowed: true });
  });

  it("allows one trial per normalized phone or email and lists the contact for Admin", async () => {
    const first = await reserveFreeTrial("Client Démo", "+225 01 51 61 05 12", undefined);
    expect(first.allowed).toBe(true);
    expect(await reserveFreeTrial(undefined, "2250151610512", undefined)).toEqual({ allowed: false, reason: "already_used" });
    const second = await reserveFreeTrial(undefined, undefined, "Prospect@EXEMPLE.CI");
    expect(second.allowed).toBe(true);
    expect(await reserveFreeTrial(undefined, undefined, " prospect@exemple.ci ")).toEqual({ allowed: false, reason: "already_used" });
    await expect(listFreeTrialContacts()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ clientName: "Client Démo", phone: "2250151610512", email: "À compléter" })]));
  });
});
