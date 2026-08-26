import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { buildEstimateWorkbookFromRequest, requestSchema, validateEstimate } from "./routers";

describe("validateEstimate", () => {
  it("accepts a structured estimate with optional coefficient", () => {
    const result = validateEstimate({
      projectTitle: "Rénovation école",
      measures: [{ code: "G-01", designation: "Dépose carrelage", unit: "m²", quantity: 120, factor: 1.1 }],
    });
    expect(result.projectTitle).toBe("Rénovation école");
    expect(result.measures[0]?.factor).toBe(1.1);
  });

  it("accepts client contacts and validation metadata in the real request schema", () => {
    const parsed = requestSchema.parse({
      description: "Construction d’une villa R+1 de 180 m² à Abidjan.",
      clientPhone: "+225 07 00 00 00 00",
      clientEmail: "client@example.ci",
      verifiedBy: "Daouda Sidibé",
      validationDate: "26/08/2026",
    });
    const workbook = XLSX.read(buildEstimateWorkbookFromRequest({
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

  it("rejects missing required project data", () => {
    expect(() => validateEstimate({ projectTitle: "", measures: [] })).toThrow();
    expect(() => validateEstimate({ projectTitle: "Projet", measures: [{ code: "01", designation: "Poste", unit: "m²", quantity: -1 }] })).toThrow();
  });
});
