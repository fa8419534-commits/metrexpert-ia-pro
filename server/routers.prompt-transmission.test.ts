import { beforeEach, describe, expect, it, vi } from "vitest";

const { invokeLLMMock } = vi.hoisted(() => ({ invokeLLMMock: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM: invokeLLMMock }));

import { appRouter } from "./routers";
import { BTP_JSON_OUTPUT_ENFORCEMENT, BTP_SYSTEM_PROMPT } from "./btpPrompt";
import type { TrpcContext } from "./_core/context";
import { getHourlyQuotaStatus, hasUsedFreeTrial, resetSecurityStateForTests, setAccessCookie } from "./security";

describe("estimate.generate prompt transmission", () => {
  beforeEach(() => {
    resetSecurityStateForTests();
    invokeLLMMock.mockReset();
    invokeLLMMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({
        projectTitle: "Projet test",
        measures: [{ code: "01", designation: "Béton", unit: "m³", quantity: 2 }],
      }) } }],
    });
  });

  it("restores the global and trial quota after a malformed provider response", async () => {
    invokeLLMMock.mockResolvedValue({ choices: [{ message: { content: "Réponse non JSON" } }] });
    const req = { ip: "198.51.100.77", cookies: {} } as TrpcContext["req"];
    const ctx: TrpcContext = { user: null, req, res: { cookie: () => undefined } as unknown as TrpcContext["res"] };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.estimate.generate({
      idempotencyKey: "44444444-4444-4444-8444-444444444444",
      description: "Construction d’une maison pilote de 90 m² à Yopougon.",
      trialPhone: "+225 0700000000",
      trialEmail: "pilote-json@example.ci",
      trialConsent: true,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    await expect(getHourlyQuotaStatus(ctx)).resolves.toMatchObject({ hourlyUsed: 0, hourlyRemaining: 5 });
    await expect(hasUsedFreeTrial("+225 0700000000", "pilote-json@example.ci")).resolves.toBe(false);
  });

  it("sends the exact adapted system prompt to Claude", async () => {
    const req = { cookies: {} } as TrpcContext["req"];
    const ctx: TrpcContext = {
      user: undefined,
      req,
      res: { cookie: (_name: string, value: string) => { req.cookies = { metrexpert_access: value }; } } as unknown as TrpcContext["res"],
    };
    setAccessCookie(ctx);
    const caller = appRouter.createCaller(ctx);

    await caller.estimate.generate({ idempotencyKey: "33333333-3333-4333-8333-333333333333", description: "Construction d’une dalle en béton armé de 20 m²." });

    expect(invokeLLMMock).toHaveBeenCalledOnce();
    const request = invokeLLMMock.mock.calls[0]?.[0];
    expect(request.model).toBe("claude-sonnet-4-6");
    expect(request.messages[0]).toEqual({ role: "system", content: `${BTP_SYSTEM_PROMPT}\n${BTP_JSON_OUTPUT_ENFORCEMENT}` });
    expect(request.messages[0].content).toContain("CONVENTION DÉTERMINISTE — PRIX DE PEINTURE AMBIGU");
    expect(request.messages[0].content).toContain("180 m², pas 360 m²-couche");
    expect(request.messages[0].content).toContain("HYPOTHÈSE NON DÉFINITIVE");
    expect(request.response_format.json_schema.schema.required).toEqual(["projectTitle", "client", "location", "summary", "currency", "geometry", "measures"]);
    expect(request.response_format.json_schema.schema.properties.measures.items.required).toEqual(["code", "designation", "unit", "quantity", "unitPrice", "factor", "notes"]);
    expect(request.response_format.json_schema.schema.properties.geometry.items.required).toEqual(["code", "designation", "formula", "unit", "length", "width", "height", "openingArea", "quantity", "notes"]);
    expect(request.response_format.json_schema.schema.properties.measures.items.properties.unitPrice.type).toEqual(["number", "null"]);
    expect(request.response_format.json_schema.schema.properties.geometry.items.properties.height.type).toEqual(["number", "null"]);
  });
});
