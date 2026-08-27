// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const writeText = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    security: {
      submitPaymentRequest: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      uploadPaymentProof: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      getPaymentRequest: { useQuery: () => ({ data: undefined, refetch: vi.fn() }) },
    },
  },
}));

import PaymentRequestPanel from "../client/src/components/PaymentRequestPanel";

describe("PaymentRequestPanel", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    sessionStorage.clear();
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  });

  it("affiche les trois comptes de réception et le titulaire", () => {
    render(React.createElement(PaymentRequestPanel));
    expect(screen.getByText("Coordonnées de réception")).toBeTruthy();
    expect(screen.getByText("0555067892")).toBeTruthy();
    expect(screen.getByText(/Titulaire :\s*ISSIA/)).toBeTruthy();
    expect(screen.getAllByText("0151610512")).toHaveLength(2);
    expect(screen.getAllByText(/Titulaire :\s*SIDIBE DAOUDA/)).toHaveLength(2);
    expect(screen.getAllByText(/Professionnel/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/5 000 FCFA/).length).toBeGreaterThan(0);
  });

  it("copie le numéro du moyen sélectionné sur demande", () => {
    render(React.createElement(PaymentRequestPanel));
    fireEvent.click(screen.getByRole("button", { name: "Copier le numéro Wave" }));
    expect(writeText).toHaveBeenCalledWith("0151610512");
  });

  it("affiche l’avertissement de sécurité avant le transfert", () => {
    render(React.createElement(PaymentRequestPanel));
    expect(screen.getByRole("note").textContent).toContain("Ne communiquez jamais votre code PIN");
    expect(screen.getByRole("note").textContent).toContain("vérifiez le nom du bénéficiaire");
  });
});
