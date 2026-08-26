import { beforeEach, describe, expect, it } from "vitest";
import { createPaymentRequest, getPaymentRequest, resetPaymentRequestsForTests, reviewPaymentRequest } from "./paymentRequests";
import { resetSecurityStateForTests } from "./security";

describe("demandes de paiement manuel", () => {
  beforeEach(() => {
    resetPaymentRequestsForTests();
    resetSecurityStateForTests();
  });

  it("enregistre une demande en attente puis confirme le forfait une seule fois", async () => {
    const created = await createPaymentRequest({ clientName: "Client test", phone: "+2250700000000", planQuota: 15, paymentMethod: "wave", paymentReference: "TX-001" });
    expect(created.status).toBe("pending");
    const confirmed = await reviewPaymentRequest(created.id, "confirmed");
    expect(confirmed.status).toBe("confirmed");
    expect("accessCode" in confirmed && confirmed.accessCode).toMatch(/^MXP-/);
    const repeated = await reviewPaymentRequest(created.id, "confirmed");
    expect(repeated.status).toBe("confirmed");
    expect("accessCode" in repeated && repeated.accessCode).toBe(confirmed.accessCode);
    expect((await getPaymentRequest(created.requestKey))?.status).toBe("confirmed");
  });

  it("conserve une demande refusée sans créer de code client", async () => {
    const created = await createPaymentRequest({ clientName: "Client refusé", phone: "+2250700000001", planQuota: 5, paymentMethod: "mtn", paymentReference: "TX-002" });
    const rejected = await reviewPaymentRequest(created.id, "rejected", "Référence non retrouvée");
    expect(rejected.status).toBe("rejected");
    expect(rejected.accessCodeId).toBeNull();
  });
});
