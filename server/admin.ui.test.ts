// @vitest-environment jsdom
import React from "react";
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
}));

beforeEach(() => {
  testState.adminUnlocked = false;
  testState.codes = [];
  testState.trials = [];
  testState.writeText.mockReset().mockResolvedValue(undefined);
  testState.disable.mockReset();
  testState.contacted.mockReset();
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
      adminMarkFreeTrialWhatsAppContacted: { useMutation: () => ({ isPending: false, mutate: testState.contacted }) },
      adminMarkFreeTrialConverted: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      adminCreateCode: { useMutation: (options?: { onSuccess?: (data: { code: string }) => void }) => ({ isPending: false, mutate: () => options?.onSuccess?.({ code: "MXP-ABC1234567" }) }) },
      adminDisableCode: { useMutation: () => ({ isPending: false, mutate: testState.disable }) },
    },
    useUtils: () => ({ security: { adminListCodes: { invalidate: vi.fn() }, adminListFreeTrials: { invalidate: vi.fn() } } }),
  },
}));

import Admin, { buildFreeTrialCsv } from "../client/src/pages/Admin";

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
