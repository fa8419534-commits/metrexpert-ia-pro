import { describe, expect, it } from "vitest";
import { exportResultsPdf } from "../client/src/lib/resultsPdf";

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
