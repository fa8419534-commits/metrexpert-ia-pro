import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./storage", () => ({
  storagePut: vi.fn(async (key: string) => ({ key, url: `/storage/${key}` })),
  storageGetSignedUrl: vi.fn(async (key: string) => `https://signed.example/${encodeURIComponent(key)}`),
}));

import { createPaymentRequest, getPaymentProofUrl, getPaymentRequest, reviewPaymentProof, uploadPaymentProof } from "./paymentRequests";

describe("payment proof workflow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores a valid image proof and lets Admin review it", async () => {
    const request = await createPaymentRequest({ clientName: "Test Client", phone: "+2250100000000", planQuota: 5, paymentMethod: "wave", paymentReference: "TX-123" });
    const proof = await uploadPaymentProof(request.requestKey, { fileName: "transfert.png", dataUrl: "data:image/png;base64,iVBORw0KGgo=" });
    expect(proof.proofStatus).toBe("pending");
    const publicRequest = await getPaymentRequest(request.requestKey);
    expect(publicRequest?.hasProof).toBe(true);
    expect(publicRequest?.proofFileName).toBe("transfert.png");
    expect((await reviewPaymentProof(request.id, "approved", "Référence vérifiée.")).status).toBe("approved");
    const signed = await getPaymentProofUrl(request.id);
    expect(signed.url).toContain("transfert.png");
  });

  it("rejects spoofed or unsupported proof formats", async () => {
    const request = await createPaymentRequest({ clientName: "Test Client", phone: "+2250100000000", planQuota: 5, paymentMethod: "mtn", paymentReference: "TX-456" });
    await expect(uploadPaymentProof(request.requestKey, { fileName: "preuve.pdf", dataUrl: "data:application/pdf;base64,JVBERi0=" })).rejects.toThrow("PNG, JPEG ou WEBP");
    await expect(uploadPaymentProof(request.requestKey, { fileName: "preuve.png", dataUrl: "data:image/png;base64,QUJDRA==" })).rejects.toThrow("ne correspond pas");
  });
});
