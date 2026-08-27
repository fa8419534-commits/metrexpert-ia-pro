import { PDFDocument, StandardFonts, rgb, type PDFImage } from "pdf-lib";
import type { WorkbookPreviewData } from "@/components/WorkbookPreview";

const colors = {
  dark: rgb(0.059, 0.086, 0.075),
  panel: rgb(0.086, 0.125, 0.11),
  gold: rgb(0.788, 0.631, 0.353),
  paper: rgb(0.929, 0.918, 0.886),
  muted: rgb(0.56, 0.61, 0.58),
  ok: rgb(0.486, 0.604, 0.463),
};

function formatNumber(value: number) {
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

function pdfSafeText(value: string) {
  return value
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/[“”«»]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/—|–/g, "-")
    .replace(/•/g, "-")
    .replace(/→/g, "->");
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("Image de validation invalide.");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

async function embedBrandImage(pdf: PDFDocument, dataUrl: string | undefined): Promise<PDFImage | null> {
  if (!dataUrl) return null;
  const bytes = dataUrlToBytes(dataUrl);
  if (dataUrl.startsWith("data:image/png")) return pdf.embedPng(bytes);
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) return pdf.embedJpg(bytes);
  return null;
}

function splitText(value: string, maxChars: number) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export async function exportResultsPdf(input: {
  preview: WorkbookPreviewData;
  documentDate: string;
  filename: string;
  signatureImageDataUrl?: string;
  stampImageDataUrl?: string;
}) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 42;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  const signature = await embedBrandImage(pdf, input.signatureImageDataUrl);
  const stamp = await embedBrandImage(pdf, input.stampImageDataUrl);

  const addPageIfNeeded = (height: number) => {
    if (y - height < margin) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      page.drawRectangle({ x: 0, y: pageHeight - 48, width: pageWidth, height: 48, color: colors.dark });
      page.drawText("MÉTREXPERT IA PRO", { x: margin, y: pageHeight - 31, size: 12, font: bold, color: colors.gold });
      y = pageHeight - 72;
    }
  };
  const text = (value: string, x: number, size = 9, font = regular, color = colors.paper) => {
    page.drawText(pdfSafeText(value).slice(0, 115), { x, y, size, font, color });
  };
  const paragraph = (value: string, x: number, maxChars = 95, size = 8, color = colors.muted) => {
    for (const line of splitText(value, maxChars)) {
      addPageIfNeeded(14);
      text(line, x, size, regular, color);
      y -= 12;
    }
  };

  page.drawRectangle({ x: 0, y: pageHeight - 124, width: pageWidth, height: 124, color: colors.dark });
  text("MÉTREXPERT IA PRO", margin, 23, bold, colors.gold);
  y -= 32;
  text("RÉSULTATS DU MÉTRÉ & DQE", margin, 10, bold, colors.paper);
  y -= 22;
  text(`Projet : ${input.preview.projectTitle || "À compléter"}`, margin, 9, regular, colors.muted);
  text(`Émis le : ${input.documentDate}`, 390, 9, regular, colors.muted);
  y = pageHeight - 154;

  page.drawRectangle({ x: margin, y: y - 92, width: pageWidth - margin * 2, height: 92, color: colors.panel, borderColor: colors.gold, borderWidth: 0.8 });
  text("RÉSUMÉ FINANCIER", margin + 14, 8, bold, colors.gold);
  y -= 25;
  text(`${formatNumber(input.preview.total)} ${input.preview.currency}`, margin + 14, 21, bold, colors.gold);
  y -= 23;
  text(`${input.preview.measures.length} postes · document ${input.filename}`, margin + 14, 8, regular, colors.paper);
  y -= 40;

  text("IDENTIFICATION", margin, 11, bold, colors.gold);
  y -= 18;
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.8, color: colors.gold });
  y -= 18;
  text(`Client : ${input.preview.client || "À compléter"}`, margin, 8, regular, colors.paper);
  text(`Localisation : ${input.preview.location || "À compléter"}`, 310, 8, regular, colors.paper);
  y -= 15;
  text(`Validation : ${input.preview.verifiedBy || "À compléter"}`, margin, 8, regular, colors.muted);
  text(`Date : ${input.preview.validationDate || "À compléter"}`, 310, 8, regular, colors.muted);
  y -= 25;

  text("PÉRIMÈTRE & HYPOTHÈSES", margin, 11, bold, colors.gold);
  y -= 18;
  paragraph(input.preview.summary || "Aucun résumé fourni.", margin, 102);
  for (const hypothesis of input.preview.hypotheses.slice(0, 6)) {
    addPageIfNeeded(16);
    text(`• ${hypothesis}`, margin + 8, 8, regular, colors.muted);
    y -= 14;
  }
  y -= 8;

  text("POSTES PRINCIPAUX", margin, 11, bold, colors.gold);
  y -= 18;
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.8, color: colors.gold });
  y -= 18;
  const columns = { code: margin, designation: margin + 52, unit: 310, quantity: 355, amount: 455 };
  text("CODE", columns.code, 7, bold, colors.gold);
  text("DÉSIGNATION", columns.designation, 7, bold, colors.gold);
  text("UNITÉ", columns.unit, 7, bold, colors.gold);
  text("QTÉ", columns.quantity, 7, bold, colors.gold);
  text("MONTANT", columns.amount, 7, bold, colors.gold);
  y -= 14;
  for (const measure of input.preview.measures) {
    addPageIfNeeded(26);
    const quantity = measure.quantity * (measure.factor ?? 1);
    const amount = quantity * (measure.unitPrice ?? 0);
    text(measure.code, columns.code, 7, regular, colors.paper);
    text(measure.designation, columns.designation, 7, regular, colors.paper);
    text(measure.unit, columns.unit, 7, regular, colors.muted);
    text(formatNumber(quantity), columns.quantity, 7, regular, colors.muted);
    text(formatNumber(amount), columns.amount, 7, regular, colors.gold);
    y -= 15;
    page.drawLine({ start: { x: margin, y: y + 4 }, end: { x: pageWidth - margin, y: y + 4 }, thickness: 0.25, color: colors.panel });
  }

  addPageIfNeeded(80);
  y -= 12;
  page.drawRectangle({ x: margin, y: y - 42, width: pageWidth - margin * 2, height: 42, color: colors.panel, borderColor: colors.gold, borderWidth: 0.7 });
  text("TOTAL ESTIMATIF", margin + 12, 8, bold, colors.gold);
  text(`${formatNumber(input.preview.total)} ${input.preview.currency}`, 385, 14, bold, colors.gold);
  y -= 65;

  addPageIfNeeded(110);
  text("VALIDATION", margin, 11, bold, colors.gold);
  y -= 18;
  text("Signature numérique / Tampon d’entreprise", margin, 8, bold, colors.paper);
  y -= 14;
  page.drawRectangle({ x: margin, y: y - 58, width: pageWidth - margin * 2, height: 58, color: colors.panel, borderColor: colors.muted, borderWidth: 0.5 });
  if (signature) page.drawImage(signature, { x: margin + 18, y: y - 50, width: 150, height: 42 });
  if (stamp) page.drawImage(stamp, { x: pageWidth - margin - 118, y: y - 50, width: 100, height: 42 });
  if (!signature && !stamp) text("Espace réservé — à compléter", margin + 14, 8, regular, colors.muted);
  y -= 78;
  page.drawRectangle({ x: margin, y: y - 40, width: pageWidth - margin * 2, height: 40, color: colors.panel, borderColor: colors.gold, borderWidth: 0.6 });
  text("AVERTISSEMENT", margin + 10, 8, bold, colors.gold);
  y -= 14;
  text("Document d’assistance au calcul — vérification humaine requise avant usage contractuel.", margin + 10, 8, regular, colors.paper);

  const bytes = await pdf.save();
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([arrayBuffer], { type: "application/pdf" });
}
