import { beforeEach, describe, expect, it, vi } from "vitest";

const { invokeLLMMock } = vi.hoisted(() => ({ invokeLLMMock: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM: invokeLLMMock }));

import { appRouter } from "./routers";
import { BTP_JSON_OUTPUT_ENFORCEMENT, BTP_SYSTEM_PROMPT } from "./btpPrompt";
import type { TrpcContext } from "./_core/context";

describe("estimate.generate prompt transmission", () => {
  beforeEach(() => {
    invokeLLMMock.mockReset();
    invokeLLMMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({
        projectTitle: "Projet test",
        measures: [{ code: "01", designation: "Béton", unit: "m³", quantity: 2 }],
      }) } }],
    });
  });

  it("sends the exact adapted system prompt to Claude", async () => {
    const ctx: TrpcContext = {
      user: undefined,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await caller.estimate.generate({ description: "Construction d’une dalle en béton armé de 20 m²." });

    expect(invokeLLMMock).toHaveBeenCalledOnce();
    const request = invokeLLMMock.mock.calls[0]?.[0];
    expect(request.model).toBe("claude-sonnet-4-6");
    expect(request.messages[0]).toEqual({ role: "system", content: `${BTP_SYSTEM_PROMPT}\n${BTP_JSON_OUTPUT_ENFORCEMENT}` });
    expect(request.messages[0].content).toContain("CONVENTION DÉTERMINISTE — PRIX DE PEINTURE AMBIGU");
    expect(request.messages[0].content).toContain("180 m², pas 360 m²-couche");
    expect(request.messages[0].content).toContain("HYPOTHÈSE NON DÉFINITIVE");
  });
});
