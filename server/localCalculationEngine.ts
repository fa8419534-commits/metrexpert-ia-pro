import type { GeometryDimension, MeasureItem, ProjectEstimate } from "./excel";
import { calculateGeometry } from "./quantityChecks";

export type LocalCalculationStatus = "CALCULATED" | "A_RENSEIGNER" | "A_VERIFIER";

export type LocalCalculationRow = MeasureItem & {
  status: LocalCalculationStatus;
  formula: string;
  parameters: Record<string, number | string | null>;
  source: "manual_geometry" | "description_only";
};

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/\.?0+$/, "");
}

function formulaFor(dimension: GeometryDimension) {
  const count = dimension.quantity ?? 1;
  if (dimension.formula === "count") return `${formatNumber(count)}`;
  if (dimension.formula === "linear") return `${formatNumber(dimension.length ?? 0)} × ${formatNumber(count)}`;
  if (dimension.formula === "surface") return `${formatNumber(dimension.length ?? 0)} × ${formatNumber(dimension.width ?? 0)} × ${formatNumber(count)} − ouvertures ${formatNumber(dimension.openingArea ?? 0)}`;
  return `${formatNumber(dimension.length ?? 0)} × ${formatNumber(dimension.width ?? 0)} × ${formatNumber(dimension.height ?? 0)} × ${formatNumber(count)}`;
}

function missingParameter(dimension: GeometryDimension) {
  if (dimension.formula !== "count" && dimension.length === undefined) return "longueur";
  if (["surface", "volume"].includes(dimension.formula) && dimension.width === undefined) return "largeur";
  if (dimension.formula === "volume" && dimension.height === undefined) return "hauteur";
  return undefined;
}

function buildRow(dimension: GeometryDimension): LocalCalculationRow {
  const missing = missingParameter(dimension);
  const quantity = calculateGeometry(dimension);
  const status: LocalCalculationStatus = missing || quantity === null ? "A_RENSEIGNER" : "CALCULATED";
  const note = missing
    ? `A_RENSEIGNER — ${missing} explicite absente. Aucun calcul inventé.`
    : dimension.notes || "Calcul déterministe à partir des dimensions explicites saisies.";
  return {
    code: dimension.code,
    designation: dimension.designation,
    unit: dimension.unit,
    quantity: quantity ?? 0,
    factor: 1,
    notes: note,
    status,
    formula: formulaFor(dimension),
    parameters: {
      length: dimension.length ?? null,
      width: dimension.width ?? null,
      height: dimension.height ?? null,
      openingArea: dimension.openingArea ?? null,
      quantity: dimension.quantity ?? 1,
    },
    source: "manual_geometry",
  };
}

/**
 * Mode local sans LLM : seules les dimensions explicitement saisies sont calculées.
 * Une description ou un plan sans dimensions structurées ne peut pas produire de quantité fiable.
 */
export function calculateLocally(input: { description: string; geometry?: GeometryDimension[] }): ProjectEstimate & { calculationRows: LocalCalculationRow[]; engine: "local-deterministic" } {
  const rows = (input.geometry ?? []).filter((dimension) => dimension.designation.trim()).map(buildRow);
  const calculationRows = rows.length ? rows : [{
    code: "A_RENSEIGNER-01",
    designation: "Données géométriques explicites à renseigner",
    unit: "u",
    quantity: 0,
    factor: 1,
    notes: "A_RENSEIGNER — le mode local ne lit pas encore automatiquement les dimensions de la description ou du plan. Ajoutez au moins une ligne géométrique explicite.",
    status: "A_RENSEIGNER" as const,
    formula: "Aucune donnée explicite",
    parameters: { descriptionLength: input.description.length },
    source: "description_only" as const,
  }];
  return {
    projectTitle: "Projet local — à compléter",
    summary: "Mode déterministe local activé. Les quantités sont calculées uniquement à partir des dimensions explicites saisies. Aucune donnée absente n’est inventée.",
    currency: "FCFA",
    geometry: input.geometry ?? [],
    measures: calculationRows.map(({ status, formula, parameters, source, ...measure }) => ({
      ...measure,
      notes: `${measure.notes || ""} | Statut=${status} | Formule=${formula} | Source=${source} | Paramètres=${JSON.stringify(parameters)}`,
    })),
    calculationRows,
    engine: "local-deterministic",
  };
}
