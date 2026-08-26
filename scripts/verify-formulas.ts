import XLSX from "xlsx-js-style";
import { buildEstimateWorkbook, type ProjectEstimate } from "../server/excel";
import { writeFileSync } from "node:fs";

const input: ProjectEstimate = {
  projectTitle: "Contrôle audit XLSX",
  client: "Projet témoin",
  location: "Abidjan",
  summary: "Vérification de la présentation et des formules.",
  currency: "FCFA",
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
  formulas,
  startsWithEquals: formulas.map((formula) => String(formula).startsWith("=")),
  styledCells: ["Couverture!A1", "Métré!A1", "DQE!A1"].map((address) => {
    const [sheetName, cellAddress] = address.split("!");
    return { address, style: Boolean(workbook.Sheets[sheetName]?.[cellAddress]?.s) };
  }),
}));
