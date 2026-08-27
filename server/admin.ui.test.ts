// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  adminUnlocked: false,
  trials: [] as Array<{ id: number; clientName: string; phone: string; email: string; trialAt: Date; convertedAt: Date | null; lastWhatsAppContactAt?: Date | null }>,
  codes: [] as Array<{
    id: number;
    clientName: string;
    monthlyQuota: number;
    monthlyRemaining: number;
    expiresAt: Date;
    disabledAt: Date | null;
  }>,
  writeText: vi.fn(),
  disable: vi.fn(),
  contacted: vi.fn(),
  saveRetention: vi.fn(),
  purgeRetention: vi.fn(),
  purgeShouldFail: false,
  retentionDays: 365,
  lastSuccessfulBackupAt: null as Date | null,
  purgeRuns: [] as Array<{ id: number; runType: "manual" | "automatic"; status: "success" | "failed"; deletedCount: number; retentionDays: number; cutoff: Date; taskUid: string | null; errorMessage: string | null; startedAt: Date; completedAt: Date }>,
  paymentRequests: [] as Array<{ id: number; clientName: string; phone: string; email: string | null; planQuota: number; amountXof: number; paymentMethod: string; paymentReference: string; status: "pending" | "confirmed" | "rejected"; accessCodeId: number | null; adminNote: string | null; createdAt: Date; reviewedAt: Date | null }>,
}));

beforeEach(() => {
  testState.adminUnlocked = false;
  testState.codes = [];
  testState.trials = [];
  testState.writeText.mockReset().mockResolvedValue(undefined);
  testState.disable.mockReset();
  testState.contacted.mockReset();
  testState.saveRetention.mockReset();
  testState.purgeRetention.mockReset();
  testState.purgeShouldFail = false;
  testState.retentionDays = 365;
  testState.lastSuccessfulBackupAt = null;
  testState.purgeRuns = [];
  testState.paymentRequests = [];
  window.localStorage.clear();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: testState.writeText },
  });
});

afterEach(() => cleanup());

vi.mock("@/lib/trpc", () => ({
  trpc: {
    security: {
      adminStatus: { useQuery: () => ({ data: { unlocked: testState.adminUnlocked }, refetch: vi.fn() }) },
      verifyAdminCode: { useMutation: (options?: { onSuccess?: () => void }) => ({ isPending: false, mutate: () => options?.onSuccess?.(), error: undefined }) },
      adminListCodes: { useQuery: () => ({ data: testState.codes, isLoading: false, refetch: vi.fn() }) },
      adminListFreeTrials: { useQuery: () => ({ data: testState.trials, isLoading: false, refetch: vi.fn() }) },
      adminGetFreeTrialRetention: { useQuery: () => ({ data: { retentionDays: testState.retentionDays }, isLoading: false, isFetching: false, refetch: vi.fn() }) },
      adminGetBackupStatus: { useQuery: () => ({ data: { lastSuccessfulBackupAt: testState.lastSuccessfulBackupAt }, isLoading: false, isFetching: false, refetch: vi.fn() }) },
      adminMarkBackupSuccessful: { useMutation: (options?: { onSuccess?: (data: { lastSuccessfulBackupAt: Date }) => void; onError?: () => void }) => ({ isPending: false, mutate: () => { testState.lastSuccessfulBackupAt = new Date(); options?.onSuccess?.({ lastSuccessfulBackupAt: testState.lastSuccessfulBackupAt }); } }) },
      adminListPurgeRuns: { useQuery: () => ({ data: testState.purgeRuns, isLoading: false, isFetching: false, refetch: vi.fn() }) },
      adminSetFreeTrialRetention: { useMutation: (options?: { onSuccess?: (data: { retentionDays: number }) => void }) => ({ isPending: false, mutate: (input: { retentionDays: number }) => { testState.saveRetention(input); testState.retentionDays = input.retentionDays; options?.onSuccess?.({ retentionDays: input.retentionDays }); } }) },
      adminPurgeExpiredFreeTrials: { useMutation: (options?: { onSuccess?: (data: { deletedCount: number; retentionDays: number; cutoff: Date }) => void; onError?: (error: Error) => void }) => ({ isPending: false, mutate: () => { testState.purgeRetention(); if (testState.purgeShouldFail) options?.onError?.(new Error("Session administrateur expirée.")); else options?.onSuccess?.({ deletedCount: 0, retentionDays: testState.retentionDays, cutoff: new Date() }); } }) },
      adminListPaymentRequests: { useQuery: () => ({ data: testState.paymentRequests, isLoading: false, refetch: vi.fn() }) },
      clientPaymentDashboard: { useQuery: () => ({ data: { access: { unlocked: false }, requests: [] }, isLoading: false }) },
      adminMarkFreeTrialWhatsAppContacted: { useMutation: () => ({ isPending: false, mutate: testState.contacted }) },
      adminMarkFreeTrialConverted: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      adminCreateCode: { useMutation: (options?: { onSuccess?: (data: { code: string }) => void }) => ({ isPending: false, mutate: () => options?.onSuccess?.({ code: "MXP-ABC1234567" }) }) },
      adminReviewPaymentRequest: { useMutation: (options?: { onSuccess?: (data: { status: "confirmed" | "rejected"; accessCode?: string }) => void }) => ({ isPending: false, mutate: (input: { status: "confirmed" | "rejected" }) => options?.onSuccess?.({ status: input.status, accessCode: input.status === "confirmed" ? "MXP-PAYMENT123" : undefined }) }) },
      adminDisableCode: { useMutation: () => ({ isPending: false, mutate: testState.disable }) },
    },
      useUtils: () => ({ security: { adminListCodes: { invalidate: vi.fn() }, adminListFreeTrials: { invalidate: vi.fn() } } }),
  },
}));

import Admin, { buildCombinedTrialCsv, buildEmailTrialCsv, buildFreeTrialCsv } from "../client/src/pages/Admin";

describe("Admin panel UI", () => {
  it("builds a CSV with escaped prospect fields and follow-up status", () => {
    const csv = buildFreeTrialCsv([{
      clientName: "Entreprise; Test",
      phone: "2250100000000",
      email: "prospect\"test@exemple.ci",
      trialAt: new Date("2026-08-26T00:00:00Z"),
      convertedAt: null,
      lastWhatsAppContactAt: null,
    }]);
    expect(csv).toContain('"Full name";"Phone number"');
    expect(csv).toContain('"Entreprise; Test";"2250100000000"');
    expect(csv).not.toContain("prospect");
  });
  it("builds a separate e-mail CSV for contacts without a phone number", () => {
    const csv = buildEmailTrialCsv([
      { clientName: "Prospect e-mail", phone: "À compléter", email: "contact@exemple.ci" },
      { clientName: "Prospect téléphone", phone: "2250100000000", email: "phone@exemple.ci" },
    ]);
    expect(csv).toContain('"Full name";"Email"');
    expect(csv).toContain('"Prospect e-mail";"contact@exemple.ci"');
    expect(csv).not.toContain("Prospect téléphone");
  });

  it("builds a combined CSV with the preferred contact channel", () => {
    const csv = buildCombinedTrialCsv([
      { clientName: "Prospect WhatsApp", phone: "2250100000000", email: "wa@exemple.ci" },
      { clientName: "Prospect e-mail", phone: "À compléter", email: "email@exemple.ci" },
    ]);
    expect(csv).toContain('"Full name";"Phone number";"Email";"Preferred contact channel"');
    expect(csv).toContain('"Prospect WhatsApp";"2250100000000";"wa@exemple.ci";"WhatsApp"');
    expect(csv).toContain('"Prospect e-mail";"";"email@exemple.ci";"Email"');
  });

  it("does not load protected Admin lists before the server confirms the session", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Admin.tsx"), "utf8");
    expect(source).toContain("const canLoadAdminData = adminStatus.data?.unlocked === true");
    expect(source).toContain("enabled: canLoadAdminData");
    expect(source).toContain("retry: false");
  });

  it("exposes manual reload and cookie verification states", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Admin.tsx"), "utf8");
    expect(source).toContain("Recharger les données");
    expect(source).toContain("Vérification de l’accès administrateur");
    expect(source).toContain("isRefreshingAdminData");
    expect(source).toContain("Promise.all([codes.refetch(), trials.refetch(), paymentRequests.refetch(), retention.refetch(), backupStatus.refetch(), purgeRuns.refetch()])");
  });

  it("renders a protected administrator unlock screen before exposing client management", () => {
    render(React.createElement(Admin));
    expect(screen.getByRole("heading", { name: "Accès administration" })).toBeTruthy();
    expect(screen.getByLabelText("Code administrateur")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Déverrouiller le panneau" })).toBeTruthy();
    expect(screen.queryByText("Nouveau code client")).toBeNull();
  });

  it("replaces the login form and allows creating a client code after validation", async () => {
    render(React.createElement(Admin));
    fireEvent.change(screen.getByLabelText("Code administrateur"), { target: { value: "admin-code" } });
    fireEvent.click(screen.getByRole("button", { name: "Déverrouiller le panneau" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Panneau d’administration" })).toBeTruthy());
    fireEvent.change(screen.getByLabelText("Nom du client"), { target: { value: "Entreprise test" } });
    fireEvent.click(screen.getByRole("button", { name: "Créer le code" }));
    await waitFor(() => expect(screen.getByText("MXP-ABC1234567")).toBeTruthy());
    expect(screen.queryByRole("heading", { name: "Accès administration" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Copier le code" }));
    await waitFor(() => expect(testState.writeText).toHaveBeenCalledWith("MXP-ABC1234567"));
    expect(screen.getByRole("button", { name: "Code copié" })).toBeTruthy();
  });

  it("shows free trial contacts and their conversion status", () => {
    testState.adminUnlocked = true;
    testState.trials = [{ id: 2, clientName: "Prospect test", phone: "2250100000000", email: "prospect@exemple.ci", trialAt: new Date("2026-08-26T00:00:00Z"), convertedAt: null, lastWhatsAppContactAt: new Date("2026-08-25T00:00:00Z") }];
    render(React.createElement(Admin));
    expect(screen.getByText("Essais gratuits")).toBeTruthy();
    expect(screen.getByText("Prospect test")).toBeTruthy();
    expect(screen.getAllByText("À relancer").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("1 prospect affiché sur 1")).toBeTruthy();
    const whatsapp = screen.getByRole("link", { name: "Ouvrir WhatsApp pour Prospect test" });
    expect(whatsapp.getAttribute("href")).toContain("https://wa.me/2250100000000?text=");
    expect(screen.getByText("25/08/2026")).toBeTruthy();
    fireEvent.click(whatsapp);
    expect(testState.contacted).toHaveBeenCalledWith({ id: 2 });
  });

  it("filters free trial contacts by follow-up and conversion status", () => {
    testState.adminUnlocked = true;
    testState.trials = [
      { id: 3, clientName: "Prospect à relancer", phone: "2250700000000", email: "a@exemple.ci", trialAt: new Date(), convertedAt: null },
      { id: 4, clientName: "Prospect converti", phone: "2250500000000", email: "b@exemple.ci", trialAt: new Date(), convertedAt: new Date() },
    ];
    render(React.createElement(Admin));
    expect(screen.getByText("Prospect à relancer")).toBeTruthy();
    expect(screen.getByText("Prospect converti")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Convertis" }));
    expect(screen.queryByText("Prospect à relancer")).toBeNull();
    expect(screen.getByText("Prospect converti")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "À relancer" }));
    expect(screen.getByText("Prospect à relancer")).toBeTruthy();
    expect(screen.queryByText("Prospect converti")).toBeNull();
  });

  it("filters free trials by start and end dates", () => {
    testState.adminUnlocked = true;
    testState.trials = [
      { id: 8, clientName: "Prospect ancien", phone: "2250700000000", email: "ancien@exemple.ci", trialAt: new Date("2026-08-01T12:00:00Z"), convertedAt: null },
      { id: 9, clientName: "Prospect retenu", phone: "2250500000000", email: "retenu@exemple.ci", trialAt: new Date("2026-08-15T12:00:00Z"), convertedAt: null },
    ];
    render(React.createElement(Admin));
    fireEvent.change(screen.getByLabelText("Du"), { target: { value: "2026-08-10" } });
    fireEvent.change(screen.getByLabelText("Au"), { target: { value: "2026-08-20" } });
    expect(screen.queryByText("Prospect ancien")).toBeNull();
    expect(screen.getByText("Prospect retenu")).toBeTruthy();
    expect(screen.getByLabelText("1 prospect affiché sur 2")).toBeTruthy();
    expect(window.localStorage.getItem("metrexpert.trials.startDate")).toBe("2026-08-10");
    expect(window.localStorage.getItem("metrexpert.trials.endDate")).toBe("2026-08-20");
    fireEvent.click(screen.getByRole("button", { name: "Réinitialiser les filtres de date" }));
    expect((screen.getByLabelText("Du") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Au") as HTMLInputElement).value).toBe("");
    expect(window.localStorage.getItem("metrexpert.trials.startDate")).toBeNull();
    expect(window.localStorage.getItem("metrexpert.trials.endDate")).toBeNull();
  });

  it("shows an error and clears the filtered list when the date range is invalid", () => {
    testState.adminUnlocked = true;
    testState.trials = [{ id: 10, clientName: "Prospect invalide", phone: "2250100000000", email: "invalid@exemple.ci", trialAt: new Date("2026-08-15T12:00:00Z"), convertedAt: null }];
    render(React.createElement(Admin));
    fireEvent.change(screen.getByLabelText("Du"), { target: { value: "2026-08-20" } });
    fireEvent.change(screen.getByLabelText("Au"), { target: { value: "2026-08-10" } });
    expect(screen.getByRole("alert").textContent).toContain("ne peut pas être postérieure");
    expect(screen.queryByText("Prospect invalide")).toBeNull();
  });

  it("asks for a prospect count before exporting the filtered list", () => {
    testState.adminUnlocked = true;
    testState.trials = [{ id: 5, clientName: "Prospect export", phone: "2250100000000", email: "export@exemple.ci", trialAt: new Date(), convertedAt: null }];
    render(React.createElement(Admin));
    fireEvent.click(screen.getByRole("button", { name: "Exporter la liste filtrée en CSV" }));
    expect(screen.getByRole("alertdialog").textContent).toContain("1 prospect");
    expect(screen.getByRole("alertdialog").textContent).toContain("nom complet et numéro de téléphone");
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("saves the retention duration and confirms a manual purge", async () => {
    testState.adminUnlocked = true;
    render(React.createElement(Admin));
    const retentionInput = screen.getByLabelText("Durée de conservation (jours)");
    fireEvent.change(retentionInput, { target: { value: "90" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(testState.saveRetention).toHaveBeenCalledWith({ retentionDays: 90 }));
    expect(screen.getByText(/Valeur actuelle : 90 jours\./)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Purger les contacts échus" }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText(/plus anciens que 90 jours/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Annuler" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Purger les contacts échus" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmer la purge" }));
    expect(testState.purgeRetention).toHaveBeenCalled();
    expect(screen.getByText("Purge terminée")).toBeTruthy();
    expect(screen.getByText(/Aucun contact arrivé à échéance/)).toBeTruthy();
  });

  it("shows an accessible error when the manual purge fails", () => {
    testState.adminUnlocked = true;
    testState.purgeShouldFail = true;
    render(React.createElement(Admin));
    fireEvent.click(screen.getByRole("button", { name: "Purger les contacts échus" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmer la purge" }));
    expect(screen.getByRole("alert").textContent).toContain("Purge non effectuée");
    expect(screen.getByRole("alert").textContent).toContain("Session administrateur expirée.");
  });

  it("shows the active code count and asks for confirmation before revocation", () => {
    testState.adminUnlocked = true;
    testState.codes = [{
      id: 7,
      clientName: "Entreprise active",
      monthlyQuota: 15,
      monthlyRemaining: 12,
      expiresAt: new Date(Date.now() + 86_400_000),
      disabledAt: null,
    }];
    render(React.createElement(Admin));
    expect(screen.getByLabelText("1 code client actif")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Révoquer" }));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByRole("heading", { name: "Révoquer ce code client ?" })).toBeTruthy();
    expect(within(dialog).getByText("Entreprise active")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Annuler" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(testState.disable).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Révoquer" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmer la révocation" }));
    expect(testState.disable).toHaveBeenCalledWith({ id: 7 });
  });
});


  it("renders operational backup, PDF and purge history controls", () => {
    testState.adminUnlocked = true;
    testState.lastSuccessfulBackupAt = new Date("2026-08-27T10:00:00Z");
    testState.purgeRuns = [{ id: 1, runType: "automatic", status: "success", deletedCount: 2, retentionDays: 365, cutoff: new Date("2025-08-27T10:00:00Z"), taskUid: "T_test", errorMessage: null, startedAt: new Date("2026-08-27T10:00:00Z"), completedAt: new Date("2026-08-27T10:01:00Z") }];
    render(React.createElement(Admin));
    expect(screen.getByText("Suivi opérationnel")).toBeTruthy();
    expect(screen.getByText("Dernière sauvegarde réussie")).toBeTruthy();
    expect(screen.getByText("Automatique")).toBeTruthy();
    expect(screen.getAllByText("Succès").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: "Rapport parcours client PDF" })).toBeTruthy();
  });


  it("filters purge history and opens the annotated PDF confirmation", () => {
    testState.adminUnlocked = true;
    testState.purgeRuns = [
      { id: 1, runType: "automatic", status: "success", deletedCount: 2, retentionDays: 365, cutoff: new Date(), taskUid: "T_success", errorMessage: null, startedAt: new Date(), completedAt: new Date() },
      { id: 2, runType: "automatic", status: "failed", deletedCount: 0, retentionDays: 365, cutoff: new Date(), taskUid: "T_failed", errorMessage: "timeout réseau", startedAt: new Date(), completedAt: new Date() },
    ];
    render(React.createElement(Admin));
    expect(screen.getByText("2 exécutions affichées")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Échecs" }));
    expect(screen.getByText("1 exécution affichée")).toBeTruthy();
    expect(screen.getByText("timeout réseau")).toBeTruthy();
    expect(screen.queryByText("T_success")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Rapport parcours client PDF" }));
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Notes personnalisées"), { target: { value: "Test pilote à vérifier dans Excel Desktop." } });
    expect((screen.getByLabelText("Notes personnalisées") as HTMLTextAreaElement).value).toContain("Excel Desktop");
  });


  it("compares the current seven-day purge volume with the previous week", () => {
    testState.adminUnlocked = true;
    const dateWithOffset = (days: number) => { const date = new Date(); date.setDate(date.getDate() + days); return date; };
    testState.purgeRuns = [
      { id: 10, runType: "automatic", status: "success", deletedCount: 3, retentionDays: 365, cutoff: dateWithOffset(-1), taskUid: "T_current", errorMessage: null, startedAt: dateWithOffset(-1), completedAt: dateWithOffset(-1) },
      { id: 11, runType: "automatic", status: "success", deletedCount: 1, retentionDays: 365, cutoff: dateWithOffset(-8), taskUid: "T_previous", errorMessage: null, startedAt: dateWithOffset(-8), completedAt: dateWithOffset(-8) },
    ];
    render(React.createElement(Admin));
    expect(screen.getByText("Tendance vs semaine précédente")).toBeTruthy();
    expect(screen.getByText(/\+2 contacts — \+200%/)).toBeTruthy();
    expect(screen.getByText("Cette semaine : 3 · Semaine précédente : 1")).toBeTruthy();
  });
