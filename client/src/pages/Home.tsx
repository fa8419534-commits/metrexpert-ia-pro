import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileSpreadsheet, FileText, Image as ImageIcon, Loader2, Paperclip, Ruler, UploadCloud } from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Impossible de lire ce fichier."));
    reader.readAsDataURL(file);
  });
}

type PreviewMeasure = {
  code: string;
  designation: string;
  unit: string;
  quantity: number;
  unitPrice?: number;
  factor?: number;
  notes?: string;
};

type GeneratedDownload = {
  url: string;
  filename: string;
  lineCount: number;
  preview: {
    projectTitle: string;
    currency: string;
    summary: string;
    measures: PreviewMeasure[];
  };
};

export default function Home() {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [download, setDownload] = useState<GeneratedDownload | null>(null);
  const [previewQuery, setPreviewQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generate = trpc.estimate.generate.useMutation();
  const [progressStage, setProgressStage] = useState(0);
  const documentDate = new Intl.DateTimeFormat("fr-FR").format(new Date());

  useEffect(() => {
    if (!generate.isPending) {
      setProgressStage(0);
      return;
    }
    const timer = window.setInterval(() => setProgressStage((stage) => Math.min(stage + 1, 2)), 1800);
    return () => window.clearInterval(timer);
  }, [generate.isPending]);

  const onFileChange = (candidate?: File) => {
    setFileError("");
    if (!candidate) return;
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setFile(null);
      setFileError("Formats acceptés : PDF, PNG, JPG ou WEBP.");
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setFile(null);
      setFileError("Le fichier doit peser moins de 8 Mo.");
      return;
    }
    setFile(candidate);
  };

  const handleGenerate = async () => {
    if (description.trim().length < 20) {
      toast.error("Ajoutez une description plus détaillée du projet.");
      return;
    }
    try {
      const dataUrl = file ? await readFileAsDataUrl(file) : undefined;
      const result = await generate.mutateAsync({
        description: description.trim(),
        file: file && dataUrl ? { name: file.name, mimeType: file.type as "application/pdf" | "image/png" | "image/jpeg" | "image/webp", dataUrl } : undefined,
      });
      const bytes = Uint8Array.from(atob(result.data), (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      setDownload((previous) => {
        if (previous) URL.revokeObjectURL(previous.url);
        return { url, filename: result.filename, lineCount: result.lineCount, preview: result.preview };
      });
      toast.success(`Classeur généré avec ${result.lineCount} poste${result.lineCount > 1 ? "s" : ""}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
    }
  };

  const visibleMeasures = download?.preview.measures.filter((measure) => {
    const query = previewQuery.trim().toLocaleLowerCase("fr-FR");
    if (!query) return true;
    return [measure.code, measure.designation, measure.unit, measure.notes || ""].some((value) => value.toLocaleLowerCase("fr-FR").includes(query));
  }) ?? [];
  const previewTotal = visibleMeasures.reduce((total, measure) => total + measure.quantity * (measure.factor ?? 1) * (measure.unitPrice ?? 0), 0);

  return (
    <main className="min-h-screen overflow-hidden bg-[#0F1613] text-[#EDEAE2]">
      <div className="technical-grid pointer-events-none fixed inset-0 opacity-60" />
      <div className="relative mx-auto min-h-screen w-full min-w-0 max-w-[1480px] overflow-x-hidden px-5 py-5 sm:px-8 lg:px-12">
        <header className="plan-cartouche mb-14 grid w-full min-w-0 gap-5 lg:grid-cols-[1.35fr_0.9fr_0.55fr]">
          <div className="flex items-center gap-4">
            <div className="brand-mark" aria-hidden="true"><Ruler className="h-6 w-6" /></div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-[#C9A15A]">Bureau d’études numérique</p>
              <p className="font-serif text-2xl tracking-tight text-[#EDEAE2]">MÉTREXPERT <span className="text-[#C9A15A]">IA PRO</span></p>
            </div>
          </div>
          <div className="cartouche-field"><span>RÉFÉRENCE</span><strong>MXP / 001</strong></div>
          <div className="cartouche-field"><span>ÉCHELLE</span><strong>1:1 — DIGITAL</strong></div>
          <div className="cartouche-field lg:col-start-2"><span>DOCUMENT</span><strong>MÉTRÉ & DQE</strong></div>
          <div className="cartouche-field"><span>ÉTAT</span><strong className="flex items-center gap-2"><i aria-hidden="true" className="status-dot" /> {download ? "LIVRABLE PRÊT" : "PRÉPARATION"}</strong></div>
          <div className="cartouche-field"><span>DATE</span><strong>{documentDate}</strong></div>
        </header>

        <section className="grid min-w-0 items-start gap-14 lg:grid-cols-[0.86fr_1.14fr] lg:gap-20">
          <div className="min-w-0 max-w-xl">
            <div className="repere mb-6">REP. 00 <span>—</span> NOTE DE CALCUL</div>
            <h1 className="font-serif text-[clamp(3.4rem,7vw,6.8rem)] leading-[0.91] tracking-[-0.055em] text-[#EDEAE2]">
              Du plan brut<br />au <em className="text-[#C9A15A]">quantitatif.</em>
            </h1>
            <div className="dimension-line my-8 max-w-md"><span>PRECISION</span><span>CONTRÔLE</span><span>TRAÇABILITÉ</span></div>
            <p className="max-w-md text-[15px] leading-7 text-[#AEB7B0]">
              Décrivez votre opération BTP, joignez un plan si nécessaire. MÉTREXPERT structure une base de métré et de DQE exploitable dans Excel, avec ses unités, quantités et formules.
            </p>
            <div className="mt-10 grid max-w-md grid-cols-3 border-y border-[#3A4A42] py-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#7C9A76]">
              <span><b className="block text-lg text-[#C9A15A]">01</b>Décrire</span>
              <span><b className="block text-lg text-[#C9A15A]">02</b>Analyser</span>
              <span><b className="block text-lg text-[#C9A15A]">03</b>Exporter</span>
            </div>
          </div>

          <div className="min-w-0 space-y-7">
            <section className="technical-panel">
              <div className="panel-heading"><div><p className="repere">REP. 01 <span>—</span> SAISIE PROJET</p><h2 className="mt-2 font-serif text-3xl text-[#EDEAE2]">Définir l’opération</h2></div><span className="panel-index">A-01</span></div>
              <label htmlFor="description" className="field-label">Description du projet <span>REQUIS</span></label>
              <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex. Construction d’une villa R+1 de 180 m² à Abidjan, avec fondations en béton armé, murs en agglos..." className="technical-input min-h-40 resize-none" />
              <div className="mt-5">
                <input ref={fileInputRef} type="file" accept=".pdf,image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => onFileChange(event.target.files?.[0])} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="upload-zone group">
                  <span className="flex items-center gap-3"><span className="upload-icon"><UploadCloud className="h-4 w-4" /></span><span><span className="block text-sm font-semibold text-[#EDEAE2]">Joindre un plan ou document</span><span className="mt-1 block font-mono text-[10px] uppercase tracking-wide text-[#87938B]">PDF · PNG · JPG · WEBP / 8 Mo max.</span></span></span><Paperclip className="h-4 w-4 text-[#C9A15A] transition group-hover:rotate-12" />
                </button>
                {file && <div className="file-chip"><span className="flex min-w-0 items-center gap-2"><FileText className="h-3.5 w-3.5 shrink-0 text-[#C9A15A]" /><span className="truncate">{file.name}</span></span><button type="button" onClick={() => setFile(null)} className="font-mono text-[10px] uppercase text-[#C9A15A] hover:text-[#EDEAE2]">Retirer</button></div>}
                {fileError && <p className="mt-2 flex items-center gap-2 text-xs font-medium text-[#d98472]"><ImageIcon className="h-3.5 w-3.5" />{fileError}</p>}
              </div>
              {generate.error && <Alert variant="destructive" className="mt-5 border-[#9d554b] bg-[#271b18] text-[#EDEAE2]"><AlertTitle>Génération interrompue</AlertTitle><AlertDescription>{generate.error.message}</AlertDescription></Alert>}
              {generate.isPending && <div className="progress-panel mt-5"><div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[#C9A15A]"><span>Traitement en cours</span><span>Étape {progressStage + 1}/3</span></div><div className="grid grid-cols-3 gap-px bg-[#3A4A42]">{["Analyse", "Validation JSON", "Classeur"].map((label, index) => <span key={label} className={`px-2 py-2 text-center font-mono text-[10px] uppercase ${progressStage >= index ? "bg-[#7C9A76] text-[#0F1613]" : "bg-[#1C2822] text-[#87938B]"}`}>{label}</span>)}</div></div>}
              <Button onClick={() => void handleGenerate()} disabled={generate.isPending} aria-busy={generate.isPending} data-loading={generate.isPending ? "true" : undefined} className="technical-button mt-6 h-12 w-full rounded-none">
                {generate.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> <span>Génération du classeur en cours…</span></> : <><FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden="true" /> <span>Générer mon métré & DQE</span></>}
              </Button>
              {generate.isPending && <div className="result-download mt-4" role="status" aria-live="polite"><span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-[#C9A15A]"><Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /><span className="truncate">Préparation du téléchargement…</span></span><button type="button" className="download-button" disabled aria-busy="true">En préparation</button></div>}
              {download && !generate.isPending && <div className="result-download mt-4" role="status" aria-live="polite"><span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-[#7C9A76]"><FileSpreadsheet className="h-4 w-4 shrink-0" /><span className="truncate">Classeur prêt — {download.filename} · {download.lineCount} postes</span></span><a href={download.url} download={download.filename} className="download-button">Télécharger</a></div>}
              <p className="mt-4 text-center font-mono text-[10px] leading-5 text-[#718078]">BASE DE TRAVAIL À CONTRÔLER PAR UN PROFESSIONNEL AVANT USAGE CONTRACTUEL.</p>
            </section>

              <section className="estimate-preview technical-panel p-0">
              <div className="panel-heading px-5 py-4 sm:px-7"><div><p className="repere">REP. 02 <span>—</span> {download ? "LIVRABLE GÉNÉRÉ" : "APERÇU DU LIVRABLE"}</p><h2 className="mt-2 font-serif text-2xl text-[#EDEAE2]">Tableau de métré</h2></div><span className="font-mono text-[10px] text-[#7C9A76]">{download ? `${download.lineCount} POSTES` : "EN ATTENTE"}</span></div>
              {generate.isPending ? <div className="px-5 py-14 text-center sm:px-7" role="status" aria-live="polite" data-preview-state="loading"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#C9A15A]" aria-hidden="true" /><p className="mt-4 font-serif text-xl text-[#EDEAE2]">Préparation de l’aperçu</p><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#87938B]">Les postes générés seront affichés ici dès que la validation JSON et le classeur seront prêts.</p></div> : generate.error ? <div className="px-5 py-14 text-center sm:px-7" role="alert" data-preview-state="error"><Alert className="mx-auto max-w-md border-[#9d554b] bg-[#271b18] text-left text-[#EDEAE2]"><AlertTitle>Aperçu indisponible</AlertTitle><AlertDescription>Le résultat n’a pas pu être chargé. Corrigez la saisie ou réessayez avant de télécharger un classeur.</AlertDescription></Alert></div> : download ? <>
                <div className="flex flex-col gap-3 border-b border-[#3A4A42] px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-7">
                  <div><p className="font-mono text-[10px] uppercase tracking-wider text-[#C9A15A]">{download.preview.projectTitle}</p><p className="mt-1 max-w-2xl text-xs leading-5 text-[#AEB7B0]">{download.preview.summary}</p></div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-[#87938B]">Rechercher<input value={previewQuery} onChange={(event) => setPreviewQuery(event.target.value)} placeholder="Code ou désignation" className="technical-input mt-2 h-9 w-full min-w-0 px-3 text-xs sm:w-52" /></label>
                </div>
                <div className="overflow-x-auto"><table className="technical-table w-full min-w-[860px] border-collapse text-left"><caption className="sr-only">Aperçu interactif des postes générés dans le métré</caption><thead><tr><th scope="col">REPÈRE</th><th scope="col">DÉSIGNATION</th><th scope="col">UNITÉ</th><th scope="col">QUANTITÉ</th><th scope="col">PU ({download.preview.currency})</th><th scope="col">MONTANT</th><th scope="col">OBS.</th></tr></thead><tbody>{visibleMeasures.map((measure) => { const quantity = measure.quantity * (measure.factor ?? 1); const amount = quantity * (measure.unitPrice ?? 0); return <tr key={measure.code}><td>{measure.code}</td><td>{measure.designation}</td><td>{measure.unit}</td><td className="text-[#C9A15A]">{quantity.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}</td><td>{(measure.unitPrice ?? 0).toLocaleString("fr-FR")}</td><td className="font-semibold text-[#C9A15A]">{amount.toLocaleString("fr-FR")}</td><td>{measure.notes || "—"}</td></tr>; })}</tbody></table></div>
                <div className="dimension-line mx-5 my-4 sm:mx-7"><span>{visibleMeasures.length} POSTES AFFICHÉS</span><span>QUANTITÉS</span><span>MONTANT FILTRÉ : {previewTotal.toLocaleString("fr-FR")} {download.preview.currency}</span></div>
              </> : <div className="px-5 py-12 text-center sm:px-7" data-preview-state="empty"><FileSpreadsheet className="mx-auto h-8 w-8 text-[#3A4A42]" aria-hidden="true" /><p className="mt-4 font-serif text-xl text-[#EDEAE2]">L’aperçu apparaîtra ici</p><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#87938B]">Générez votre métré pour consulter les postes réels, les quantités, les prix et les montants avant le téléchargement Excel.</p></div>}
              <div className="flex items-center justify-between px-5 pb-5 font-mono text-[10px] uppercase tracking-wider text-[#718078] sm:px-7"><span>{download ? "APERÇU INTERACTIF" : "APERÇU EN ATTENTE"}</span><span className="text-[#C9A15A]">Contrôle humain requis</span></div>
            </section>
          </div>
        </section>

        <footer className="mt-16 flex flex-col gap-2 border-t border-[#3A4A42] py-5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#718078] sm:flex-row sm:items-center sm:justify-between"><span>Document de travail numérique · Cabinet d’études BTP</span><span>MVP / Version de validation · 2026</span></footer>
      </div>
    </main>
  );
}
