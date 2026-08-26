import { beforeEach, describe, expect, it } from "vitest";
import { createClientAccessCode, listClientAccessCodes, resetSecurityStateForTests } from "./security";

describe("suivi du paiement manuel", () => {
  beforeEach(() => resetSecurityStateForTests());

  it("conserve le moyen et la référence lors de la création d’un code", async () => {
    await createClientAccessCode("Client test", 15, "wave", "TX-2026-001");
    const codes = await listClientAccessCodes();
    expect(codes[0]?.paymentMethod).toBe("wave");
    expect(codes[0]?.paymentReference).toBe("TX-2026-001");
    expect(codes[0]?.paidAt).toBeInstanceOf(Date);
  });
});
