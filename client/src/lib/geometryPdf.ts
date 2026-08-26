import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type GeometryPdfDimension = {
  code: string;
  designation: string;
  formula: string;
  unit: string;
  length?: number;
  width?: number;
  height?: number;
  openingArea?: number;
  quantity?: number;
};

type GeometryPdfCheck = {
  code: string;
  status: string;
  observed: string;
  recommendation: string;
};

const colors = {
  dark: rgb(0.059, 0.086, 0.075),
  panel: rgb(0.086, 0.125, 0.11),
  gold: rgb(0.788, 0.631, 0.353),
  paper: rgb(0.929, 0.918, 0.886),
  muted: rgb(0.56, 0.61, 0.58),
  ok: rgb(0.486, 0.604, 0.463),
  warning: rgb(0.85, 0.62, 0.25),
  danger: rgb(0.75, 0.33, 0.29),
};

function formatDimension(dimension: GeometryPdfDimension) {
  if (dimension.formula === "count") return `${dimension.quantity ?? 1} ×`;
  const parts = [dimension.length, dimension.width, dimension.height].filter((value) => value !== undefined).map((value) => String(value));
  const opening = dimension.openingArea ? ` − ouv. ${dimension.openingArea}` : "";
  return `${parts.join(" × ") || "À confirmer"}${opening} × ${dimension.quantity ?? 1}`;
}

function statusColor(status: string) {
  if (status === "OK") return colors.ok;
  if (status === "BLOQUANT") return colors.danger;
  return colors.warning;
}

export async function exportGeometryReportPdf(input: {
  projectTitle: string;
  documentDate: string;
  dimensions: GeometryPdfDimension[];
  checks: GeometryPdfCheck[];
}) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 42;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const addPageIfNeeded = (height: number) => {
    if (y - height < margin) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };
  const text = (value: string, x: number, size = 9, font = regular, color = colors.paper) => {
    page.drawText(value.slice(0, 105), { x, y, size, font, color });
  };

  page.drawRectangle({ x: 0, y: pageHeight - 112, width: pageWidth, height: 112, color: colors.dark });
  text("MÉTREXPERT IA PRO", margin, 22, bold, colors.gold);
  y -= 32;
  text("RAPPORT DE CONTRÔLE GÉOMÉTRIQUE", margin, 10, bold, colors.paper);
  y -= 22;
  text(`Projet : ${input.projectTitle || "À compléter"}`, margin, 9, regular, colors.muted);
  text(`Émis le : ${input.documentDate}`, 390, 9, regular, colors.muted);
  y = pageHeight - 142;

  page.drawRectangle({ x: margin, y: y - 58, width: pageWidth - margin * 2, height: 58, color: colors.panel, borderColor: colors.gold, borderWidth: 0.8 });
  y -= 22;
  text("PÉRIMÈTRE", margin + 12, 8, bold, colors.gold);
  y -= 16;
  text("Contrôle indépendant des dimensions explicites et comparaison avec les quantités générées.", margin + 12, 8, regular, colors.paper);
  y -= 44;

  text("DIMENSIONS CONTRÔLÉES", margin, 11, bold, colors.gold);
  y -= 18;
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.8, color: colors.gold });
  y -= 18;

  for (const dimension of input.dimensions) {
    addPageIfNeeded(66);
    const check = input.checks.find((item) => item.code === dimension.code);
    const status = check?.status || "À VÉRIFIER";
    page.drawRectangle({ x: margin, y: y - 48, width: pageWidth - margin * 2, height: 48, color: colors.panel });
    text(`${dimension.code} — ${dimension.designation || "Sans désignation"}`, margin + 10, 9, bold, colors.paper);
    y -= 15;
    text(`Formule : ${dimension.formula} | Unité : ${dimension.unit} | Dimensions : ${formatDimension(dimension)}`, margin + 10, 8, regular, colors.muted);
    y -= 14;
    text(`Résultat : ${check?.observed || "Contrôle non disponible"}`, margin + 10, 8, regular, colors.paper);
    text(status, pageWidth - margin - 80, 8, bold, statusColor(status));
    y -= 25;
  }

  addPageIfNeeded(80);
  y -= 8;
  text("RECOMMANDATIONS", margin, 11, bold, colors.gold);
  y -= 18;
  for (const check of input.checks.filter((item) => item.status !== "OK")) {
    addPageIfNeeded(36);
    text(`${check.code} — ${check.recommendation}`, margin, 8, regular, statusColor(check.status));
    y -= 16;
  }
  if (!input.checks.some((check) => check.status !== "OK")) {
    text("Aucune anomalie détectée selon les contrôles disponibles.", margin, 8, regular, colors.ok);
    y -= 16;
  }

  addPageIfNeeded(52);
  y -= 10;
  page.drawRectangle({ x: margin, y: y - 38, width: pageWidth - margin * 2, height: 38, color: colors.panel, borderColor: colors.gold, borderWidth: 0.6 });
  y -= 15;
  text("AVERTISSEMENT", margin + 10, 8, bold, colors.gold);
  y -= 13;
  text("Rapport d’assistance au calcul — vérification humaine requise avant usage contractuel.", margin + 10, 8, regular, colors.paper);

  const bytes = await pdf.save();
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([arrayBuffer], { type: "application/pdf" });
}
