import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("access code configuration", () => {
  it("accepts the configured access code through the lightweight verification procedure", async () => {
    expect(ENV.accessCode).toBeTruthy();
    const caller = appRouter.createCaller({
      user: null,
      req: {} as TrpcContext["req"],
      res: { cookie: () => undefined } as unknown as TrpcContext["res"],
    });

    const result = await caller.security.verifyAccessCode({ accessCode: ENV.accessCode });
    expect(result).toEqual({ valid: true });
  });
});
