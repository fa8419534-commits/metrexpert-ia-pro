import type { GeometryDimension, MeasureItem, ProjectEstimate } from "./excel";

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
const GEOMETRY_TOLERANCE = 0.01;

export function calculateGeometry(dimension: GeometryDimension): number | null {
  const count = dimension.quantity ?? 1;
  if (!Number.isFinite(count) || count < 0) return null;
  if (dimension.formula === "count") return count;
  if (!Number.isFinite(dimension.length) || (dimension.length ?? 0) < 0) return null;
  if (dimension.formula === "linear") return (dimension.length ?? 0) * count;
  if (!Number.isFinite(dimension.width) || (dimension.width ?? 0) < 0) return null;
  if (dimension.formula === "surface") return Math.max(0, (dimension.length ?? 0) * (dimension.width ?? 0) * count - (dimension.openingArea ?? 0));
  if (!Number.isFinite(dimension.height) || (dimension.height ?? 0) < 0) return null;
  return (dimension.length ?? 0) * (dimension.width ?? 0) * (dimension.height ?? 0) * count;
}

export function runQuantityChecks(estimate: ProjectEstimate): QuantityCheck[] {
  const checks: QuantityCheck[] = [];
  const measuresByCode = new Map(estimate.measures.map((item) => [item.code, item]));
  for (const geometry of estimate.geometry ?? []) {
    const expected = calculateGeometry(geometry);
    const item = measuresByCode.get(geometry.code);
    if (expected === null) {
      checks.push({ code: geometry.code, designation: geometry.designation, status: "BLOQUANT", rule: "Dimensions explicites valides pour la formule choisie", observed: "Dimension manquante, négative ou non finie", recommendation: "Corriger les dimensions et l’unité avant de retenir la quantité." });
      continue;
    }
    if (!item) {
      checks.push({ code: geometry.code, designation: geometry.designation, status: "À VÉRIFIER", rule: "Correspondance entre géométrie et poste", observed: `Poste ${geometry.code} absent`, recommendation: "Vérifier le code du poste avant d’utiliser le contrôle géométrique." });
      continue;
    }
    const difference = Math.abs(item.quantity - expected) / Math.max(1, Math.abs(expected));
    checks.push({ code: geometry.code, designation: geometry.designation, status: difference <= GEOMETRY_TOLERANCE ? "OK" : "À VÉRIFIER", rule: `Contrôle ${geometry.formula} avec tolérance de ${GEOMETRY_TOLERANCE * 100}%`, observed: `attendu=${numberText(expected)} ${geometry.unit}, généré=${numberText(item.quantity)} ${item.unit}`, recommendation: difference <= GEOMETRY_TOLERANCE ? "Aucune divergence significative détectée." : "Comparer les dimensions, ouvertures, unités et facteurs avec le document source." });
  }
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
  if (estimate.geometry?.length) hypotheses.add("Les contrôles géométriques comparent les quantités générées aux dimensions explicites saisies, avec une tolérance de 1 % ; ils ne remplacent pas une vérification humaine du plan.");
  for (const geometry of estimate.geometry ?? []) {
    const expected = calculateGeometry(geometry);
    hypotheses.add(`${geometry.code} — ${geometry.formula} : L=${geometry.length ?? "?"}, l=${geometry.width ?? "?"}, h=${geometry.height ?? "?"}, ouvertures=${geometry.openingArea ?? 0}, résultat indépendant=${expected === null ? "à confirmer" : numberText(expected)} ${geometry.unit}.`);
  }
  for (const item of estimate.measures) {
    if (item.notes?.trim()) hypotheses.add(`${item.code} — ${item.notes.trim()}`);
    if (item.unitPrice === undefined) hypotheses.add(`${item.code} — Prix unitaire non fourni : montant à confirmer, non définitif.`);
    if (item.factor === undefined) hypotheses.add(`${item.code} — Coefficient non fourni : coefficient 1 appliqué par défaut.`);
  }
  return Array.from(hypotheses);
}
