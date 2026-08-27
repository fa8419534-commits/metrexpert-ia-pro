import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { buildEstimateWorkbook } from "../server/excel";

const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const outputDir = "/home/ubuntu/metrexpert-ia-pro/docs/test-artifacts";
mkdirSync(outputDir, { recursive: true });
const outputPath = join(outputDir, "metrexpert-test-signature-tampon.xlsx");
const workbook = await buildEstimateWorkbook({
  projectTitle: "Test insertion signature et tampon",
  location: "Yopougon — test interne",
  currency: "FCFA",
  verifiedBy: "Test interne",
  validationDate: "27/08/2026",
  signatureImageDataUrl: image,
  stampImageDataUrl: image,
  measures: [{ code: "01", designation: "Béton de test", unit: "m³", quantity: 2, unitPrice: 85000 }],
});
writeFileSync(outputPath, workbook);
console.log(outputPath);
