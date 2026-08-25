import * as XLSX from "xlsx";

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

const cell = (value: unknown): XLSX.CellObject => ({
  v: (value ?? "") as string | number | boolean | Date,
  t: typeof value === "number" ? "n" : "s",
});

const formula = (f: string): XLSX.CellObject => ({ f, v: 0, t: "n" });

export function buildEstimateWorkbook(data: ProjectEstimate): Buffer {
  const workbook = XLSX.utils.book_new();
  const currency = data.currency || "FCFA";

  const cover = [
    [cell("MÉTREXPERT IA PRO")],
    [cell("Métré & DQE")],
    [],
    [cell("Projet"), cell(data.projectTitle)],
    [cell("Client"), cell(data.client || "Non renseigné")],
    [cell("Localisation"), cell(data.location || "Non renseignée")],
    [cell("Devise"), cell(currency)],
    [],
    [cell("Résumé"), cell(data.summary || "Généré à partir des éléments fournis.")],
    [],
    [cell("Document généré automatiquement — vérifier les hypothèses et prix avant usage contractuel.")],
  ];
  const coverSheet = XLSX.utils.aoa_to_sheet(cover);
  coverSheet["!cols"] = [{ wch: 26 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(workbook, coverSheet, "Couverture");

  const measureRows: XLSX.CellObject[][] = [
    [cell("Code"), cell("Désignation"), cell("Unité"), cell("Quantité de base"), cell("Coefficient"), cell("Quantité calculée"), cell("Observations")],
  ];
  data.measures.forEach((item) => {
    measureRows.push([
      cell(item.code),
      cell(item.designation),
      cell(item.unit),
      cell(item.quantity),
      cell(item.factor ?? 1),
      formula(`=D${measureRows.length + 1}*E${measureRows.length + 1}`),
      cell(item.notes || ""),
    ]);
  });
  const measureSheet = XLSX.utils.aoa_to_sheet(measureRows);
  measureSheet["!cols"] = [{ wch: 14 }, { wch: 52 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 44 }];
  measureSheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(workbook, measureSheet, "Métré");

  const dqeRows: XLSX.CellObject[][] = [
    [cell("Code"), cell("Désignation"), cell("Unité"), cell("Quantité"), cell(`Prix unitaire (${currency})`), cell(`Montant (${currency})`)],
  ];
  data.measures.forEach((item, index) => {
    const row = index + 2;
    dqeRows.push([
      cell(item.code),
      cell(item.designation),
      cell(item.unit),
      formula(`=IFERROR('Métré'!F${row},0)`),
      cell(item.unitPrice ?? 0),
      formula(`=D${row}*E${row}`),
    ]);
  });
  const totalRow = data.measures.length + 2;
  dqeRows.push([cell(""), cell("TOTAL ESTIMATIF"), cell(""), cell(""), cell(""), formula(`=SUM(F2:F${totalRow - 1})`)]);
  const dqeSheet = XLSX.utils.aoa_to_sheet(dqeRows);
  dqeSheet["!cols"] = [{ wch: 14 }, { wch: 52 }, { wch: 12 }, { wch: 16 }, { wch: 22 }, { wch: 22 }];
  dqeSheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(workbook, dqeSheet, "DQE");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
