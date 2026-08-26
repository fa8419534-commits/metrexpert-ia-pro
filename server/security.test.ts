import { describe, expect, it, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { consumeGenerationQuota, DAILY_LIMIT, HOURLY_LIMIT, resetSecurityStateForTests } from "./security";

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
