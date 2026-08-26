import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

    const workbook = XLSX.read(buildEstimateWorkbook(input), { type: "buffer", cellFormula: true, cellStyles: true });
    expect(workbook.SheetNames).toEqual(["Couverture", "Métré", "DQE"]);
    expect(workbook.Sheets.Métré?.F2.f).toBe("D2*E2");
    expect(workbook.Sheets.DQE?.D2.f).toBe("IFERROR('Métré'!F2,0)");
    expect(workbook.Sheets.DQE?.F2.f).toBe("D2*E2");
    expect(workbook.Sheets.DQE?.F4.f).toBe("SUM(F2:F3)");
    expect(workbook.Sheets.Métré?.F2.f).not.toMatch(/^=/);
    expect(workbook.Sheets.DQE?.D2.f).not.toMatch(/^=/);
    expect(workbook.Sheets.DQE?.F2.f).not.toMatch(/^=/);
    expect(workbook.Sheets.Couverture?.A1.v).toBe("MÉTREXPERT IA PRO");
    expect(workbook.Sheets.Couverture?.A1.s).toBeDefined();
    expect(workbook.Sheets.Métré?.A1.s).toBeDefined();
    expect(workbook.Sheets.DQE?.A1.s).toBeDefined();
  });

  it("writes formula XML without a leading equals sign", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "metrexpert-xlsx-"));
    const xlsxPath = join(tempDir, "formula-check.xlsx");
    try {
      writeFileSync(xlsxPath, buildEstimateWorkbook({
        projectTitle: "XML test",
        measures: [{ code: "01", designation: "Béton", unit: "m³", quantity: 2, unitPrice: 85000 }],
      }));
      const worksheetXml = ["sheet1.xml", "sheet2.xml", "sheet3.xml"].map((name) =>
        execFileSync("unzip", ["-p", xlsxPath, `xl/worksheets/${name}`], { encoding: "utf8" }),
      ).join("\\n");
      const formulas = [...worksheetXml.matchAll(/<f(?: [^>]*)?>([^<]*)<\/f>/g)].map((match) => match[1]);
      expect(formulas.length).toBeGreaterThan(0);
      expect(formulas.every((formula) => formula && !formula.startsWith("="))).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
