import XLSX from "xlsx-js-style";
import ExcelJS from "exceljs";

export type MeasureItem = {
  code: string;
  designation: string;
  unit: string;
  quantity: number;
  unitPrice?: number;
  factor?: number;
  notes?: string;
};

export type ProjectEstimate = {
  projectTitle: string;
  client?: string;
  clientPhone?: string;
  clientEmail?: string;
  location?: string;
  summary?: string;
  currency?: string;
  verifiedBy?: string;
  validationDate?: string;
  signatureImageDataUrl?: string;
  stampImageDataUrl?: string;
  measures: MeasureItem[];
};

type CellStyle = Record<string, unknown>;

const COLORS = {
  anthracite: "0F1613",
  card: "16201C",
  gold: "C9A15A",
  paper: "EDEAE2",
  line: "3A4A42",
  sage: "7C9A76",
  muted: "AEB7B0",
};

const border = (color = COLORS.line): CellStyle => ({
  top: { style: "thin", color: { rgb: color } },
  bottom: { style: "thin", color: { rgb: color } },
  left: { style: "thin", color: { rgb: color } },
  right: { style: "thin", color: { rgb: color } },
});

const cell = (value: unknown, style?: CellStyle): XLSX.CellObject => ({
  v: (value ?? "") as string | number | boolean | Date,
  t: typeof value === "number" ? "n" : "s",
  ...(style ? { s: style } : {}),
});

const formula = (f: string, style?: CellStyle): XLSX.CellObject => ({
  f: f.replace(/^=+/, ""),
  v: 0,
  t: "n",
  ...(style ? { s: style } : {}),
});

const titleStyle: CellStyle = {
  fill: { fgColor: { rgb: COLORS.anthracite } },
  font: { name: "Aptos Display", sz: 20, bold: true, color: { rgb: COLORS.gold } },
  alignment: { vertical: "center" },
};

const subtitleStyle: CellStyle = {
  fill: { fgColor: { rgb: COLORS.anthracite } },
  font: { name: "Aptos", sz: 11, color: { rgb: COLORS.paper }, italic: true },
  alignment: { vertical: "center" },
};

const sectionStyle: CellStyle = {
  fill: { fgColor: { rgb: COLORS.gold } },
  font: { name: "Aptos", sz: 10, bold: true, color: { rgb: COLORS.anthracite } },
  alignment: { vertical: "center" },
  border: border(COLORS.gold),
};

const labelStyle: CellStyle = {
  fill: { fgColor: { rgb: COLORS.card } },
  font: { name: "Aptos", sz: 10, bold: true, color: { rgb: COLORS.gold } },
  alignment: { vertical: "center" },
  border: border(),
};

const valueStyle: CellStyle = {
  fill: { fgColor: { rgb: "F5F3ED" } },
  font: { name: "Aptos", sz: 10, color: { rgb: COLORS.anthracite } },
  alignment: { vertical: "center", wrapText: true },
  border: border(),
};

const tableHeaderStyle: CellStyle = {
  fill: { fgColor: { rgb: COLORS.anthracite } },
  font: { name: "Aptos", sz: 10, bold: true, color: { rgb: COLORS.gold } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: border(COLORS.gold),
};

const tableTextStyle: CellStyle = {
  fill: { fgColor: { rgb: "F7F6F1" } },
  font: { name: "Aptos", sz: 10, color: { rgb: COLORS.anthracite } },
  alignment: { vertical: "center", wrapText: true },
  border: border(),
};

const tableNumberStyle: CellStyle = {
  ...tableTextStyle,
  alignment: { horizontal: "right", vertical: "center" },
  numFmt: "#,##0.00",
};

const formulaStyle: CellStyle = {
  ...tableNumberStyle,
  fill: { fgColor: { rgb: "E8F0E7" } },
  font: { name: "Aptos", sz: 10, color: { rgb: COLORS.anthracite }, bold: true },
};

function decodeBrandImage(dataUrl: string): { buffer: Buffer; extension: "png" | "jpeg" } {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match) throw new Error("Image de validation invalide : seuls PNG et JPEG sont acceptés.");
  return { buffer: Buffer.from(match[2].replace(/\s/g, ""), "base64"), extension: match[1] === "image/png" ? "png" : "jpeg" };
}

async function embedCoverageImages(xlsxBuffer: Buffer, data: ProjectEstimate): Promise<Buffer> {
  if (!data.signatureImageDataUrl && !data.stampImageDataUrl) return xlsxBuffer;
  const sourceWorkbook = XLSX.read(xlsxBuffer, { type: "buffer", cellFormula: true });
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(xlsxBuffer as any);
  Object.entries(sourceWorkbook.Sheets).forEach(([sheetName, sourceSheet]) => {
    const targetSheet = workbook.getWorksheet(sheetName);
    if (!targetSheet) return;
    Object.entries(sourceSheet).forEach(([address, sourceCell]) => {
      if (!address.startsWith("!") && sourceCell && typeof sourceCell === "object" && "f" in sourceCell && sourceCell.f && "v" in sourceCell) {
        targetSheet.getCell(address).value = { formula: String(sourceCell.f), result: sourceCell.v as string | number | boolean };
      }
    });
  });
  const calculatedQuantities = data.measures.map((measure) => measure.quantity * (measure.factor ?? 1));
  const calculatedTotal = data.measures.reduce((sum, measure, index) => sum + calculatedQuantities[index] * (measure.unitPrice ?? 0), 0);
  const measureTarget = workbook.getWorksheet("Métré");
  const dqeTarget = workbook.getWorksheet("DQE");
  data.measures.forEach((measure, index) => {
    const row = index + 2;
    if (measureTarget) measureTarget.getCell(`F${row}`).value = { formula: `D${row}*E${row}`, result: calculatedQuantities[index] };
    if (dqeTarget) {
      dqeTarget.getCell(`D${row}`).value = { formula: `IFERROR('Métré'!F${row},0)`, result: calculatedQuantities[index] };
      dqeTarget.getCell(`F${row}`).value = { formula: `D${row}*E${row}`, result: calculatedQuantities[index] * (measure.unitPrice ?? 0) };
    }
  });
  const totalRow = data.measures.length + 2;
  if (dqeTarget) dqeTarget.getCell(`F${totalRow}`).value = { formula: `SUM(F2:F${totalRow - 1})`, result: calculatedTotal };
  const sheet = workbook.getWorksheet("Couverture");
  if (!sheet) return xlsxBuffer;
  sheet.getCell("B15").value = { formula: `'DQE'!F${totalRow}`, result: calculatedTotal };
  if (data.signatureImageDataUrl) {
    const image = decodeBrandImage(data.signatureImageDataUrl);
    const imageId = workbook.addImage({ buffer: image.buffer as any, extension: image.extension });
    sheet.addImage(imageId, "B23:B24");
  }
  if (data.stampImageDataUrl) {
    const image = decodeBrandImage(data.stampImageDataUrl);
    const imageId = workbook.addImage({ buffer: image.buffer as any, extension: image.extension });
    sheet.addImage(imageId, "D23:D24");
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function buildEstimateWorkbook(data: ProjectEstimate): Promise<Buffer> {
  const workbook = XLSX.utils.book_new();
  const currency = data.currency || "FCFA";
  const issuedAt = new Date();
  const issueDate = issuedAt.toLocaleDateString("fr-FR");
  const reference = `MXP-${issuedAt.getFullYear()}-${String(issuedAt.getTime()).slice(-6)}`;
  const totalRow = data.measures.length + 2;
  const clientName = data.client || "À compléter";
  const clientPhone = data.clientPhone || "À compléter";
  const clientEmail = data.clientEmail || "À compléter";
  const projectTitle = data.projectTitle || "À compléter";
  const location = data.location || "À compléter";
  const summary = data.summary || "Généré à partir des éléments fournis. Vérifier les hypothèses, unités et prix avant usage contractuel.";
  const provider = "MÉTREXPERT IA PRO — préparé par Daouda";
  const verifiedBy = data.verifiedBy || "À compléter";
  const validationDate = data.validationDate || "À compléter";
  const projectTitleValueStyle: CellStyle = { ...valueStyle, font: { name: "Aptos", sz: 11, bold: true, color: { rgb: COLORS.anthracite } } };
  const totalLabelStyle: CellStyle = { ...labelStyle, font: { name: "Aptos Display", sz: 13, bold: true, color: { rgb: COLORS.gold } } };
  const totalFormulaStyle: CellStyle = { ...formulaStyle, fill: { fgColor: { rgb: COLORS.gold } }, font: { name: "Aptos Display", sz: 18, bold: true, color: { rgb: COLORS.anthracite } }, alignment: { horizontal: "right", vertical: "center" } };
  const totalCurrencyStyle: CellStyle = { ...valueStyle, font: { name: "Aptos Display", sz: 13, bold: true, color: { rgb: COLORS.gold } }, fill: { fgColor: { rgb: COLORS.anthracite } } };
  const totalLinkStyle: CellStyle = { ...valueStyle, fill: { fgColor: { rgb: COLORS.anthracite } }, font: { name: "Aptos", sz: 10, italic: true, color: { rgb: COLORS.paper } } };

  const cover = [
    [cell("MÉTREXPERT IA PRO", titleStyle), cell("", titleStyle), cell("", titleStyle), cell("", titleStyle)],
    [cell("MÉTRÉ • QUANTITATIF • DQE", subtitleStyle), cell("", subtitleStyle), cell("", subtitleStyle), cell("", subtitleStyle)],
    [cell("DOCUMENT DE TRAVAIL — COUVERTURE", sectionStyle), cell("", sectionStyle), cell("", sectionStyle), cell("", sectionStyle)],
    [cell("Référence", labelStyle), cell(reference, valueStyle), cell("Émission", labelStyle), cell(issueDate, valueStyle)],
    [cell("Version", labelStyle), cell("V1", valueStyle), cell("Devise", labelStyle), cell(currency, valueStyle)],
    [],
    [cell("IDENTITÉ DU PROJET", sectionStyle), cell("", sectionStyle), cell("", sectionStyle), cell("", sectionStyle)],
    [cell("Nom du projet", labelStyle), cell(projectTitle, projectTitleValueStyle), cell("Localisation", labelStyle), cell(location, valueStyle)],
    [],
    [cell("INFORMATIONS CLIENT", sectionStyle), cell("", sectionStyle), cell("", sectionStyle), cell("", sectionStyle)],
    [cell("Nom", labelStyle), cell(clientName, valueStyle), cell("Téléphone", labelStyle), cell(clientPhone, valueStyle)],
    [cell("E-mail", labelStyle), cell(clientEmail, valueStyle), cell("Statut", labelStyle), cell("À confirmer", valueStyle)],
    [],
    [cell("RÉSUMÉ FINANCIER", sectionStyle), cell("", sectionStyle), cell("", sectionStyle), cell("", sectionStyle)],
    [cell("TOTAL GÉNÉRAL", totalLabelStyle), formula(`'DQE'!F${totalRow}`, totalFormulaStyle), cell(currency, totalCurrencyStyle), cell("Voir feuille DQE", totalLinkStyle)],
    [cell("Contrôle", labelStyle), cell("Requis avant usage contractuel", valueStyle), cell("Postes", labelStyle), cell(String(data.measures.length), valueStyle)],
    [],
    [cell("PRESTATAIRE", sectionStyle), cell("", sectionStyle), cell("", sectionStyle), cell("", sectionStyle)],
    [cell("Structure", labelStyle), cell(provider, valueStyle), cell("Téléphone", labelStyle), cell("07 67 15 93 51", valueStyle)],
    [cell("E-mail", labelStyle), cell("dawoud.digitallab@gmail.com", valueStyle), cell("WhatsApp", labelStyle), cell("01 51 61 05 12", valueStyle)],
    [cell("Vérifié par", labelStyle), cell(verifiedBy, valueStyle), cell("Date de validation", labelStyle), cell(validationDate, valueStyle)],
    [cell("SIGNATURE NUMÉRIQUE / TAMPON D’ENTREPRISE", sectionStyle), cell("", sectionStyle), cell("", sectionStyle), cell("", sectionStyle)],
    [cell("Signature numérique", labelStyle), cell("À compléter", valueStyle), cell("Tampon d’entreprise", labelStyle), cell("À compléter", valueStyle)],
    [cell("Nom du signataire", labelStyle), cell("À compléter", valueStyle), cell("Référence du tampon", labelStyle), cell("À compléter", valueStyle)],
    [cell("MENTIONS, HYPOTHÈSES ET AVERTISSEMENT", sectionStyle), cell("", sectionStyle), cell("", sectionStyle), cell("", sectionStyle)],
    [cell(summary, { ...valueStyle, alignment: { wrapText: true, vertical: "top" } }), cell("", valueStyle), cell("", valueStyle), cell("", valueStyle)],
    [cell("Les informations absentes sont indiquées « À compléter ». Ce document est une base de travail assistée par IA : vérifier données d’entrée, hypothèses, unités, prix, quantités et périmètre des lots avant toute utilisation contractuelle.", { fill: { fgColor: { rgb: COLORS.anthracite } }, font: { name: "Aptos", sz: 9, italic: true, color: { rgb: COLORS.paper } }, alignment: { wrapText: true, vertical: "center" }, border: border(COLORS.gold) }), cell("", { fill: { fgColor: { rgb: COLORS.anthracite } }, border: border(COLORS.gold) }), cell("", { fill: { fgColor: { rgb: COLORS.anthracite } }, border: border(COLORS.gold) }), cell("", { fill: { fgColor: { rgb: COLORS.anthracite } }, border: border(COLORS.gold) })],
  ];
  const coverSheet = XLSX.utils.aoa_to_sheet(cover);
  coverSheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: 3 } },
    { s: { r: 9, c: 0 }, e: { r: 9, c: 3 } },
    { s: { r: 13, c: 0 }, e: { r: 13, c: 3 } },
    { s: { r: 17, c: 0 }, e: { r: 17, c: 3 } },
    { s: { r: 21, c: 0 }, e: { r: 21, c: 3 } },
    { s: { r: 24, c: 0 }, e: { r: 24, c: 3 } },
    { s: { r: 25, c: 0 }, e: { r: 25, c: 3 } },
    { s: { r: 26, c: 0 }, e: { r: 26, c: 3 } },
  ];
  coverSheet["!cols"] = [{ wch: 18 }, { wch: 17 }, { wch: 18 }, { wch: 17 }];
  coverSheet["!rows"] = [{ hpt: 32 }, { hpt: 18 }, { hpt: 20 }, { hpt: 22 }, { hpt: 22 }, { hpt: 6 }, { hpt: 20 }, { hpt: 26 }, { hpt: 6 }, { hpt: 20 }, { hpt: 24 }, { hpt: 24 }, { hpt: 6 }, { hpt: 20 }, { hpt: 38 }, { hpt: 24 }, { hpt: 6 }, { hpt: 20 }, { hpt: 24 }, { hpt: 24 }, { hpt: 22 }, { hpt: 24 }, { hpt: 22 }, { hpt: 20 }, { hpt: 28 }, { hpt: 44 }];
  coverSheet["!pageSetup"] = { orientation: "portrait", fitToWidth: 1, fitToHeight: 1, scale: 80 };
  coverSheet["!margins"] = { left: 0.25, right: 0.25, top: 0.35, bottom: 0.35, header: 0.1, footer: 0.1 };
  XLSX.utils.book_append_sheet(workbook, coverSheet, "Couverture");

  const measureRows: XLSX.CellObject[][] = [
    ["Code", "Désignation", "Unité", "Quantité de base", "Coefficient", "Quantité calculée", "Observations"].map((value) => cell(value, tableHeaderStyle)),
  ];
  data.measures.forEach((item) => {
    const row = measureRows.length + 1;
    measureRows.push([
      cell(item.code, tableTextStyle),
      cell(item.designation, tableTextStyle),
      cell(item.unit, tableTextStyle),
      cell(item.quantity, tableNumberStyle),
      cell(item.factor ?? 1, tableNumberStyle),
      formula(`=D${row}*E${row}`, formulaStyle),
      cell(item.notes || "", tableTextStyle),
    ]);
  });
  const measureSheet = XLSX.utils.aoa_to_sheet(measureRows);
  measureSheet["!cols"] = [{ wch: 14 }, { wch: 52 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 52 }];
  measureSheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  measureSheet["!autofilter"] = { ref: `A1:G${measureRows.length}` };
  XLSX.utils.book_append_sheet(workbook, measureSheet, "Métré");

  const dqeRows: XLSX.CellObject[][] = [
    ["Code", "Désignation", "Unité", "Quantité", `Prix unitaire (${currency})`, `Montant (${currency})`].map((value) => cell(value, tableHeaderStyle)),
  ];
  data.measures.forEach((item, index) => {
    const row = index + 2;
    dqeRows.push([
      cell(item.code, tableTextStyle),
      cell(item.designation, tableTextStyle),
      cell(item.unit, tableTextStyle),
      formula(`=IFERROR('Métré'!F${row},0)`, formulaStyle),
      cell(item.unitPrice ?? 0, tableNumberStyle),
      formula(`=D${row}*E${row}`, formulaStyle),
    ]);
  });
  dqeRows.push([
    cell("", sectionStyle), cell("TOTAL ESTIMATIF", sectionStyle), cell("", sectionStyle), cell("", sectionStyle), cell("", sectionStyle), formula(`=SUM(F2:F${totalRow - 1})`, { ...formulaStyle, fill: { fgColor: { rgb: COLORS.gold } }, font: { name: "Aptos", sz: 10, bold: true, color: { rgb: COLORS.anthracite } } }),
  ]);
  const dqeSheet = XLSX.utils.aoa_to_sheet(dqeRows);
  dqeSheet["!cols"] = [{ wch: 14 }, { wch: 52 }, { wch: 12 }, { wch: 16 }, { wch: 22 }, { wch: 22 }];
  dqeSheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  dqeSheet["!autofilter"] = { ref: `A1:F${totalRow - 1}` };
  XLSX.utils.book_append_sheet(workbook, dqeSheet, "DQE");

  workbook.Workbook = {
    ...(workbook.Workbook || {}),
    CalcPr: { calcMode: "auto", fullCalcOnLoad: true, forceFullCalc: true },
  } as typeof workbook.Workbook;

  const xlsxBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx", cellStyles: true });
  return embedCoverageImages(xlsxBuffer, data);
}
