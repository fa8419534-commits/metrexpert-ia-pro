import { describe, expect, it } from "vitest";
import { parseStoredEmailTemplates, renderEmailTemplate } from "../client/src/pages/Home";

describe("email template rendering", () => {
  it("replaces all supported variables", () => {
    const rendered = renderEmailTemplate("{nom_client} · {projet} · {date} · {total} · {nom_client}", {
      client: "Awa BTP",
      project: "Villa R+1",
      date: "28/08/2026",
      total: "2 000 000 FCFA",
    });
    expect(rendered).toBe("Awa BTP · Villa R+1 · 28/08/2026 · 2 000 000 FCFA · Awa BTP");
  });

  it("uses explicit placeholders when client or project is missing", () => {
    expect(renderEmailTemplate("Bonjour {nom_client} — {projet}", { client: "", project: "", date: "28/08/2026", total: "À confirmer" }))
      .toBe("Bonjour Client à compléter — Projet à compléter");
  });
});

describe("email template persistence", () => {
  it("keeps only valid named templates from local storage", () => {
    const templates = parseStoredEmailTemplates(JSON.stringify([
      { id: "t1", name: "Relance", subject: "Objet", body: "Corps" },
      { id: "invalid", name: "", subject: 4, body: "Corps" },
    ]));
    expect(templates).toHaveLength(1);
    expect(templates[0]).toMatchObject({ id: "t1", name: "Relance" });
  });

  it("falls back to the standard template for invalid storage", () => {
    const templates = parseStoredEmailTemplates("not-json");
    expect(templates).toHaveLength(1);
    expect(templates[0].id).toBe("standard");
  });
});
