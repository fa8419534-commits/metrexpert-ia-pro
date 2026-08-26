// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    security: {
      status: { useQuery: () => ({ data: { unlocked: true, hourlyRemaining: 3, hourlyLimit: 5, dailyTotal: 10, dailyLimit: 50 }, refetch: vi.fn() }) },
      verifyAccessCode: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: undefined }) },
      verifyClientCode: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: undefined }) },
    },
    estimate: { generate: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn(), error: undefined }) } },
  },
}));

import Home from "../client/src/pages/Home";

const SIGNATURE_KEY = "metrexpert:validation-image:signature";
const STAMP_KEY = "metrexpert:validation-image:stamp";
const storedImage = (name: string) => JSON.stringify({ version: 1, name, dataUrl: "data:image/png;base64,abc" });

describe("brand image cache interactions", () => {
  beforeEach(() => localStorage.clear());

  it("supports cancelling individual deletion, confirming it, and clearing all cached images", async () => {
    localStorage.setItem(SIGNATURE_KEY, storedImage("signature.png"));
    const { unmount } = render(React.createElement(Home));

    await waitFor(() => expect(screen.getByText("Enregistrée localement")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Effacer l’image de signature mémorisée" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(localStorage.getItem(SIGNATURE_KEY)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Effacer l’image de signature mémorisée" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmer la suppression" }));
    await waitFor(() => expect(localStorage.getItem(SIGNATURE_KEY)).toBeNull());
    expect(screen.queryByText("Enregistrée localement")).toBeNull();

    unmount();
    localStorage.setItem(SIGNATURE_KEY, storedImage("signature.png"));
    localStorage.setItem(STAMP_KEY, storedImage("tampon.png"));
    render(React.createElement(Home));
    await waitFor(() => expect(screen.getAllByText("Enregistrée localement")).toHaveLength(2));
    fireEvent.click(screen.getByRole("button", { name: "Effacer toutes les données locales de signature et de tampon" }));
    expect(screen.getByText("Les images mémorisées de signature et de tampon seront supprimées de ce navigateur.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirmer la suppression" }));
    await waitFor(() => {
      expect(localStorage.getItem(SIGNATURE_KEY)).toBeNull();
      expect(localStorage.getItem(STAMP_KEY)).toBeNull();
    });
  });
});

export {};

