import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const css = readFileSync(resolve(projectRoot, "client/src/index.css"), "utf8");
const home = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");

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
    expect(home).toContain("Préparation du téléchargement…");
    expect(home).toContain("Déverrouiller l’étude");
    expect(home).toContain('id="access-code"');
    expect(home).toContain("5 / H · 50 / J");
    expect(home).toContain("Compteur global du jour");
    expect(home).toContain("Déverrouiller l’étude");
    expect(home).toContain('id="access-code"');
    expect(home).toContain("Limites actives : 5 générations par heure et 50 pour toute l’application par jour.");
    expect(home).toContain("security.status.useQuery");
    expect(home).toContain('aria-busy="true"');
    expect(home).toContain("En préparation");
    expect(home).toContain("disabled={generate.isPending || (!accessStatus.data?.unlocked && !hasTrialContact)}");
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
