// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  adminUnlocked: false,
  trials: [] as Array<{ id: number; clientName: string; phone: string; email: string; trialAt: Date; convertedAt: Date | null }>,
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
}));

beforeEach(() => {
  testState.adminUnlocked = false;
  testState.codes = [];
  testState.trials = [];
  testState.writeText.mockReset().mockResolvedValue(undefined);
  testState.disable.mockReset();
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
      adminMarkFreeTrialConverted: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      adminCreateCode: { useMutation: (options?: { onSuccess?: (data: { code: string }) => void }) => ({ isPending: false, mutate: () => options?.onSuccess?.({ code: "MXP-ABC1234567" }) }) },
      adminDisableCode: { useMutation: () => ({ isPending: false, mutate: testState.disable }) },
    },
    useUtils: () => ({ security: { adminListCodes: { invalidate: vi.fn() }, adminListFreeTrials: { invalidate: vi.fn() } } }),
  },
}));

import Admin from "../client/src/pages/Admin";

describe("Admin panel UI", () => {
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
    testState.trials = [{ id: 2, clientName: "Prospect test", phone: "2250100000000", email: "prospect@exemple.ci", trialAt: new Date("2026-08-26T00:00:00Z"), convertedAt: null }];
    render(React.createElement(Admin));
    expect(screen.getByText("Essais gratuits")).toBeTruthy();
    expect(screen.getByText("Prospect test")).toBeTruthy();
    expect(screen.getByText("À relancer")).toBeTruthy();
    expect(screen.getByText("1 contact")).toBeTruthy();
    const whatsapp = screen.getByRole("link", { name: "Ouvrir WhatsApp pour Prospect test" });
    expect(whatsapp.getAttribute("href")).toContain("https://wa.me/2250100000000?text=");
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
