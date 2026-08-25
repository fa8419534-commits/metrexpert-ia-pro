import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileSpreadsheet, FileText, Image as ImageIcon, Loader2, Paperclip, Sparkles, UploadCloud } from "lucide-react";
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

export default function Home() {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [download, setDownload] = useState<{ url: string; filename: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generate = trpc.estimate.generate.useMutation();
  const [progressStage, setProgressStage] = useState(0);

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
        return { url, filename: result.filename };
      });
      toast.success(`Classeur généré avec ${result.lineCount} poste${result.lineCount > 1 ? "s" : ""}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f6] text-[#18251f]">
      <div className="relative isolate mx-auto min-h-screen max-w-[1440px] px-5 py-5 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute -right-36 -top-48 -z-10 h-[520px] w-[520px] rounded-full bg-[#dce9df] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-64 -left-44 -z-10 h-[560px] w-[560px] rounded-full bg-[#efe6d4] blur-3xl" />

        <header className="flex items-center justify-between border-b border-[#dfe5df] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1d4d3a] text-[#f4c879] shadow-lg shadow-[#1d4d3a]/15">
              <span className="font-serif text-xl font-bold">M</span>
            </div>
            <div>
              <p className="font-serif text-lg font-bold tracking-tight">MÉTREXPERT</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#718077]">IA PRO</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs font-medium text-[#718077] sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#94b59e]" />
            Analyse assistée par IA
          </div>
        </header>

        <section className="grid items-center gap-12 pb-12 pt-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:pb-20 lg:pt-24">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d8e4db] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#3a7256] shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              MÉTRÉ & DQE, sans friction
            </div>
            <h1 className="font-serif text-5xl leading-[0.98] tracking-[-0.045em] text-[#183428] sm:text-6xl lg:text-[76px]">
              Du projet brut au <em className="text-[#3e795a]">classeur prêt</em> à chiffrer.
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-[#66756c] sm:text-lg">
              Décrivez votre projet BTP, ajoutez vos plans si nécessaire, et recevez une base de métré et de DQE structurée dans Excel.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-[#718077]">
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d4a554]" /> Formules Excel actives</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d4a554]" /> PDF ou image facultatif</span>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_24px_70px_rgba(31,66,49,0.12)] backdrop-blur sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a7b42]">Nouveau calcul</p>
                <h2 className="mt-2 font-serif text-2xl font-bold text-[#183428]">Décrivez votre opération</h2>
              </div>
              <div className="rounded-2xl bg-[#edf4ee] p-3 text-[#3e795a]"><FileSpreadsheet className="h-5 w-5" /></div>
            </div>
            <label htmlFor="description" className="mb-2 block text-sm font-semibold text-[#33473c]">Description du projet</label>
            <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex. Construction d’une villa R+1 de 180 m² à Abidjan, avec fondations en béton armé, murs en agglos..." className="min-h-40 resize-none rounded-2xl border-[#dbe5dc] bg-[#fbfcfa] px-4 py-3 text-sm leading-6 shadow-none placeholder:text-[#9ba9a0] focus-visible:ring-[#79a889]" />
            <div className="mt-4">
              <input ref={fileInputRef} type="file" accept=".pdf,image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => onFileChange(event.target.files?.[0])} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="group flex w-full items-center justify-between rounded-2xl border border-dashed border-[#cbd9ce] bg-[#f8fbf8] px-4 py-3 text-left transition hover:border-[#79a889] hover:bg-[#f2f8f3]">
                <span className="flex items-center gap-3"><span className="rounded-xl bg-white p-2 text-[#568064] shadow-sm"><UploadCloud className="h-4 w-4" /></span><span><span className="block text-sm font-semibold text-[#40554a]">Ajouter un plan ou document</span><span className="mt-0.5 block text-xs text-[#91a198]">PDF, PNG, JPG ou WEBP · facultatif · 8 Mo max.</span></span></span>
                <Paperclip className="h-4 w-4 text-[#9aaba0] transition group-hover:rotate-12" />
              </button>
              {file && <div className="mt-2 flex items-center justify-between rounded-xl bg-[#edf4ee] px-3 py-2 text-xs text-[#477059]"><span className="flex min-w-0 items-center gap-2"><FileText className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{file.name}</span></span><button type="button" onClick={() => setFile(null)} className="font-semibold hover:text-[#1d4d3a]">Retirer</button></div>}
              {fileError && <p className="mt-2 flex items-center gap-2 text-xs font-medium text-[#b45146]"><ImageIcon className="h-3.5 w-3.5" />{fileError}</p>}
            </div>
            {generate.error && <Alert variant="destructive" className="mt-4 rounded-2xl"><AlertTitle>Génération interrompue</AlertTitle><AlertDescription>{generate.error.message}</AlertDescription></Alert>}
            {generate.isPending && <div className="mt-5 rounded-2xl border border-[#dbe5dc] bg-[#f8fbf8] p-3"><div className="mb-3 flex items-center justify-between text-xs font-semibold text-[#54715e]"><span>Traitement en cours</span><span>Étape {progressStage + 1}/3</span></div><div className="grid grid-cols-3 gap-1.5 text-[10px] text-[#809288]">{["Analyse", "Validation JSON", "Classeur"].map((label, index) => <span key={label} className={`rounded-lg px-2 py-2 text-center ${progressStage >= index ? "bg-[#dcebe0] text-[#3e795a]" : "bg-[#eaf0eb]"}`}>{label}</span>)}</div></div>}
            <Button onClick={handleGenerate} disabled={generate.isPending} className="mt-6 h-12 w-full rounded-2xl bg-[#1d4d3a] text-sm font-semibold text-white shadow-lg shadow-[#1d4d3a]/20 transition hover:bg-[#286348] active:scale-[0.98]">
              {generate.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyse et préparation du classeur…</> : <><Sparkles className="mr-2 h-4 w-4" /> Générer mon métré & DQE</>}
            </Button>
            {download && <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#cfe0d2] bg-[#edf6ef] p-3"><span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-[#3e795a]"><FileSpreadsheet className="h-4 w-4 shrink-0" /><span className="truncate">Votre classeur est prêt</span></span><a href={download.url} download={download.filename} className="shrink-0 rounded-xl bg-[#d4a554] px-3 py-2 text-xs font-bold text-[#2b382f] transition hover:bg-[#e2b867]">Télécharger</a></div>}
            <p className="mt-4 text-center text-[11px] leading-5 text-[#91a198]">Le fichier généré est une base de travail à contrôler par un professionnel avant utilisation contractuelle.</p>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-[#dfe5df] py-5 text-xs text-[#91a198] sm:flex-row sm:items-center sm:justify-between">
          <span>Un outil pour mieux passer de l’intention au quantitatif.</span>
          <span className="font-medium tracking-wide">MVP · Version de validation</span>
        </footer>
      </div>
    </main>
  );
}
