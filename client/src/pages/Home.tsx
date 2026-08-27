import { useEffect, useRef, useState } from "react";
import React from "react";
import { isValidTrialEmail, isValidTrialPhone } from "@/lib/trialValidation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileDown, FileSpreadsheet, FileText, Image as ImageIcon, Loader2, Paperclip, Ruler, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import ClientSubscriptionPanel from "@/components/ClientSubscriptionPanel";
import { WorkbookPreview, type WorkbookPreviewData, type WorkbookPreviewTab } from "@/components/WorkbookPreview";
import { useTheme } from "@/contexts/ThemeContext";
import { trackOnboardingEvent } from "@/lib/onboardingTelemetry";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const BRAND_IMAGE_TYPES = ["image/png", "image/jpeg"];
const MAX_BRAND_IMAGE_SIZE = 1.5 * 1024 * 1024;
const BRAND_IMAGE_STORAGE_VERSION = 1;
const SIGNATURE_STORAGE_KEY = "metrexpert:validation-image:signature";
const STAMP_STORAGE_KEY = "metrexpert:validation-image:stamp";
const PDF_LOGO_STORAGE_KEY = "metrexpert:pdf-logo";
const PDF_STYLE_STORAGE_KEY = "metrexpert:pdf-style:v1";
const FORM_DRAFT_STORAGE_KEY = "metrexpert:generation-draft:v1";
const EXAMPLE_PROJECT_DESCRIPTION = "Construction d’une villa R+1 de 180 m² à Yopougon, avec fondations en béton armé, murs en agglos de 15 cm, dalle pleine, toiture-terrasse et peinture intérieure. Métrer séparément les fondations, le gros œuvre, les enduits, les menuiseries et la peinture. Les dimensions non précisées doivent être indiquées comme hypothèses à vérifier.";

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

type GeometryDraft = {
  code: string;
  designation: string;
  formula: "linear" | "surface" | "volume" | "count";
  unit: string;
  length: string;
  width: string;
  height: string;
  openingArea: string;
  quantity: string;
  notes: string;
};

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

type GeometryPreview = {
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

type GeometryCheckPreview = {
  code: string;
  designation: string;
  status: "OK" | "À VÉRIFIER" | "BLOQUANT";
  rule: string;
  observed: string;
  recommendation: string;
};

type GeneratedDownload = {
  url: string;
  filename: string;
  lineCount: number;
  preview: WorkbookPreviewData;
};

const ONBOARDING_STEPS = [
  { number: 1, title: "Accès & contact", description: "Déverrouillez l’étude ou renseignez le contact de votre essai." },
  { number: 2, title: "Décrire le projet", description: "Expliquez le chantier, les lots et les dimensions connues." },
  { number: 3, title: "Relire les données", description: "Ajoutez les dimensions explicites et vérifiez les hypothèses." },
  { number: 4, title: "Générer le livrable", description: "Contrôlez la checklist, puis produisez le métré et le DQE." },
] as const;


export function GuidedOnboarding({ step, onStepChange }: { step: number; onStepChange: (step: number) => void }) {
  return <section className="mb-6 border border-[#3A4A42] bg-[#0F1613] p-4" aria-labelledby="onboarding-title" data-onboarding-guide>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="repere">GUIDE · DÉMARRAGE</p><h3 id="onboarding-title" className="mt-2 font-serif text-xl text-[#EDEAE2]">Votre étude en 4 repères</h3></div><span className="font-mono text-[10px] uppercase tracking-wider text-[#C9A15A]">Étape {step}/4</span></div>
    <ol className="mt-4 grid gap-2 sm:grid-cols-4" aria-label="Étapes du parcours de génération">{ONBOARDING_STEPS.map((item) => <li key={item.number}><button type="button" aria-current={step === item.number ? "step" : undefined} onClick={() => { trackOnboardingEvent("step_selected", item.number); onStepChange(item.number); }} className={`w-full border px-3 py-3 text-left ${step === item.number ? "border-[#C9A15A] bg-[#16201C]" : "border-[#3A4A42]"}`}><span className="font-mono text-[10px] text-[#C9A15A]">REP. 0{item.number}</span><span className="mt-1 block text-xs font-semibold text-[#EDEAE2]">{item.title}</span></button></li>)}</ol>
    <div className="mt-4 border-t border-[#3A4A42] pt-4"><p className="text-sm text-[#EDEAE2]">{ONBOARDING_STEPS[step - 1]?.description}</p><div className="mt-3 flex flex-wrap justify-between gap-2"><button type="button" disabled={step <= 1} onClick={() => { trackOnboardingEvent("step_back", step); onStepChange(Math.max(1, step - 1)); }} className="border border-[#3A4A42] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0] disabled:opacity-40">← Précédent</button><button type="button" disabled={step >= 4} onClick={() => { trackOnboardingEvent("step_completed", step); onStepChange(Math.min(4, step + 1)); }} className="border border-[#C9A15A] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#C9A15A] disabled:opacity-40">Suivant →</button></div></div>
  </section>;
}

export default function Home() {
  const [description, setDescription] = useState("");
  const [geometry, setGeometry] = useState<GeometryDraft[]>([]);
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [trialPhone, setTrialPhone] = useState("");
  const [trialEmail, setTrialEmail] = useState("");
  const [trialConsent, setTrialConsent] = useState(false);
  const { theme } = useTheme();
  const [verifiedBy, setVerifiedBy] = useState("");
  const [validationDate, setValidationDate] = useState("");
  const [signatureImage, setSignatureImage] = useState<BrandImage | null>(null);
  const [stampImage, setStampImage] = useState<BrandImage | null>(null);
  const [logoImage, setLogoImage] = useState<BrandImage | null>(null);
  const [pdfAccentColor, setPdfAccentColor] = useState("#C9A15A");
  const [pdfDarkColor, setPdfDarkColor] = useState("#0F1613");
  const [pdfDetail, setPdfDetail] = useState<"summary" | "detailed">("detailed");
  const [pdfFooter, setPdfFooter] = useState("");
  const [pendingRemoval, setPendingRemoval] = useState<"signature" | "stamp" | "logo" | "all" | null>(null);
  const [pendingGeometryRegeneration, setPendingGeometryRegeneration] = useState<GeometryDraft[] | null>(null);
  const [geometryPdfUrl, setGeometryPdfUrl] = useState<string | null>(null);
  const [geometryPdfFilename, setGeometryPdfFilename] = useState("controle-geometrique.pdf");
  const [geometryPdfOpen, setGeometryPdfOpen] = useState(false);
  const [resultsPdfUrl, setResultsPdfUrl] = useState<string | null>(null);
  const [resultsPdfFilename, setResultsPdfFilename] = useState("metrexpert-resultats.pdf");
  const [resultsPdfOpen, setResultsPdfOpen] = useState(false);
  const [resultsPdfPending, setResultsPdfPending] = useState(false);
  const [geometryQuery, setGeometryQuery] = useState("");
  const [geometryStatusFilter, setGeometryStatusFilter] = useState<"ALL" | "OK" | "À VÉRIFIER" | "BLOQUANT">("ALL");
  const [geometrySort, setGeometrySort] = useState<"code" | "designation" | "formula" | "status">("code");
  const [geometrySortDirection, setGeometrySortDirection] = useState<"asc" | "desc">("asc");
  const [brandImageError, setBrandImageError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [download, setDownload] = useState<GeneratedDownload | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSaveNotice, setDraftSaveNotice] = useState(false);
  const [resetFormOpen, setResetFormOpen] = useState(false);
  const [exampleWarningOpen, setExampleWarningOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [previewGeometryDrafts, setPreviewGeometryDrafts] = useState<GeometryDraft[]>([]);
  const [previewQuery, setPreviewQuery] = useState("");
  const [workbookPreviewTab, setWorkbookPreviewTab] = useState<WorkbookPreviewTab>("cover");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generationRequestKeyRef = useRef<string | null>(null);
  const draftHydratedRef = useRef(false);
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
  const [generationElapsedSeconds, setGenerationElapsedSeconds] = useState(0);
  const progressMessages = ["Lecture de la description et du plan…", "Contrôle de la réponse structurée…", "Construction du classeur Excel et des vérifications…"];
  const documentDate = new Intl.DateTimeFormat("fr-FR").format(new Date());
  const addGeometry = () => setGeometry((rows) => [...rows, { code: `G-${rows.length + 1}`, designation: "", formula: "surface", unit: "m²", length: "", width: "", height: "", openingArea: "", quantity: "1", notes: "" }]);
  const updateGeometry = (index: number, patch: Partial<GeometryDraft>) => setGeometry((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  const removeGeometry = (index: number) => setGeometry((rows) => rows.filter((_, rowIndex) => rowIndex !== index));

  useEffect(() => {
    setSignatureImage(readStoredBrandImage(SIGNATURE_STORAGE_KEY));
    setStampImage(readStoredBrandImage(STAMP_STORAGE_KEY));
    setLogoImage(readStoredBrandImage(PDF_LOGO_STORAGE_KEY));
    try {
      const savedPdfStyle = JSON.parse(window.localStorage.getItem(PDF_STYLE_STORAGE_KEY) || "null") as Partial<{ accentColor: string; darkColor: string; detail: "summary" | "detailed"; footer: string }> | null;
      if (savedPdfStyle?.accentColor) setPdfAccentColor(savedPdfStyle.accentColor);
      if (savedPdfStyle?.darkColor) setPdfDarkColor(savedPdfStyle.darkColor);
      if (savedPdfStyle?.detail === "summary" || savedPdfStyle?.detail === "detailed") setPdfDetail(savedPdfStyle.detail);
      if (typeof savedPdfStyle?.footer === "string") setPdfFooter(savedPdfStyle.footer);
    } catch {
      // Les options PDF reprennent leurs valeurs sûres par défaut.
    }
    const exampleRequested = new URLSearchParams(window.location.search).get("example") === "1";
    try {
      const rawDraft = window.localStorage.getItem(FORM_DRAFT_STORAGE_KEY);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft) as Partial<{ description: string; clientPhone: string; clientEmail: string; trialPhone: string; trialEmail: string; trialConsent: boolean; verifiedBy: string; validationDate: string; onboardingStep: number }>;
        const hasMeaningfulDraft = Boolean(draft.description?.trim() || draft.clientPhone?.trim() || draft.clientEmail?.trim() || draft.trialPhone?.trim() || draft.trialEmail?.trim() || draft.verifiedBy?.trim() || draft.validationDate?.trim() || draft.trialConsent || (draft.onboardingStep && draft.onboardingStep > 1));
        if (exampleRequested && hasMeaningfulDraft) {
          setExampleWarningOpen(true);
          setDraftRestored(true);
        } else {
          if (typeof draft.description === "string") setDescription(draft.description);
          if (typeof draft.clientPhone === "string") setClientPhone(draft.clientPhone);
          if (typeof draft.clientEmail === "string") setClientEmail(draft.clientEmail);
          if (typeof draft.trialPhone === "string") setTrialPhone(draft.trialPhone);
          if (typeof draft.trialEmail === "string") setTrialEmail(draft.trialEmail);
          if (draft.trialConsent === true) setTrialConsent(true);
          if (typeof draft.verifiedBy === "string") setVerifiedBy(draft.verifiedBy);
          if (typeof draft.validationDate === "string") setValidationDate(draft.validationDate);
          if (typeof draft.onboardingStep === "number" && draft.onboardingStep >= 1 && draft.onboardingStep <= 4) setOnboardingStep(draft.onboardingStep);
          setDraftRestored(hasMeaningfulDraft);
          if (exampleRequested) applyExampleDescription();
        }
      } else if (exampleRequested) {
        applyExampleDescription();
      }
    } catch {
      window.localStorage.removeItem(FORM_DRAFT_STORAGE_KEY);
      if (exampleRequested) applyExampleDescription();
    } finally {
      draftHydratedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!draftHydratedRef.current) return;
    try {
      const hasMeaningfulDraft = Boolean(description.trim() || clientPhone.trim() || clientEmail.trim() || trialPhone.trim() || trialEmail.trim() || trialConsent || verifiedBy.trim() || validationDate.trim() || onboardingStep > 1);
      if (hasMeaningfulDraft) {
        window.localStorage.setItem(FORM_DRAFT_STORAGE_KEY, JSON.stringify({ description, clientPhone, clientEmail, trialPhone, trialEmail, trialConsent, verifiedBy, validationDate, onboardingStep }));
        setDraftSaveNotice(true);
        const noticeTimer = window.setTimeout(() => setDraftSaveNotice(false), 1600);
        return () => window.clearTimeout(noticeTimer);
      }
      else window.localStorage.removeItem(FORM_DRAFT_STORAGE_KEY);
    } catch {
      // Le formulaire reste utilisable même si le stockage local est indisponible.
    }
  }, [description, clientPhone, clientEmail, trialPhone, trialEmail, trialConsent, verifiedBy, validationDate, onboardingStep]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PDF_STYLE_STORAGE_KEY, JSON.stringify({ accentColor: pdfAccentColor, darkColor: pdfDarkColor, detail: pdfDetail, footer: pdfFooter }));
    } catch {
      // Les options restent actives pour la session même si le cache est indisponible.
    }
  }, [pdfAccentColor, pdfDarkColor, pdfDetail, pdfFooter]);

  useEffect(() => {
    if (!generate.isPending) {
      setProgressStage(0);
      setGenerationElapsedSeconds(0);
      return;
    }
    setGenerationElapsedSeconds(0);
    const stageTimer = window.setInterval(() => setProgressStage((stage) => Math.min(stage + 1, 2)), 1800);
    const elapsedTimer = window.setInterval(() => setGenerationElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => {
      window.clearInterval(stageTimer);
      window.clearInterval(elapsedTimer);
    };
  }, [generate.isPending]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!download && (description.trim() || file || trialPhone.trim() || trialEmail.trim())) {
        trackOnboardingEvent("form_abandoned", onboardingStep);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [description, download, file, onboardingStep, trialEmail, trialPhone]);

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

  const onBrandImageChange = async (kind: "signature" | "stamp" | "logo", candidate?: File) => {
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
      const persisted = persistBrandImage(kind === "signature" ? SIGNATURE_STORAGE_KEY : kind === "stamp" ? STAMP_STORAGE_KEY : PDF_LOGO_STORAGE_KEY, image);
      if (!persisted) {
        setBrandImageError("L’image a été chargée pour cette génération, mais n’a pas pu être conservée dans le cache local du navigateur.");
      }
      if (kind === "signature") setSignatureImage(image);
      else if (kind === "stamp") setStampImage(image);
      else setLogoImage(image);
    } catch (error) {
      setBrandImageError(error instanceof Error ? error.message : "Impossible de lire cette image.");
    }
  };

  const clearBrandImage = (kind: "signature" | "stamp" | "logo") => {
    const key = kind === "signature" ? SIGNATURE_STORAGE_KEY : kind === "stamp" ? STAMP_STORAGE_KEY : PDF_LOGO_STORAGE_KEY;
    const cleared = persistBrandImage(key, null);
    if (kind === "signature") setSignatureImage(null);
    else if (kind === "stamp") setStampImage(null);
    else setLogoImage(null);
    if (!cleared) setBrandImageError("Le cache local n’a pas pu être modifié dans ce navigateur.");
  };

  const clearAllBrandImages = () => {
    const signatureCleared = persistBrandImage(SIGNATURE_STORAGE_KEY, null);
    const stampCleared = persistBrandImage(STAMP_STORAGE_KEY, null);
    const logoCleared = persistBrandImage(PDF_LOGO_STORAGE_KEY, null);
    setSignatureImage(null);
    setStampImage(null);
    setLogoImage(null);
    if (!signatureCleared || !stampCleared || !logoCleared) setBrandImageError("Le cache local n’a pas pu être entièrement effacé dans ce navigateur.");
  };

  const confirmPendingRemoval = () => {
    if (pendingRemoval === "all") clearAllBrandImages();
    else if (pendingRemoval) clearBrandImage(pendingRemoval);
    setPendingRemoval(null);
  };

  const clearBrandImageRequest = (kind: "signature" | "stamp" | "logo") => setPendingRemoval(kind);


  const handleVerifyAccess = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    verifyAccess.mutate({ accessCode });
  };

  const handleVerifyClientAccess = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    verifyClientAccess.mutate({ accessCode: clientAccessCode });
  };

  const toGeometryDraft = (dimension: GeometryPreview): GeometryDraft => ({ code: dimension.code, designation: dimension.designation, formula: dimension.formula, unit: dimension.unit, length: dimension.length === undefined ? "" : String(dimension.length), width: dimension.width === undefined ? "" : String(dimension.width), height: dimension.height === undefined ? "" : String(dimension.height), openingArea: dimension.openingArea === undefined ? "" : String(dimension.openingArea), quantity: dimension.quantity === undefined ? "1" : String(dimension.quantity), notes: "" });

  const handleGenerate = async (geometryOverride?: GeometryDraft[]) => {
    if (generationRequestKeyRef.current) return;
    generate.reset();
    trackOnboardingEvent("generation_started", 4);
    const requestKey = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    generationRequestKeyRef.current = requestKey;
    if (!accessStatus.data?.unlocked && hasTrialContact && !hasValidTrialContact) {
      toast.error("Vérifiez le format du téléphone ou de l’e-mail d’essai.");
      generationRequestKeyRef.current = null;
      return;
    }
    if (!accessStatus.data?.unlocked && !hasValidTrialContact) {
      toast.error("Déverrouillez l’application ou renseignez un téléphone/e-mail d’essai valide.");
      generationRequestKeyRef.current = null;
      return;
    }
    if (description.trim().length < 20) {
      toast.error("Ajoutez une description plus détaillée du projet.");
      generationRequestKeyRef.current = null;
      return;
    }
    try {
      const dataUrl = file ? await readFileAsDataUrl(file) : undefined;
      const geometryRows = geometryOverride ?? geometry;
      const geometryPayload = geometryRows.filter((row) => row.designation.trim()).map((row) => ({
        code: row.code.trim(), designation: row.designation.trim(), formula: row.formula, unit: row.unit.trim() || "u",
        ...(row.length.trim() ? { length: Number(row.length) } : {}), ...(row.width.trim() ? { width: Number(row.width) } : {}), ...(row.height.trim() ? { height: Number(row.height) } : {}),
        ...(row.openingArea.trim() ? { openingArea: Number(row.openingArea) } : {}), ...(row.quantity.trim() ? { quantity: Number(row.quantity) } : {}), ...(row.notes.trim() ? { notes: row.notes.trim() } : {}),
      }));
      const result = await generate.mutateAsync({
        idempotencyKey: requestKey,
        description: description.trim(),
        geometry: geometryPayload.length ? geometryPayload : undefined,
        clientPhone: clientPhone.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        trialPhone: trialPhone.trim() || undefined,
        trialEmail: trialEmail.trim() || undefined,
        trialConsent: trialConsent || undefined,
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
        setWorkbookPreviewTab("cover");
        return { url, filename: result.filename, lineCount: result.lineCount, preview: result.preview };
      });
      setPreviewGeometryDrafts(result.preview.geometry.map(toGeometryDraft));
      await accessStatus.refetch();
      trackOnboardingEvent("form_completed", 4);
      toast.success(`Classeur généré avec ${result.lineCount} poste${result.lineCount > 1 ? "s" : ""}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      if (generationRequestKeyRef.current === requestKey) generationRequestKeyRef.current = null;
    }
  };

  const applyPreviewGeometry = () => {
    if (!previewGeometryDrafts.length) {
      toast.error("Aucune dimension géométrique à modifier.");
      return;
    }
    const hasInvalidValue = previewGeometryDrafts.some((row) => [row.length, row.width, row.height, row.openingArea, row.quantity].some((value) => value.trim() && (!Number.isFinite(Number(value)) || Number(value) < 0)));
    if (hasInvalidValue) {
      toast.error("Chaque dimension doit être un nombre positif ou nul.");
      return;
    }
    setPendingGeometryRegeneration(previewGeometryDrafts);
  };

  const confirmGeometryRegeneration = () => {
    if (!pendingGeometryRegeneration) return;
    setGeometry(pendingGeometryRegeneration);
    setPendingGeometryRegeneration(null);
    toast.info("Régénération confirmée : un droit de génération sera consommé.");
    void handleGenerate(pendingGeometryRegeneration);
  };

  const handleExportGeometryPdf = async () => {
    if (!download?.preview.geometry.length) {
      toast.error("Aucun contrôle géométrique disponible à exporter.");
      return;
    }
    const { exportGeometryReportPdf } = await import("@/lib/geometryPdf");
    const blob = await exportGeometryReportPdf({ projectTitle: download.preview.projectTitle, documentDate, dimensions: download.preview.geometry, checks: download.preview.geometryChecks });
    if (geometryPdfUrl) URL.revokeObjectURL(geometryPdfUrl);
    const url = URL.createObjectURL(blob);
    setGeometryPdfUrl(url);
    setGeometryPdfFilename(`${download.filename.replace(/\\.xlsx$/i, "")}-controle-geometrique.pdf`);
    setGeometryPdfOpen(true);
  };

  const handlePrintResultsPdf = () => {
    if (!resultsPdfUrl) {
      toast.error("Générez d’abord l’aperçu PDF des résultats.");
      return;
    }
    const printWindow = window.open(resultsPdfUrl, "_blank", "noopener,noreferrer");
    if (!printWindow) {
      toast.error("Le navigateur a bloqué la fenêtre d’impression. Autorisez les fenêtres contextuelles puis réessayez.");
      return;
    }
    printWindow.addEventListener("load", () => printWindow.print(), { once: true });
  };

  const handleExportResultsPdf = async () => {
    if (!download) {
      toast.error("Générez d’abord un classeur avant d’exporter ses résultats en PDF.");
      return;
    }
    setResultsPdfPending(true);
    try {
      const { exportResultsPdf } = await import("@/lib/resultsPdf");
      const blob = await exportResultsPdf({ preview: download.preview, documentDate, filename: download.filename, signatureImageDataUrl: signatureImage?.dataUrl, stampImageDataUrl: stampImage?.dataUrl, logoImageDataUrl: logoImage?.dataUrl, accentColor: pdfAccentColor, darkColor: pdfDarkColor, detail: pdfDetail, customFooter: pdfFooter });
      if (resultsPdfUrl) URL.revokeObjectURL(resultsPdfUrl);
      const url = URL.createObjectURL(blob);
      setResultsPdfUrl(url);
      setResultsPdfFilename(`${download.filename.replace(/\\.xlsx$/i, "")}-resultats.pdf`);
      setResultsPdfOpen(true);
      toast.success("Aperçu PDF des résultats prêt.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Le PDF des résultats n’a pas pu être généré.");
    } finally {
      setResultsPdfPending(false);
    }
  };

  const visibleMeasures = download?.preview.measures.filter((measure) => {
    const query = previewQuery.trim().toLocaleLowerCase("fr-FR");
    if (!query) return true;
    return [measure.code, measure.designation, measure.unit, measure.notes || ""].some((value) => value.toLocaleLowerCase("fr-FR").includes(query));
  }) ?? [];
  const previewTotal = visibleMeasures.reduce((total, measure) => total + measure.quantity * (measure.factor ?? 1) * (measure.unitPrice ?? 0), 0);
  const estimatedTotalSeconds = progressStage === 0 ? 12 : progressStage === 1 ? 8 : 5;
  const estimatedRemainingSeconds = Math.max(1, estimatedTotalSeconds - generationElapsedSeconds);
  const progressPercent = Math.min(92, Math.max(12, Math.round(((progressStage + 1) / 3) * 100)));
  const visibleGeometry = download?.preview.geometry.filter((dimension) => {
    const check = download.preview.geometryChecks.find((item) => item.code === dimension.code);
    const query = geometryQuery.trim().toLocaleLowerCase("fr-FR");
    const matchesQuery = !query || [dimension.code, dimension.designation, dimension.formula].some((value) => value.toLocaleLowerCase("fr-FR").includes(query));
    const matchesStatus = geometryStatusFilter === "ALL" || check?.status === geometryStatusFilter;
    return matchesQuery && matchesStatus;
  }).sort((left, right) => {
    const leftCheck = download?.preview.geometryChecks.find((item) => item.code === left.code);
    const rightCheck = download?.preview.geometryChecks.find((item) => item.code === right.code);
    const leftValue = geometrySort === "status" ? leftCheck?.status || "À VÉRIFIER" : geometrySort === "designation" ? left.designation : geometrySort === "formula" ? left.formula : left.code;
    const rightValue = geometrySort === "status" ? rightCheck?.status || "À VÉRIFIER" : geometrySort === "designation" ? right.designation : geometrySort === "formula" ? right.formula : right.code;
    return leftValue.localeCompare(rightValue, "fr-FR") * (geometrySortDirection === "asc" ? 1 : -1);
  }) ?? [];
  const hourlyRemaining = accessStatus.data?.hourlyRemaining;
  const hourlyLimit = accessStatus.data?.hourlyLimit ?? 5;
  const hasTrialContact = Boolean(trialPhone.trim() || trialEmail.trim());
  const validTrialPhone = isValidTrialPhone(trialPhone);
  const validTrialEmail = isValidTrialEmail(trialEmail);
  const hasValidTrialContact = validTrialPhone || validTrialEmail;
  const checklistItems = [
    { id: "access", label: accessStatus.data?.unlocked ? "Accès déverrouillé" : "Contact d’essai valide", complete: Boolean(accessStatus.data?.unlocked || hasValidTrialContact) },
    { id: "description", label: "Description détaillée du projet", complete: description.trim().length >= 20 },
    { id: "file-or-description", label: "Base de travail fournie", complete: Boolean(file || description.trim().length >= 20) },
    { id: "consent", label: "Consentement d’essai", complete: Boolean(accessStatus.data?.unlocked || trialConsent) },
  ];
  const checklistComplete = checklistItems.every((item) => item.complete);

  const clearSavedDraft = () => {
    window.localStorage.removeItem(FORM_DRAFT_STORAGE_KEY);
    setDraftRestored(false);
    setDraftSaveNotice(false);
    setDescription("");
    setClientPhone("");
    setClientEmail("");
    setTrialPhone("");
    setTrialEmail("");
    setTrialConsent(false);
    setVerifiedBy("");
    setValidationDate("");
    setGeometry([]);
    setFile(null);
    setFileError("");
    setBrandImageError("");
    setDownload(null);
    setPreviewGeometryDrafts([]);
    setPreviewQuery("");
    setWorkbookPreviewTab("cover");
    setOnboardingStep(1);
    setExampleWarningOpen(false);
    setResetFormOpen(false);
    toast.success("Formulaire et brouillon local réinitialisés.");
  };

  const applyExampleDescription = () => {
    setDescription(EXAMPLE_PROJECT_DESCRIPTION);
    setOnboardingStep(2);
    setDraftRestored(false);
    setExampleWarningOpen(false);
    window.localStorage.removeItem(FORM_DRAFT_STORAGE_KEY);
    trackOnboardingEvent("example_started", 2);
    window.history.replaceState({}, "", window.location.pathname);
  };

  const cancelExampleDescription = () => {
    setExampleWarningOpen(false);
    window.history.replaceState({}, "", window.location.pathname);
  };

  const useExampleDescription = () => {
    setDescription(EXAMPLE_PROJECT_DESCRIPTION);
    setHelpOpen(false);
    trackOnboardingEvent("help_example_used", onboardingStep);
  };

  return (
    <main className={`internal-page internal-page--${theme} min-h-screen overflow-hidden bg-[#0F1613] text-[#EDEAE2]`}><div className="internal-theme-toolbar"><ThemeToggle /></div>
      <div className="technical-grid pointer-events-none fixed inset-0 opacity-60" />
      <div className="relative mx-auto min-h-screen w-full min-w-0 max-w-[1480px] overflow-x-hidden px-5 py-5 sm:px-8 lg:px-12">
        <header className="plan-cartouche mb-14 grid w-full min-w-0 gap-5 lg:grid-cols-[1.35fr_0.9fr_0.55fr]"><div className="flex justify-end px-4 pt-3 lg:col-span-3 lg:order-first"><a href="/" className="inline-flex items-center border border-[#3A4A42] px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-[#C9A15A] hover:border-[#C9A15A] hover:text-[#EDEAE2]">← Retour à l’accueil</a></div>
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
        <ClientSubscriptionPanel />
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
              {!accessStatus.data?.unlocked && <div className="access-panel mb-6" role="region" aria-labelledby="access-title"><div className="mb-4 flex items-start justify-between gap-4"><div><p className="repere">PROTECTION <span>—</span> ACCÈS REQUIS</p><h3 id="access-title" className="mt-2 font-serif text-xl text-[#EDEAE2]">Déverrouiller l’étude</h3></div><span className="font-mono text-[10px] uppercase text-[#C9A15A]">5 / H · 50 / J</span></div><p className="mb-4 text-xs leading-5 text-[#AEB7B0]">Un code d’accès est nécessaire avant toute génération payante. Limites actives : 5 générations par heure et 50 pour toute l’application par jour.</p><form onSubmit={handleVerifyAccess} className="flex flex-col gap-3 sm:flex-row"><label htmlFor="access-code" className="sr-only">Code d’accès partagé</label><input id="access-code" type="password" autoComplete="off" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="Code d’accès partagé" className="technical-input h-11 min-w-0 flex-1 px-3 text-sm" required /><Button type="submit" disabled={verifyAccess.isPending || !accessCode} className="technical-button h-11 rounded-none sm:w-40">{verifyAccess.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Vérification…</> : "Déverrouiller"}</Button></form>{verifyAccess.error && <p className="mt-3 text-xs font-medium text-[#d98472]" role="alert">{verifyAccess.error.message}</p>}<div className="my-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-[#607068]"><span className="h-px flex-1 bg-[#3A4A42]" />ou accès client<span className="h-px flex-1 bg-[#3A4A42]" /></div><form onSubmit={handleVerifyClientAccess} className="flex flex-col gap-3 sm:flex-row"><label htmlFor="client-access-code" className="sr-only">Code client</label><input id="client-access-code" type="password" autoComplete="off" value={clientAccessCode} onChange={(event) => setClientAccessCode(event.target.value)} placeholder="Code client transmis" className="technical-input h-11 min-w-0 flex-1 px-3 text-sm" required /><Button type="submit" disabled={verifyClientAccess.isPending || !clientAccessCode} className="technical-button h-11 rounded-none sm:w-40">{verifyClientAccess.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Vérification…</> : "Activer mon accès"}</Button></form>{verifyClientAccess.error && <p className="mt-3 text-xs font-medium text-[#d98472]" role="alert">{verifyClientAccess.error.message}</p>}<div className="my-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-[#607068]"><span className="h-px flex-1 bg-[#3A4A42]" />ou essai gratuit<span className="h-px flex-1 bg-[#3A4A42]" /></div><p className="mb-3 text-xs leading-5 text-[#AEB7B0]">Une seule génération gratuite par téléphone ou e-mail. Renseignez au moins un contact pour commencer.</p><div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor="trial-phone" className="field-label">Téléphone d’essai <span>REQUIS SI PAS D’E-MAIL</span></label><input id="trial-phone" type="tel" autoComplete="tel" value={trialPhone} onChange={(event) => setTrialPhone(event.target.value)} placeholder="+225 …" aria-invalid={Boolean(trialPhone) && !validTrialPhone} className={`technical-input h-11 w-full min-w-0 px-3 text-sm ${trialPhone && !validTrialPhone ? "border-[#9d554b]" : trialPhone && validTrialPhone ? "border-[#7C9A76]" : ""}`} />{trialPhone && <p className={`mt-1 text-[11px] ${validTrialPhone ? "text-[#7C9A76]" : "text-[#d98472]"}`} role="status">{validTrialPhone ? "Format reconnu." : "Format attendu : 10 chiffres ivoiriens ou +225 suivi du numéro."}</p>}</div><div><label htmlFor="trial-email" className="field-label">E-mail d’essai <span>REQUIS SI PAS DE TÉL.</span></label><input id="trial-email" type="email" autoComplete="email" value={trialEmail} onChange={(event) => setTrialEmail(event.target.value)} placeholder="vous@exemple.ci" aria-invalid={Boolean(trialEmail) && !validTrialEmail} className={`technical-input h-11 w-full min-w-0 px-3 text-sm ${trialEmail && !validTrialEmail ? "border-[#9d554b]" : trialEmail && validTrialEmail ? "border-[#7C9A76]" : ""}`} />{trialEmail && <p className={`mt-1 text-[11px] ${validTrialEmail ? "text-[#7C9A76]" : "text-[#d98472]"}`} role="status">{validTrialEmail ? "Format reconnu." : "Format attendu : nom@domaine.ci"}</p>}</div><label className="mt-4 flex items-start gap-3 text-xs leading-5 text-[#AEB7B0]"><input type="checkbox" checked={trialConsent} onChange={(event) => setTrialConsent(event.target.checked)} className="mt-1 accent-[#C9A15A]" />J’accepte que mes coordonnées soient conservées pour traiter l’essai et me recontacter au sujet du service. Je peux me désinscrire depuis l’accueil.</label></div></div>}
              {accessStatus.data?.unlocked && accessStatus.data.accessType === "client" && accessStatus.data.monthlyRemaining !== undefined && accessStatus.data.monthlyQuota !== undefined && <MonthlyQuotaProgress remaining={accessStatus.data.monthlyRemaining} limit={accessStatus.data.monthlyQuota} />}{accessStatus.data?.unlocked && hourlyRemaining !== undefined && <HourlyQuotaIndicator remaining={hourlyRemaining} limit={hourlyLimit} />}
              {accessStatus.data?.dailyTotal !== undefined && <div className="mb-6 flex items-center justify-between gap-3 border border-[#3A4A42] bg-[#16201C] px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]"><span>Compteur global du jour</span><strong className="text-[#C9A15A]">{accessStatus.data.dailyTotal} / {accessStatus.data.dailyLimit}</strong></div>}
              <GuidedOnboarding step={onboardingStep} onStepChange={(nextStep) => { setOnboardingStep(nextStep); trackOnboardingEvent("step_viewed", nextStep); }} />
              <section className="mb-5 border border-[#C9A15A]/70 bg-[#16201C] p-4" aria-labelledby="generation-checklist-title" data-generation-checklist>
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="repere">REP. 01B <span>—</span> CONTRÔLE AVANT LANCEMENT</p><h3 id="generation-checklist-title" className="mt-2 font-serif text-xl text-[#EDEAE2]">Checklist de génération</h3></div><span className={`font-mono text-[10px] uppercase tracking-wider ${checklistComplete ? "text-[#7C9A76]" : "text-[#C9A15A]"}`}>{checklistItems.filter((item) => item.complete).length}/{checklistItems.length} validés</span></div>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="Vérifications requises avant génération">{checklistItems.map((item) => <li key={item.id} className={`flex items-center gap-2 border px-3 py-2 text-xs ${item.complete ? "border-[#7C9A76]/60 text-[#7C9A76]" : "border-[#3A4A42] text-[#AEB7B0]"}`}><span aria-hidden="true" className={`inline-flex h-4 w-4 items-center justify-center border font-mono text-[10px] ${item.complete ? "border-[#7C9A76]" : "border-[#C9A15A]"}`}>{item.complete ? "✓" : "·"}</span>{item.label}</li>)}</ul>
                {!checklistComplete && <p className="mt-3 border-l-2 border-[#C9A15A] pl-3 text-xs text-[#C9A15A]" role="status">Complétez les éléments signalés avant de générer le fichier.</p>}
                <button type="button" onClick={() => setResetFormOpen(true)} className="mt-4 border border-[#9d554b] px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-[#d98472]">Réinitialiser et recommencer</button>
              </section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><label htmlFor="description" className="field-label">Description du projet <span>REQUIS</span></label><div className="flex items-center gap-2">{draftRestored && <span className="font-mono text-[10px] uppercase tracking-wide text-[#7C9A76]" role="status">Brouillon restauré</span>}<button type="button" onClick={() => setHelpOpen((open) => !open)} aria-expanded={helpOpen} aria-controls="description-help" className="border border-[#C9A15A] px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-[#C9A15A]">Aide — exemple</button>{draftRestored && <button type="button" onClick={() => setResetFormOpen(true)} className="border border-[#3A4A42] px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-[#AEB7B0]">Effacer le brouillon</button>}<button type="button" onClick={() => setResetFormOpen(true)} className="border border-[#9d554b] px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-[#d98472]">Réinitialiser le formulaire</button></div></div>
              {draftSaveNotice && <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#7C9A76]" role="status" aria-live="polite">Brouillon sauvegardé automatiquement</p>}
              {helpOpen && <aside id="description-help" className="mb-3 border border-[#C9A15A]/70 bg-[#16201C] p-4 text-xs leading-5 text-[#AEB7B0]" role="note"><p className="font-mono text-[10px] uppercase tracking-wider text-[#C9A15A]">Exemple de description bien remplie</p><p className="mt-2">{EXAMPLE_PROJECT_DESCRIPTION}</p><button type="button" onClick={useExampleDescription} className="mt-3 border border-[#7C9A76] px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-[#7C9A76]">Utiliser cet exemple</button></aside>}
              <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex. Construction d’une villa R+1 de 180 m² à Abidjan, avec fondations en béton armé, murs en agglos..." className="technical-input min-h-40 resize-none" />
              <section className="mt-5 border border-[#3A4A42] bg-[#16201C] p-4" aria-labelledby="geometry-title">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="repere">REP. 01A <span>—</span> DIMENSIONS EXPLICITES</p><h3 id="geometry-title" className="mt-2 font-serif text-xl text-[#EDEAE2]">Contrôle géométrique</h3><p className="mt-1 max-w-xl text-xs leading-5 text-[#AEB7B0]">Saisissez les dimensions connues. Elles seront comparées indépendamment aux quantités générées, sans correction silencieuse.</p></div><button type="button" onClick={addGeometry} className="border border-[#C9A15A] px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-[#C9A15A]">+ Ajouter une ligne</button></div>
                {geometry.length === 0 ? <p className="mt-4 border-l-2 border-[#3A4A42] pl-3 text-xs text-[#87938B]">Aucune dimension structurée saisie. La description et le plan restent utilisés.</p> : <div className="mt-4 space-y-4">{geometry.map((row, index) => <div key={`${row.code}-${index}`} className="border border-[#3A4A42] p-3"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div><label className="field-label" htmlFor={`geometry-code-${index}`}>Code</label><input id={`geometry-code-${index}`} value={row.code} onChange={(event) => updateGeometry(index, { code: event.target.value })} className="technical-input h-9 w-full px-2 text-xs" /></div><div className="sm:col-span-1 lg:col-span-2"><label className="field-label" htmlFor={`geometry-designation-${index}`}>Poste correspondant</label><input id={`geometry-designation-${index}`} value={row.designation} onChange={(event) => updateGeometry(index, { designation: event.target.value })} placeholder="Ex. Surface de dalle" className="technical-input h-9 w-full px-2 text-xs" /></div><div><label className="field-label" htmlFor={`geometry-formula-${index}`}>Formule</label><select id={`geometry-formula-${index}`} value={row.formula} onChange={(event) => updateGeometry(index, { formula: event.target.value as GeometryDraft["formula"] })} className="technical-input h-9 w-full px-2 text-xs"><option value="linear">Linéaire</option><option value="surface">Surface</option><option value="volume">Volume</option><option value="count">Comptage</option></select></div><div><label className="field-label" htmlFor={`geometry-unit-${index}`}>Unité</label><input id={`geometry-unit-${index}`} value={row.unit} onChange={(event) => updateGeometry(index, { unit: event.target.value })} className="technical-input h-9 w-full px-2 text-xs" /></div><div><label className="field-label" htmlFor={`geometry-length-${index}`}>Longueur</label><input id={`geometry-length-${index}`} type="number" min="0" step="any" value={row.length} onChange={(event) => updateGeometry(index, { length: event.target.value })} className="technical-input h-9 w-full px-2 text-xs" /></div><div><label className="field-label" htmlFor={`geometry-width-${index}`}>Largeur</label><input id={`geometry-width-${index}`} type="number" min="0" step="any" value={row.width} onChange={(event) => updateGeometry(index, { width: event.target.value })} className="technical-input h-9 w-full px-2 text-xs" /></div><div><label className="field-label" htmlFor={`geometry-height-${index}`}>Hauteur</label><input id={`geometry-height-${index}`} type="number" min="0" step="any" value={row.height} onChange={(event) => updateGeometry(index, { height: event.target.value })} className="technical-input h-9 w-full px-2 text-xs" /></div><div><label className="field-label" htmlFor={`geometry-opening-${index}`}>Ouvertures</label><input id={`geometry-opening-${index}`} type="number" min="0" step="any" value={row.openingArea} onChange={(event) => updateGeometry(index, { openingArea: event.target.value })} className="technical-input h-9 w-full px-2 text-xs" /></div><div><label className="field-label" htmlFor={`geometry-quantity-${index}`}>Répétitions</label><input id={`geometry-quantity-${index}`} type="number" min="0" step="any" value={row.quantity} onChange={(event) => updateGeometry(index, { quantity: event.target.value })} className="technical-input h-9 w-full px-2 text-xs" /></div><div className="sm:col-span-2 lg:col-span-2"><label className="field-label" htmlFor={`geometry-notes-${index}`}>Note / source</label><input id={`geometry-notes-${index}`} value={row.notes} onChange={(event) => updateGeometry(index, { notes: event.target.value })} placeholder="Plan, façade, niveau…" className="technical-input h-9 w-full px-2 text-xs" /></div><div className="flex items-end"><button type="button" onClick={() => removeGeometry(index)} className="h-9 border border-[#9d554b] px-3 font-mono text-[10px] uppercase tracking-wide text-[#d98472]">Retirer</button></div></div></div>)}</div>}
              </section>
              <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
                <div className="min-w-0"><label htmlFor="client-phone" className="field-label">Téléphone client <span>OPTIONNEL</span></label><input id="client-phone" type="tel" autoComplete="tel" value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} placeholder="À compléter" className="technical-input h-11 w-full min-w-0 px-3 text-sm" /></div>
                <div className="min-w-0"><label htmlFor="client-email" className="field-label">E-mail client <span>OPTIONNEL</span></label><input id="client-email" type="email" autoComplete="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} placeholder="À compléter" className="technical-input h-11 w-full min-w-0 px-3 text-sm" /></div>
                <div className="min-w-0"><label htmlFor="verified-by" className="field-label">Vérifié par <span>OPTIONNEL</span></label><input id="verified-by" type="text" autoComplete="name" value={verifiedBy} onChange={(event) => setVerifiedBy(event.target.value)} placeholder="À compléter" className="technical-input h-11 w-full min-w-0 px-3 text-sm" /></div>
                <div className="min-w-0"><label htmlFor="validation-date" className="field-label">Date de validation <span>OPTIONNEL</span></label><input id="validation-date" type="text" inputMode="numeric" value={validationDate} onChange={(event) => setValidationDate(event.target.value)} placeholder="JJ/MM/AAAA" className="technical-input h-11 w-full min-w-0 px-3 text-sm" /></div>
              </div>
              <div className="mt-5 border border-[#3A4A42] bg-[#16201C] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="repere">REP. 01C <span>—</span> IDENTITÉ DU PDF</p><h3 className="mt-2 font-serif text-xl text-[#EDEAE2]">Personnaliser le document PDF</h3><p className="mt-1 text-xs leading-5 text-[#AEB7B0]">Le logo et les couleurs sont conservés localement dans ce navigateur. Les valeurs par défaut restent disponibles à tout moment.</p></div><span className="font-mono text-[10px] uppercase tracking-wide text-[#C9A15A]">PDF</span></div>
                <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                  <div className="min-w-0"><label htmlFor="pdf-logo-image" className="field-label">Logo du document <span>OPTIONNEL</span></label><input id="pdf-logo-image" type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(event) => void onBrandImageChange("logo", event.target.files?.[0])} /><div className="flex min-w-0 gap-2"><button type="button" onClick={() => document.getElementById("pdf-logo-image")?.click()} className="upload-zone min-w-0 flex-1 justify-between"><span className="min-w-0 text-left text-sm text-[#AEB7B0]"><span className="block truncate">{logoImage?.name || "Importer un logo"}</span>{logoImage && <span className="mt-1 block text-[9px] uppercase tracking-wide text-[#7C9A76]">Enregistré localement</span>}</span><UploadCloud className="h-4 w-4 shrink-0 text-[#C9A15A]" /></button>{logoImage && <button type="button" onClick={() => clearBrandImageRequest("logo")} className="shrink-0 border border-[#3A4A42] px-2 font-mono text-[9px] uppercase tracking-wide text-[#C9A15A]" aria-label="Effacer le logo mémorisé">Effacer</button>}</div></div>
                  <div className="min-w-0"><label htmlFor="pdf-detail" className="field-label">Niveau d’export <span>REQUIS</span></label><select id="pdf-detail" value={pdfDetail} onChange={(event) => setPdfDetail(event.target.value as "summary" | "detailed")} className="technical-input h-11 w-full px-3 text-sm"><option value="summary">Résumé — postes principaux</option><option value="detailed">Détaillé — tous les postes</option></select></div>
                  <label className="flex min-w-0 items-center justify-between gap-3 border border-[#3A4A42] px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-[#AEB7B0]">Couleur principale<input aria-label="Couleur principale du PDF" type="color" value={pdfAccentColor} onChange={(event) => setPdfAccentColor(event.target.value)} className="h-8 w-12 cursor-pointer border-0 bg-transparent p-0" /></label>
                  <label className="flex min-w-0 items-center justify-between gap-3 border border-[#3A4A42] px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-[#AEB7B0]">Fond du bandeau<input aria-label="Fond du bandeau PDF" type="color" value={pdfDarkColor} onChange={(event) => setPdfDarkColor(event.target.value)} className="h-8 w-12 cursor-pointer border-0 bg-transparent p-0" /></label>
                  <div className="sm:col-span-2"><label htmlFor="pdf-footer" className="field-label">Pied de page personnalisé <span>OPTIONNEL</span></label><input id="pdf-footer" type="text" maxLength={130} value={pdfFooter} onChange={(event) => setPdfFooter(event.target.value)} placeholder="Ex. MÉTREXPERT IA PRO · Document de travail" className="technical-input h-11 w-full px-3 text-sm" /></div>
                  <button type="button" onClick={() => { setPdfAccentColor("#C9A15A"); setPdfDarkColor("#0F1613"); }} className="justify-self-start border border-[#C9A15A] px-3 py-2 font-mono text-[9px] uppercase tracking-wide text-[#C9A15A]">Réinitialiser palette MÉTREXPERT</button>
                </div>
              </div>
              <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
                <div className="min-w-0"><label htmlFor="signature-image" className="field-label">Image de signature <span>OPTIONNEL</span></label><input ref={signatureInputRef} id="signature-image" type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(event) => void onBrandImageChange("signature", event.target.files?.[0])} /><div className="flex min-w-0 gap-2"><button type="button" onClick={() => signatureInputRef.current?.click()} className="upload-zone min-w-0 flex-1 justify-between"><span className="min-w-0 text-left text-sm text-[#AEB7B0]"><span className="block truncate">{signatureImage?.name || "Importer une image"}</span>{signatureImage && <span className="mt-1 block text-[9px] uppercase tracking-wide text-[#7C9A76]">Enregistrée localement</span>}</span><UploadCloud className="h-4 w-4 shrink-0 text-[#C9A15A]" /></button>{signatureImage && <button type="button" onClick={() => clearBrandImageRequest("signature")} className="shrink-0 border border-[#3A4A42] px-2 font-mono text-[9px] uppercase tracking-wide text-[#C9A15A] hover:border-[#C9A15A]" aria-label="Effacer l’image de signature mémorisée">Effacer</button>}</div></div>
                <div className="min-w-0"><label htmlFor="stamp-image" className="field-label">Image de tampon <span>OPTIONNEL</span></label><input ref={stampInputRef} id="stamp-image" type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(event) => void onBrandImageChange("stamp", event.target.files?.[0])} /><div className="flex min-w-0 gap-2"><button type="button" onClick={() => stampInputRef.current?.click()} className="upload-zone min-w-0 flex-1 justify-between"><span className="min-w-0 text-left text-sm text-[#AEB7B0]"><span className="block truncate">{stampImage?.name || "Importer une image"}</span>{stampImage && <span className="mt-1 block text-[9px] uppercase tracking-wide text-[#7C9A76]">Enregistrée localement</span>}</span><UploadCloud className="h-4 w-4 shrink-0 text-[#C9A15A]" /></button>{stampImage && <button type="button" onClick={() => clearBrandImageRequest("stamp")} className="shrink-0 border border-[#3A4A42] px-2 font-mono text-[9px] uppercase tracking-wide text-[#C9A15A] hover:border-[#C9A15A]" aria-label="Effacer l’image de tampon mémorisée">Effacer</button>}</div></div>
              </div>
              {brandImageError && <p className="mt-2 flex items-center gap-2 text-xs font-medium text-[#d98472]" role="alert"><ImageIcon className="h-3.5 w-3.5" />{brandImageError}</p>}
              {(signatureImage || stampImage || logoImage) && <button type="button" onClick={() => setPendingRemoval("all")} className="mt-3 inline-flex items-center gap-2 border border-[#3A4A42] px-3 py-2 font-mono text-[9px] uppercase tracking-wide text-[#C9A15A] hover:border-[#C9A15A]" aria-label="Effacer toutes les données locales de signature et de tampon"><Trash2 className="h-3.5 w-3.5" />Effacer toutes les données locales</button>}
              <Dialog open={exampleWarningOpen} onOpenChange={(open) => { if (!open) cancelExampleDescription(); }}>
                <DialogContent className="border-[#C9A15A] bg-[#16201C] text-[#EDEAE2]">
                  <DialogHeader><DialogTitle className="font-serif text-2xl text-[#EDEAE2]">Un brouillon est déjà présent</DialogTitle><DialogDescription className="text-[#AEB7B0]">Charger l’exemple remplacera le brouillon sauvegardé dans ce navigateur. Vous pouvez annuler pour continuer votre saisie actuelle.</DialogDescription></DialogHeader>
                  <DialogFooter><button type="button" onClick={cancelExampleDescription} className="border border-[#3A4A42] px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#AEB7B0]">Conserver mon brouillon</button><button type="button" onClick={applyExampleDescription} className="bg-[#C9A15A] px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#0F1613]">Charger l’exemple</button></DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={resetFormOpen} onOpenChange={setResetFormOpen}>
                <DialogContent className="border-[#9d554b] bg-[#16201C] text-[#EDEAE2]">
                  <DialogHeader><DialogTitle className="font-serif text-2xl text-[#EDEAE2]">Réinitialiser le formulaire ?</DialogTitle><DialogDescription className="text-[#AEB7B0]">Tous les champs du formulaire, les dimensions saisies, le fichier sélectionné, l’aperçu et le brouillon local seront effacés. Les images de signature et de tampon mémorisées séparément ne seront pas supprimées.</DialogDescription></DialogHeader>
                  <DialogFooter><button type="button" onClick={() => setResetFormOpen(false)} className="border border-[#3A4A42] px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#AEB7B0]">Annuler</button><button type="button" onClick={clearSavedDraft} className="bg-[#9d554b] px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#F4F0E8]">Réinitialiser</button></DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={pendingRemoval !== null} onOpenChange={(open) => { if (!open) setPendingRemoval(null); }}>
                <DialogContent className="border-[#C9A15A] bg-[#16201C] text-[#EDEAE2]">
                  <DialogHeader><DialogTitle className="font-serif text-2xl text-[#EDEAE2]">Confirmer la suppression</DialogTitle><DialogDescription className="text-[#AEB7B0]">{pendingRemoval === "all" ? "Les images mémorisées de signature et de tampon seront supprimées de ce navigateur." : `L’image de ${pendingRemoval === "signature" ? "signature" : pendingRemoval === "stamp" ? "tampon" : "logo"} sera supprimée de ce navigateur.`}</DialogDescription></DialogHeader>
                  <DialogFooter><button type="button" onClick={() => setPendingRemoval(null)} className="border border-[#3A4A42] px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#AEB7B0]">Annuler</button><button type="button" onClick={confirmPendingRemoval} className="bg-[#C9A15A] px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#0F1613]">Confirmer la suppression</button></DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={pendingGeometryRegeneration !== null} onOpenChange={(open) => { if (!open) setPendingGeometryRegeneration(null); }}>
                <DialogContent className="border-[#C9A15A] bg-[#16201C] text-[#EDEAE2]">
                  <DialogHeader><DialogTitle className="font-serif text-2xl text-[#EDEAE2]">Confirmer la régénération</DialogTitle><DialogDescription className="text-[#AEB7B0]">Cette action relancera l’analyse et consommera un droit de génération. Les dimensions modifiées seront transmises au contrôle indépendant et au nouveau classeur.</DialogDescription></DialogHeader>
                  <DialogFooter><button type="button" onClick={() => setPendingGeometryRegeneration(null)} className="border border-[#3A4A42] px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#AEB7B0]">Annuler</button><button type="button" onClick={confirmGeometryRegeneration} className="bg-[#C9A15A] px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#0F1613]">Confirmer et régénérer</button></DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={geometryPdfOpen} onOpenChange={setGeometryPdfOpen}>
                <DialogContent className="flex h-[90vh] max-w-5xl flex-col border-[#C9A15A] bg-[#16201C] text-[#EDEAE2]">
                  <DialogHeader><DialogTitle className="font-serif text-2xl text-[#EDEAE2]">Aperçu du rapport PDF</DialogTitle><DialogDescription className="text-[#AEB7B0]">Vérifiez le rapport avant de le télécharger ou de le partager.</DialogDescription></DialogHeader>
                  <div className="min-h-0 flex-1 border border-[#3A4A42] bg-[#EDEAE2]">{geometryPdfUrl ? <iframe title="Aperçu du rapport de contrôle géométrique" src={geometryPdfUrl} className="h-full min-h-[55vh] w-full" /> : <p className="p-6 text-[#0F1613]">Aperçu indisponible.</p>}</div>
                  <DialogFooter><button type="button" onClick={() => setGeometryPdfOpen(false)} className="border border-[#3A4A42] px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#AEB7B0]">Fermer</button>{geometryPdfUrl && <a href={geometryPdfUrl} download={geometryPdfFilename} className="bg-[#C9A15A] px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#0F1613]">Télécharger le PDF</a>}</DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={resultsPdfOpen} onOpenChange={setResultsPdfOpen}>
                <DialogContent className="flex h-[90vh] max-w-5xl flex-col border-[#C9A15A] bg-[#16201C] text-[#EDEAE2]">
                  <DialogHeader><DialogTitle className="font-serif text-2xl text-[#EDEAE2]">Aperçu PDF des résultats</DialogTitle><DialogDescription className="text-[#AEB7B0]">Relisez le résumé, les montants et les postes avant de télécharger le rapport PDF.</DialogDescription></DialogHeader>
                  <div className="min-h-0 flex-1 border border-[#3A4A42] bg-[#EDEAE2]">{resultsPdfUrl ? <iframe title="Aperçu PDF des résultats du métré et DQE" src={resultsPdfUrl} className="h-full min-h-[55vh] w-full" /> : <p className="p-6 text-[#0F1613]">Aperçu indisponible.</p>}</div>
                  <DialogFooter><button type="button" onClick={() => setResultsPdfOpen(false)} className="border border-[#3A4A42] px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#AEB7B0]">Fermer</button>{resultsPdfUrl && <><button type="button" onClick={handlePrintResultsPdf} className="border border-[#C9A15A] px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#C9A15A]">Imprimer</button><a href={resultsPdfUrl} download={resultsPdfFilename} className="bg-[#C9A15A] px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-[#0F1613]"><FileDown className="mr-2 inline h-4 w-4" aria-hidden="true" />Télécharger le PDF</a></>}</DialogFooter>
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
              {generate.error && !download && <GenerationErrorAlert message={generate.error.message} />}
              {generate.isPending && <div className="progress-panel mt-5 animate-pulse motion-reduce:animate-none" role="status" aria-live="polite"><div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[#C9A15A]"><span>Traitement sécurisé en cours</span><span>Étape {progressStage + 1}/3</span></div><p className="mb-3 text-xs leading-5 text-[#EDEAE2]">{progressMessages[progressStage]}</p><div className="mb-3 h-2 overflow-hidden border border-[#3A4A42] bg-[#0F1613]" role="progressbar" aria-label="Progression indicative de la génération" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent} aria-valuetext={`${progressPercent}% — environ ${estimatedRemainingSeconds} seconde${estimatedRemainingSeconds > 1 ? "s" : ""} restante${estimatedRemainingSeconds > 1 ? "s" : ""}`}><div className="h-full bg-[#C9A15A] transition-[width] duration-500 ease-out motion-reduce:transition-none" style={{ width: `${progressPercent}%` }} /></div><p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-[#87938B]">Progression indicative : {progressPercent}% · environ {estimatedRemainingSeconds}s restantes</p><div className="grid grid-cols-3 gap-px bg-[#3A4A42]">{["Analyse", "Validation JSON", "Classeur"].map((label, index) => <span key={label} className={`px-2 py-2 text-center font-mono text-[10px] uppercase transition-colors duration-200 ${progressStage >= index ? "bg-[#7C9A76] text-[#0F1613]" : "bg-[#1C2822] text-[#87938B]"}`}>{progressStage > index ? "Terminé · " : progressStage === index ? "En cours · " : "À venir · "}{label}</span>)}</div></div>}
              <Button onClick={() => { if (!checklistComplete) { trackOnboardingEvent("generation_blocked_checklist", onboardingStep); toast.error("Complétez la checklist avant de générer le fichier."); return; } void handleGenerate(); }} disabled={generate.isPending} aria-busy={generate.isPending} data-loading={generate.isPending ? "true" : undefined} className="technical-button mt-6 h-12 w-full rounded-none">
                {generate.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> <span>Génération du classeur en cours…</span></> : <><FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden="true" /> <span>Générer mon métré & DQE</span></>}
              </Button>
              {generate.isPending && <div className="result-download mt-4" role="status" aria-live="polite"><span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-[#C9A15A]"><Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" /><span className="truncate">Le fichier est presque prêt — ne fermez pas cette page.</span></span><button type="button" className="download-button" disabled aria-busy="true">Génération…</button></div>}
              {download && !generate.isPending && <><div className="excel-compatibility-notice" role="note"><strong>Compatibilité Microsoft Excel Desktop.</strong> Format XLSX standard, formules natives et recalcul prévu à l’ouverture. Si Excel affiche un avertissement, utilisez « Activer la modification », puis relisez les hypothèses et contrôles.</div><div className="result-download mt-4" role="status" aria-live="polite"><span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-[#7C9A76]"><FileSpreadsheet className="h-4 w-4 shrink-0" /><span className="truncate">Classeur prêt — {download.filename} · {download.lineCount} postes</span></span><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => void handleExportResultsPdf()} disabled={resultsPdfPending} className="download-button border border-[#C9A15A] text-[#C9A15A]" aria-busy={resultsPdfPending}>{resultsPdfPending ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden="true" />Préparation PDF…</> : <><FileDown className="mr-2 inline h-4 w-4" aria-hidden="true" />Aperçu PDF</>}</button><a href={download.url} download={download.filename} className="download-button">Télécharger XLSX</a></div></div></>}
              <p className="mt-4 text-center font-mono text-[10px] leading-5 text-[#718078]">BASE DE TRAVAIL À CONTRÔLER PAR UN PROFESSIONNEL AVANT USAGE CONTRACTUEL.</p>
            </section>

              <section className="estimate-preview technical-panel p-0">
              <div className="panel-heading px-5 py-4 sm:px-7"><div><p className="repere">REP. 02 <span>—</span> {download ? "LIVRABLE GÉNÉRÉ" : "APERÇU DU LIVRABLE"}</p><h2 className="mt-2 font-serif text-2xl text-[#EDEAE2]">Tableau de métré</h2></div><span className="font-mono text-[10px] text-[#7C9A76]">{download ? `${download.lineCount} POSTES` : "EN ATTENTE"}</span></div>
              {generate.isPending ? <div className="px-5 py-14 text-center sm:px-7" role="status" aria-live="polite" data-preview-state="loading"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#C9A15A]" aria-hidden="true" /><p className="mt-4 font-serif text-xl text-[#EDEAE2]">Préparation de l’aperçu</p><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#87938B]">Les postes générés seront affichés ici dès que la validation JSON et le classeur seront prêts.</p></div> : generate.error ? <div className="px-5 py-14 text-center sm:px-7" role="alert" data-preview-state="error"><Alert className="mx-auto max-w-md border-[#9d554b] bg-[#271b18] text-left text-[#EDEAE2]"><AlertTitle>Aperçu indisponible</AlertTitle><AlertDescription>Le résultat n’a pas pu être chargé. Corrigez la saisie ou réessayez avant de télécharger un classeur.</AlertDescription></Alert></div> : download ? <><WorkbookPreview preview={download.preview} activeTab={workbookPreviewTab} onTabChange={setWorkbookPreviewTab} />
                <div className="flex flex-col gap-3 border-b border-[#3A4A42] px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-7">
                  <div><p className="font-mono text-[10px] uppercase tracking-wider text-[#C9A15A]">{download.preview.projectTitle}</p><p className="mt-1 max-w-2xl text-xs leading-5 text-[#AEB7B0]">{download.preview.summary}</p></div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-[#87938B]">Rechercher<input value={previewQuery} onChange={(event) => setPreviewQuery(event.target.value)} placeholder="Code ou désignation" className="technical-input mt-2 h-9 w-full min-w-0 px-3 text-xs sm:w-52" /></label>
                </div>
                <div className="overflow-x-auto"><table className="technical-table w-full min-w-[860px] border-collapse text-left"><caption className="sr-only">Aperçu interactif des postes générés dans le métré</caption><thead><tr><th scope="col">REPÈRE</th><th scope="col">DÉSIGNATION</th><th scope="col">UNITÉ</th><th scope="col">QUANTITÉ</th><th scope="col">PU ({download.preview.currency})</th><th scope="col">MONTANT</th><th scope="col">OBS.</th></tr></thead><tbody>{visibleMeasures.map((measure) => { const quantity = measure.quantity * (measure.factor ?? 1); const amount = quantity * (measure.unitPrice ?? 0); return <tr key={measure.code}><td>{measure.code}</td><td>{measure.designation}</td><td>{measure.unit}</td><td className="text-[#C9A15A]">{quantity.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}</td><td>{(measure.unitPrice ?? 0).toLocaleString("fr-FR")}</td><td className="font-semibold text-[#C9A15A]">{amount.toLocaleString("fr-FR")}</td><td>{measure.notes || "—"}</td></tr>; })}</tbody></table></div>
                <div className="dimension-line mx-5 my-4 sm:mx-7"><span>{visibleMeasures.length} POSTES AFFICHÉS</span><span>QUANTITÉS</span><span>MONTANT FILTRÉ : {previewTotal.toLocaleString("fr-FR")} {download.preview.currency}</span></div>
                {download.preview.geometry.length > 0 && <section className="mx-5 mb-5 border border-[#3A4A42] bg-[#16201C] p-4 sm:mx-7" aria-labelledby="geometry-preview-title"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="repere">REP. 02A <span>—</span> CONTRÔLE INDÉPENDANT</p><h3 id="geometry-preview-title" className="mt-2 font-serif text-xl text-[#EDEAE2]">Vérification géométrique</h3><p className="mt-1 text-xs leading-5 text-[#87938B]">Les quantités sont comparées aux dimensions explicites saisies, sans modification automatique du résultat.</p></div><span className="font-mono text-[10px] uppercase tracking-wide text-[#C9A15A]">Tolérance 1 %</span></div><div className="mt-4 grid gap-3 border border-[#3A4A42] bg-[#0F1613] p-3 sm:grid-cols-[1.4fr_0.8fr_0.8fr_auto]"><label className="font-mono text-[9px] uppercase tracking-wider text-[#87938B]">Rechercher<input value={geometryQuery} onChange={(event) => setGeometryQuery(event.target.value)} placeholder="Code, poste ou formule" className="technical-input mt-1 h-9 w-full px-2 text-xs" /></label><label className="font-mono text-[9px] uppercase tracking-wider text-[#87938B]">Statut<select value={geometryStatusFilter} onChange={(event) => setGeometryStatusFilter(event.target.value as typeof geometryStatusFilter)} className="technical-input mt-1 h-9 w-full px-2 text-xs"><option value="ALL">Tous</option><option value="OK">OK</option><option value="À VÉRIFIER">À vérifier</option><option value="BLOQUANT">Bloquant</option></select></label><label className="font-mono text-[9px] uppercase tracking-wider text-[#87938B]">Trier par<select value={geometrySort} onChange={(event) => setGeometrySort(event.target.value as typeof geometrySort)} className="technical-input mt-1 h-9 w-full px-2 text-xs"><option value="code">Code</option><option value="designation">Désignation</option><option value="formula">Formule</option><option value="status">Statut</option></select></label><button type="button" onClick={() => setGeometrySortDirection((direction) => direction === "asc" ? "desc" : "asc")} className="self-end border border-[#C9A15A] px-3 py-2 font-mono text-[10px] uppercase text-[#C9A15A]" aria-label={`Ordre ${geometrySortDirection === "asc" ? "croissant" : "décroissant"}`}>{geometrySortDirection === "asc" ? "A → Z" : "Z → A"}</button></div><p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[#87938B]">{visibleGeometry.length} / {download.preview.geometry.length} dimensions affichées</p><div className="mt-4 border border-[#3A4A42] bg-[#0F1613] p-3"><p className="font-mono text-[10px] uppercase tracking-wider text-[#C9A15A]">Modifier avant validation</p><p className="mt-1 text-xs leading-5 text-[#87938B]">Ajustez les dimensions ci-dessous, puis validez pour relancer une génération avec ces valeurs. Cette régénération consomme un droit.</p><div className="mt-3 grid gap-3">{previewGeometryDrafts.map((row, index) => <div key={row.code} className="grid gap-2 border-b border-[#3A4A42] pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[0.7fr_1.2fr_repeat(4,minmax(0,1fr))]"><span className="self-center font-mono text-xs text-[#C9A15A]">{row.code}</span><span className="self-center text-xs text-[#EDEAE2]">{row.designation || "Sans désignation"}</span>{(["length", "width", "height", "quantity"] as const).map((field) => <label key={field} className="font-mono text-[9px] uppercase tracking-wider text-[#87938B]">{field === "length" ? "Long." : field === "width" ? "Larg." : field === "height" ? "Haut." : "Qté"}<input aria-label={`${row.code} ${field}`} inputMode="decimal" value={row[field]} onChange={(event) => setPreviewGeometryDrafts((drafts) => drafts.map((draft, draftIndex) => draftIndex === index ? { ...draft, [field]: event.target.value } : draft))} className="technical-input mt-1 h-8 w-full px-2 text-xs" /></label>)}</div>)}</div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={applyPreviewGeometry} disabled={generate.isPending} className="technical-button h-10 flex-1 px-3 text-[10px] uppercase" aria-busy={generate.isPending}>{generate.isPending ? "Régénération…" : "Valider et régénérer"}</button><button type="button" onClick={() => void handleExportGeometryPdf()} disabled={generate.isPending} className="technical-button h-10 flex-1 border-[#7C9A76] px-3 text-[10px] uppercase">Exporter le contrôle PDF</button></div></div><div className="mt-4 overflow-x-auto"><table className="technical-table w-full min-w-[780px] border-collapse text-left"><caption className="sr-only">Contrôle géométrique des dimensions et quantités générées</caption><thead><tr><th scope="col">CODE</th><th scope="col">FORMULE</th><th scope="col">DIMENSIONS</th><th scope="col">ATTENDU</th><th scope="col">GÉNÉRÉ</th><th scope="col">STATUT</th></tr></thead><tbody>{visibleGeometry.map((dimension) => { const check = download.preview.geometryChecks.find((item) => item.code === dimension.code); const status = check?.status || "À VÉRIFIER"; const dimensionText = dimension.formula === "count" ? `${dimension.quantity ?? 1} ×` : `${dimension.length ?? "?"} × ${dimension.width ?? "?"}${dimension.height !== undefined ? ` × ${dimension.height}` : ""}${dimension.openingArea ? ` − ouv. ${dimension.openingArea}` : ""} × ${dimension.quantity ?? 1}`; return <tr key={dimension.code}><td>{dimension.code}</td><td>{dimension.formula}</td><td className="font-mono text-[#AEB7B0]">{dimensionText}</td><td className="font-mono text-[#C9A15A]">{check?.observed.match(/attendu=([^,]+)/)?.[1] || "À confirmer"}</td><td className="font-mono">{check?.observed.match(/généré=(.*)$/)?.[1] || "À confirmer"}</td><td><span className={`inline-flex border px-2 py-1 font-mono text-[10px] uppercase ${status === "OK" ? "border-[#7C9A76] text-[#7C9A76]" : status === "BLOQUANT" ? "border-[#9d554b] text-[#d98472]" : "border-[#C9A15A] text-[#C9A15A]"}`}>{status}</span></td></tr>; })}</tbody></table>{visibleGeometry.length === 0 && <p className="border-t border-[#3A4A42] px-3 py-5 text-center text-xs text-[#87938B]">Aucune dimension ne correspond aux filtres sélectionnés.</p>}</div><div className="mt-3 grid gap-2 text-xs text-[#AEB7B0]">{download.preview.geometryChecks.filter((check) => check.status !== "OK").map((check) => <p key={`${check.code}-${check.status}`} className={`border-l-2 pl-3 ${check.status === "BLOQUANT" ? "border-[#9d554b] text-[#d98472]" : "border-[#C9A15A] text-[#C9A15A]"}`}><strong>{check.code} — {check.status} :</strong> {check.recommendation}</p>)}</div></section>}
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
