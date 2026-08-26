import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("suivi abonnement client", () => {
  it("expose le statut, l’historique et les alertes d’expiration", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/ClientSubscriptionPanel.tsx"), "utf8");
    expect(source).toContain("Mon forfait");
    expect(source).toContain("Historique des paiements et renouvellements");
    expect(source).toContain("Votre forfait expire dans");
    expect(source).toContain("refetchInterval: 30000");
  });

  it("prépare un message WhatsApp contenant le code activé", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Admin.tsx"), "utf8");
    expect(source).toContain("buildActivatedCodeWhatsAppUrl");
    expect(source).toContain("votre code d’accès : ${code}");
    expect(source).toContain("Ouvrir WhatsApp");
  });
});
