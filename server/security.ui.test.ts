import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => {
  const unlockedStatus = { data: { unlocked: true, hourlyRemaining: 3, hourlyLimit: 5, dailyTotal: 10, dailyLimit: 50 }, refetch: vi.fn() };
  return {
    trpc: {
      security: {
        status: { useQuery: () => unlockedStatus },
        verifyAccessCode: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: undefined }) },
        verifyClientCode: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: undefined }) },
        clientPaymentDashboard: { useQuery: () => ({ data: { access: { unlocked: false }, requests: [] }, isLoading: false }) },
      },
      estimate: { generate: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn(), error: undefined }) } },
    },
  };
});
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Home, { GenerationErrorAlert, GuidedOnboarding, HourlyQuotaIndicator, MonthlyQuotaProgress, persistBrandImage, readStoredBrandImage, trackOnboardingEvent } from "../client/src/pages/Home";
import { isValidTrialEmail, isValidTrialPhone } from "../client/src/lib/trialValidation";

describe("generation quota UI errors", () => {
  it("validates trial contact formats without accepting partial values", () => {
    expect(isValidTrialEmail("prospect@exemple.ci")).toBe(true);
    expect(isValidTrialEmail("prospect@exemple")).toBe(false);
    expect(isValidTrialPhone("+225 01 51 61 05 12")).toBe(true);
    expect(isValidTrialPhone("01 51 61")).toBe(false);
  });

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

  it("renders the monthly quota progress bar with accessible values and responsive layout", () => {
    const available = renderToStaticMarkup(React.createElement(MonthlyQuotaProgress, { remaining: 12, limit: 15 }));
    const low = renderToStaticMarkup(React.createElement(MonthlyQuotaProgress, { remaining: 2, limit: 15 }));
    const exhausted = renderToStaticMarkup(React.createElement(MonthlyQuotaProgress, { remaining: 0, limit: 15 }));
    expect(available).toContain('role="progressbar"');
    expect(available).toContain('aria-valuenow="12"');
    expect(available).toContain('aria-valuemax="15"');
    expect(available).toContain('style="width:80%"');
    expect(available).toContain("Quota mensuel client");
    expect(low).toContain('data-quota-state="low"');
    expect(low).toContain("Votre quota mensuel est bientôt épuisé.");
    expect(exhausted).toContain('data-quota-state="exhausted"');
    expect(exhausted).toContain("Quota mensuel atteint, contactez-moi pour renouveler votre accès.");
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

  it("renders the four-step onboarding guide with accessible navigation", () => {
    const markup = renderToStaticMarkup(React.createElement(GuidedOnboarding, { step: 2, onStepChange: () => undefined }));
    expect(markup).toContain("Votre étude en 4 repères");
    expect(markup).toContain("Étape 2/4");
    expect(markup).toContain("Accès &amp; contact");
    expect(markup).toContain("Décrire le projet");
    expect(markup).toContain('aria-label="Étapes du parcours de génération"');
    expect(markup).toContain('aria-current="step"');
  });

  it("tracks only anonymous onboarding event metadata locally", () => {
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) }, dispatchEvent: vi.fn(), CustomEvent: class { constructor(public type: string, public detail: unknown) {} } } });
    trackOnboardingEvent("step_viewed", 3);
    const eventLog = values.get("metrexpert:onboarding-events:v1") ?? "";
    expect(eventLog).toContain("step_viewed");
    expect(eventLog).toContain("\"step\":3");
    expect(eventLog).not.toContain("description");
    expect(eventLog).not.toContain("phone");
  });

  it("renders the quota indicator in Home when the mocked session is unlocked", () => {
    const markup = renderToStaticMarkup(React.createElement(Home));
    expect(markup).toContain("Quota horaire restant");
    expect(markup).toContain("3 / 5 générations");
  });

  it("includes the generation checklist and privacy-safe abandonment hooks", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(source).toContain('data-generation-checklist');
    expect(source).toContain("Checklist de génération");
    expect(source).toContain("generation_blocked_checklist");
    expect(source).toContain("generation_started");
    expect(source).toContain("ONBOARDING_EVENT_KEY");
    expect(source).toContain('trackOnboardingEvent("step_viewed", nextStep)');
  });

  it("exposes draft recovery and a concrete description example", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(source).toContain("FORM_DRAFT_STORAGE_KEY");
    expect(source).toContain("Brouillon restauré");
    expect(source).toContain("Effacer le brouillon");
    expect(source).toContain("Exemple de description bien remplie");
    expect(source).toContain("help_example_used");
  });

  it("renders the aggregated onboarding analytics section behind the Admin page", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Admin.tsx"), "utf8");
    expect(source).toContain("aggregateOnboardingEvents");
    expect(source).toContain('id="onboarding-analytics"');
    expect(source).toContain("Abandons par repère");
    expect(source).toContain("30 derniers jours");
    expect(source).toContain("metrexpert:onboarding-event");
  });

  it("renders client contact fields and forwards them during generation", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(source).toContain('id="client-phone"');
    expect(source).toContain('id="client-email"');
    expect(source).toContain("clientPhone: clientPhone.trim() || undefined");
    expect(source).toContain("clientEmail: clientEmail.trim() || undefined");
    expect(source).toContain('id="trial-phone"');
    expect(source).toContain('id="trial-email"');
    expect(source).toContain("trialPhone: trialPhone.trim() || undefined");
    expect(source).toContain("trialEmail: trialEmail.trim() || undefined");
    expect(source).toContain('id="verified-by"');
    expect(source).toContain('id="validation-date"');
    expect(source).toContain("verifiedBy: verifiedBy.trim() || undefined");
    expect(source).toContain("validationDate: validationDate.trim() || undefined");
    expect(source).toContain('id="signature-image"');
    expect(source).toContain('id="stamp-image"');
    expect(source).toContain('accept="image/png,image/jpeg"');
    expect(source).toContain("signatureImageDataUrl: signatureImage?.dataUrl");
    expect(source).toContain("stampImageDataUrl: stampImage?.dataUrl");
    expect(source).toContain('className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2"');
    expect(source).toContain('className="flex min-w-0 gap-2"');
    expect(source).toContain('className="min-w-0 text-left text-sm text-[#AEB7B0]"');
    expect(source).toContain("Enregistrée localement");
    expect(source).toContain("aria-label=\"Effacer l’image de signature mémorisée\"");
    expect(source).toContain("aria-label=\"Effacer toutes les données locales de signature et de tampon\"");
    expect(source).toContain("Confirmer la suppression");
    expect(source).toContain('localStorage.setItem');
    expect(source).toContain('localStorage.removeItem');
  });

  it("persists, restores and clears brand images through local storage", () => {
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) } } });
    const image = { name: "signature.png", dataUrl: "data:image/png;base64,abc" };
    expect(persistBrandImage("signature-key", image)).toBe(true);
    expect(readStoredBrandImage("signature-key")).toEqual(image);
    expect(persistBrandImage("signature-key", null)).toBe(true);
    expect(readStoredBrandImage("signature-key")).toBeNull();
  });

  it("keeps the unlocked quota condition in Home", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(source).toContain("accessStatus.data?.unlocked && hourlyRemaining !== undefined && <HourlyQuotaIndicator remaining={hourlyRemaining} limit={hourlyLimit} />");
    expect(source).toContain("<MonthlyQuotaProgress remaining={accessStatus.data.monthlyRemaining} limit={accessStatus.data.monthlyQuota} />");
    expect(source).toContain("role=\"progressbar\"");
    expect(source).toContain("aria-valuetext");
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
