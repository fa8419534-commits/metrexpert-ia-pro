import XLSX from "xlsx-js-style";
import { buildEstimateWorkbook, type ProjectEstimate } from "../server/excel";
import { writeFileSync } from "node:fs";

const input: ProjectEstimate = {
  projectTitle: "Contrôle audit XLSX",
  client: "Projet témoin",
  clientPhone: "+225 07 00 00 00 00",
  clientEmail: "client@example.ci",
  location: "Abidjan",
  summary: "Vérification de la présentation et des formules.",
  currency: "FCFA",
  verifiedBy: "Daouda Sidibé",
  validationDate: "26/08/2026",
  measures: [
    { code: "01", designation: "Béton de fondation", unit: "m³", quantity: 2, unitPrice: 85000, notes: "Contrôle indépendant requis" },
    { code: "02", designation: "Peinture intérieure, deux couches", unit: "m²", quantity: 180, unitPrice: 2500, notes: "HYPOTHÈSE NON DÉFINITIVE" },
  ],
};

const buffer = buildEstimateWorkbook(input);
writeFileSync("/tmp/metrexpert-audit-styled.xlsx", buffer);
const workbook = XLSX.read(buffer, { type: "buffer", cellFormula: true, cellStyles: true });
const formulas = Object.values(workbook.Sheets).flatMap((sheet) =>
  Object.values(sheet).filter((cell): cell is XLSX.CellObject => Boolean(cell && typeof cell === "object" && "f" in cell)).map((cell) => cell.f),
);
console.log(JSON.stringify({
  output: "/tmp/metrexpert-audit-styled.xlsx",
  sheets: workbook.SheetNames,
  coverRef: workbook.Sheets.Couverture?.["!ref"],
  coverCells: ["A4", "B4", "C4", "D4", "A5", "D5", "A8", "B8", "C8", "D8", "A11", "B11", "C11", "D11", "A15", "B15", "C15", "D15", "A19", "B19", "C19", "D19", "A20", "B20", "C20", "D20", "A24"].map((address) => ({ address, value: workbook.Sheets.Couverture?.[address]?.v, formula: workbook.Sheets.Couverture?.[address]?.f })),
  formulas,
  startsWithEquals: formulas.map((formula) => String(formula).startsWith("=")),
  styledCells: ["Couverture!A1", "Métré!A1", "DQE!A1"].map((address) => {
    const [sheetName, cellAddress] = address.split("!");
    return { address, style: Boolean(workbook.Sheets[sheetName]?.[cellAddress]?.s) };
  }),
}));
