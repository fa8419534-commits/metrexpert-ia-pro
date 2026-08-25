import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { buildEstimateWorkbook, type ProjectEstimate } from "./excel";

describe("buildEstimateWorkbook", () => {
  it("creates the required sheets with live formulas", () => {
    const input: ProjectEstimate = {
      projectTitle: "Villa test",
      currency: "FCFA",
      measures: [
        { code: "01", designation: "Béton de fondation", unit: "m³", quantity: 12, unitPrice: 85000 },
        { code: "02", designation: "Agglos", unit: "m²", quantity: 140, unitPrice: 7500 },
      ],
    };

    const workbook = XLSX.read(buildEstimateWorkbook(input), { type: "buffer", cellFormula: true });
    expect(workbook.SheetNames).toEqual(["Couverture", "Métré", "DQE"]);
    expect(workbook.Sheets.Métré?.F2.f).toBe("=D2*E2");
    expect(workbook.Sheets.DQE?.D2.f).toBe("=IFERROR('Métré'!F2,0)");
    expect(workbook.Sheets.DQE?.F2.f).toBe("=D2*E2");
    expect(workbook.Sheets.DQE?.F4.f).toBe("=SUM(F2:F3)");
  });
});
