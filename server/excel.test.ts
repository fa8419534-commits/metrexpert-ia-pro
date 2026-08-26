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
    expect(workbook.Sheets.Couverture?.["!ref"]).toBe("A1:D25");
    expect(workbook.Sheets.Métré?.F2.f).not.toMatch(/^=/);
    expect(workbook.Sheets.DQE?.D2.f).not.toMatch(/^=/);
    expect(workbook.Sheets.DQE?.F2.f).not.toMatch(/^=/);
    expect(workbook.Sheets.Couverture?.A1.v).toBe("MÉTREXPERT IA PRO");
    expect(workbook.Sheets.Couverture?.A1.s).toBeDefined();
    expect(workbook.Sheets.Couverture?.A4.v).toBe("Référence");
    expect(String(workbook.Sheets.Couverture?.B4.v)).toMatch(/^MXP-\d{4}-\d{6}$/);
    expect(workbook.Sheets.Couverture?.A5.v).toBe("Version");
    expect(workbook.Sheets.Couverture?.B5.v).toBe("V1");
    expect(workbook.Sheets.Couverture?.C5.v).toBe("Devise");
    expect(workbook.Sheets.Couverture?.D5.v).toBe("FCFA");
    expect(workbook.Sheets.Couverture?.A14.v).toBe("RÉSUMÉ FINANCIER");
    expect(workbook.Sheets.Couverture?.A15.v).toBe("TOTAL GÉNÉRAL");
    expect(workbook.Sheets.Couverture?.B11.v).toBe("À compléter");
    expect(workbook.Sheets.Couverture?.D11.v).toBe("À compléter");
    expect(workbook.Sheets.Couverture?.B12.v).toBe("À compléter");
    expect(workbook.Sheets.Couverture?.B15.f).toBe("'DQE'!F4");
    expect(workbook.Sheets.Couverture?.B15.s).toBeDefined();
    expect(workbook.Sheets.Couverture?.B19.v).toContain("préparé par Daouda");
    expect(workbook.Sheets.Couverture?.D19.v).toBe("07 67 15 93 51");
    expect(workbook.Sheets.Couverture?.B20.v).toBe("dawoud.digitallab@gmail.com");
    expect(workbook.Sheets.Couverture?.B11.v).toBe("À compléter");
    expect(workbook.Sheets.Couverture?.D11.v).toBe("À compléter");
    expect(workbook.Sheets.Couverture?.B12.v).toBe("À compléter");
    expect(workbook.Sheets.Couverture?.B21.v).toBe("À compléter");
    expect(workbook.Sheets.Couverture?.D21.v).toBe("À compléter");
    expect(workbook.Sheets.Métré?.A1.s).toBeDefined();
    expect(workbook.Sheets.DQE?.A1.s).toBeDefined();
  });

  it("renders supplied client and validation metadata", () => {
    const workbook = XLSX.read(buildEstimateWorkbook({
      projectTitle: "Projet client",
      client: "Client Exemple",
      clientPhone: "+225 07 00 00 00 00",
      clientEmail: "client@example.ci",
      location: "Yopougon",
      currency: "FCFA",
      verifiedBy: "Daouda Sidibé",
      validationDate: "26/08/2026",
      measures: [{ code: "01", designation: "Béton", unit: "m³", quantity: 1, unitPrice: 85000 }],
    }), { type: "buffer", cellFormula: true, cellStyles: true });
    expect(workbook.Sheets.Couverture?.B11.v).toBe("Client Exemple");
    expect(workbook.Sheets.Couverture?.D11.v).toBe("+225 07 00 00 00 00");
    expect(workbook.Sheets.Couverture?.B12.v).toBe("client@example.ci");
    expect(workbook.Sheets.Couverture?.B21.v).toBe("Daouda Sidibé");
    expect(workbook.Sheets.Couverture?.D21.v).toBe("26/08/2026");
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
