import XLSX from "xlsx-js-style";

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
  location?: string;
  summary?: string;
  currency?: string;
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

export function buildEstimateWorkbook(data: ProjectEstimate): Buffer {
  const workbook = XLSX.utils.book_new();
  const currency = data.currency || "FCFA";

  const cover = [
    [cell("MÉTREXPERT IA PRO", titleStyle), cell("", titleStyle), cell("", titleStyle), cell("", titleStyle)],
    [cell("MÉTRÉ • QUANTITATIF • DQE", subtitleStyle), cell("", subtitleStyle), cell("", subtitleStyle), cell("", subtitleStyle)],
    [cell("IDENTITÉ DU PROJET", sectionStyle), cell("", sectionStyle), cell("", sectionStyle), cell("", sectionStyle)],
    [cell("Projet", labelStyle), cell(data.projectTitle, valueStyle), cell("Client", labelStyle), cell(data.client || "Non renseigné", valueStyle)],
    [cell("Localisation", labelStyle), cell(data.location || "Non renseignée", valueStyle), cell("Devise", labelStyle), cell(currency, valueStyle)],
    [],
    [cell("RÉSUMÉ DES MONTANTS", sectionStyle), cell("", sectionStyle), cell("", sectionStyle), cell("", sectionStyle)],
    [cell("Total estimatif", labelStyle), cell("Voir feuille DQE", valueStyle), cell("Statut", labelStyle), cell("À contrôler avant usage contractuel", valueStyle)],
    [],
    [cell("NOTES ET HYPOTHÈSES", sectionStyle), cell("", sectionStyle), cell("", sectionStyle), cell("", sectionStyle)],
    [cell(data.summary || "Généré à partir des éléments fournis. Vérifier les hypothèses, unités et prix avant usage contractuel.", valueStyle), cell("", valueStyle), cell("", valueStyle), cell("", valueStyle)],
    [],
    [cell("MÉTREXPERT IA PRO — document de travail assisté par IA, soumis à vérification humaine.", {
      fill: { fgColor: { rgb: COLORS.anthracite } },
      font: { name: "Aptos", sz: 9, italic: true, color: { rgb: COLORS.paper } },
      alignment: { wrapText: true, vertical: "center" },
    }), cell("", subtitleStyle), cell("", subtitleStyle), cell("", subtitleStyle)],
  ];
  const coverSheet = XLSX.utils.aoa_to_sheet(cover);
  coverSheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: 3 } },
    { s: { r: 9, c: 0 }, e: { r: 9, c: 3 } },
    { s: { r: 10, c: 0 }, e: { r: 10, c: 3 } },
    { s: { r: 12, c: 0 }, e: { r: 12, c: 3 } },
  ];
  coverSheet["!cols"] = [{ wch: 22 }, { wch: 38 }, { wch: 18 }, { wch: 42 }];
  coverSheet["!rows"] = [{ hpt: 30 }, { hpt: 20 }, { hpt: 22 }, { hpt: 24 }, { hpt: 24 }, { hpt: 8 }, { hpt: 22 }, { hpt: 24 }, { hpt: 8 }, { hpt: 22 }, { hpt: 54 }, { hpt: 8 }, { hpt: 30 }];
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
  const totalRow = data.measures.length + 2;
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

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx", cellStyles: true });
}
