import { describe, expect, it } from "vitest";
import { calculateLocally } from "./localCalculationEngine";
import { requestSchema } from "./routers";

describe("calculateLocally", () => {
  it("calcule une surface explicite sans inventer de donnée", () => {
    const result = calculateLocally({
      description: "Dalle de terrasse avec dimensions explicites fournies.",
      geometry: [{ code: "DAL-01", designation: "Dalle béton", formula: "surface", unit: "m²", length: 10, width: 12, openingArea: 2 }],
    });

    expect(result.engine).toBe("local-deterministic");
    expect(result.measures[0]).toMatchObject({ code: "DAL-01", quantity: 118, unit: "m²" });
    expect(result.calculationRows[0]).toMatchObject({ status: "CALCULATED", formula: "10 × 12 × 1 − ouvertures 2", source: "manual_geometry" });
    expect(result.calculationRows[0].parameters).toMatchObject({ length: 10, width: 12, openingArea: 2, quantity: 1 });
  });

  it("calcule un volume explicite et conserve ses paramètres", () => {
    const result = calculateLocally({
      description: "Semelle avec longueur largeur et hauteur saisies.",
      geometry: [{ code: "SEM-01", designation: "Béton de semelle", formula: "volume", unit: "m³", length: 8, width: 0.5, height: 0.3, quantity: 2 }],
    });

    expect(result.measures[0]?.quantity).toBeCloseTo(2.4);
    expect(result.calculationRows[0]).toMatchObject({ status: "CALCULATED", formula: "8 × 0.5 × 0.3 × 2" });
  });

  it("calcule un comptage explicite", () => {
    const result = calculateLocally({
      description: "Dix portes à compter.",
      geometry: [{ code: "POR-01", designation: "Porte intérieure", formula: "count", unit: "u", quantity: 10 }],
    });

    expect(result.measures[0]?.quantity).toBe(10);
    expect(result.calculationRows[0]).toMatchObject({ status: "CALCULATED", formula: "10" });
  });

  it("retourne A_RENSEIGNER quand une dimension indispensable manque", () => {
    const result = calculateLocally({
      description: "Surface à compléter ultérieurement.",
      geometry: [{ code: "MUR-01", designation: "Mur", formula: "surface", unit: "m²", length: 12 }],
    });

    expect(result.calculationRows[0]?.status).toBe("A_RENSEIGNER");
    expect(result.calculationRows[0]?.quantity).toBe(0);
    expect(result.calculationRows[0]?.notes).toContain("largeur explicite absente");
    expect(result.measures[0]?.notes).toContain("Statut=A_RENSEIGNER");
  });

  it("retourne une ligne traçable quand aucune géométrie explicite n’est fournie", () => {
    const result = calculateLocally({ description: "Une villa à étudier sans dimensions chiffrées." });

    expect(result.geometry).toEqual([]);
    expect(result.calculationRows).toHaveLength(1);
    expect(result.calculationRows[0]).toMatchObject({ status: "A_RENSEIGNER", source: "description_only", quantity: 0 });
    expect(result.measures[0]?.notes).toContain("mode local ne lit pas encore automatiquement");
  });

  it("accepte la dimension manquante dans le contrat de requête pour permettre A_RENSEIGNER", () => {
    const parsed = requestSchema.safeParse({
      idempotencyKey: "00000000-0000-4000-8000-000000000001",
      description: "Une surface avec largeur à compléter.",
      engineMode: "local",
      geometry: [{ code: "MUR-01", designation: "Mur", formula: "surface", unit: "m²", length: 12 }],
    });

    expect(parsed.success).toBe(true);
  });
});
