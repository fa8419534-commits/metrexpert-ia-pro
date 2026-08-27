import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildEstimateWorkbook } from "../server/excel";

const outputDir = join(process.cwd(), "examples");
const outputPath = join(outputDir, "METREXPERT_IA_PRO_exemple_V1.xlsx");

const workbook = await buildEstimateWorkbook({
  projectTitle: "Maison individuelle — exemple anonymisé",
  client: "Client exemple (données fictives)",
  clientPhone: "+225 00 00 00 00 00",
  clientEmail: "client.exemple@domaine.test",
  location: "Abidjan — localisation fictive",
  currency: "FCFA",
  verifiedBy: "À compléter",
  validationDate: "À compléter",
  hypotheses: [
    "Les dimensions et prix unitaires de cet exemple sont fictifs et servent uniquement à tester le classeur.",
    "Les quantités sont calculées à partir des dimensions saisies dans la feuille Métré.",
    "Les prix unitaires sont indicatifs et doivent être remplacés par les prix réellement retenus.",
    "Aucun lot technique non listé dans le DQE n’est inclus dans le total.",
  ],
  geometry: [
    { code: "G-01", designation: "Dalle principale", formula: "volume", unit: "m³", length: 10, width: 8, height: 0.15, notes: "10,00 × 8,00 × 0,15" },
    { code: "G-02", designation: "Mur extérieur net", formula: "surface", unit: "m²", length: 36, width: 2.8, openingArea: 18, notes: "Périmètre × hauteur − ouvertures" },
    { code: "G-03", designation: "Pièces carrelées", formula: "surface", unit: "m²", length: 8, width: 6, notes: "Surface indicative" },
  ],
  measures: [
    { code: "01.01", designation: "Béton dosé — dalle principale", unit: "m³", quantity: 12, unitPrice: 85000, notes: "Quantité issue de la géométrie G-01" },
    { code: "02.01", designation: "Maçonnerie en agglos creux", unit: "m²", quantity: 82.8, unitPrice: 7500, notes: "Surface nette après déduction des ouvertures" },
    { code: "03.01", designation: "Enduit intérieur et extérieur", unit: "m²", quantity: 165.6, unitPrice: 3200, notes: "Deux faces indicatives" },
    { code: "04.01", designation: "Carrelage sol", unit: "m²", quantity: 48, unitPrice: 9500, notes: "Hors pertes et plinthes" },
    { code: "05.01", designation: "Peinture intérieure", unit: "m²", quantity: 135, unitPrice: 2800, factor: 1, notes: "Prix indicatif couvrant l’ensemble des couches prévues dans cet exemple" },
    { code: "06.01", designation: "Évacuation et transport", unit: "forfait", quantity: 1, unitPrice: 125000, notes: "Forfait fictif à confirmer" },
  ],
});

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, workbook);
console.log(outputPath);
console.log("Taille:", workbook.length, "octets");
console.log("Total attendu:", 12 * 85000 + 82.8 * 7500 + 165.6 * 3200 + 48 * 9500 + 135 * 2800 + 125000, "FCFA");
