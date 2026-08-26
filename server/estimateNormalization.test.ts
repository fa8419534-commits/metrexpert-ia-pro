import { describe, expect, it } from "vitest";
import { normalizeEstimateAmbiguities, PAINT_AMBIGUITY_MARKER } from "./estimateNormalization";

const ambiguousEstimate = {
  projectTitle: "Villa test",
  summary: "Étude indicative",
  measures: [{
    code: "26.01",
    designation: "Peinture intérieure, deux couches",
    unit: "m²-couche",
    quantity: 360,
    unitPrice: 1250,
    notes: "Surface 180 m² × 2 couches ; prix indicatif/hypothèse",
  }],
};

describe("normalizeEstimateAmbiguities", () => {
  it("uses the global surface for an ambiguous paint price", () => {
    const result = normalizeEstimateAmbiguities(ambiguousEstimate);
    const paint = result.measures[0];

    expect(paint.unit).toBe("m²");
    expect(paint.quantity).toBe(180);
    expect(paint.notes).toContain(PAINT_AMBIGUITY_MARKER);
    expect(result.summary).toContain(PAINT_AMBIGUITY_MARKER);
  });

  it("preserves an explicitly per-layer paint price", () => {
    const result = normalizeEstimateAmbiguities({
      ...ambiguousEstimate,
      measures: [{ ...ambiguousEstimate.measures[0], notes: "Surface 180 m² × 2 couches ; prix par couche" }],
    });
    const paint = result.measures[0];

    expect(paint.unit).toBe("m²-couche");
    expect(paint.quantity).toBe(360);
    expect(paint.notes).not.toContain(PAINT_AMBIGUITY_MARKER);
  });
});
