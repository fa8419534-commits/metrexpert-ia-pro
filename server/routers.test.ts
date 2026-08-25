import { describe, expect, it } from "vitest";
import { validateEstimate } from "./routers";

describe("validateEstimate", () => {
  it("accepts a structured estimate with optional coefficient", () => {
    const result = validateEstimate({
      projectTitle: "Rénovation école",
      measures: [{ code: "G-01", designation: "Dépose carrelage", unit: "m²", quantity: 120, factor: 1.1 }],
    });
    expect(result.projectTitle).toBe("Rénovation école");
    expect(result.measures[0]?.factor).toBe(1.1);
  });

  it("rejects missing required project data", () => {
    expect(() => validateEstimate({ projectTitle: "", measures: [] })).toThrow();
    expect(() => validateEstimate({ projectTitle: "Projet", measures: [{ code: "01", designation: "Poste", unit: "m²", quantity: -1 }] })).toThrow();
  });
});
