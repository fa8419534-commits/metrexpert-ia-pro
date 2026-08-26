import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => {
  const unlockedStatus = { data: { unlocked: true, hourlyRemaining: 3, hourlyLimit: 5, dailyTotal: 10, dailyLimit: 50 }, refetch: vi.fn() };
  return {
    trpc: {
      security: {
        status: { useQuery: () => unlockedStatus },
        verifyAccessCode: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: undefined }) },
      },
      estimate: { generate: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn(), error: undefined }) } },
    },
  };
});
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Home, { GenerationErrorAlert, HourlyQuotaIndicator } from "../client/src/pages/Home";

describe("generation quota UI errors", () => {
  it("renders the hourly limit message in the visible generation alert", () => {
    const markup = renderToStaticMarkup(React.createElement(GenerationErrorAlert, { message: "Limite atteinte : 5 générations par heure." }));
    expect(markup).toContain("Limite atteinte : 5 générations par heure.");
    expect(markup).toContain("Génération interrompue");
  });

  it("renders the daily quota message in the visible generation alert", () => {
    const markup = renderToStaticMarkup(React.createElement(GenerationErrorAlert, { message: "Quota global atteint : 50 générations pour aujourd’hui." }));
    expect(markup).toContain("Quota global atteint : 50 générations pour aujourd’hui.");
    expect(markup).toContain("Génération interrompue");
  });

  it("renders available, low and exhausted hourly quota states", () => {
    const available = renderToStaticMarkup(React.createElement(HourlyQuotaIndicator, { remaining: 3, limit: 5 }));
    const low = renderToStaticMarkup(React.createElement(HourlyQuotaIndicator, { remaining: 1, limit: 5 }));
    const exhausted = renderToStaticMarkup(React.createElement(HourlyQuotaIndicator, { remaining: 0, limit: 5 }));
    expect(available).toContain('data-quota-state="available"');
    expect(available).toContain("3 / 5 générations");
    expect(low).toContain('data-quota-state="low"');
    expect(low).toContain("1 / 5 génération");
    expect(exhausted).toContain('data-quota-state="exhausted"');
    expect(exhausted).toContain("0 / 5 génération");
  });

  it("renders the quota indicator in Home when the mocked session is unlocked", () => {
    const markup = renderToStaticMarkup(React.createElement(Home));
    expect(markup).toContain("Quota horaire restant");
    expect(markup).toContain("3 / 5 générations");
  });

  it("keeps the unlocked quota condition in Home", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(source).toContain("accessStatus.data?.unlocked && hourlyRemaining !== undefined && <HourlyQuotaIndicator remaining={hourlyRemaining} limit={hourlyLimit} />");
  });
});
