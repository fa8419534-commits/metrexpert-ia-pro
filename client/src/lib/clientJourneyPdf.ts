import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const colors = {
  dark: rgb(0.059, 0.086, 0.075),
  panel: rgb(0.086, 0.125, 0.11),
  gold: rgb(0.788, 0.631, 0.353),
  paper: rgb(0.929, 0.918, 0.886),
  muted: rgb(0.56, 0.61, 0.58),
  ok: rgb(0.486, 0.604, 0.463),
};

const steps = [
  "Accueil et affichage des offres",
  "Ouverture de l’espace de génération",
  "Validation du téléphone/e-mail et consentement",
  "Saisie d’un projet déterministe",
  "Chargement et absence de double soumission",
  "Réponse et consommation du quota uniquement en cas de succès",
  "Lecture de l’aperçu web du livrable",
  "Téléchargement du fichier XLSX",
  "Ouverture dans Microsoft Excel Desktop",
  "Soumission d’un paiement manuel",
  "Réception de la demande pending dans Admin",
  "Validation du paiement et création idempotente du code",
  "Copie du code et préparation WhatsApp",
  "Déverrouillage client et affichage de l’abonnement",
  "Génération avec le quota mensuel",
  "Restauration du quota après génération échouée",
  "Filtres Admin de paiement et expiration",
  "Renouvellement et historique",
  "Consentement, désinscription et rétention",
  "Purge et vérification des logs",
];

export async function exportClientJourneyReportPdf(input: { generatedAt?: Date; operator?: string; notes?: string }) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const width = 595.28;
  const height = 841.89;
  const margin = 42;
  let page = pdf.addPage([width, height]);
  let y = height - margin;
  const date = (input.generatedAt ?? new Date()).toLocaleString("fr-FR", { timeZone: "Africa/Abidjan" });
  const text = (value: string, x: number, size = 9, font = regular, color = colors.paper) => page.drawText(value.slice(0, 110), { x, y, size, font, color });
  const addPageIfNeeded = (space: number) => { if (y - space < margin) { page = pdf.addPage([width, height]); y = height - margin; } };

  page.drawRectangle({ x: 0, y: height - 112, width, height: 112, color: colors.dark });
  text("MÉTREXPERT IA PRO", margin, 22, bold, colors.gold);
  y -= 32;
  text("RAPPORT DE TEST — PARCOURS CLIENT", margin, 10, bold, colors.paper);
  y -= 22;
  text(`Généré le : ${date}`, margin, 9, regular, colors.muted);
  text(`Opérateur : ${input.operator || "Daouda"}`, 390, 9, regular, colors.muted);
  y = height - 142;

  page.drawRectangle({ x: margin, y: y - 58, width: width - margin * 2, height: 58, color: colors.panel, borderColor: colors.gold, borderWidth: 0.8 });
  y -= 20;
  text("PÉRIMÈTRE DU RAPPORT", margin + 12, 8, bold, colors.gold);
  y -= 15;
  text("Checklist de recette opérationnelle — à compléter après exécution réelle du parcours.", margin + 12, 8, regular, colors.paper);
  y -= 42;

  text("ÉTAPES À VÉRIFIER", margin, 11, bold, colors.gold);
  y -= 18;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.8, color: colors.gold });
  y -= 18;
  steps.forEach((step, index) => {
    addPageIfNeeded(28);
    page.drawRectangle({ x: margin, y: y - 15, width: 12, height: 12, borderColor: colors.gold, borderWidth: 0.8 });
    text(`${String(index + 1).padStart(2, "0")} — ${step}`, margin + 22, 8, regular, colors.paper);
    text("À TESTER", width - margin - 58, 7, bold, colors.muted);
    y -= 23;
  });

  addPageIfNeeded(75);
  y -= 8;
  page.drawRectangle({ x: margin, y: y - 52, width: width - margin * 2, height: 52, color: colors.panel, borderColor: colors.gold, borderWidth: 0.6 });
  y -= 16;
  text("CRITÈRE DE VALIDATION", margin + 10, 8, bold, colors.gold);
  y -= 14;
  text("Le parcours est validé uniquement après contrôle du fichier dans Microsoft Excel Desktop", margin + 10, 8, regular, colors.paper);
  y -= 13;
  text("et vérification des quotas, paiements, erreurs, notifications et logs.", margin + 10, 8, regular, colors.paper);
  y -= 35;
  addPageIfNeeded(70);
  page.drawRectangle({ x: margin, y: y - 48, width: width - margin * 2, height: 48, color: colors.panel, borderColor: colors.gold, borderWidth: 0.6 });
  y -= 15;
  text("NOTES DE L’OPÉRATEUR", margin + 10, 8, bold, colors.gold);
  y -= 14;
  text(input.notes?.trim() || "Aucune note personnalisée.", margin + 10, 8, regular, colors.paper);
  y -= 28;
  text("Rapport de préparation — il ne constitue pas la preuve d’un test exécuté.", margin, 8, regular, colors.ok);

  const bytes = await pdf.save();
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([arrayBuffer], { type: "application/pdf" });
}
