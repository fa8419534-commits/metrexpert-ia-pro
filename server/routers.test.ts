import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { buildEstimateWorkbookFromRequest, requestSchema, validateBrandImageDataUrl, validateEstimate } from "./routers";

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
      description: "Construction d’une villa R+1 de 180 m² à Abidjan.",
      clientPhone: "+225 07 00 00 00 00",
      clientEmail: "client@example.ci",
      verifiedBy: "Daouda Sidibé",
      validationDate: "26/08/2026",
      signatureImageDataUrl: validPng,
      stampImageDataUrl: validPng,
    });
    expect(parsed.signatureImageDataUrl).toBe(validPng);
    expect(parsed.stampImageDataUrl).toBe(validPng);
    const workbook = XLSX.read(await buildEstimateWorkbookFromRequest({
      projectTitle: "Villa test",
      client: "Client Exemple",
      currency: "FCFA",
      measures: [{ code: "01", designation: "Béton", unit: "m³", quantity: 1, unitPrice: 85000 }],
    }, parsed), { type: "buffer", cellFormula: true, cellStyles: true });
    expect(workbook.Sheets.Couverture?.D11.v).toBe("+225 07 00 00 00 00");
    expect(workbook.Sheets.Couverture?.B12.v).toBe("client@example.ci");
    expect(workbook.Sheets.Couverture?.B21.v).toBe("Daouda Sidibé");
    expect(workbook.Sheets.Couverture?.D21.v).toBe("26/08/2026");
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

  it("rejects missing required project data", () => {
    expect(() => validateEstimate({ projectTitle: "", measures: [] })).toThrow();
    expect(() => validateEstimate({ projectTitle: "Projet", measures: [{ code: "01", designation: "Poste", unit: "m²", quantity: -1 }] })).toThrow();
  });
});
