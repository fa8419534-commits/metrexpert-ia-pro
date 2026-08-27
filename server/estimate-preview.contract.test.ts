import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routers = readFileSync(resolve(import.meta.dirname, "routers.ts"), "utf8");

describe("estimate preview contract", () => {
  it("returns the normalized preview fields alongside the workbook", () => {
    expect(routers).toContain("preview:");
    expect(routers).toContain("projectTitle: estimate.projectTitle");
    expect(routers).toContain('currency: estimate.currency || "FCFA"');
    expect(routers).toContain('summary: estimate.summary || "Résumé non renseigné."');
    expect(routers).toContain("measures: estimate.measures");
    expect(routers).toContain('client: estimate.client || "À compléter"');
    expect(routers).toContain('location: estimate.location || "À compléter"');
    expect(routers).toContain("hypotheses: estimate.hypotheses?.length ? estimate.hypotheses : buildHypotheses(estimate)");
    expect(routers).toContain("total: estimate.measures.reduce");
  });
});
