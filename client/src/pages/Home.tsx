import { useEffect, useRef, useState } from "react";
import React from "react";
import { isValidTrialEmail, isValidTrialPhone } from "@/lib/trialValidation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileSpreadsheet, FileText, Image as ImageIcon, Loader2, Paperclip, Ruler, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const BRAND_IMAGE_TYPES = ["image/png", "image/jpeg"];
const MAX_BRAND_IMAGE_SIZE = 1.5 * 1024 * 1024;
const BRAND_IMAGE_STORAGE_VERSION = 1;
const SIGNATURE_STORAGE_KEY = "metrexpert:validation-image:signature";
const STAMP_STORAGE_KEY = "metrexpert:validation-image:stamp";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Impossible de lire ce fichier."));
    reader.readAsDataURL(file);
  });
}

type BrandImage = { name: string; dataUrl: string };


type StoredBrandImage = BrandImage & { version: number };

export function readStoredBrandImage(key: string): BrandImage | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredBrandImage>;
    if (parsed.version !== BRAND_IMAGE_STORAGE_VERSION || typeof parsed.name !== "string" || typeof parsed.dataUrl !== "string") return null;
    return { name: parsed.name, dataUrl: parsed.dataUrl };
  } catch {
    return null;
  }
}

export function persistBrandImage(key: string, image: BrandImage | null): boolean {
  try {
    if (!image) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify({ ...image, version: BRAND_IMAGE_STORAGE_VERSION }));
    return true;
  } catch {
    return false;
  }
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

export function GenerationErrorAlert({ message }: { message: string }) {
  return <Alert variant="destructive" className="mt-5 border-[#9d554b] bg-[#271b18] text-[#EDEAE2]" role="alert"><AlertTitle>Génération interrompue</AlertTitle><AlertDescription>{message}</AlertDescription></Alert>;
}

export function HourlyQuotaIndicator({ remaining, limit }: { remaining: number; limit: number }) {
  const state = remaining === 0 ? "exhausted" : remaining <= 1 ? "low" : "available";
  const color = state === "exhausted" ? "text-[#d98472]" : state === "low" ? "text-[#C9A15A]" : "text-[#7C9A76]";
  const notice = state === "exhausted" ? "Générations suspendues jusqu’au prochain renouvellement horaire." : state === "low" ? "Attention : il reste une seule génération horaire." : "";
  return <div className={`quota-indicator mb-6 border bg-[#16201C] px-4 py-3 font-mono text-[10px] uppercase tracking-wider ${state === "exhausted" ? "quota-indicator--exhausted border-[#9d554b]" : state === "low" ? "quota-indicator--low border-[#C9A15A]" : "border-[#3A4A42]"}`} role="status" aria-live={state === "exhausted" ? "assertive" : "polite"} data-quota-state={state}>
    <div className="quota-indicator__summary flex items-center justify-between gap-3 text-[#AEB7B0]"><span>Quota horaire restant</span><strong className={color}>{remaining} / {limit} génération{remaining > 1 ? "s" : ""}</strong></div>
    {notice && <p className={`quota-notice mt-2 border-l-2 pl-2 ${color}`} role={state === "exhausted" ? "alert" : "status"} data-quota-notice={state}>{notice}</p>}
  </div>;
}

export function MonthlyQuotaProgress({ remaining, limit }: { remaining: number; limit: number }) {
  const safeLimit = Math.max(1, limit);
  const safeRemaining = Math.min(safeLimit, Math.max(0, remaining));
  const percent = Math.round((safeRemaining / safeLimit) * 100);
  const state = safeRemaining === 0 ? "exhausted" : percent <= 20 ? "low" : "available";
  const fillColor = state === "exhausted" ? "bg-[#9d554b]" : state === "low" ? "bg-[#C9A15A]" : "bg-[#7C9A76]";
  const textColor = state === "exhausted" ? "text-[#d98472]" : state === "low" ? "text-[#C9A15A]" : "text-[#7C9A76]";
  return <div className="monthly-quota-progress mb-6 border border-[#C9A15A]/60 bg-[#16201C] px-4 py-4" data-quota-state={state}>
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2 font-mono text-[10px] uppercase tracking-wider">
      <div><p className="text-[#C9A15A]">Quota mensuel client</p><p className="mt-1 text-[#AEB7B0]">Générations restantes</p></div>
      <strong className={textColor}>{safeRemaining} / {safeLimit}</strong>
    </div>
    <div className="h-3 w-full overflow-hidden border border-[#3A4A42] bg-[#0F1613]" role="progressbar" aria-label="Quota mensuel de générations restant" aria-valuemin={0} aria-valuemax={safeLimit} aria-valuenow={safeRemaining} aria-valuetext={`${safeRemaining} génération${safeRemaining > 1 ? "s" : ""} restante${safeRemaining > 1 ? "s" : ""} sur ${safeLimit}`}>
      <div className={`h-full transition-[width] duration-300 ease-out ${fillColor}`} style={{ width: `${percent}%` }} />
    </div>
    <div className="mt-2 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-wider text-[#718078]"><span>0</span><span>{percent}% disponible</span><span>{safeLimit}</span></div>
    {state === "low" && <p className="mt-3 border-l-2 border-[#C9A15A] pl-2 text-xs text-[#C9A15A]" role="status">Votre quota mensuel est bientôt épuisé.</p>}
    {state === "exhausted" && <p className="mt-3 border-l-2 border-[#9d554b] pl-2 text-xs text-[#d98472]" role="alert">Quota mensuel atteint, contactez-moi pour renouveler votre accès.</p>}
  </div>;
}

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
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [trialPhone, setTrialPhone] = useState("");
  const [trialEmail, setTrialEmail] = useState("");
  const [verifiedBy, setVerifiedBy] = useState("");
  const [validationDate, setValidationDate] = useState("");
  const [signatureImage, setSignatureImage] = useState<BrandImage | null>(null);
  const [stampImage, setStampImage] = useState<BrandImage | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<"signature" | "stamp" | "all" | null>(null);
  const [brandImageError, setBrandImageError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [download, setDownload] = useState<GeneratedDownload | null>(null);
  const [previewQuery, setPreviewQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const accessStatus = trpc.security.status.useQuery();
  const verifyAccess = trpc.security.verifyAccessCode.useMutation({
    onSuccess: async () => {
      await accessStatus.refetch();
      setAccessCode("");
      toast.success("Accès partagé autorisé pour 7 jours.");
    },
  });
  const verifyClientAccess = trpc.security.verifyClientCode.useMutation({
    onSuccess: async () => {
      await accessStatus.refetch();
      setClientAccessCode("");
      toast.success("Accès client autorisé.");
    },
  });
  const generate = trpc.estimate.generate.useMutation();
  const [accessCode, setAccessCode] = useState("");
  const [clientAccessCode, setClientAccessCode] = useState("");
  const [progressStage, setProgressStage] = useState(0);
  const documentDate = new Intl.DateTimeFormat("fr-FR").format(new Date());

  useEffect(() => {
    setSignatureImage(readStoredBrandImage(SIGNATURE_STORAGE_KEY));
    setStampImage(readStoredBrandImage(STAMP_STORAGE_KEY));
  }, []);

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

  const onBrandImageChange = async (kind: "signature" | "stamp", candidate?: File) => {
    setBrandImageError("");
    if (!candidate) return;
    if (!BRAND_IMAGE_TYPES.includes(candidate.type)) {
      setBrandImageError("Les images de validation doivent être au format PNG ou JPEG.");
      return;
    }
    if (candidate.size > MAX_BRAND_IMAGE_SIZE) {
      setBrandImageError("Chaque image de validation doit peser moins de 1,5 Mo.");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(candidate);
      const image = { name: candidate.name, dataUrl };
      const persisted = persistBrandImage(kind === "signature" ? SIGNATURE_STORAGE_KEY : STAMP_STORAGE_KEY, image);
      if (!persisted) {
        setBrandImageError("L’image a été chargée pour cette génération, mais n’a pas pu être conservée dans le cache local du navigateur.");
      }
      if (kind === "signature") setSignatureImage(image);
      else setStampImage(image);
    } catch (error) {
      setBrandImageError(error instanceof Error ? error.message : "Impossible de lire cette image.");
    }
  };

  const clearBrandImage = (kind: "signature" | "stamp") => {
    const key = kind === "signature" ? SIGNATURE_STORAGE_KEY : STAMP_STORAGE_KEY;
    const cleared = persistBrandImage(key, null);
    if (kind === "signature") setSignatureImage(null);
    else setStampImage(null);
    if (!cleared) setBrandImageError("Le cache local n’a pas pu être modifié dans ce navigateur.");
  };

  const clearAllBrandImages = () => {
    const signatureCleared = persistBrandImage(SIGNATURE_STORAGE_KEY, null);
    const stampCleared = persistBrandImage(STAMP_STORAGE_KEY, null);
    setSignatureImage(null);
    setStampImage(null);
    if (!signatureCleared || !stampCleared) setBrandImageError("Le cache local n’a pas pu être entièrement effacé dans ce navigateur.");
  };

  const confirmPendingRemoval = () => {
    if (pendingRemoval === "all") clearAllBrandImages();
    else if (pendingRemoval) clearBrandImage(pendingRemoval);
    setPendingRemoval(null);
  };

  const clearBrandImageRequest = (kind: "signature" | "stamp") => setPendingRemoval(kind);


  const handleVerifyAccess = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    verifyAccess.mutate({ accessCode });
  };

  const handleVerifyClientAccess = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    verifyClientAccess.mutate({ accessCode: clientAccessCode });
  };

  const handleGenerate = async () => {
    if (!accessStatus.data?.unlocked && hasTrialContact && !hasValidTrialContact) {
      toast.error("Vérifiez le format du téléphone ou de l’e-mail d’essai.");
      return;
    }
    if (!accessStatus.data?.unlocked && !hasValidTrialContact) {
      toast.error("Déverrouillez l’application ou renseignez un téléphone/e-mail d’essai valide.");
      return;
    }
    if (description.trim().length < 20) {
      toast.error("Ajoutez une description plus détaillée du projet.");
      return;
    }
    try {
      const dataUrl = file ? await readFileAsDataUrl(file) : undefined;
      const result = await generate.mutateAsync({
        description: description.trim(),
        clientPhone: clientPhone.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        trialPhone: trialPhone.trim() || undefined,
        trialEmail: trialEmail.trim() || undefined,
        verifiedBy: verifiedBy.trim() || undefined,
        validationDate: validationDate.trim() || undefined,
        signatureImageDataUrl: signatureImage?.dataUrl,
        stampImageDataUrl: stampImage?.dataUrl,
        file: file && dataUrl ? { name: file.name, mimeType: file.type as "application/pdf" | "image/png" | "image/jpeg" | "image/webp", dataUrl } : undefined,
      });
      const bytes = Uint8Array.from(atob(result.data), (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      setDownload((previous) => {
        if (previous) URL.revokeObjectURL(previous.url);
        return { url, filename: result.filename, lineCount: result.lineCount, preview: result.preview };
      });
      await accessStatus.refetch();
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
  const hourlyRemaining = accessStatus.data?.hourlyRemaining;
  const hourlyLimit = accessStatus.data?.hourlyLimit ?? 5;
  const hasTrialContact = Boolean(trialPhone.trim() || trialEmail.trim());
  const validTrialPhone = isValidTrialPhone(trialPhone);
  const validTrialEmail = isValidTrialEmail(trialEmail);
  const hasValidTrialContact = validTrialPhone || validTrialEmail;

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
              {!accessStatus.data?.unlocked && <div className="access-panel mb-6" role="region" aria-labelledby="access-title"><div className="mb-4 flex items-start justify-between gap-4"><div><p className="repere">PROTECTION <span>—</span> ACCÈS REQUIS</p><h3 id="access-title" className="mt-2 font-serif text-xl text-[#EDEAE2]">Déverrouiller l’étude</h3></div><span className="font-mono text-[10px] uppercase text-[#C9A15A]">5 / H · 50 / J</span></div><p className="mb-4 text-xs leading-5 text-[#AEB7B0]">Un code d’accès est nécessaire avant toute génération payante. Limites actives : 5 générations par heure et 50 pour toute l’application par jour.</p><form onSubmit={handleVerifyAccess} className="flex flex-col gap-3 sm:flex-row"><label htmlFor="access-code" className="sr-only">Code d’accès partagé</label><input id="access-code" type="password" autoComplete="off" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="Code d’accès partagé" className="technical-input h-11 min-w-0 flex-1 px-3 text-sm" required /><Button type="submit" disabled={verifyAccess.isPending || !accessCode} className="technical-button h-11 rounded-none sm:w-40">{verifyAccess.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Vérification…</> : "Déverrouiller"}</Button></form>{verifyAccess.error && <p className="mt-3 text-xs font-medium text-[#d98472]" role="alert">{verifyAccess.error.message}</p>}<div className="my-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-[#607068]"><span className="h-px flex-1 bg-[#3A4A42]" />ou accès client<span className="h-px flex-1 bg-[#3A4A42]" /></div><form onSubmit={handleVerifyClientAccess} className="flex flex-col gap-3 sm:flex-row"><label htmlFor="client-access-code" className="sr-only">Code client</label><input id="client-access-code" type="password" autoComplete="off" value={clientAccessCode} onChange={(event) => setClientAccessCode(event.target.value)} placeholder="Code client transmis" className="technical-input h-11 min-w-0 flex-1 px-3 text-sm" required /><Button type="submit" disabled={verifyClientAccess.isPending || !clientAccessCode} className="technical-button h-11 rounded-none sm:w-40">{verifyClientAccess.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Vérification…</> : "Activer mon accès"}</Button></form>{verifyClientAccess.error && <p className="mt-3 text-xs font-medium text-[#d98472]" role="alert">{verifyClientAccess.error.message}</p>}<div className="my-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-[#607068]"><span className="h-px flex-1 bg-[#3A4A42]" />ou essai gratuit<span className="h-px flex-1 bg-[#3A4A42]" /></div><p className="mb-3 text-xs leading-5 text-[#AEB7B0]">Une seule génération gratuite par téléphone ou e-mail. Renseignez au moins un contact pour commencer.</p><div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor="trial-phone" className="field-label">Téléphone d’essai <span>REQUIS SI PAS D’E-MAIL</span></label><input id="trial-phone" type="tel" autoComplete="tel" value={trialPhone} onChange={(event) => setTrialPhone(event.target.value)} placeholder="+225 …" aria-invalid={Boolean(trialPhone) && !validTrialPhone} className={`technical-input h-11 w-full min-w-0 px-3 text-sm ${trialPhone && !validTrialPhone ? "border-[#9d554b]" : trialPhone && validTrialPhone ? "border-[#7C9A76]" : ""}`} />{trialPhone && <p className={`mt-1 text-[11px] ${validTrialPhone ? "text-[#7C9A76]" : "text-[#d98472]"}`} role="status">{validTrialPhone ? "Format reconnu." : "Format attendu : 10 chiffres ivoiriens ou +225 suivi du numéro."}</p>}</div><div><label htmlFor="trial-email" className="field-label">E-mail d’essai <span>REQUIS SI PAS DE TÉL.</span></label><input id="trial-email" type="email" autoComplete="email" value={trialEmail} onChange={(event) => setTrialEmail(event.target.value)} placeholder="vous@exemple.ci" aria-invalid={Boolean(trialEmail) && !validTrialEmail} className={`technical-input h-11 w-full min-w-0 px-3 text-sm ${trialEmail && !validTrialEmail ? "border-[#9d554b]" : trialEmail && validTrialEmail ? "border-[#7C9A76]" : ""}`} />{trialEmail && <p className={`mt-1 text-[11px] ${validTrialEmail ? "text-[#7C9A76]" : "text-[#d98472]"}`} role="status">{validTrialEmail ? "Format reconnu." : "Format attendu : nom@domaine.ci"}</p>}</div></div></div>}
              {accessStatus.data?.unlocked && accessStatus.data.accessType === "client" && accessStatus.data.monthlyRemaining !== undefined && accessStatus.data.monthlyQuota !== undefined && <MonthlyQuotaProgress remaining={accessStatus.data.monthlyRemaining} limit={accessStatus.data.monthlyQuota} />}{accessStatus.data?.unlocked && hourlyRemaining !== undefined && <HourlyQuotaIndicator remaining={hourlyRemaining} limit={hourlyLimit} />}
              {accessStatus.data?.dailyTotal !== undefined && <div className="mb-6 flex items-center justify-between gap-3 border border-[#3A4A42] bg-[#16201C] px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]"><span>Compteur global du jour</span><strong className="text-[#C9A15A]">{accessStatus.data.dailyTotal} / {accessStatus.data.dailyLimit}</strong></div>}
              <label htmlFor="description" className="field-label">Description du projet <span>REQUIS</span></label>
              <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex. Construction d’une villa R+1 de 180 m² à Abidjan, avec fondations en béton armé, murs en agglos..." className="technical-input min-h-40 resize-none" />
              <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
                <div className="min-w-0"><label htmlFor="client-phone" className="field-label">Téléphone client <span>OPTIONNEL</span></label><input id="client-phone" type="tel" autoComplete="tel" value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} placeholder="À compléter" className="technical-input h-11 w-full min-w-0 px-3 text-sm" /></div>
                <div className="min-w-0"><label htmlFor="client-email" className="field-label">E-mail client <span>OPTIONNEL</span></label><input id="client-email" type="email" autoComplete="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} placeholder="À compléter" className="technical-input h-11 w-full min-w-0 px-3 text-sm" /></div>
                <div className="min-w-0"><label htmlFor="verified-by" className="field-label">Vérifié par <span>OPTIONNEL</span></label><input id="verified-by" type="text" autoComplete="name" value={verifiedBy} onChange={(event) => setVerifiedBy(event.target.value)} placeholder="À compléter" className="technical-input h-11 w-full min-w-0 px-3 text-sm" /></div>
                <div className="min-w-0"><label htmlFor="validation-date" className="field-label">Date de validation <span>OPTIONNEL</span></label><input id="validation-date" type="text" inputMode="numeric" value={validationDate} onChange={(event) => setValidationDate(event.target.value)} placeholder="JJ/MM/AAAA" className="technical-input h-11 w-full min-w-0 px-3 text-sm" /></div>
              </div>
              <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
                <div className="min-w-0"><label htmlFor="signature-image" className="field-label">Image de signature <span>OPTIONNEL</span></label><input ref={signatureInputRef} id="signature-image" type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(event) => void onBrandImageChange("signature", event.target.files?.[0])} /><div className="flex min-w-0 gap-2"><button type="button" onClick={() => signatureInputRef.current?.click()} className="upload-zone min-w-0 flex-1 justify-between"><span className="min-w-0 text-left text-sm text-[#AEB7B0]"><span className="block truncate">{signatureImage?.name || "Importer une image"}</span>{signatureImage && <span className="mt-1 block text-[9px] uppercase tracking-wide text-[#7C9A76]">Enregistrée localement</span>}</span><UploadCloud className="h-4 w-4 shrink-0 text-[#C9A15A]" /></button>{signatureImage && <button type="button" onClick={() => clearBrandImageRequest("signature")} className="shrink-0 border border-[#3A4A42] px-2 font-mono text-[9px] uppercase tracking-wide text-[#C9A15A] hover:border-[#C9A15A]" aria-label="Effacer l’image de signature mémorisée">Effacer</button>}</div></div>
                <div className="min-w-0"><label htmlFor="stamp-image" className="field-label">Image de tampon <span>OPTIONNEL</span></label><input ref={stampInputRef} id="stamp-image" type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(event) => void onBrandImageChange("stamp", event.target.files?.[0])} /><div className="flex min-w-0 gap-2"><button type="button" onClick={() => stampInputRef.current?.click()} className="upload-zone min-w-0 flex-1 justify-between"><span className="min-w-0 text-left text-sm text-[#AEB7B0]"><span className="block truncate">{stampImage?.name || "Importer une image"}</span>{stampImage && <span className="mt-1 block text-[9px] uppercase tracking-wide text-[#7C9A76]">Enregistrée localement</span>}</span><UploadCloud className="h-4 w-4 shrink-0 text-[#C9A15A]" /></button>{stampImage && <button type="button" onClick={() => clearBrandImageRequest("stamp")} className="shrink-0 border border-[#3A4A42] px-2 font-mono text-[9px] uppercase tracking-wide text-[#C9A15A] hover:border-[#C9A15A]" aria-label="Effacer l’image de tampon mémorisée">Effacer</button>}</div></div>
              </div>
              {brandImageError && <p className="mt-2 flex items-center gap-2 text-xs font-medium text-[#d98472]" role="alert"><ImageIcon className="h-3.5 w-3.5" />{brandImageError}</p>}
              {(signatureImage || stampImage) && <button type="button" onClick={() => setPendingRemoval("all")} className="mt-3 inline-flex items-center gap-2 border border-[#3A4A42] px-3 py-2 font-mono text-[9px] uppercase tracking-wide text-[#C9A15A] hover:border-[#C9A15A]" aria-label="Effacer toutes les données locales de signature et de tampon"><Trash2 className="h-3.5 w-3.5" />Effacer toutes les données locales</button>}
              <Dialog open={pendingRemoval !== null} onOpenChange={(open) => { if (!open) setPendingRemoval(null); }}>
                <DialogContent className="border-[#C9A15A] bg-[#16201C] text-[#EDEAE2]">
                  <DialogHeader><DialogTitle className="font-serif text-2xl text-[#EDEAE2]">Confirmer la suppression</DialogTitle><DialogDescription className="text-[#AEB7B0]">{pendingRemoval === "all" ? "Les images mémorisées de signature et de tampon seront supprimées de ce navigateur." : `L’image de ${pendingRemoval === "signature" ? "signature" : "tampon"} sera supprimée de ce navigateur.`}</DialogDescription></DialogHeader>
                  <DialogFooter><button type="button" onClick={() => setPendingRemoval(null)} className="border border-[#3A4A42] px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#AEB7B0]">Annuler</button><button type="button" onClick={confirmPendingRemoval} className="bg-[#C9A15A] px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#0F1613]">Confirmer la suppression</button></DialogFooter>
                </DialogContent>
              </Dialog>
              <div className="mt-5">
                <input ref={fileInputRef} type="file" accept=".pdf,image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => onFileChange(event.target.files?.[0])} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="upload-zone group">
                  <span className="flex items-center gap-3"><span className="upload-icon"><UploadCloud className="h-4 w-4" /></span><span><span className="block text-sm font-semibold text-[#EDEAE2]">Joindre un plan ou document</span><span className="mt-1 block font-mono text-[10px] uppercase tracking-wide text-[#87938B]">PDF · PNG · JPG · WEBP / 8 Mo max.</span></span></span><Paperclip className="h-4 w-4 text-[#C9A15A] transition group-hover:rotate-12" />
                </button>
                {file && <div className="file-chip"><span className="flex min-w-0 items-center gap-2"><FileText className="h-3.5 w-3.5 shrink-0 text-[#C9A15A]" /><span className="truncate">{file.name}</span></span><button type="button" onClick={() => setFile(null)} className="font-mono text-[10px] uppercase text-[#C9A15A] hover:text-[#EDEAE2]">Retirer</button></div>}
                {fileError && <p className="mt-2 flex items-center gap-2 text-xs font-medium text-[#d98472]"><ImageIcon className="h-3.5 w-3.5" />{fileError}</p>}
              </div>
              {generate.error && <GenerationErrorAlert message={generate.error.message} />}
              {generate.isPending && <div className="progress-panel mt-5"><div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[#C9A15A]"><span>Traitement en cours</span><span>Étape {progressStage + 1}/3</span></div><div className="grid grid-cols-3 gap-px bg-[#3A4A42]">{["Analyse", "Validation JSON", "Classeur"].map((label, index) => <span key={label} className={`px-2 py-2 text-center font-mono text-[10px] uppercase ${progressStage >= index ? "bg-[#7C9A76] text-[#0F1613]" : "bg-[#1C2822] text-[#87938B]"}`}>{label}</span>)}</div></div>}
              <Button onClick={() => void handleGenerate()} disabled={generate.isPending || (!accessStatus.data?.unlocked && !hasValidTrialContact)} aria-busy={generate.isPending} data-loading={generate.isPending ? "true" : undefined} className="technical-button mt-6 h-12 w-full rounded-none">
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
