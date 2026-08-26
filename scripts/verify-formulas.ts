import * as XLSX from "xlsx";
import { buildEstimateWorkbook, type ProjectEstimate } from "../server/excel";
import { writeFileSync } from "node:fs";

const input: ProjectEstimate = {
  projectTitle: "Contrôle formules",
  currency: "FCFA",
  measures: [{ code: "01", designation: "Béton", unit: "m³", quantity: 2, unitPrice: 85000 }],
};

const buffer = buildEstimateWorkbook(input);
writeFileSync("/tmp/metrexpert-formula-check.xlsx", buffer);
const workbook = XLSX.read(buffer, { type: "buffer", cellFormula: true });
const formulas = [workbook.Sheets.Métré?.F2?.f, workbook.Sheets.DQE?.D2?.f, workbook.Sheets.DQE?.F2?.f, workbook.Sheets.DQE?.F3?.f];
console.log(JSON.stringify({ formulas, startsWithEquals: formulas.map((formula) => String(formula).startsWith("=")) }));
