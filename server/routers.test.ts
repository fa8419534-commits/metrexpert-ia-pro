import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { buildEstimateWorkbookFromRequest, claimGenerationRequest, releaseGenerationRequest, requestSchema, validateBrandImageDataUrl, validateEstimate } from "./routers";
import { calculateGeometry, runQuantityChecks } from "./quantityChecks";

describe("validateEstimate", () => {
  it("accepts a structured estimate with optional coefficient", () => {
    const result = validateEstimate({
      projectTitle: "Rénovation école",
      measures: [{ code: "G-01", designation: "Dépose carrelage", unit: "m²", quantity: 120, factor: 1.1 }],
    });
    expect(result.projectTitle).toBe("Rénovation école");
    expect(result.measures[0]?.factor).toBe(1.1);
  });

  it("accepts client contacts and validation metadata in the real request schema", async () => {
    const validPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    const parsed = requestSchema.parse({
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
      description: "Construction d’une villa R+1 de 180 m² à Abidjan.",
      geometry: [{ code: "01", designation: "Dalle", formula: "surface", unit: "m²", length: 10, width: 12, quantity: 1, openingArea: 0 }],
      clientPhone: "+225 07 00 00 00 00",
      clientEmail: "client@example.ci",
      verifiedBy: "Daouda Sidibé",
      validationDate: "26/08/2026",
      signatureImageDataUrl: validPng,
      stampImageDataUrl: validPng,
    });
    expect(parsed.idempotencyKey).toBe("11111111-1111-4111-8111-111111111111");
    expect(parsed.geometry?.[0]?.formula).toBe("surface");
    expect(parsed.signatureImageDataUrl).toBe(validPng);
    expect(parsed.stampImageDataUrl).toBe(validPng);
    const workbook = XLSX.read(await buildEstimateWorkbookFromRequest({
      projectTitle: "Villa test",
      client: "Client Exemple",
      currency: "FCFA",
      geometry: [{ code: "01", designation: "Dalle", formula: "surface", unit: "m²", length: 10, width: 12, quantity: 1 }],
      measures: [{ code: "01", designation: "Béton", unit: "m³", quantity: 1, unitPrice: 85000 }],
    }, parsed), { type: "buffer", cellFormula: true, cellStyles: true });
    expect(workbook.Sheets.Couverture?.D11.v).toBe("+225 07 00 00 00 00");
    expect(workbook.Sheets.Couverture?.B12.v).toBe("client@example.ci");
    expect(workbook.Sheets.Couverture?.B21.v).toBe("Daouda Sidibé");
    expect(workbook.Sheets.Couverture?.D21.v).toBe("26/08/2026");
    expect(workbook.Sheets.Géométrie?.J2.v).toBe(120);
  });

  it("accepts validation images and rejects spoofed binary content", () => {
    const validPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    expect(validateBrandImageDataUrl(validPng).length).toBeGreaterThan(0);
    expect(() => validateBrandImageDataUrl("data:image/png;base64,SGVsbG8=")).toThrow("contenu binaire");
    expect(() => validateBrandImageDataUrl("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP")).toThrow("PNG ou JPEG");
    const oversizedPng = Buffer.from(validPng.split(",")[1], "base64");
    oversizedPng.writeUInt32BE(3000, 16);
    expect(() => validateBrandImageDataUrl(`data:image/png;base64,${oversizedPng.toString("base64")}`)).toThrow("dimensions");
  });

  it("claims an idempotency key only once until the generation is released", () => {
    const key = "22222222-2222-4222-8222-222222222222";
    expect(claimGenerationRequest(key)).toBe(true);
    expect(claimGenerationRequest(key)).toBe(false);
    releaseGenerationRequest(key);
    expect(claimGenerationRequest(key)).toBe(true);
    releaseGenerationRequest(key);
  });

  it("calculates and checks explicit surface geometry independently", () => {
    expect(calculateGeometry({ code: "01", designation: "Dalle", formula: "surface", unit: "m²", length: 10, width: 12, openingArea: 2, quantity: 1 })).toBe(118);
    const checks = runQuantityChecks({ projectTitle: "Projet", geometry: [{ code: "01", designation: "Dalle", formula: "surface", unit: "m²", length: 10, width: 12, openingArea: 2, quantity: 1 }], measures: [{ code: "01", designation: "Dalle", unit: "m²", quantity: 118, unitPrice: 1 }] });
    expect(checks.some((check) => check.rule.includes("surface") && check.status === "OK")).toBe(true);
  });

  it("rejects missing required project data", () => {
    expect(() => validateEstimate({ projectTitle: "", measures: [] })).toThrow();
    expect(() => validateEstimate({ projectTitle: "Projet", measures: [{ code: "01", designation: "Poste", unit: "m²", quantity: -1 }] })).toThrow();
  });
});
