import { describe, expect, it } from "vitest";
import { exportGeometryReportPdf } from "../client/src/lib/geometryPdf";

describe("geometry PDF report", () => {
  it("generates a readable PDF blob without external calls", async () => {
    const blob = await exportGeometryReportPdf({
      projectTitle: "Villa test",
      documentDate: "26/08/2026",
      dimensions: [{ code: "G-1", designation: "Dallage", formula: "surface", unit: "m²", length: 10, width: 8, quantity: 1 }],
      checks: [{ code: "G-1", status: "OK", observed: "attendu=80 m², généré=80 m²", recommendation: "Aucune action." }],
    });

    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(500);
    const header = new TextDecoder().decode(new Uint8Array(await blob.slice(0, 5).arrayBuffer()));
    expect(header).toBe("%PDF-");
  });
});
