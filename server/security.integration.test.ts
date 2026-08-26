import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { invokeLLMMock } = vi.hoisted(() => ({ invokeLLMMock: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM: invokeLLMMock }));

import { appRouter } from "./routers";
import { ENV } from "./_core/env";
import { resetSecurityStateForTests } from "./security";

describe("protected generation flow", () => {
  beforeEach(() => {
    resetSecurityStateForTests();
    invokeLLMMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({
        projectTitle: "Essai protégé",
        client: "",
        location: "",
        summary: "Test d’accès autorisé",
        currency: "FCFA",
        measures: [{ code: "01", designation: "Dalle béton", unit: "m²", quantity: 10, unitPrice: 1000, factor: 1, notes: "" }],
      }) } }],
    });
  });

  it("unlocks the session with the configured code and permits one generation", async () => {
    const req = { cookies: {}, ip: "198.51.100.77", headers: {} } as TrpcContext["req"];
    const ctx: TrpcContext = {
      user: null,
      req,
      res: { cookie: (_name: string, value: string) => { req.cookies = { metrexpert_access: value }; } } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.estimate.generate({ description: "Description bloquée avant déverrouillage." })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.security.verifyAccessCode({ accessCode: ENV.accessCode })).resolves.toEqual({ valid: true });
    await expect(caller.security.status()).resolves.toMatchObject({ unlocked: true, hourlyUsed: 0, hourlyRemaining: 5, hourlyLimit: 5 });
    const result = await caller.estimate.generate({ description: "Construction d’une dalle béton de 10 m²." });

    expect(result.lineCount).toBe(1);
    expect(result.preview.measures[0]?.designation).toBe("Dalle béton");
    await expect(caller.security.status()).resolves.toMatchObject({ unlocked: true, hourlyUsed: 1, hourlyRemaining: 4, hourlyLimit: 5 });
    expect(invokeLLMMock).toHaveBeenCalledOnce();
  });
});
