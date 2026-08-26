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
    expect(source).toContain("Rappel dans l’application actif");
    expect(source).toContain("statut actualisé automatiquement");
    expect(source).toContain("metrexpert.expiryReminders");
    expect(source).toContain("Recevoir les rappels dans l’application");
    expect(source).toContain("Renouveler mon forfait");
    expect(source).toContain("metrexpert:renew");
  });

  it("expose les filtres Admin pour les paiements et les expirations proches", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Admin.tsx"), "utf8");
    expect(source).toContain("Filtrer les paiements par statut");
    expect(source).toContain("Expirent sous 7 jours");
    expect(source).toContain("Expirent aujourd’hui");
    expect(source).toContain("Expirent demain");
    expect(source).toContain('codeFilter === "today"');
    expect(source).toContain('codeFilter === "tomorrow"');
    expect(source).toContain("filteredPaymentRequests");
    expect(source).toContain("filteredCodes");
  });

  it("affiche une confirmation animée après soumission de la référence", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/PaymentRequestPanel.tsx"), "utf8");
    expect(source).toContain("submissionConfirmed");
    expect(source).toContain("Référence reçue");
    expect(source).toContain("motion-safe:animate-pulse");
  });

  it("prépare un message WhatsApp contenant le code activé", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Admin.tsx"), "utf8");
    expect(source).toContain("buildActivatedCodeWhatsAppUrl");
    expect(source).toContain("votre code d’accès : ${code}");
    expect(source).toContain("Il est valable jusqu’au ${expiry}");
    expect(source).toContain("${window.location.origin}/#paiement");
    expect(source).toContain("Ouvrir WhatsApp");
  });
});
