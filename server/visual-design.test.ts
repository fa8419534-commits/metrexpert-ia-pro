import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const css = readFileSync(resolve(projectRoot, "client/src/index.css"), "utf8");
const home = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");
const workbookPreview = readFileSync(resolve(projectRoot, "client/src/components/WorkbookPreview.tsx"), "utf8");
const admin = readFileSync(resolve(projectRoot, "client/src/pages/Admin.tsx"), "utf8");

describe("technical visual system", () => {
  it("keeps the approved precision-plan palette and type hierarchy", () => {
    expect(css).toContain("#0F1613");
    expect(css).toContain("#16201C");
    expect(css).toContain("#C9A15A");
    expect(css).toContain("#EDEAE2");
    expect(css).toContain("#3A4A42");
    expect(css).toContain("#7C9A76");
    expect(css).toContain("Fraunces");
    expect(css).toContain("Inter");
    expect(css).toContain("IBM Plex Mono");
  });

  it("keeps the BTP workflow and deliverable vocabulary visible", () => {
    expect(home).toContain("REP. 01");
    expect(home).toContain("Joindre un plan ou document");
    expect(home).toContain("Générer mon métré & DQE");
    expect(home).toContain("Tableau de métré");
    expect(home).toContain("Rechercher");
    expect(home).toContain("APERÇU INTERACTIF");
    expect(home).toContain("MONTANT FILTRÉ");
    expect(home).toContain("Aperçu interactif des postes générés dans le métré");
    expect(home).toContain("download");
    expect(home).toContain("animate-spin");
    expect(home).toContain("Génération du classeur en cours");
    expect(home).toContain("aria-busy={generate.isPending}");
    expect(home).toContain('data-loading={generate.isPending ? "true" : undefined}');
    expect(home).toContain("Le fichier est presque prêt — ne fermez pas cette page.");
    expect(home).toContain("Traitement sécurisé en cours");
    expect(home).toContain("CONTRÔLE INDÉPENDANT");
    expect(home).toContain("Modifier avant validation");
    expect(home).toContain("Valider et régénérer");
    expect(home).toContain("Exporter le contrôle PDF");
    expect(home).toContain("Confirmer la régénération");
    expect(home).toContain("Confirmer et régénérer");
    expect(home).toContain("Aperçu du rapport PDF");
    expect(home).toContain("Télécharger le PDF");
    expect(home).toContain('await import("@/lib/geometryPdf")');
    expect(home).not.toContain('import { exportGeometryReportPdf } from "@/lib/geometryPdf"');
    expect(home).toContain("geometryStatusFilter");
    expect(home).toContain("dimensions affichées");
    expect(home).toContain("Progression indicative");
    expect(home).toContain("aria-valuetext");
    expect(home).toContain("Déverrouiller l’étude");
    expect(home).toContain('id="access-code"');
    expect(home).toContain("5 / H · 50 / J");
    expect(home).toContain("Compteur global du jour");
    expect(home).toContain("Déverrouiller l’étude");
    expect(home).toContain('id="access-code"');
    expect(home).toContain("Limites actives : 5 générations par heure et 50 pour toute l’application par jour.");
    expect(home).toContain("security.status.useQuery");
    expect(home).toContain('aria-busy="true"');
    expect(home).toContain("Génération…");
    expect(home).toContain("disabled={generate.isPending}");
    expect(home).toContain("generation_blocked_checklist");
    expect(home).toContain("checklistComplete");
    expect(home).toContain("MobileStudyRail");
    expect(home).toContain("Accès rapide aux étapes de l’étude");
    expect(home).toContain('id="study-access"');
    expect(home).toContain('id="generation-action"');
  });

  it("exposes the workbook preview before the Excel download", () => {
    expect(home).toContain("<WorkbookPreview preview={download.preview}");
    expect(home).toContain("workbookPreviewTab");
    expect(workbookPreview).toContain("Lire avant téléchargement");
    expect(workbookPreview).toContain("Couverture");
    expect(workbookPreview).toContain("Microsoft Excel Desktop");
    expect(workbookPreview).toContain('role="tablist"');
    expect(workbookPreview).toContain('role="tabpanel"');
    expect(workbookPreview).toContain("TOTAL ESTIMATIF");
  });

  it("exposes success and error feedback for manual retention purge", () => {
    expect(admin).toContain('data-purge-feedback={purgeFeedback.tone}');
    expect(admin).toContain('Purge terminée');
    expect(admin).toContain('Purge non effectuée');
    expect(admin).toContain('role={purgeFeedback.tone === "success" ? "status" : "alert"}');
  });

  it("documents the minimum accessibility guards in the rendered contract", () => {
    expect(home).toContain('htmlFor="description"');
    expect(home).toContain('role="status" aria-live="polite"');
    expect(home).toContain('caption className="sr-only"');
    expect(home).toContain('scope="col"');
    expect(home).toContain('aria-live="polite"');
    expect(home).toContain("visibleMeasures");
    expect(home).toContain('data-preview-state="loading"');
    expect(home).toContain('data-preview-state="error"');
    expect(home).toContain('data-preview-state="empty"');
    expect(css).toContain(":focus-visible");
    expect(home).toContain("overflow-x-hidden");
  });
});
