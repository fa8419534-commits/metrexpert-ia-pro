import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const landing = fs.readFileSync(path.join(root, "client/src/pages/Landing.tsx"), "utf8");
const app = fs.readFileSync(path.join(root, "client/src/App.tsx"), "utf8");

describe("public landing page", () => {
  it("contains the honest service positioning and actionable CTAs", () => {
    expect(landing).toContain("métré structuré");
    expect(landing).toContain("DQE exploitable");
    expect(landing).toContain("vérification humaine");
    expect(landing).toContain("Tester l’espace de génération");
    expect(landing).toContain("Parler du projet");
    expect(landing).toContain("Yopougon, Abidjan");
    expect(landing).toContain("sticky top-0");
    expect(landing).toContain("Questions fréquentes");
    expect(landing).toContain("whatsappUrlFor");
    expect(landing).toContain("Que se passe-t-il lorsque mon quota est atteint ?");
    expect(landing).toContain("Activer le mode");
    expect(landing).toContain("Retours clients — à venir");
    expect(landing).toContain("Aucun témoignage client n’est publié pour le moment.");
    expect(landing).toContain("Exemples d’utilisation");
    expect(landing).toContain("Puis-je joindre un plan PDF ?");
  });

  it("keeps the public landing and generation workspace on separate routes", () => {
    expect(app).toContain('<Route path={"/"} component={Landing} />');
    expect(app).toContain('<Route path={"/etude"} component={Home} />');
  });
});
