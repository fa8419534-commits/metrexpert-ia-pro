import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildEstimateWorkbook, type ProjectEstimate } from "./excel";
import { buildHypotheses, runQuantityChecks } from "./quantityChecks";

describe("buildEstimateWorkbook", () => {
  it("creates the required sheets with live formulas", async () => {
    const input: ProjectEstimate = {
      projectTitle: "Villa test",
      currency: "FCFA",
      measures: [
        { code: "01", designation: "Béton de fondation", unit: "m³", quantity: 12, unitPrice: 85000 },
        { code: "02", designation: "Agglos", unit: "m²", quantity: 140, unitPrice: 7500 },
      ],
    };

    const workbook = XLSX.read(await buildEstimateWorkbook(input), { type: "buffer", cellFormula: true, cellStyles: true });
    expect(workbook.SheetNames).toEqual(["Couverture", "Hypothèses", "Contrôles", "Métré", "DQE"]);
    expect(workbook.Sheets.Métré?.F2.f).toBe("D2*E2");
    expect(workbook.Sheets.DQE?.D2.f).toBe("IFERROR('Métré'!F2,0)");
    expect(workbook.Sheets.DQE?.F2.f).toBe("D2*E2");
    expect(workbook.Sheets.DQE?.F4.f).toBe("SUM(F2:F3)");
    expect(workbook.Sheets.Couverture?.["!ref"]).toBe("A1:D27");
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
    expect(workbook.Sheets.Couverture?.A22.v).toBe("SIGNATURE NUMÉRIQUE / TAMPON D’ENTREPRISE");
    expect(workbook.Sheets.Couverture?.A23.v).toBe("Signature numérique");
    expect(workbook.Sheets.Couverture?.B23.v).toBe("À compléter");
    expect(workbook.Sheets.Couverture?.C23.v).toBe("Tampon d’entreprise");
    expect(workbook.Sheets.Couverture?.D23.v).toBe("À compléter");
    expect(workbook.Sheets.Métré?.A1.s).toBeDefined();
    expect(workbook.Sheets.DQE?.A1.s).toBeDefined();
  });

  it("renders supplied client and validation metadata", async () => {
    const workbook = XLSX.read(await buildEstimateWorkbook({
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

  it("marks a free trial workbook without removing any required sheet or formula", async () => {
    const workbook = XLSX.read(await buildEstimateWorkbook({ trialVersion: true, projectTitle: "Essai", measures: [{ code: "01", designation: "Béton", unit: "m³", quantity: 1, unitPrice: 85000 }] }), { type: "buffer", cellFormula: true, cellStyles: true });
    expect(workbook.SheetNames).toEqual(["Couverture", "Hypothèses", "Contrôles", "Métré", "DQE"]);
    expect(workbook.Sheets.Couverture?.A2.v).toContain("VERSION D’ESSAI GRATUIT");
    expect(workbook.Sheets.DQE?.F2.f).toBe("D2*E2");
  });

  it("runs independent numeric checks and writes explicit hypotheses", () => {
    const estimate: ProjectEstimate = { projectTitle: "Contrôle", measures: [
      { code: "01", designation: "Béton", unit: "m³", quantity: 2, unitPrice: 85000 },
      { code: "02", designation: "Poste sans prix", unit: "m²", quantity: 12 },
    ] };
    const checks = runQuantityChecks(estimate);
    expect(checks[0]?.status).toBe("OK");
    expect(checks[1]?.status).toBe("À VÉRIFIER");
    expect(buildHypotheses(estimate).some((hypothesis) => hypothesis.includes("Prix unitaire non fourni"))).toBe(true);
  });

  it("embeds supplied signature and stamp images in the XLSX package", async () => {
    const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    const buffer = await buildEstimateWorkbook({
      projectTitle: "Image test",
      signatureImageDataUrl: image,
      stampImageDataUrl: image,
      measures: [{ code: "01", designation: "Béton", unit: "m³", quantity: 1, unitPrice: 85000 }],
    });
    const tempDir = mkdtempSync(join(tmpdir(), "metrexpert-image-xlsx-"));
    const xlsxPath = join(tempDir, "image-check.xlsx");
    try {
      writeFileSync(xlsxPath, buffer);
      const mediaList = execFileSync("unzip", ["-Z1", xlsxPath], { encoding: "utf8" });
      expect(mediaList).toContain("xl/media/image1.png");
      expect(mediaList).toContain("xl/media/image2.png");
      expect(mediaList).toContain("xl/drawings/drawing1.xml");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("writes formula XML without a leading equals sign", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "metrexpert-xlsx-"));
    const xlsxPath = join(tempDir, "formula-check.xlsx");
    try {
      writeFileSync(xlsxPath, await buildEstimateWorkbook({
        projectTitle: "XML test",
        measures: [{ code: "01", designation: "Béton", unit: "m³", quantity: 2, unitPrice: 85000 }],
      }));
      const worksheetXml = ["sheet1.xml", "sheet2.xml", "sheet3.xml", "sheet4.xml", "sheet5.xml"].map((name) =>
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
