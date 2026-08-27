import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, vi } from "vitest";
import { exportResultsPdf } from "../client/src/lib/resultsPdf";

afterEach(() => vi.restoreAllMocks());

function mockFontFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    const packagePath = url.includes("montserrat") ? "node_modules/@fontsource/montserrat/files/" : "node_modules/@fontsource/ibm-plex-mono/files/";
    const filename = (url.split("/").pop() || "").split("?")[0];
    return new Response(readFileSync(join(process.cwd(), packagePath, filename)));
  });
}

const preview = {
  projectTitle: "Villa d’essai",
  client: "Client test",
  location: "Yopougon",
  clientPhone: "À compléter",
  clientEmail: "À compléter",
  verifiedBy: "Daouda",
  validationDate: "27/08/2026",
  trialVersion: true,
  currency: "FCFA",
  summary: "Métré structuré avec hypothèses à vérifier.",
  hypotheses: ["Prix unitaires à confirmer."],
  measures: [{ code: "G-01", designation: "Dallage béton", unit: "m²", quantity: 80, unitPrice: 5000, factor: 1, notes: "Base explicite" }],
  geometry: [],
  geometryChecks: [],
  total: 400000,
};

describe("results PDF export", () => {
  it("produces a readable PDF blob from the generated preview", async () => {
    const blob = await exportResultsPdf({ preview, documentDate: "27/08/2026", filename: "metrexpert-test.xlsx" });
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(1000);
    const header = new TextDecoder().decode(new Uint8Array(await blob.slice(0, 5).arrayBuffer()));
    expect(header).toBe("%PDF-");
  });

  it("sanitizes emoji markers in observations for WinAnsi fonts", async () => {
    const blob = await exportResultsPdf({
      preview: { ...preview, hypotheses: ["🔴 DONNÉE MANQUANTE — prix à confirmer", "✅ Contrôle effectué"] },
      documentDate: "27/08/2026",
      filename: "metrexpert-emoji-safe.xlsx",
    });
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(1000);
  });
});

it("supports summary mode and an embedded logo", async () => {
  const logoImageDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  const blob = await exportResultsPdf({
    preview: { ...preview, measures: [...preview.measures, { code: "G-02", designation: "Mur", unit: "m²", quantity: 100, unitPrice: 3000 }] },
    documentDate: "27/08/2026",
    filename: "metrexpert-test.xlsx",
    logoImageDataUrl,
    accentColor: "#8B5E34",
    darkColor: "#102018",
    detail: "summary",
  });
  expect(blob.type).toBe("application/pdf");
  expect(blob.size).toBeGreaterThan(1000);
});

it("adds a custom watermark and footer to the exported document", async () => {
  const blob = await exportResultsPdf({
    preview,
    documentDate: "27/08/2026",
    filename: "metrexpert-watermark.xlsx",
    watermark: "CONFIDENTIEL",
    customFooter: "MÉTREXPERT IA PRO · Rapport de travail",
    detail: "detailed",
    fontFamily: "courier",
  });
  expect(blob.type).toBe("application/pdf");
  expect(blob.size).toBeGreaterThan(1000);
});

it.each(["montserrat", "plex-mono"] as const)("embeds the modern font %s in a valid PDF", async (fontFamily) => {
  mockFontFetch();
  const blob = await exportResultsPdf({ preview, documentDate: "27/08/2026", filename: `metrexpert-${fontFamily}.xlsx`, fontFamily });
  expect(blob.type).toBe("application/pdf");
  expect(blob.size).toBeGreaterThan(1000);
});
