// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    security: {
      adminStatus: { useQuery: () => ({ data: { unlocked: false } }) },
      verifyAdminCode: { useMutation: () => ({ isPending: false, mutate: vi.fn(), error: undefined }) },
      adminListCodes: { useQuery: () => ({ data: [], isLoading: false, refetch: vi.fn() }) },
      adminCreateCode: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      adminDisableCode: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
    useUtils: () => ({ security: { adminListCodes: { invalidate: vi.fn() } } }),
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
});
