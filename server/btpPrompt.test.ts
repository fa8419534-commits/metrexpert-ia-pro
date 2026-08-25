import { describe, expect, it } from "vitest";
import { BTP_SYSTEM_PROMPT } from "./btpPrompt";

describe("BTP_SYSTEM_PROMPT", () => {
  it("preserves the source methodology while adapting the app interaction", () => {
    expect(BTP_SYSTEM_PROMPT).toContain("MÉTREUR PROFESSIONNEL");
    expect(BTP_SYSTEM_PROMPT).toContain("Volume = Longueur × Largeur × Hauteur");
    expect(BTP_SYSTEM_PROMPT).toContain("🔴 DONNÉE MANQUANTE — à préciser : [nom de la donnée]");
    expect(BTP_SYSTEM_PROMPT).toContain("SORTIE JSON EXCLUSIVE — PAS DE FICHIER EXCEL");
    expect(BTP_SYSTEM_PROMPT).toContain('"measures"');
    expect(BTP_SYSTEM_PROMPT).toContain("Le code serveur de MÉTREXPERT IA PRO transforme ensuite ce JSON");
  });
});
