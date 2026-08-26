import type { ProjectEstimate, MeasureItem } from "./excel";

export const PAINT_AMBIGUITY_MARKER = "HYPOTHÈSE NON DÉFINITIVE — prix de peinture considéré global pour l’ensemble des couches ; confirmer le mode de tarification";

const PER_LAYER_PATTERN = /prix\s*(?:par|\/|au)\s*(?:couche|passe)|par\s+couche|par\s+passe/i;
const PAINT_PATTERN = /peinture|paint/i;
const COAT_PATTERN = /(\d+(?:[.,]\d+)?)\s*(?:couches?|passes?)/i;
const AREA_PATTERN = /(\d+(?:[.,]\d+)?)\s*m(?:²|2)\b/i;

function toNumber(value: string) {
  return Number(value.replace(",", "."));
}

function normalizePaintMeasure(item: MeasureItem): MeasureItem {
  const sourceText = `${item.designation} ${item.notes ?? ""}`;
  if (!PAINT_PATTERN.test(sourceText) || PER_LAYER_PATTERN.test(sourceText)) return item;

  const notes = item.notes ?? "";
  const areaMatch = notes.match(AREA_PATTERN);
  const coatsMatch = notes.match(COAT_PATTERN);
  const area = areaMatch ? toNumber(areaMatch[1]) : undefined;
  const coats = coatsMatch ? toNumber(coatsMatch[1]) : undefined;
  const isLayerUnit = /m(?:²|2)\s*[-/]?\s*couche/i.test(item.unit);
  const hasLayerCalculation = Boolean(area && coats && coats > 1 && item.quantity > area);

  if (!isLayerUnit && !hasLayerCalculation) {
    return { ...item, notes: notes.includes(PAINT_AMBIGUITY_MARKER) ? notes : `${notes}${notes ? " — " : ""}${PAINT_AMBIGUITY_MARKER}` };
  }

  const baseArea = area ?? (coats && coats > 1 ? item.quantity / coats : item.quantity);
  const formulaNote = area && coats && coats > 1
    ? `Convention appliquée : ${area} m² × ${coats} couches ; le prix est traité comme global.`
    : "Convention appliquée : le prix est traité comme global pour l’ensemble des couches.";

  return {
    ...item,
    unit: "m²",
    quantity: Number(baseArea.toFixed(6)),
    notes: `${notes}${notes ? " — " : ""}${formulaNote} ${PAINT_AMBIGUITY_MARKER}`,
  };
}

export function normalizeEstimateAmbiguities(estimate: ProjectEstimate): ProjectEstimate {
  const measures = estimate.measures.map(normalizePaintMeasure);
  const hasAmbiguousPaint = measures.some((item) => item.notes?.includes(PAINT_AMBIGUITY_MARKER));
  if (!hasAmbiguousPaint) return { ...estimate, measures };

  const summaryMarker = `HYPOTHÈSE DQE — ${PAINT_AMBIGUITY_MARKER}.`;
  return {
    ...estimate,
    measures,
    summary: estimate.summary?.includes(summaryMarker)
      ? estimate.summary
      : `${estimate.summary ? `${estimate.summary} ` : ""}${summaryMarker}`,
  };
}
