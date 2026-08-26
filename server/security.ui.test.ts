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
    expect(low).toContain('data-quota-notice="low"');
    expect(low).toContain("quota-indicator__summary flex items-center justify-between gap-3 text-[#AEB7B0]");
    expect(low).toContain("Attention : il reste une seule génération horaire.");
    expect(low).toContain("1 / 5 génération");
    expect(exhausted).toContain('data-quota-state="exhausted"');
    expect(exhausted).toContain('data-quota-notice="exhausted"');
    expect(exhausted).toContain("Générations suspendues jusqu’au prochain renouvellement horaire.");
    expect(exhausted).toContain("0 / 5 génération");
  });

  it("renders the quota indicator in Home when the mocked session is unlocked", () => {
    const markup = renderToStaticMarkup(React.createElement(Home));
    expect(markup).toContain("Quota horaire restant");
    expect(markup).toContain("3 / 5 générations");
  });

  it("renders client contact fields and forwards them during generation", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(source).toContain('id="client-phone"');
    expect(source).toContain('id="client-email"');
    expect(source).toContain("clientPhone: clientPhone.trim() || undefined");
    expect(source).toContain("clientEmail: clientEmail.trim() || undefined");
    expect(source).toContain('id="verified-by"');
    expect(source).toContain('id="validation-date"');
    expect(source).toContain("verifiedBy: verifiedBy.trim() || undefined");
    expect(source).toContain("validationDate: validationDate.trim() || undefined");
  });

  it("keeps the unlocked quota condition in Home", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(source).toContain("accessStatus.data?.unlocked && hourlyRemaining !== undefined && <HourlyQuotaIndicator remaining={hourlyRemaining} limit={hourlyLimit} />");
  });

  it("defines a reduced-motion-safe entrance animation for quota notices", () => {
    const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
    expect(styles).toContain("quota-notice-in");
    expect(styles).toContain(".quota-indicator__summary { min-width: 0; flex-wrap: wrap; }");
    expect(styles).toContain("overflow-wrap: anywhere");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain(".quota-notice { animation: none; }");
  });
});
