import { useMemo } from "react";

export type WorkbookPreviewTab = "cover" | "metre" | "dqe" | "hypotheses" | "geometry" | "checks";

export type WorkbookPreviewMeasure = {
  code: string;
  designation: string;
  unit: string;
  quantity: number;
  unitPrice?: number;
  factor?: number;
  notes?: string;
};

export type WorkbookPreviewGeometry = {
  code: string;
  designation: string;
  formula: "linear" | "surface" | "volume" | "count";
  unit: string;
  length?: number;
  width?: number;
  height?: number;
  openingArea?: number;
  quantity?: number;
};

export type WorkbookPreviewCheck = {
  code: string;
  designation: string;
  status: "OK" | "À VÉRIFIER" | "BLOQUANT";
  rule: string;
  observed: string;
  recommendation: string;
};

export type WorkbookPreviewData = {
  projectTitle: string;
  client: string;
  location: string;
  clientPhone: string;
  clientEmail: string;
  verifiedBy: string;
  validationDate: string;
  trialVersion: boolean;
  currency: string;
  summary: string;
  hypotheses: string[];
  measures: WorkbookPreviewMeasure[];
  geometry: WorkbookPreviewGeometry[];
  geometryChecks: WorkbookPreviewCheck[];
  total: number;
};

function formatNumber(value: number | undefined) {
  return value === undefined ? "À compléter" : value.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

function geometryText(dimension: WorkbookPreviewGeometry) {
  if (dimension.formula === "count") return `${dimension.quantity ?? 1} ×`;
  return `${dimension.length ?? "?"} × ${dimension.width ?? "?"}${dimension.height !== undefined ? ` × ${dimension.height}` : ""}${dimension.openingArea ? ` − ouv. ${dimension.openingArea}` : ""} × ${dimension.quantity ?? 1}`;
}

export function WorkbookPreview({ preview, activeTab, onTabChange }: { preview: WorkbookPreviewData; activeTab: WorkbookPreviewTab; onTabChange: (tab: WorkbookPreviewTab) => void }) {
  const tabs = useMemo<Array<{ id: WorkbookPreviewTab; label: string }>>(() => [
    { id: "cover", label: "Couverture" },
    { id: "metre", label: "Métré" },
    { id: "dqe", label: "DQE" },
    { id: "hypotheses", label: "Hypothèses" },
    ...(preview.geometry.length ? [{ id: "geometry" as const, label: "Géométrie" }] : []),
    { id: "checks", label: "Contrôles" },
  ], [preview.geometry.length]);

  const renderPanel = () => {
    if (activeTab === "cover") return <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
      {preview.trialVersion && <div className="border border-[#C9A15A] bg-[#1f2a23] px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[#C9A15A] sm:col-span-2">Version d’essai gratuit — abonnement requis pour un usage régulier</div>}
      <div className="border border-[#3A4A42] bg-[#0F1613] p-4"><p className="field-label">Projet</p><p className="mt-2 font-serif text-xl text-[#EDEAE2]">{preview.projectTitle}</p><p className="mt-1 text-xs text-[#AEB7B0]">{preview.location}</p></div>
      <div className="border border-[#3A4A42] bg-[#0F1613] p-4"><p className="field-label">Client</p><p className="mt-2 text-sm text-[#EDEAE2]">{preview.client}</p><p className="mt-1 text-xs text-[#AEB7B0]">{preview.clientPhone} · {preview.clientEmail}</p></div>
      <div className="border border-[#3A4A42] bg-[#0F1613] p-4"><p className="field-label">Validation</p><p className="mt-2 text-sm text-[#EDEAE2]">{preview.verifiedBy}</p><p className="mt-1 text-xs text-[#AEB7B0]">{preview.validationDate}</p></div>
      <div className="border border-[#C9A15A] bg-[#C9A15A] p-4 text-[#0F1613]"><p className="font-mono text-[10px] uppercase tracking-wider">Total général · {preview.currency}</p><p className="mt-2 font-mono text-2xl font-bold">{formatNumber(preview.total)}</p><p className="mt-1 text-xs">Montant calculé à partir des postes affichés.</p></div>
      <div className="border border-[#3A4A42] bg-[#16201C] p-4 sm:col-span-2"><p className="field-label">Résumé et périmètre</p><p className="mt-2 text-sm leading-6 text-[#AEB7B0]">{preview.summary}</p><p className="mt-3 border-l-2 border-[#C9A15A] pl-3 text-xs leading-5 text-[#C9A15A]">Base de travail assistée par IA : vérifier les hypothèses, unités, prix, quantités et lots dans Microsoft Excel Desktop avant usage contractuel.</p></div>
    </div>;

    if (activeTab === "metre") return <div className="overflow-x-auto p-5 sm:p-7"><table className="technical-table w-full min-w-[760px] border-collapse text-left"><caption className="sr-only">Aperçu de la feuille Métré</caption><thead><tr><th scope="col">CODE</th><th scope="col">DÉSIGNATION</th><th scope="col">UNITÉ</th><th scope="col">QTÉ BASE</th><th scope="col">COEFF.</th><th scope="col">QTÉ CALCULÉE</th><th scope="col">OBSERVATIONS</th></tr></thead><tbody>{preview.measures.map((measure) => { const quantity = measure.quantity * (measure.factor ?? 1); return <tr key={measure.code}><td>{measure.code}</td><td>{measure.designation}</td><td>{measure.unit}</td><td>{formatNumber(measure.quantity)}</td><td>{formatNumber(measure.factor ?? 1)}</td><td className="font-mono text-[#C9A15A]">{formatNumber(quantity)}</td><td>{measure.notes || "—"}</td></tr>; })}</tbody></table></div>;

    if (activeTab === "dqe") return <div className="overflow-x-auto p-5 sm:p-7"><table className="technical-table w-full min-w-[700px] border-collapse text-left"><caption className="sr-only">Aperçu de la feuille DQE</caption><thead><tr><th scope="col">CODE</th><th scope="col">DÉSIGNATION</th><th scope="col">UNITÉ</th><th scope="col">QUANTITÉ</th><th scope="col">PU ({preview.currency})</th><th scope="col">MONTANT ({preview.currency})</th></tr></thead><tbody>{preview.measures.map((measure) => { const quantity = measure.quantity * (measure.factor ?? 1); const amount = quantity * (measure.unitPrice ?? 0); return <tr key={measure.code}><td>{measure.code}</td><td>{measure.designation}</td><td>{measure.unit}</td><td className="font-mono">{formatNumber(quantity)}</td><td className="font-mono">{formatNumber(measure.unitPrice ?? 0)}</td><td className="font-mono font-semibold text-[#C9A15A]">{formatNumber(amount)}</td></tr>; })}</tbody><tfoot><tr><td colSpan={5} className="text-right font-mono font-semibold">TOTAL ESTIMATIF</td><td className="font-mono font-bold text-[#C9A15A]">{formatNumber(preview.total)}</td></tr></tfoot></table></div>;

    if (activeTab === "hypotheses") return <div className="p-5 sm:p-7"><ol className="space-y-3">{preview.hypotheses.map((hypothesis, index) => <li key={`${index}-${hypothesis}`} className="flex gap-3 border-b border-[#3A4A42] pb-3 last:border-b-0"><span className="font-mono text-xs text-[#C9A15A]">{String(index + 1).padStart(2, "0")}</span><span className="text-sm leading-6 text-[#AEB7B0]">{hypothesis}</span><span className="ml-auto shrink-0 font-mono text-[9px] uppercase text-[#C9A15A]">À confirmer</span></li>)}</ol></div>;

    if (activeTab === "geometry") return <div className="overflow-x-auto p-5 sm:p-7"><table className="technical-table w-full min-w-[760px] border-collapse text-left"><caption className="sr-only">Aperçu de la feuille Géométrie</caption><thead><tr><th scope="col">CODE</th><th scope="col">DÉSIGNATION</th><th scope="col">FORMULE</th><th scope="col">DIMENSIONS</th><th scope="col">RÉSULTAT INDÉPENDANT</th></tr></thead><tbody>{preview.geometry.map((dimension) => <tr key={dimension.code}><td>{dimension.code}</td><td>{dimension.designation}</td><td>{dimension.formula}</td><td className="font-mono text-[#AEB7B0]">{geometryText(dimension)}</td><td className="font-mono text-[#C9A15A]">{preview.geometryChecks.find((check) => check.code === dimension.code)?.observed || "À confirmer"}</td></tr>)}</tbody></table></div>;

    return <div className="overflow-x-auto p-5 sm:p-7"><table className="technical-table w-full min-w-[800px] border-collapse text-left"><caption className="sr-only">Aperçu de la feuille Contrôles</caption><thead><tr><th scope="col">CODE</th><th scope="col">POSTE</th><th scope="col">STATUT</th><th scope="col">CONSTAT</th><th scope="col">RECOMMANDATION</th></tr></thead><tbody>{preview.geometryChecks.map((check) => <tr key={`${check.code}-${check.status}`}><td>{check.code}</td><td>{check.designation}</td><td><span className={`border px-2 py-1 font-mono text-[10px] uppercase ${check.status === "OK" ? "border-[#7C9A76] text-[#7C9A76]" : check.status === "BLOQUANT" ? "border-[#9d554b] text-[#d98472]" : "border-[#C9A15A] text-[#C9A15A]"}`}>{check.status}</span></td><td>{check.observed}</td><td>{check.recommendation}</td></tr>)}</tbody></table>{preview.geometryChecks.length === 0 && <p className="text-sm text-[#87938B]">Aucun contrôle géométrique n’est disponible pour ce projet.</p>}</div>;
  };

  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label || "Excel";
  return <section className="mx-5 mb-6 border border-[#C9A15A] bg-[#16201C] sm:mx-7" data-workbook-preview aria-labelledby="workbook-preview-title"><div className="border-b border-[#3A4A42] px-5 py-4 sm:px-7"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="repere">REP. 02A <span>—</span> APERÇU DU CLASSEUR</p><h3 id="workbook-preview-title" className="mt-2 font-serif text-2xl text-[#EDEAE2]">Lire avant téléchargement</h3></div><span className="font-mono text-[10px] uppercase tracking-wider text-[#C9A15A]">XLSX · {preview.measures.length} postes</span></div><p className="mt-3 max-w-3xl text-xs leading-5 text-[#AEB7B0]">Voici les données principales du fichier qui sera téléchargé. L’aperçu navigateur facilite la relecture ; ouvrez ensuite le fichier dans <strong className="text-[#EDEAE2]">Microsoft Excel Desktop</strong> pour vérifier le recalcul des formules, les images et l’impression.</p></div><div className="flex gap-1 overflow-x-auto border-b border-[#3A4A42] px-3 py-3" role="tablist" aria-label="Feuilles du classeur Excel">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} aria-controls={`workbook-panel-${tab.id}`} onClick={() => onTabChange(tab.id)} className={`shrink-0 border px-3 py-2 font-mono text-[10px] uppercase tracking-wider ${activeTab === tab.id ? "border-[#C9A15A] bg-[#C9A15A] text-[#0F1613]" : "border-[#3A4A42] text-[#AEB7B0]"}`}>{tab.label}</button>)}</div><div id={`workbook-panel-${activeTab}`} role="tabpanel" tabIndex={0} aria-label={`Feuille ${activeTabLabel}`}>{renderPanel()}</div></section>;
}
