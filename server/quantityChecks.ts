import type { MeasureItem, ProjectEstimate } from "./excel";

export type QuantityCheckStatus = "OK" | "À VÉRIFIER" | "BLOQUANT";

export type QuantityCheck = {
  code: string;
  designation: string;
  status: QuantityCheckStatus;
  rule: string;
  observed: string;
  recommendation: string;
};

const numberText = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/\.?0+$/, "");

export function runQuantityChecks(estimate: ProjectEstimate): QuantityCheck[] {
  const checks: QuantityCheck[] = [];
  for (const item of estimate.measures) {
    const quantityValid = Number.isFinite(item.quantity) && item.quantity >= 0;
    const factorValid = item.factor === undefined || (Number.isFinite(item.factor) && item.factor > 0);
    const priceValid = item.unitPrice === undefined || (Number.isFinite(item.unitPrice) && item.unitPrice >= 0);
    const hasPrice = item.unitPrice !== undefined;
    const notes = item.notes?.trim() || "";

    if (!quantityValid || !factorValid) {
      checks.push({ code: item.code, designation: item.designation, status: "BLOQUANT", rule: "Quantité et coefficient finis et positifs", observed: `quantité=${String(item.quantity)}, coefficient=${String(item.factor ?? 1)}`, recommendation: "Corriger la donnée avant de produire un DQE exploitable." });
      continue;
    }
    if (!priceValid) {
      checks.push({ code: item.code, designation: item.designation, status: "BLOQUANT", rule: "Prix unitaire numérique et non négatif", observed: `prix=${String(item.unitPrice)}`, recommendation: "Confirmer le prix unitaire ou retirer le poste du total chiffré." });
      continue;
    }
    if (!hasPrice) {
      checks.push({ code: item.code, designation: item.designation, status: "À VÉRIFIER", rule: "Prix unitaire fourni", observed: "Prix absent", recommendation: "Renseigner le prix avant toute utilisation contractuelle ; le montant est provisoire." });
      continue;
    }
    if (item.quantity === 0) {
      checks.push({ code: item.code, designation: item.designation, status: "À VÉRIFIER", rule: "Quantité strictement positive pour un poste chiffré", observed: "0", recommendation: "Vérifier que le poste est réellement nul et non omis par l’analyse." });
      continue;
    }
    checks.push({ code: item.code, designation: item.designation, status: "OK", rule: "Contrôles numériques de base", observed: `quantité=${numberText(item.quantity)} ${item.unit}, coefficient=${numberText(item.factor ?? 1)}, prix=${item.unitPrice === undefined ? "absent" : numberText(item.unitPrice)}`, recommendation: notes ? "Lire également les observations et hypothèses du poste." : "Ajouter une note source ou une hypothèse si le calcul dépend d’une interprétation." });
  }
  return checks;
}

export function buildHypotheses(estimate: ProjectEstimate): string[] {
  const hypotheses = new Set<string>();
  hypotheses.add("Les quantités et prix sont calculés à partir des informations fournies dans la description et/ou le document joint.");
  hypotheses.add("Toute donnée absente, ambiguë ou estimée doit être confirmée par un professionnel avant usage contractuel.");
  for (const item of estimate.measures) {
    if (item.notes?.trim()) hypotheses.add(`${item.code} — ${item.notes.trim()}`);
    if (item.unitPrice === undefined) hypotheses.add(`${item.code} — Prix unitaire non fourni : montant à confirmer, non définitif.`);
    if (item.factor === undefined) hypotheses.add(`${item.code} — Coefficient non fourni : coefficient 1 appliqué par défaut.`);
  }
  return Array.from(hypotheses);
}
