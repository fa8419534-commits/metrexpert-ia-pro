import ExcelJS from "exceljs";
import { buildHypotheses, calculateGeometry, runQuantityChecks, type QuantityCheck } from "./quantityChecks";

export type GeometryFormula = "linear" | "surface" | "volume" | "count";

export type GeometryDimension = {
  code: string;
  designation: string;
  formula: GeometryFormula;
  unit: string;
  length?: number;
  width?: number;
  height?: number;
  openingArea?: number;
  quantity?: number;
  notes?: string;
};

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
  trialVersion?: boolean;
  hypotheses?: string[];
  quantityChecks?: QuantityCheck[];
  geometry?: GeometryDimension[];
  measures: MeasureItem[];
};

const COLORS = { anthracite: "0F1613", card: "16201C", gold: "C9A15A", paper: "EDEAE2", line: "3A4A42", sage: "7C9A76", muted: "AEB7B0", red: "9D554B" };
const argb = (hex: string) => `FF${hex}`;

function applyFill(cell: ExcelJS.Cell, color: string) { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(color) } }; }
function applyBorder(cell: ExcelJS.Cell, color = COLORS.line) { cell.border = { top: { style: "thin", color: { argb: argb(color) } }, bottom: { style: "thin", color: { argb: argb(color) } }, left: { style: "thin", color: { argb: argb(color) } }, right: { style: "thin", color: { argb: argb(color) } } }; }
function styleCell(cell: ExcelJS.Cell, options: { fill?: string; color?: string; size?: number; bold?: boolean; italic?: boolean; align?: ExcelJS.Alignment["horizontal"]; wrap?: boolean; border?: string; font?: string }) {
  if (options.fill) applyFill(cell, options.fill);
  if (options.border !== "none") applyBorder(cell, options.border);
  cell.font = { name: options.font || "Aptos", size: options.size || 10, bold: options.bold, italic: options.italic, color: { argb: argb(options.color || COLORS.anthracite) } };
  cell.alignment = { vertical: "middle", horizontal: options.align || "left", wrapText: options.wrap ?? true };
}
function columnNumber(column: string) { return column.split("").reduce((value, char) => value * 26 + char.charCodeAt(0) - 64, 0); }
function styleRange(sheet: ExcelJS.Worksheet, range: string, options: Parameters<typeof styleCell>[1]) {
  const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  if (!match) return;
  for (let row = Number(match[2]); row <= Number(match[4]); row += 1) {
    for (let column = columnNumber(match[1]); column <= columnNumber(match[3]); column += 1) styleCell(sheet.getCell(row, column), options);
  }
}
function setFormula(cell: ExcelJS.Cell, formula: string, result: number, options: Parameters<typeof styleCell>[1]) { cell.value = { formula: formula.replace(/^=+/, ""), result }; styleCell(cell, options); }

function decodeBrandImage(dataUrl: string): { buffer: Buffer; extension: "png" | "jpeg" } {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match) throw new Error("Image de validation invalide : seuls PNG et JPEG sont acceptés.");
  return { buffer: Buffer.from(match[2].replace(/\s/g, ""), "base64"), extension: match[1] === "image/png" ? "png" : "jpeg" };
}

export async function buildEstimateWorkbook(data: ProjectEstimate): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MÉTREXPERT IA PRO";
  workbook.lastModifiedBy = "MÉTREXPERT IA PRO";
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  const currency = data.currency || "FCFA";
  const issueDate = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Abidjan" }).format(new Date());
  const reference = `MXP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const clientName = data.client || "À compléter";
  const projectTitle = data.projectTitle || "À compléter";
  const total = data.measures.reduce((sum, item) => sum + item.quantity * (item.factor ?? 1) * (item.unitPrice ?? 0), 0);
  const totalRow = data.measures.length + 2;
  const cover = workbook.addWorksheet("Couverture");
  cover.columns = [{ width: 18 }, { width: 28 }, { width: 18 }, { width: 28 }];
  cover.pageSetup = { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 1, paperSize: 9 };
  cover.pageSetup.margins = { left: 0.25, right: 0.25, top: 0.35, bottom: 0.35, header: 0.1, footer: 0.1 };
  const set = (address: string, value: string | number) => { cover.getCell(address).value = value; };
  const merged = (range: string, value: string, opts: Parameters<typeof styleCell>[1]) => { cover.mergeCells(range); const cell = cover.getCell(range.split(":")[0]); cell.value = value; styleCell(cell, opts); styleRange(cover, range, opts); };
  const section = (row: number, value: string) => merged(`A${row}:D${row}`, value, { fill: COLORS.gold, color: COLORS.anthracite, bold: true, border: COLORS.gold });
  merged("A1:D1", "MÉTREXPERT IA PRO", { fill: COLORS.anthracite, color: COLORS.gold, size: 20, bold: true, font: "Aptos Display", border: COLORS.line });
  merged("A2:D2", data.trialVersion ? "VERSION D’ESSAI GRATUIT — abonnement requis pour un usage régulier" : "MÉTRÉ • QUANTITATIF • DQE", { fill: COLORS.anthracite, color: COLORS.paper, italic: true, border: COLORS.line });
  section(3, "DOCUMENT DE TRAVAIL — COUVERTURE");
  [["A4", "Référence"], ["C4", "Émission"], ["A5", "Version"], ["C5", "Devise"]].forEach(([address, value]) => { set(address, value); styleCell(cover.getCell(address), { fill: COLORS.card, color: COLORS.gold, bold: true }); });
  [["B4", reference], ["D4", issueDate], ["B5", "V1"], ["D5", currency]].forEach(([address, value]) => { set(address, value); styleCell(cover.getCell(address), { fill: "F5F3ED", color: COLORS.anthracite }); });
  section(7, "IDENTITÉ DU PROJET");
  [["A8", "Nom du projet"], ["C8", "Localisation"], ["B8", projectTitle], ["D8", data.location || "À compléter"]].forEach(([address, value]) => { set(address, value); styleCell(cover.getCell(address), { fill: address[0] === "A" || address[0] === "C" ? COLORS.card : "F5F3ED", color: address[0] === "A" || address[0] === "C" ? COLORS.gold : COLORS.anthracite, bold: address[0] === "A" || address[0] === "C" }); });
  section(10, "INFORMATIONS CLIENT");
  [["A11", "Nom"], ["B11", clientName], ["C11", "Téléphone"], ["D11", data.clientPhone || "À compléter"], ["A12", "E-mail"], ["B12", data.clientEmail || "À compléter"], ["C12", "Statut"], ["D12", "À confirmer"]].forEach(([address, value]) => { set(address, value); styleCell(cover.getCell(address), { fill: ["A11", "C11", "A12", "C12"].includes(address) ? COLORS.card : "F5F3ED", color: ["A11", "C11", "A12", "C12"].includes(address) ? COLORS.gold : COLORS.anthracite, bold: ["A11", "C11", "A12", "C12"].includes(address) }); });
  section(14, "RÉSUMÉ FINANCIER");
  set("A15", "TOTAL GÉNÉRAL"); styleCell(cover.getCell("A15"), { fill: COLORS.card, color: COLORS.gold, bold: true, size: 13, font: "Aptos Display" });
  setFormula(cover.getCell("B15"), `'DQE'!F${totalRow}`, total, { fill: COLORS.gold, color: COLORS.anthracite, bold: true, size: 18, align: "right", font: "Aptos Display" });
  set("C15", currency); styleCell(cover.getCell("C15"), { fill: COLORS.anthracite, color: COLORS.gold, bold: true, size: 13, font: "Aptos Display" });
  set("D15", "Voir feuille DQE"); styleCell(cover.getCell("D15"), { fill: COLORS.anthracite, color: COLORS.paper, italic: true });
  [["A16", "Contrôle"], ["B16", "Requis avant usage contractuel"], ["C16", "Postes"], ["D16", String(data.measures.length)]].forEach(([address, value]) => { set(address, value); styleCell(cover.getCell(address), { fill: address[0] === "A" || address[0] === "C" ? COLORS.card : "F5F3ED", color: address[0] === "A" || address[0] === "C" ? COLORS.gold : COLORS.anthracite, bold: address[0] === "A" || address[0] === "C" }); });
  section(18, "PRESTATAIRE");
  [["A19", "Structure"], ["B19", "MÉTREXPERT IA PRO — préparé par Daouda"], ["C19", "Téléphone"], ["D19", "07 67 15 93 51"], ["A20", "E-mail"], ["B20", "dawoud.digitallab@gmail.com"], ["C20", "WhatsApp"], ["D20", "01 51 61 05 12"], ["A21", "Vérifié par"], ["B21", data.verifiedBy || "À compléter"], ["C21", "Date de validation"], ["D21", data.validationDate || "À compléter"]].forEach(([address, value]) => { set(address, value); styleCell(cover.getCell(address), { fill: ["A19", "C19", "A20", "C20", "A21", "C21"].includes(address) ? COLORS.card : "F5F3ED", color: ["A19", "C19", "A20", "C20", "A21", "C21"].includes(address) ? COLORS.gold : COLORS.anthracite, bold: ["A19", "C19", "A20", "C20", "A21", "C21"].includes(address) }); });
  section(22, "SIGNATURE NUMÉRIQUE / TAMPON D’ENTREPRISE");
  [["A23", "Signature numérique"], ["B23", "À compléter"], ["C23", "Tampon d’entreprise"], ["D23", "À compléter"], ["A24", "Nom du signataire"], ["B24", "À compléter"], ["C24", "Référence du tampon"], ["D24", "À compléter"]].forEach(([address, value]) => { set(address, value); styleCell(cover.getCell(address), { fill: ["A23", "C23", "A24", "C24"].includes(address) ? COLORS.card : "F5F3ED", color: ["A23", "C23", "A24", "C24"].includes(address) ? COLORS.gold : COLORS.anthracite, bold: ["A23", "C23", "A24", "C24"].includes(address) }); });
  section(25, "MENTIONS, HYPOTHÈSES ET AVERTISSEMENT");
  merged("A26:D26", data.summary || "Généré à partir des éléments fournis. Vérifier les hypothèses, unités et prix avant usage contractuel.", { fill: "F5F3ED", color: COLORS.anthracite, border: COLORS.line });
  merged("A27:D27", "Les informations absentes sont indiquées « À compléter ». Ce document est une base de travail assistée par IA : vérifier données d’entrée, hypothèses, unités, prix, quantités et périmètre des lots avant toute utilisation contractuelle.", { fill: COLORS.anthracite, color: COLORS.paper, italic: true, size: 9, border: COLORS.gold });
  for (let row = 1; row <= 27; row += 1) {
    if ([1, 2, 3, 4, 5, 7, 10, 14, 15, 16, 18, 22, 25].includes(row)) cover.getRow(row).height = 22;
    else if ([8, 11, 12, 19, 20, 21, 23, 24].includes(row)) cover.getRow(row).height = 30;
    else if (row === 26) cover.getRow(row).height = 34;
    else if (row === 27) cover.getRow(row).height = 44;
    else cover.getRow(row).height = 6;
  }

  const hypotheses = data.hypotheses?.length ? data.hypotheses : buildHypotheses(data);
  const hypothesisSheet = workbook.addWorksheet("Hypothèses");
  hypothesisSheet.columns = [{ width: 8 }, { width: 105 }, { width: 18 }];
  [["N°", "HYPOTHÈSE / DONNÉE À CONFIRMER", "STATUT"], ...hypotheses.map((value, index) => [index + 1, value, "À CONFIRMER"])].forEach((row) => hypothesisSheet.addRow(row));
  styleRange(hypothesisSheet, `A1:C${hypothesisSheet.rowCount}`, { fill: "F7F6F1", color: COLORS.anthracite, border: COLORS.line }); styleRange(hypothesisSheet, "A1:C1", { fill: COLORS.anthracite, color: COLORS.gold, bold: true, align: "center", border: COLORS.gold });
  hypothesisSheet.views = [{ state: "frozen", ySplit: 1 }];

  if (data.geometry?.length) {
    const geometrySheet = workbook.addWorksheet("Géométrie");
    geometrySheet.columns = [{ width: 14 }, { width: 36 }, { width: 14 }, { width: 12 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 16 }, { width: 22 }];
    geometrySheet.addRow(["Code", "Désignation", "Formule", "Unité", "Longueur", "Largeur", "Hauteur", "Ouvertures", "Répétitions", "Résultat indépendant"]);
    data.geometry.forEach((dimension) => geometrySheet.addRow([dimension.code, dimension.designation, dimension.formula, dimension.unit, dimension.length ?? "", dimension.width ?? "", dimension.height ?? "", dimension.openingArea ?? 0, dimension.quantity ?? 1, calculateGeometry(dimension) ?? "À confirmer"]));
    styleRange(geometrySheet, `A1:J${geometrySheet.rowCount}`, { fill: "F7F6F1", color: COLORS.anthracite, border: COLORS.line });
    styleRange(geometrySheet, "A1:J1", { fill: COLORS.anthracite, color: COLORS.gold, bold: true, align: "center", border: COLORS.gold });
    geometrySheet.getColumn(5).numFmt = "#,##0.00";
    geometrySheet.getColumn(6).numFmt = "#,##0.00";
    geometrySheet.getColumn(7).numFmt = "#,##0.00";
    geometrySheet.getColumn(8).numFmt = "#,##0.00";
    geometrySheet.getColumn(9).numFmt = "#,##0.00";
    geometrySheet.getColumn(10).numFmt = "#,##0.00";
    geometrySheet.autoFilter = { from: "A1", to: `J${geometrySheet.rowCount}` };
    geometrySheet.views = [{ state: "frozen", ySplit: 1 }];
  }

  const checks = data.quantityChecks?.length ? data.quantityChecks : runQuantityChecks(data);
  const checkSheet = workbook.addWorksheet("Contrôles");
  checkSheet.columns = [{ width: 14 }, { width: 36 }, { width: 16 }, { width: 36 }, { width: 38 }, { width: 62 }];
  checkSheet.addRow(["Code", "Poste", "Statut", "Règle", "Constat", "Recommandation"]);
  checks.forEach((check) => checkSheet.addRow([check.code, check.designation, check.status, check.rule, check.observed, check.recommendation]));
  styleRange(checkSheet, `A1:F${checkSheet.rowCount}`, { fill: "F7F6F1", color: COLORS.anthracite, border: COLORS.line }); styleRange(checkSheet, "A1:F1", { fill: COLORS.anthracite, color: COLORS.gold, bold: true, align: "center", border: COLORS.gold });
  checkSheet.getColumn(3).eachCell((cell, row) => { if (row > 1) { const status = String(cell.value); cell.font = { name: "Aptos", size: 10, bold: true, color: { argb: argb(status === "OK" ? COLORS.sage : status === "BLOQUANT" ? COLORS.red : COLORS.gold) } }; } }); checkSheet.autoFilter = { from: "A1", to: `F${checkSheet.rowCount}` }; checkSheet.views = [{ state: "frozen", ySplit: 1 }];

  const measure = workbook.addWorksheet("Métré");
  measure.columns = [{ width: 14 }, { width: 52 }, { width: 12 }, { width: 18 }, { width: 14 }, { width: 20 }, { width: 52 }];
  measure.addRow(["Code", "Désignation", "Unité", "Quantité de base", "Coefficient", "Quantité calculée", "Observations"]);
  data.measures.forEach((item, index) => { const row = index + 2; measure.addRow([item.code, item.designation, item.unit, item.quantity, item.factor ?? 1, null, item.notes || ""]); setFormula(measure.getCell(`F${row}`), `D${row}*E${row}`, item.quantity * (item.factor ?? 1), { fill: "E8F0E7", color: COLORS.anthracite, bold: true, align: "right", border: COLORS.line }); });
  styleRange(measure, `A1:G${measure.rowCount}`, { fill: "F7F6F1", color: COLORS.anthracite, border: COLORS.line }); styleRange(measure, "A1:G1", { fill: COLORS.anthracite, color: COLORS.gold, bold: true, align: "center", border: COLORS.gold });
  measure.getColumn(4).numFmt = "#,##0.00";
  measure.getColumn(5).numFmt = "#,##0.00";
  measure.getColumn(6).numFmt = "#,##0.00";
  measure.autoFilter = { from: "A1", to: `G${measure.rowCount}` }; measure.views = [{ state: "frozen", ySplit: 1 }];

  const dqe = workbook.addWorksheet("DQE");
  dqe.columns = [{ width: 14 }, { width: 52 }, { width: 12 }, { width: 16 }, { width: 22 }, { width: 22 }];
  dqe.addRow(["Code", "Désignation", "Unité", "Quantité", `Prix unitaire (${currency})`, `Montant (${currency})`]);
  data.measures.forEach((item, index) => { const row = index + 2; dqe.addRow([item.code, item.designation, item.unit, null, item.unitPrice ?? 0, null]); setFormula(dqe.getCell(`D${row}`), `IFERROR('Métré'!F${row},0)`, item.quantity * (item.factor ?? 1), { fill: "E8F0E7", color: COLORS.anthracite, bold: true, align: "right", border: COLORS.line }); setFormula(dqe.getCell(`F${row}`), `D${row}*E${row}`, item.quantity * (item.factor ?? 1) * (item.unitPrice ?? 0), { fill: "E8F0E7", color: COLORS.anthracite, bold: true, align: "right", border: COLORS.line }); });
  dqe.addRow(["", "TOTAL ESTIMATIF", "", "", "", null]); setFormula(dqe.getCell(`F${totalRow}`), `SUM(F2:F${totalRow - 1})`, total, { fill: COLORS.gold, color: COLORS.anthracite, bold: true, align: "right", border: COLORS.gold }); styleRange(dqe, `A1:F${dqe.rowCount}`, { fill: "F7F6F1", color: COLORS.anthracite, border: COLORS.line }); styleRange(dqe, "A1:F1", { fill: COLORS.anthracite, color: COLORS.gold, bold: true, align: "center", border: COLORS.gold }); styleRange(dqe, `A${totalRow}:F${totalRow}`, { fill: COLORS.gold, color: COLORS.anthracite, bold: true, border: COLORS.gold });
  dqe.getColumn(4).numFmt = "#,##0.00";
  dqe.getColumn(5).numFmt = "#,##0";
  dqe.getColumn(6).numFmt = "#,##0";
  dqe.autoFilter = { from: "A1", to: `F${totalRow - 1}` }; dqe.views = [{ state: "frozen", ySplit: 1 }];

  if (data.signatureImageDataUrl) { const image = decodeBrandImage(data.signatureImageDataUrl); cover.addImage(workbook.addImage({ buffer: image.buffer as any, extension: image.extension }), "B23:B24"); }
  if (data.stampImageDataUrl) { const image = decodeBrandImage(data.stampImageDataUrl); cover.addImage(workbook.addImage({ buffer: image.buffer as any, extension: image.extension }), "D23:D24"); }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
