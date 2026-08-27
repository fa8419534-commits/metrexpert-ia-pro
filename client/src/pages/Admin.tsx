import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  Check,
  Clipboard,
  DatabaseBackup,
  Download,
  FileText,
  UserPlus,
  KeyRound,
  Loader2,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  History,
  Search,
  BarChart3,
  XCircle,
} from "lucide-react";
import React, { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SUBSCRIPTION_PLANS, type SubscriptionQuota, formatXof, getSubscriptionPlan } from "@shared/plans";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";

const quotaOptions = SUBSCRIPTION_PLANS.map((plan) => plan.quota) as readonly SubscriptionQuota[];

function buildWhatsAppUrl(phone: string, clientName: string) {
  const digits = phone.replace(/\D/g, "");
  const internationalPhone = digits.startsWith("0") ? `225${digits.slice(1)}` : digits;
  const message = `Bonjour ${clientName}, merci pour votre intérêt pour MÉTREXPERT IA PRO. Je reste disponible pour échanger sur votre étude de métré et votre abonnement.`;
  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`;
}

function buildExpiredRelanceWhatsAppUrl(phone: string, clientName: string, expiresAt: Date | string, planQuota: number) {
  const digits = phone.replace(/\D/g, "");
  const internationalPhone = digits.startsWith("0") ? `225${digits.slice(1)}` : digits;
  const expiry = new Date(expiresAt).toLocaleDateString("fr-FR");
  const renewalUrl = typeof window === "undefined" ? `/#paiement?plan=${planQuota}` : `${window.location.origin}/#paiement?plan=${planQuota}`;
  const message = `Bonjour ${clientName}, votre forfait MÉTREXPERT IA PRO a expiré le ${expiry}. Vous pouvez demander son renouvellement ici : ${renewalUrl}. Répondez à ce message si vous souhaitez être accompagné.`;
  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`;
}

function buildActivatedCodeWhatsAppUrl(phone: string, clientName: string, code: string, expiresAt: Date | string) {
  const digits = phone.replace(/\D/g, "");
  const internationalPhone = digits.startsWith("0") ? `225${digits.slice(1)}` : digits;
  const expiry = new Date(expiresAt).toLocaleDateString("fr-FR");
  const renewalUrl = typeof window === "undefined" ? "/#paiement" : `${window.location.origin}/#paiement`;
  const message = `Bonjour ${clientName}, votre paiement a été confirmé. Votre forfait MÉTREXPERT IA PRO est activé. Voici votre code d’accès : ${code}. Il est valable jusqu’au ${expiry}. Pour renouveler votre forfait : ${renewalUrl}. Conservez ce message précieusement.`;
  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`;
}

type CsvTrial = { clientName: string; phone: string; email?: string };
type HeartbeatCsvRun = { completedAt: Date | string; runType: "manual" | "automatic"; status: "success" | "failed"; deletedCount: number; retentionDays: number; taskUid?: string | null; errorMessage?: string | null };

export function buildFreeTrialCsv(trials: CsvTrial[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const normalizeWhatsAppPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.startsWith("0") ? `225${digits.slice(1)}` : digits;
  };
  return [
    ["Full name", "Phone number"],
    ...trials.filter((trial) => trial.phone !== "À compléter").map((trial) => [trial.clientName, normalizeWhatsAppPhone(trial.phone)]),
  ].map((row) => row.map((value) => escape(String(value))).join(";")) .join("\r\n");
}

export function buildCombinedTrialCsv(trials: CsvTrial[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const normalizePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.startsWith("0") ? `225${digits.slice(1)}` : digits;
  };
  return [
    ["Full name", "Phone number", "Email", "Preferred contact channel"],
    ...trials.filter((trial) => trial.phone !== "À compléter" || (trial.email && trial.email !== "À compléter")).map((trial) => [
      trial.clientName,
      trial.phone !== "À compléter" ? normalizePhone(trial.phone) : "",
      trial.email !== "À compléter" ? trial.email ?? "" : "",
      trial.phone !== "À compléter" ? "WhatsApp" : "Email",
    ]),
  ].map((row) => row.map((value) => escape(String(value))).join(";")) .join("\r\n");
}

export function buildEmailTrialCsv(trials: CsvTrial[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return [
    ["Full name", "Email"],
    ...trials.filter((trial) => trial.phone === "À compléter" && trial.email && trial.email !== "À compléter").map((trial) => [trial.clientName, trial.email as string]),
  ].map((row) => row.map((value) => escape(String(value))).join(";")).join("\r\n");
}

export function buildHeartbeatCsv(runs: HeartbeatCsvRun[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = runs.map((run) => [new Date(run.completedAt).toISOString(), run.runType === "automatic" ? "Automatique" : "Manuelle", run.status === "success" ? "Succès" : "Échec", String(run.deletedCount), String(run.retentionDays), run.taskUid ?? "", run.errorMessage ?? ""]);
  return "\uFEFF" + [["Date UTC", "Type", "Statut", "Contacts supprimés", "Rétention (jours)", "Task UID", "Détail"], ...rows].map((row) => row.map((value) => escape(String(value))).join(";")).join("\r\n");
}

type CodeToRevoke = { id: number; clientName: string } | null;
type PurgeFeedback = { tone: "success" | "error"; title: string; message: string } | null;

export default function Admin() {
  const [adminCode, setAdminCode] = useState("");
  const [clientName, setClientName] = useState("");
  const [monthlyQuota, setMonthlyQuota] =
    useState<SubscriptionQuota>(15);
  const [paymentMethod, setPaymentMethod] = useState<"wave" | "moov" | "mtn" | "autre" | "">("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "pending" | "confirmed" | "rejected">("all");
  const [proofPreviewId, setProofPreviewId] = useState<number | null>(null);
  const [proofPreview, setProofPreview] = useState<{ id: number; url: string; fileName: string | null } | null>(null);
  const [proofZoom, setProofZoom] = useState(1);
  const [proofPan, setProofPan] = useState({ x: 0, y: 0 });
  const proofDragRef = useRef<{ pointerId: number; x: number; y: number; originX: number; originY: number } | null>(null);
  const [codeFilter, setCodeFilter] = useState<"all" | "expiring" | "today" | "tomorrow" | "expired">("all");
  const [selectedExpiredCodeIds, setSelectedExpiredCodeIds] = useState<number[]>([]);
  const [bulkRelanceOpen, setBulkRelanceOpen] = useState(false);
  const [revealedCode, setRevealedCode] = useState<string | null>(null);
  const [revealedCodeRecipient, setRevealedCodeRecipient] = useState<{ clientName: string; phone: string; expiresAt: Date | string } | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [sessionUnlocked, setSessionUnlocked] = useState(false);
  const [codeToRevoke, setCodeToRevoke] = useState<CodeToRevoke>(null);
  const [trialFilter, setTrialFilter] = useState<"all" | "followup" | "converted">("all");
  const [trialStartDate, setTrialStartDate] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem("metrexpert.trials.startDate") ?? "");
  const [trialEndDate, setTrialEndDate] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem("metrexpert.trials.endDate") ?? "");
  const [csvExportKind, setCsvExportKind] = useState<"whatsapp" | "email" | "combined" | null>(null);
  const [retentionDays, setRetentionDays] = useState(365);
  const [retentionDraft, setRetentionDraft] = useState("365");
  const [purgeRetentionOpen, setPurgeRetentionOpen] = useState(false);
  const [purgeFeedback, setPurgeFeedback] = useState<PurgeFeedback>(null);
  const [backupFeedback, setBackupFeedback] = useState<"success" | "error" | null>(null);
  const [journeyPdfPending, setJourneyPdfPending] = useState(false);
  const [journeyPdfOpen, setJourneyPdfOpen] = useState(false);
  const [journeyPdfNotes, setJourneyPdfNotes] = useState("");
  const [purgeSearch, setPurgeSearch] = useState("");
  const [purgeStatusFilter, setPurgeStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [heartbeatStatusFilter, setHeartbeatStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [heartbeatChecks, setHeartbeatChecks] = useState<Record<number, "pending" | "success" | "error">>({});

  useEffect(() => {
    if (trialStartDate) window.localStorage.setItem("metrexpert.trials.startDate", trialStartDate);
    else window.localStorage.removeItem("metrexpert.trials.startDate");
    if (trialEndDate) window.localStorage.setItem("metrexpert.trials.endDate", trialEndDate);
    else window.localStorage.removeItem("metrexpert.trials.endDate");
  }, [trialStartDate, trialEndDate]);

  const adminStatus = trpc.security.adminStatus.useQuery();
  const utils = trpc.useUtils();
  const isAdminUnlocked =
    sessionUnlocked || adminStatus.data?.unlocked === true;
  // Les listes protégées ne doivent se charger qu’après confirmation du cookie Admin par le serveur.
  // Cela évite trois réponses 401 simultanées pendant l’ouverture de la page ou la reconnexion.
  const canLoadAdminData = adminStatus.data?.unlocked === true;

  const login = trpc.security.verifyAdminCode.useMutation({
    onSuccess: () => {
      setSessionUnlocked(true);
      void adminStatus.refetch();
      toast.success("Accès administrateur ouvert pour cette session.");
    },
    onError: (error) => toast.error(error.message),
  });

  const codes = trpc.security.adminListCodes.useQuery(undefined, {
    enabled: canLoadAdminData,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const trials = trpc.security.adminListFreeTrials.useQuery(undefined, {
    enabled: canLoadAdminData,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const retention = trpc.security.adminGetFreeTrialRetention.useQuery(undefined, {
    enabled: canLoadAdminData,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const backupStatus = trpc.security.adminGetBackupStatus.useQuery(undefined, { enabled: canLoadAdminData, retry: false, refetchOnWindowFocus: false });
  const purgeRuns = trpc.security.adminListPurgeRuns.useQuery(undefined, { enabled: canLoadAdminData, retry: false, refetchOnWindowFocus: false });
  useEffect(() => {
    if (retention.data?.retentionDays) {
      setRetentionDays(retention.data.retentionDays);
      setRetentionDraft(String(retention.data.retentionDays));
    }
  }, [retention.data?.retentionDays]);
  const paymentRequests = trpc.security.adminListPaymentRequests.useQuery(undefined, {
    enabled: canLoadAdminData,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const isRefreshingAdminData = Boolean(codes.isFetching || trials.isFetching || paymentRequests.isFetching || retention.isFetching || backupStatus.isFetching || purgeRuns.isFetching);

  async function refreshAdminData() {
    if (!canLoadAdminData) {
      await adminStatus.refetch();
      return;
    }
    await Promise.all([codes.refetch(), trials.refetch(), paymentRequests.refetch(), retention.refetch(), backupStatus.refetch(), purgeRuns.refetch()]);
    toast.success("Données administratives actualisées.");
  }

  const paymentProof = trpc.security.adminGetPaymentProof.useQuery({ id: proofPreviewId ?? 0 }, { enabled: canLoadAdminData && proofPreviewId !== null, retry: false, refetchOnWindowFocus: false });
  useEffect(() => {
    if (paymentProof.data && proofPreviewId !== null) setProofPreview({ id: proofPreviewId, url: paymentProof.data.url, fileName: paymentProof.data.fileName });
    if (paymentProof.error) toast.error(paymentProof.error.message);
  }, [paymentProof.data, paymentProof.error, proofPreviewId]);
  const reviewPaymentProof = trpc.security.adminReviewPaymentProof.useMutation({
    onSuccess: () => { void paymentRequests.refetch(); toast.success("Statut de la preuve mis à jour.", { icon: <Check className="h-4 w-4" aria-hidden="true" />, className: "border-[#7C9A76] bg-[#E4EEE1] text-[#25402A]" }); },
    onError: (error) => toast.error(error.message, { icon: <XCircle className="h-4 w-4" aria-hidden="true" />, className: "border-[#D98472] bg-[#F7E4E0] text-[#5B2C25]" }),
  });
  const reviewPayment = trpc.security.adminReviewPaymentRequest.useMutation({
    onSuccess: (data) => {
      void paymentRequests.refetch();
      void codes.refetch();
      if (data.status === "confirmed" && "accessCode" in data && data.accessCode) {
        setRevealedCode(data.accessCode);
        if ("clientName" in data && "phone" in data && "expiresAt" in data && typeof data.clientName === "string" && typeof data.phone === "string" && data.expiresAt) setRevealedCodeRecipient({ clientName: data.clientName, phone: data.phone, expiresAt: data.expiresAt as Date | string });
      }
      toast.success(data.status === "confirmed" ? "Paiement confirmé et forfait activé." : "Paiement refusé.");
    },
    onError: (error) => toast.error(error.message),
  });

  const create = trpc.security.adminCreateCode.useMutation({
    onSuccess: (data) => {
      setClientName("");
      setPaymentMethod("");
      setPaymentReference("");
      setRevealedCode(data.code);
      setCopyState("idle");
      void codes.refetch();
      toast.success(
        "Code client créé. Copiez-le maintenant : il ne sera plus affiché ensuite.",
      );
    },
    onError: (error) => toast.error(error.message),
  });

  const disable = trpc.security.adminDisableCode.useMutation({
    onSuccess: () => {
      void utils.security.adminListCodes.invalidate();
      setCodeToRevoke(null);
      toast.success("Code client révoqué.");
    },
    onError: (error) => toast.error(error.message),
  });
  const markTrialContacted = trpc.security.adminMarkFreeTrialWhatsAppContacted.useMutation({
    onSuccess: () => {
      void utils.security.adminListFreeTrials.invalidate();
      toast.success("Dernière relance enregistrée.");
    },
    onError: (error) => toast.error(error.message),
  });

  const markTrialUnsubscribed = trpc.security.adminMarkFreeTrialUnsubscribed?.useMutation?.({ onSuccess: () => void utils.security.adminListFreeTrials.invalidate(), onError: (error) => toast.error(error.message) }) ?? { mutate: () => undefined, isPending: false };

  const markTrialConverted = trpc.security.adminMarkFreeTrialConverted.useMutation({
    onSuccess: () => {
      void utils.security.adminListFreeTrials.invalidate();
      toast.success("Essai marqué comme converti.");
    },
    onError: (error) => toast.error(error.message),
  });
  const heartbeatCheck = trpc.security.adminRunHeartbeatCheck.useMutation({
    onMutate: ({ id }) => setHeartbeatChecks((current) => ({ ...current, [id]: "pending" })),
    onSuccess: (data) => { setHeartbeatChecks((current) => ({ ...current, [data.id]: "success" })); toast.success(`Contrôle Heartbeat terminé pour ${data.clientName}.`); },
    onError: (error, input) => { setHeartbeatChecks((current) => ({ ...current, [input.id]: "error" })); toast.error(error.message); },
  });
  const markBackupSuccessful = trpc.security.adminMarkBackupSuccessful.useMutation({
    onSuccess: (data) => { setBackupFeedback("success"); void backupStatus.refetch(); toast.success(`Sauvegarde enregistrée : ${new Date(data.lastSuccessfulBackupAt).toLocaleString("fr-FR")}.`, { icon: <Check className="h-4 w-4" aria-hidden="true" />, className: "border-[#7C9A76] bg-[#E4E8DF] text-[#25402A]" }); },
    onError: () => { setBackupFeedback("error"); toast.error("Impossible d’enregistrer la sauvegarde.", { icon: <XCircle className="h-4 w-4" aria-hidden="true" />, className: "border-[#D98472] bg-[#F7E4E0] text-[#5B2C25]" }); },
  });
  const saveRetention = trpc.security.adminSetFreeTrialRetention.useMutation({
    onSuccess: (data) => {
      setRetentionDays(data.retentionDays);
      setRetentionDraft(String(data.retentionDays));
      void retention.refetch();
      toast.success(`Conservation réglée à ${data.retentionDays} jours.`);
    },
    onError: (error) => toast.error(error.message),
  });
  const purgeRetention = trpc.security.adminPurgeExpiredFreeTrials.useMutation({
    onSuccess: (data) => {
      setPurgeRetentionOpen(false);
      void trials.refetch();
      const message = data.deletedCount
        ? `${data.deletedCount} contact${data.deletedCount > 1 ? "s" : ""} supprimé${data.deletedCount > 1 ? "s" : ""}.`
        : "Aucun contact arrivé à échéance : aucune donnée n’a été supprimée.";
      setPurgeFeedback({ tone: "success", title: "Purge terminée", message });
      toast.success(message);
    },
    onError: (error) => {
      setPurgeRetentionOpen(false);
      const message = error instanceof Error ? error.message : "La purge n’a pas pu être exécutée. Aucune donnée n’a été modifiée.";
      setPurgeFeedback({ tone: "error", title: "Purge non effectuée", message });
      toast.error(message);
    },
  });

  const purgeRunRows = purgeRuns.data ?? [];
  const lastPurgeRun = purgeRunRows[0];
  const successfulPurgeCount = purgeRunRows.filter((run) => run.status === "success").length;
  const lastBackupLabel = backupStatus.data?.lastSuccessfulBackupAt ? new Date(backupStatus.data.lastSuccessfulBackupAt).toLocaleString("fr-FR") : "Aucune sauvegarde enregistrée";
  const lastAutomaticHeartbeat = purgeRunRows.find((run) => run.runType === "automatic");
  const heartbeatLabel = lastAutomaticHeartbeat ? new Date(lastAutomaticHeartbeat.completedAt).toLocaleString("fr-FR") : "Aucune exécution automatique";
  const heartbeatFresh = lastAutomaticHeartbeat ? Date.now() - new Date(lastAutomaticHeartbeat.completedAt).getTime() <= 36 * 60 * 60 * 1000 : false;
  const heartbeatState = lastAutomaticHeartbeat ? (heartbeatFresh ? "Actif récemment" : "À vérifier") : "À configurer";
  const heartbeatSince = new Date();
  heartbeatSince.setUTCHours(0, 0, 0, 0);
  heartbeatSince.setUTCDate(heartbeatSince.getUTCDate() - 29);
  const heartbeatLast30Days = Array.from({ length: 30 }, (_, index) => {
    const day = new Date(heartbeatSince);
    day.setUTCDate(heartbeatSince.getUTCDate() + index);
    const key = day.toISOString().slice(0, 10);
    const runs = purgeRunRows.filter((run) => run.runType === "automatic" && new Date(run.completedAt).toISOString().slice(0, 10) === key && (heartbeatStatusFilter === "all" || run.status === heartbeatStatusFilter));
    return { key, label: day.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), success: runs.filter((run) => run.status === "success").length, failed: runs.filter((run) => run.status === "failed").length };
  });
  const heartbeatRuns30d = purgeRunRows.filter((run) => run.runType === "automatic" && new Date(run.completedAt).getTime() >= heartbeatSince.getTime() && (heartbeatStatusFilter === "all" || run.status === heartbeatStatusFilter));
  const heartbeatSuccess30d = heartbeatRuns30d.filter((run) => run.status === "success").length;
  const heartbeatFailed30d = heartbeatRuns30d.filter((run) => run.status === "failed").length;
  const maxHeartbeatRuns = Math.max(1, ...heartbeatLast30Days.map((day) => day.success + day.failed));

  const visiblePurgeRuns = purgeRunRows.filter((run) => {
    const query = purgeSearch.trim().toLowerCase();
    const searchable = `${run.runType} ${run.status} ${run.errorMessage ?? ""} ${run.taskUid ?? ""}`.toLowerCase();
    return (purgeStatusFilter === "all" || run.status === purgeStatusFilter) && (!query || searchable.includes(query));
  });
  const purgeLastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    const key = day.toISOString().slice(0, 10);
    const deletedCount = purgeRunRows.filter((run) => new Date(run.completedAt).toISOString().slice(0, 10) === key).reduce((total, run) => total + run.deletedCount, 0);
    return { key, label: day.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), deletedCount };
  });
  const purgePreviousSevenDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (13 - index));
    const key = day.toISOString().slice(0, 10);
    const deletedCount = purgeRunRows.filter((run) => new Date(run.completedAt).toISOString().slice(0, 10) === key).reduce((total, run) => total + run.deletedCount, 0);
    return { key, deletedCount };
  });
  const currentPurgeTotal = purgeLastSevenDays.reduce((total, day) => total + day.deletedCount, 0);
  const previousPurgeTotal = purgePreviousSevenDays.reduce((total, day) => total + day.deletedCount, 0);
  const purgeTrendDelta = currentPurgeTotal - previousPurgeTotal;
  const purgeTrendPercent = previousPurgeTotal > 0 ? Math.round((purgeTrendDelta / previousPurgeTotal) * 100) : null;
  const purgeTrendTone = purgeTrendDelta > 0 ? "text-[#C9A15A]" : purgeTrendDelta < 0 ? "text-[#7C9A76]" : "text-[#AEB7B0]";
  const maxPurgeDeletedCount = Math.max(1, ...purgeLastSevenDays.map((day) => day.deletedCount));

  async function handleJourneyPdfExport(notes: string) {
    setJourneyPdfPending(true);
    try {
      const { exportClientJourneyReportPdf } = await import("@/lib/clientJourneyPdf");
      const blob = await exportClientJourneyReportPdf({ operator: "Daouda", notes });
      setJourneyPdfOpen(false);
      setJourneyPdfNotes("");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `metrexpert-rapport-parcours-client-${new Date().toISOString().slice(0, 10)}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Rapport PDF du parcours client téléchargé.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Le rapport PDF n’a pas pu être généré.");
    } finally { setJourneyPdfPending(false); }
  }

  const activeCodesCount =
    codes.data?.filter(
      (code) =>
        !code.disabledAt && new Date(code.expiresAt).getTime() > Date.now(),
    ).length ?? 0;
  const invalidDateRange = Boolean(trialStartDate && trialEndDate && trialStartDate > trialEndDate);
  const filteredPaymentRequests = paymentRequests.data?.filter((request) => paymentFilter === "all" || request.status === paymentFilter) ?? [];
  const filteredCodes = codes.data?.filter((code) => {
    if (codeFilter === "all") return true;
    const isExpired = Boolean(code.disabledAt) || new Date(code.expiresAt).getTime() <= Date.now();
    if (codeFilter === "expired") return isExpired;
    if (code.disabledAt) return false;
    const expiry = new Date(code.expiresAt);
    const daysRemaining = (expiry.getTime() - Date.now()) / 86_400_000;
    if (codeFilter === "expiring") return daysRemaining >= 0 && daysRemaining <= 7;
    const expiryKey = expiry.toLocaleDateString("fr-CA");
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return expiryKey === (codeFilter === "today" ? today : tomorrow).toLocaleDateString("fr-CA");
  }) ?? [];
  const expiredCodes = codes.data?.filter((code) => Boolean(code.disabledAt) || new Date(code.expiresAt).getTime() <= Date.now()) ?? [];
  const phoneForCode = (codeId: number) => paymentRequests.data?.find((request) => request.accessCodeId === codeId && request.status === "confirmed")?.phone;
  const selectedExpiredCodes = expiredCodes.filter((code) => selectedExpiredCodeIds.includes(code.id) && phoneForCode(code.id));
  const filteredTrials = trials.data?.filter((trial) => {
    const statusMatches = trialFilter === "all" || (trialFilter === "converted" ? Boolean(trial.convertedAt) : !trial.convertedAt);
    const trialTime = new Date(trial.trialAt).getTime();
    const startTime = trialStartDate ? new Date(`${trialStartDate}T00:00:00`).getTime() : -Infinity;
    const endTime = trialEndDate ? new Date(`${trialEndDate}T23:59:59.999`).getTime() : Infinity;
    return !invalidDateRange && statusMatches && trialTime >= startTime && trialTime <= endTime;
  }) ?? [];

  function submitLogin(event: FormEvent) {
    event.preventDefault();
    login.mutate({ accessCode: adminCode });
  }

  function submitCreate(event: FormEvent) {
    event.preventDefault();
    create.mutate({ clientName, monthlyQuota, paymentMethod: paymentMethod || undefined, paymentReference: paymentReference.trim() || undefined });
  }

  async function copyRevealedCode() {
    if (!revealedCode) return;

    try {
      await navigator.clipboard.writeText(revealedCode);
      setCopyState("copied");
      toast.success("Code client copié dans le presse-papiers.");
    } catch {
      toast.error("Impossible de copier automatiquement le code.");
    }
  }

  function requestRevoke(id: number, name: string) {
    setCodeToRevoke({ id, clientName: name });
  }

  function resetTrialDates() {
    setTrialStartDate("");
    setTrialEndDate("");
    window.localStorage.removeItem("metrexpert.trials.startDate");
    window.localStorage.removeItem("metrexpert.trials.endDate");
    toast.success("Filtres de date réinitialisés.");
  }

  function downloadFilteredTrials() {
    const emailOnly = csvExportKind === "email";
    const combined = csvExportKind === "combined";
    const exportableTrials = emailOnly
      ? filteredTrials.filter((trial) => trial.phone === "À compléter" && trial.email !== "À compléter")
      : combined
        ? filteredTrials.filter((trial) => trial.phone !== "À compléter" || (trial.email && trial.email !== "À compléter"))
        : filteredTrials.filter((trial) => trial.phone !== "À compléter");
    const csv = `\uFEFF${emailOnly ? buildEmailTrialCsv(exportableTrials) : combined ? buildCombinedTrialCsv(exportableTrials) : buildFreeTrialCsv(exportableTrials)}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `metrexpert-essais-${emailOnly ? "emails" : combined ? "combine" : "whatsapp"}-${trialFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setCsvExportKind(null);
    toast.success(`${exportableTrials.length} prospect${exportableTrials.length > 1 ? "s" : ""} exporté${exportableTrials.length > 1 ? "s" : ""}.`);
  }

  function beginProofDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (proofZoom <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    proofDragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, originX: proofPan.x, originY: proofPan.y };
  }

  function moveProofDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = proofDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setProofPan({ x: drag.originX + event.clientX - drag.x, y: drag.originY + event.clientY - drag.y });
  }

  function endProofDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (proofDragRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    proofDragRef.current = null;
  }

  function downloadHeartbeatHistory() {
    const csv = buildHeartbeatCsv(heartbeatRuns30d);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `metrexpert-heartbeat-30-jours-${heartbeatStatusFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`${heartbeatRuns30d.length} exécution${heartbeatRuns30d.length > 1 ? "s" : ""} Heartbeat exportée${heartbeatRuns30d.length > 1 ? "s" : ""}.`);
  }

  const { theme } = useTheme();

  if (!isAdminUnlocked) {
    return (
      <main className={`internal-page internal-page--${theme} min-h-screen bg-[#0F1613] px-4 py-12 text-[#EDEAE2]`}><div className="internal-theme-toolbar"><ThemeToggle /></div>
        <section className="mx-auto max-w-md border border-[#3A4A42] bg-[#16201C] p-6 shadow-2xl">
          <div className="mb-8 border-b border-[#3A4A42] pb-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C9A15A]">
              MÉTREXPERT IA PRO / REP. ADM-01
            </p>
            <h1 className="mt-3 font-serif text-3xl">
              Accès administration
            </h1>
            <p className="mt-2 text-sm text-[#AEB7B0]">
              Gestion manuelle des abonnements et des quotas clients.
            </p>
            {adminStatus.isLoading && <p role="status" className="mt-4 flex items-center gap-2 border border-[#C9A15A]/60 bg-[#211d14] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#C9A15A]"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Vérification de l’accès administrateur…</p>}
          </div>
          <form onSubmit={submitLogin} className="space-y-4">
            <Label htmlFor="admin-code">Code administrateur</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-[#C9A15A]" />
              <Input
                id="admin-code"
                type="password"
                value={adminCode}
                onChange={(event) => setAdminCode(event.target.value)}
                className="border-[#3A4A42] bg-[#0F1613] pl-10 text-[#EDEAE2]"
                autoComplete="off"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#C9A15A] text-[#0F1613] hover:bg-[#d8b574]"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Déverrouiller le panneau
            </Button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className={`internal-page internal-page--${theme} min-h-screen bg-[#0F1613] px-4 py-8 text-[#EDEAE2]`}><div className="internal-theme-toolbar"><ThemeToggle /></div>
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 border-b border-[#3A4A42] pb-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#C9A15A]">
            MÉTREXPERT IA PRO / REP. ADM-01
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl">Panneau d’administration</h1>
              <p className="mt-2 text-sm text-[#AEB7B0]">
                Accès manuels, renouvellements et suivi des quotas mensuels.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                aria-label={`${activeCodesCount} code${activeCodesCount > 1 ? "s" : ""} client${activeCodesCount > 1 ? "s" : ""} actif${activeCodesCount > 1 ? "s" : ""}`}
                className="border border-[#C9A15A]/60 bg-[#211d14] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#C9A15A]"
              >
                {activeCodesCount} code{activeCodesCount > 1 ? "s" : ""} actif
                {activeCodesCount > 1 ? "s" : ""}
              </span>
              <span aria-label={`${expiredCodes.length} forfait${expiredCodes.length > 1 ? "s" : ""} expiré${expiredCodes.length > 1 ? "s" : ""}`} className="border border-[#D98472]/70 bg-[#2A1A18] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#F0B0A4]">{expiredCodes.length} expiré{expiredCodes.length > 1 ? "s" : ""}</span>
              <span className="border border-[#7C9A76] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#7C9A76]">
                Session protégée
              </span>
              <Button type="button" variant="outline" size="sm" onClick={() => void refreshAdminData()} disabled={isRefreshingAdminData} className="border-[#3A4A42] text-[#AEB7B0]">{isRefreshingAdminData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />}Recharger les données</Button>
            </div>
          </div>
        </header>

        <section className="mb-6 border border-[#3A4A42] bg-[#16201C] p-5" aria-labelledby="operations-title">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A15A]">REP. OPS-02</p>
              <h2 id="operations-title" className="mt-1 font-serif text-2xl">Suivi opérationnel</h2>
              <p className="mt-1 max-w-2xl text-xs text-[#AEB7B0]">La date de sauvegarde est enregistrée après confirmation manuelle d’un export réussi. Elle ne signifie pas qu’un backup automatique a été exécuté.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => markBackupSuccessful.mutate()} disabled={markBackupSuccessful.isPending} className="border-[#7C9A76] text-[#7C9A76]">
                {markBackupSuccessful.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <DatabaseBackup className="mr-2 h-4 w-4" aria-hidden="true" />}
                Enregistrer une sauvegarde réussie
              </Button>
              <Button type="button" variant="outline" onClick={() => setJourneyPdfOpen(true)} disabled={journeyPdfPending} className="border-[#C9A15A] text-[#C9A15A]">
                {journeyPdfPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <FileText className="mr-2 h-4 w-4" aria-hidden="true" />}
                Rapport parcours client PDF
              </Button>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="border border-[#3A4A42] bg-[#0F1613] p-4" aria-live="polite">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]">Dernière sauvegarde réussie</p>
              <p className="mt-2 font-mono text-sm text-[#C9A15A]">{lastBackupLabel}</p>
              {backupFeedback === "success" && <p className="mt-2 text-xs text-[#7C9A76]">Enregistrement confirmé.</p>}
              {backupFeedback === "error" && <p className="mt-2 text-xs text-[#D98472]">Échec de l’enregistrement.</p>}
            </div>
            <div className="border border-[#3A4A42] bg-[#0F1613] p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]">Heartbeat quotidien</p>
              <p className={`mt-2 font-mono text-sm ${heartbeatFresh ? "text-[#7C9A76]" : "text-[#C9A15A]"}`}>{heartbeatState}</p>
              <p className="mt-1 text-[11px] text-[#AEB7B0]">Dernière exécution : {heartbeatLabel}</p>
            </div>
            <div className="border border-[#3A4A42] bg-[#0F1613] p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]">Exécutions réussies visibles</p>
              <p className="mt-2 font-mono text-2xl text-[#7C9A76]">{successfulPurgeCount}</p>
            </div>
            <div className="border border-[#3A4A42] bg-[#0F1613] p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]">Dernière purge</p>
              <p className="mt-2 font-mono text-sm text-[#EDEAE2]">{lastPurgeRun ? new Date(lastPurgeRun.completedAt).toLocaleString("fr-FR") : "Aucune exécution"}</p>
              <p className={`mt-1 text-xs ${lastPurgeRun?.status === "failed" ? "text-[#D98472]" : "text-[#7C9A76]"}`}>{lastPurgeRun ? (lastPurgeRun.status === "success" ? "Succès" : "Échec") : "En attente"}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]">
            <div>
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#AEB7B0]" aria-hidden="true" /><Input aria-label="Rechercher dans l’historique des purges" value={purgeSearch} onChange={(event) => setPurgeSearch(event.target.value)} placeholder="Rechercher : erreur, tâche, automatique…" className="border-[#3A4A42] bg-[#0F1613] pl-9 text-[#EDEAE2]" /></div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les purges par statut"><Button type="button" size="sm" variant="outline" aria-pressed={purgeStatusFilter === "all"} onClick={() => setPurgeStatusFilter("all")} className={purgeStatusFilter === "all" ? "border-[#C9A15A] bg-[#C9A15A] text-[#0F1613]" : "border-[#3A4A42] text-[#AEB7B0]"}>Tous</Button><Button type="button" size="sm" variant="outline" aria-pressed={purgeStatusFilter === "success"} onClick={() => setPurgeStatusFilter("success")} className={purgeStatusFilter === "success" ? "border-[#7C9A76] bg-[#7C9A76] text-[#0F1613]" : "border-[#3A4A42] text-[#AEB7B0]"}>Succès</Button><Button type="button" size="sm" variant="outline" aria-pressed={purgeStatusFilter === "failed"} onClick={() => setPurgeStatusFilter("failed")} className={purgeStatusFilter === "failed" ? "border-[#D98472] bg-[#D98472] text-[#0F1613]" : "border-[#3A4A42] text-[#AEB7B0]"}>Échecs</Button></div>
              </div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]">{visiblePurgeRuns.length} exécution{visiblePurgeRuns.length > 1 ? "s" : ""} affichée{visiblePurgeRuns.length > 1 ? "s" : ""}</p>
              <div className="overflow-x-auto border border-[#3A4A42]">
            <table className="min-w-full text-left text-xs" aria-label="Historique des purges automatiques">
              <thead className="bg-[#0F1613] font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]"><tr><th className="px-3 py-3">Date</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Statut</th><th className="px-3 py-3">Contacts supprimés</th><th className="px-3 py-3">Détail</th></tr></thead>
              <tbody>{visiblePurgeRuns.length ? visiblePurgeRuns.map((run) => <tr key={run.id} className="border-t border-[#3A4A42]"><td className="px-3 py-3 font-mono text-[#EDEAE2]">{new Date(run.completedAt).toLocaleString("fr-FR")}</td><td className="px-3 py-3 text-[#AEB7B0]">{run.runType === "automatic" ? "Automatique" : "Manuelle"}</td><td className={`px-3 py-3 font-semibold ${run.status === "success" ? "text-[#7C9A76]" : "text-[#D98472]"}`}>{run.status === "success" ? "Succès" : "Échec"}</td><td className="px-3 py-3 font-mono text-[#C9A15A]">{run.deletedCount}</td><td className="max-w-xs px-3 py-3 text-[#AEB7B0]">{run.errorMessage || `Rétention : ${run.retentionDays} jours`}</td></tr>) : <tr><td colSpan={5} className="px-3 py-5 text-center text-[#AEB7B0]">Aucune purge enregistrée pour le moment.</td></tr>}</tbody>
            </table>
              </div>
            </div>
            <div className="border border-[#3A4A42] bg-[#0F1613] p-4" aria-labelledby="purge-chart-title">
              <div className="flex items-center justify-between gap-2"><p id="purge-chart-title" className="font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]">Contacts purgés / 7 jours</p><BarChart3 className="h-4 w-4 text-[#C9A15A]" aria-hidden="true" /></div>
              <div className="mt-3 border border-[#3A4A42] bg-[#16201C] p-3" aria-label="Tendance comparée aux sept jours précédents">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]">Tendance vs semaine précédente</p>
                <p className={`mt-1 font-mono text-lg ${purgeTrendTone}`}>{purgeTrendDelta > 0 ? "↑" : purgeTrendDelta < 0 ? "↓" : "→"} {purgeTrendDelta > 0 ? "+" : ""}{purgeTrendDelta} contact{Math.abs(purgeTrendDelta) > 1 ? "s" : ""}{purgeTrendPercent === null ? " — base précédente indisponible" : ` — ${purgeTrendPercent > 0 ? "+" : ""}${purgeTrendPercent}%`}</p>
                <p className="mt-1 text-[11px] text-[#AEB7B0]">Cette semaine : {currentPurgeTotal} · Semaine précédente : {previousPurgeTotal}</p>
              </div>
              <div className="mt-4 flex h-36 items-end justify-between gap-2" aria-label="Graphique des contacts purgés au cours des sept derniers jours">
                {purgeLastSevenDays.map((day) => <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"><span className="font-mono text-[10px] text-[#C9A15A]">{day.deletedCount}</span><div className="w-full max-w-7 bg-[#C9A15A]" style={{ height: `${Math.max(6, (day.deletedCount / maxPurgeDeletedCount) * 100)}%` }} title={`${day.label} : ${day.deletedCount} contact${day.deletedCount > 1 ? "s" : ""}`} /><span className="font-mono text-[9px] text-[#AEB7B0]">{day.label}</span></div>)}
              </div>
              <p className="mt-3 text-[11px] text-[#AEB7B0]">Données issues des exécutions de purge enregistrées. Aucun chiffre n’est simulé.</p>
            </div>
          </div>
        </section>

        <section className="mb-6 border border-[#3A4A42] bg-[#16201C] p-5" aria-labelledby="heartbeat-history-title">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A15A]">REP. OPS-03</p>
              <h2 id="heartbeat-history-title" className="mt-1 font-serif text-2xl">Historique Heartbeat — 30 jours</h2>
              <p className="mt-1 max-w-2xl text-xs text-[#AEB7B0]">Les volumes correspondent uniquement aux exécutions automatiques du callback enregistrées dans le journal opérationnel. Les jours sans exécution restent visibles.</p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les exécutions Heartbeat par statut">
              {([["all", "Tous"], ["success", "Succès"], ["failed", "Échecs"]] as const).map(([value, label]) => <Button key={value} type="button" size="sm" variant="outline" aria-pressed={heartbeatStatusFilter === value} aria-label={`Heartbeat : ${label}`} onClick={() => setHeartbeatStatusFilter(value)} className={heartbeatStatusFilter === value ? "border-[#C9A15A] bg-[#C9A15A] text-[#0F1613]" : "border-[#3A4A42] text-[#AEB7B0]"}>{label}</Button>)}
              <Button type="button" size="sm" variant="outline" disabled={!heartbeatRuns30d.length} onClick={downloadHeartbeatHistory} className="border-[#7C9A76] text-[#7C9A76]"><Download className="mr-2 h-4 w-4" />Exporter CSV</Button>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="border border-[#3A4A42] bg-[#0F1613] p-4"><p className="font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]">Exécutions visibles</p><p className="mt-2 font-mono text-2xl text-[#C9A15A]">{heartbeatRuns30d.length}</p></div>
            <div className="border border-[#3A4A42] bg-[#0F1613] p-4"><p className="font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]">Succès / 30 jours</p><p className="mt-2 font-mono text-2xl text-[#7C9A76]">{heartbeatSuccess30d}</p></div>
            <div className="border border-[#3A4A42] bg-[#0F1613] p-4"><p className="font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]">Échecs / 30 jours</p><p className="mt-2 font-mono text-2xl text-[#D98472]">{heartbeatFailed30d}</p></div>
          </div>
          <div className="mt-5 overflow-x-auto border border-[#3A4A42] bg-[#0F1613] p-3" aria-label="Graphique des exécutions Heartbeat sur les trente derniers jours">
            <div className="flex min-w-[720px] items-end gap-1" style={{ height: "180px" }}>
              {heartbeatLast30Days.map((day) => {
                const total = day.success + day.failed;
                const successHeight = total ? Math.max(4, (day.success / maxHeartbeatRuns) * 145) : 0;
                const failedHeight = total ? Math.max(day.failed ? 4 : 0, (day.failed / maxHeartbeatRuns) * 145) : 0;
                return <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${day.key} : ${day.success} succès, ${day.failed} échec${day.failed > 1 ? "s" : ""}`}><span className="font-mono text-[9px] text-[#AEB7B0]">{total || "·"}</span><div className="flex w-full max-w-5 flex-col justify-end"><div className="w-full bg-[#D98472]" style={{ height: `${failedHeight}px` }} /><div className="w-full bg-[#7C9A76]" style={{ height: `${successHeight}px` }} /></div><span className="font-mono text-[8px] text-[#AEB7B0]">{day.label}</span></div>;
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]"><span><i className="mr-2 inline-block h-2 w-2 bg-[#7C9A76]" aria-hidden="true" />Succès</span><span><i className="mr-2 inline-block h-2 w-2 bg-[#D98472]" aria-hidden="true" />Échecs</span></div>
          </div>
          {!heartbeatRuns30d.length && <p className="mt-3 text-xs text-[#C9A15A]" role="status">Aucune exécution Heartbeat ne correspond au filtre sur les 30 derniers jours.</p>}
        </section>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card className="border-[#3A4A42] bg-[#16201C] text-[#EDEAE2]">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">
                Nouveau code client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitCreate} className="space-y-5">
                <div>
                  <Label htmlFor="client-name">Nom du client</Label>
                  <Input
                    id="client-name"
                    value={clientName}
                    onChange={(event) => setClientName(event.target.value)}
                    className="mt-2 border-[#3A4A42] bg-[#0F1613] text-[#EDEAE2]"
                    placeholder="Entreprise ou particulier"
                    required
                    maxLength={160}
                  />
                </div>
                <div>
                  <Label htmlFor="monthly-quota">Forfait mensuel</Label>
                  <select
                    id="monthly-quota"
                    value={monthlyQuota}
                    onChange={(event) =>
                      setMonthlyQuota(
                        Number(event.target.value) as (typeof quotaOptions)[number],
                      )
                    }
                    className="mt-2 h-10 w-full border border-[#3A4A42] bg-[#0F1613] px-3 text-sm text-[#EDEAE2]"
                  >
                    {SUBSCRIPTION_PLANS.map((plan) => <option key={plan.quota} value={plan.quota}>{plan.name} — {plan.quota} générations — {formatXof(plan.priceXof)}</option>)}
                  </select>
                  <p className="mt-2 text-xs text-[#AEB7B0]">Expiration automatique : un mois après la création.</p>
                </div>
                <div>
                  <Label htmlFor="payment-method">Paiement reçu</Label>
                  <select id="payment-method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)} className="mt-2 h-10 w-full border border-[#3A4A42] bg-[#0F1613] px-3 text-sm text-[#EDEAE2]"><option value="">À confirmer</option><option value="wave">Wave</option><option value="moov">Moov Money</option><option value="mtn">MTN Money</option><option value="autre">Autre</option></select>
                  <Input id="payment-reference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} className="mt-2 border-[#3A4A42] bg-[#0F1613] text-[#EDEAE2]" placeholder="Référence de transaction (facultatif)" maxLength={120} />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#C9A15A] text-[#0F1613] hover:bg-[#d8b574]"
                  disabled={create.isPending}
                >
                  {create.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  Créer le code
                </Button>
              </form>

              {revealedCode && (
                <Alert className="mt-5 border-[#C9A15A] bg-[#211d14] text-[#EDEAE2]">
                  <AlertTitle>Code à transmettre maintenant</AlertTitle>
                  <AlertDescription>
                    <code className="mt-2 block break-all font-mono text-lg text-[#C9A15A]">
                      {revealedCode}
                    </code>
                    <p className="mt-2 text-xs">
                      Conservez-le dans un canal sûr. Pour des raisons de
                      sécurité, il ne sera pas récupérable depuis la liste.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#C9A15A] text-[#C9A15A]"
                        onClick={copyRevealedCode}
                      >
                        {copyState === "copied" ? (
                          <Check className="mr-2 h-4 w-4" />
                        ) : (
                          <Clipboard className="mr-2 h-4 w-4" />
                        )}
                        {copyState === "copied"
                          ? "Code copié"
                          : "Copier le code"}
                      </Button>
                      {revealedCodeRecipient && <a href={buildActivatedCodeWhatsAppUrl(revealedCodeRecipient.phone, revealedCodeRecipient.clientName, revealedCode, revealedCodeRecipient.expiresAt)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 border border-[#7C9A76] px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-[#7C9A76] hover:bg-[#7C9A76] hover:text-[#0F1613]"><MessageCircle className="h-4 w-4" aria-hidden="true" />Ouvrir WhatsApp</a>}
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#C9A15A] text-[#C9A15A]"
                        onClick={() => setRevealedCode(null)}
                      >
                        Masquer le code
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#3A4A42] bg-[#16201C] text-[#EDEAE2]">
            <CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><CardTitle className="font-serif text-2xl">Demandes de paiement</CardTitle><div className="flex flex-wrap gap-2" aria-label="Filtrer les paiements par statut">{([['all', 'Tous'], ['pending', 'En attente'], ['confirmed', 'Confirmés'], ['rejected', 'Refusés']] as const).map(([value, label]) => <Button key={value} type="button" size="sm" variant="outline" onClick={() => setPaymentFilter(value)} className={paymentFilter === value ? "border-[#C9A15A] bg-[#C9A15A] text-[#0F1613]" : "border-[#3A4A42] text-[#AEB7B0]"}>{label}</Button>)}</div></div><p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]">{filteredPaymentRequests.length} demande{filteredPaymentRequests.length > 1 ? "s" : ""} affichée{filteredPaymentRequests.length > 1 ? "s" : ""}</p></CardHeader>
            <CardContent>
              {paymentRequests.isLoading ? <div className="flex items-center gap-2 text-sm text-[#AEB7B0]"><Loader2 className="h-4 w-4 animate-spin" />Chargement des paiements…</div> : filteredPaymentRequests.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-[#3A4A42] font-mono text-[10px] uppercase tracking-wider text-[#C9A15A]"><tr><th className="px-3 py-3">Client</th><th className="px-3 py-3">Forfait / montant</th><th className="px-3 py-3">Moyen / référence</th><th className="px-3 py-3">Statut</th><th className="px-3 py-3">Preuve</th><th className="px-3 py-3 text-right">Décision</th></tr></thead><tbody>{filteredPaymentRequests.map((request) => <tr key={request.id} className="border-b border-[#3A4A42]/70"><td className="px-3 py-4"><span className="font-medium">{request.clientName}</span><br /><span className="text-xs text-[#AEB7B0]">{request.phone}</span></td><td className="px-3 py-4 font-mono text-xs">{getSubscriptionPlan(request.planQuota)?.name}<br /><span className="text-[#C9A15A]">{formatXof(request.amountXof)}</span></td><td className="px-3 py-4 font-mono text-xs">{request.paymentMethod.toUpperCase()}<br /><span className="text-[#AEB7B0]">{request.paymentReference}</span></td><td className={`px-3 py-4 font-mono text-xs uppercase ${request.status === "confirmed" ? "text-[#7C9A76]" : request.status === "rejected" ? "text-[#D98472]" : "text-[#C9A15A]"}`}>{request.status === "confirmed" ? "Confirmé" : request.status === "rejected" ? "Refusé" : "En attente"}</td><td className="px-3 py-4 font-mono text-xs">{request.hasProof ? <div className="flex flex-col items-start gap-2"><span className={request.proofStatus === "approved" ? "text-[#7C9A76]" : request.proofStatus === "rejected" ? "text-[#D98472]" : "text-[#C9A15A]"}>{request.proofStatus === "approved" ? "Validée" : request.proofStatus === "rejected" ? "Rejetée" : "À vérifier"}</span><Button type="button" size="sm" variant="outline" className="border-[#C9A15A] text-[#C9A15A]" onClick={() => { setProofPreview(null); setProofZoom(1); setProofPan({ x: 0, y: 0 }); setProofPreviewId(request.id); }}>Voir</Button>{request.proofStatus !== "approved" && <Button type="button" size="sm" className="bg-[#7C9A76] text-[#0F1613]" disabled={reviewPaymentProof.isPending} onClick={() => reviewPaymentProof.mutate({ id: request.id, status: "approved" })}>Valider</Button>}{request.proofStatus !== "rejected" && <Button type="button" size="sm" variant="outline" className="border-[#D98472] text-[#D98472]" disabled={reviewPaymentProof.isPending} onClick={() => reviewPaymentProof.mutate({ id: request.id, status: "rejected" })}>Rejeter</Button>}</div> : <span className="text-[#56635B]">Aucune</span>}</td><td className="px-3 py-4 text-right">{request.status === "pending" && <div className="flex justify-end gap-2"><Button type="button" size="sm" className="bg-[#7C9A76] text-[#0F1613]" disabled={reviewPayment.isPending} onClick={() => reviewPayment.mutate({ id: request.id, status: "confirmed" })}>Confirmer</Button><Button type="button" size="sm" variant="outline" className="border-[#D98472] text-[#D98472]" disabled={reviewPayment.isPending} onClick={() => reviewPayment.mutate({ id: request.id, status: "rejected" })}>Refuser</Button></div>}</td></tr>)}</tbody></table></div> : <p className="py-8 text-sm text-[#AEB7B0]">{paymentRequests.data?.length ? "Aucune demande ne correspond à ce filtre." : "Aucune demande de paiement enregistrée."}</p>}
            </CardContent>
          </Card>

          {proofPreview && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1613]/80 p-4" role="dialog" aria-modal="true" aria-label="Aperçu de la preuve de paiement" tabIndex={-1} onKeyDown={(event) => { if (event.key === "Escape") { setProofPreview(null); setProofPreviewId(null); setProofZoom(1); setProofPan({ x: 0, y: 0 }); } }}><div className="max-h-[90vh] w-full max-w-4xl border border-[#C9A15A] bg-[#16201C] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-xs uppercase tracking-wider text-[#C9A15A]">Preuve de paiement</p><p className="mt-1 text-xs text-[#AEB7B0]">{proofPreview.fileName || "Capture protégée"}</p></div><div className="flex flex-wrap items-center gap-2"><Button type="button" size="sm" variant="outline" aria-label="Réduire le zoom" disabled={proofZoom <= 0.75} className="border-[#3A4A42] text-[#EDEAE2]" onClick={() => setProofZoom((zoom) => Math.max(0.75, Number((zoom - 0.25).toFixed(2))))}>−</Button><Button type="button" size="sm" variant="outline" aria-label="Réinitialiser le zoom" className="border-[#3A4A42] text-[#EDEAE2]" onClick={() => setProofZoom(1)}>{Math.round(proofZoom * 100)} %</Button><Button type="button" size="sm" variant="outline" aria-label="Agrandir le zoom" disabled={proofZoom >= 3} className="border-[#C9A15A] text-[#C9A15A]" onClick={() => setProofZoom((zoom) => Math.min(3, Number((zoom + 0.25).toFixed(2))))}>+</Button><Button type="button" variant="outline" className="border-[#AEB7B0] text-[#EDEAE2]" onClick={() => { setProofPreview(null); setProofPreviewId(null); setProofZoom(1); setProofPan({ x: 0, y: 0 }); }}>Fermer</Button></div></div><div className={`mt-4 max-h-[70vh] overflow-auto bg-[#0F1613] p-2 text-center ${proofZoom > 1 ? "cursor-grab touch-none" : ""}`} aria-label={`Image agrandie à ${Math.round(proofZoom * 100)} pour cent`} onPointerDown={beginProofDrag} onPointerMove={moveProofDrag} onPointerUp={endProofDrag} onPointerCancel={endProofDrag}><img src={proofPreview.url} alt={proofPreview.fileName ? `Capture ${proofPreview.fileName}` : "Capture de preuve de paiement"} className="mx-auto w-auto max-w-none object-contain" style={{ maxHeight: "65vh", transform: `translate(${proofPan.x}px, ${proofPan.y}px) scale(${proofZoom})`, transformOrigin: "center top" }} /></div><p className="mt-2 text-[11px] text-[#AEB7B0]">À plus de 100 %, maintenez le bouton de la souris ou le doigt sur l’image pour la déplacer. Le zoom reste visuel et ne rend pas l’image publique.</p></div></div>}

          <Card className="border-[#3A4A42] bg-[#16201C] text-[#EDEAE2]">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><CardTitle className="font-serif text-2xl">Codes actifs et historiques</CardTitle><div className="flex flex-wrap gap-2" aria-label="Filtrer les expirations"><Button type="button" size="sm" variant="outline" onClick={() => setCodeFilter("all")} className={codeFilter === "all" ? "border-[#C9A15A] bg-[#C9A15A] text-[#0F1613]" : "border-[#3A4A42] text-[#AEB7B0]"}>Tous</Button><Button type="button" size="sm" variant="outline" onClick={() => setCodeFilter("expiring")} className={codeFilter === "expiring" ? "border-[#C9A15A] bg-[#C9A15A] text-[#0F1613]" : "border-[#3A4A42] text-[#AEB7B0]"}>Expirent sous 7 jours</Button><Button type="button" size="sm" variant="outline" onClick={() => setCodeFilter("today")} className={codeFilter === "today" ? "border-[#C9A15A] bg-[#C9A15A] text-[#0F1613]" : "border-[#3A4A42] text-[#AEB7B0]"}>Expirent aujourd’hui</Button><Button type="button" size="sm" variant="outline" onClick={() => setCodeFilter("tomorrow")} className={codeFilter === "tomorrow" ? "border-[#C9A15A] bg-[#C9A15A] text-[#0F1613]" : "border-[#3A4A42] text-[#AEB7B0]"}>Expirent demain</Button><Button type="button" size="sm" variant="outline" onClick={() => setCodeFilter("expired")} className={codeFilter === "expired" ? "border-[#C9A15A] bg-[#C9A15A] text-[#0F1613]" : "border-[#3A4A42] text-[#AEB7B0]"}>Expirés</Button><Button type="button" size="sm" variant="outline" disabled={!selectedExpiredCodes.length} onClick={() => setBulkRelanceOpen(true)} className="border-[#7C9A76] text-[#7C9A76]">Relancer sélectionnés ({selectedExpiredCodes.length})</Button></div></div><p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]">{filteredCodes.length} code{filteredCodes.length > 1 ? "s" : ""} affiché{filteredCodes.length > 1 ? "s" : ""}</p>
            </CardHeader>
            <CardContent>
              {codes.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-[#AEB7B0]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des accès…
                </div>
              ) : filteredCodes.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="border-b border-[#3A4A42] font-mono text-[10px] uppercase tracking-wider text-[#C9A15A]">
                      <tr>
                        <th className="px-3 py-3">Relance</th>
                        <th className="px-3 py-3">Client</th>
                        <th className="px-3 py-3">Forfait / tarif</th>
                        <th className="px-3 py-3">Paiement</th>
                        <th className="px-3 py-3">Quota restant</th>
                        <th className="px-3 py-3">Expiration</th>
                        <th className="px-3 py-3">État</th>
                        <th className="px-3 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCodes.map((code) => {
                        const disabled =
                          Boolean(code.disabledAt) ||
                          new Date(code.expiresAt).getTime() <= Date.now();
                        const phone = phoneForCode(code.id);
                        return (
                          <tr
                            key={code.id}
                            className="border-b border-[#3A4A42]/70"
                          >
                            <td className="px-3 py-4">
                              {disabled && phone ? <input type="checkbox" aria-label={`Sélectionner ${code.clientName} pour relance`} checked={selectedExpiredCodeIds.includes(code.id)} onChange={(event) => setSelectedExpiredCodeIds((current) => event.target.checked ? (current.includes(code.id) ? current : [...current, code.id]) : current.filter((id) => id !== code.id))} className="h-4 w-4 accent-[#C9A15A]" /> : <span className="text-[#56635B]">—</span>}
                            </td>
                            <td className="px-3 py-4 font-medium">
                              {code.clientName}
                            </td>
                            <td className="px-3 py-4 font-mono text-xs">{getSubscriptionPlan(code.monthlyQuota)?.name ?? "Forfait à confirmer"}<br /><span className="text-[#C9A15A]">{getSubscriptionPlan(code.monthlyQuota) ? formatXof(getSubscriptionPlan(code.monthlyQuota)!.priceXof) : "Tarif à confirmer"}</span></td>
                            <td className="px-3 py-4 font-mono text-xs">{code.paymentMethod ? code.paymentMethod.toUpperCase() : "À confirmer"}<br /><span className="text-[#AEB7B0]">{code.paymentReference || "Sans référence"}</span></td>
                            <td className="px-3 py-4 font-mono">
                              {code.monthlyRemaining} / {code.monthlyQuota}
                            </td>
                            <td className="px-3 py-4 text-[#AEB7B0]">
                              {new Date(code.expiresAt).toLocaleDateString(
                                "fr-FR",
                              )}
                            </td>
                            <td
                              className={`px-3 py-4 font-mono text-xs uppercase ${disabled ? "text-[#d98472]" : "text-[#7C9A76]"}`}
                            >
                              {disabled ? "Désactivé / expiré" : "Actif"}
                            </td>
                            <td className="px-3 py-4 text-right">
                              <div className="flex flex-col items-end gap-2">
                                <Button type="button" variant="outline" size="sm" className={`border-[#3A4A42] ${heartbeatChecks[code.id] === "success" ? "text-[#7C9A76]" : heartbeatChecks[code.id] === "error" ? "text-[#D98472]" : "text-[#AEB7B0]"}`} onClick={() => heartbeatCheck.mutate({ id: code.id })} disabled={heartbeatCheck.isPending && heartbeatChecks[code.id] === "pending"}>{heartbeatChecks[code.id] === "pending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}<span className="ml-1">Heartbeat</span></Button>
                                {disabled && <a href={`/?plan=${code.monthlyQuota}#paiement`} className="inline-flex items-center gap-1 border border-[#C9A15A] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#C9A15A] hover:bg-[#C9A15A] hover:text-[#0F1613]"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Renouveler</a>}
                                {!disabled && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-[#9d554b] text-[#d98472]"
                                    onClick={() =>
                                      requestRevoke(code.id, code.clientName)
                                    }
                                    disabled={disable.isPending}
                                  >
                                    <XCircle className="mr-1 h-4 w-4" />
                                    Révoquer
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-8 text-sm text-[#AEB7B0]">
                  {codes.data?.length ? "Aucun code ne correspond à ce filtre." : "Aucun code client créé."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-[#3A4A42] bg-[#16201C] text-[#EDEAE2]">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-serif text-2xl">Essais gratuits</CardTitle>
              <p className="mt-1 text-sm text-[#AEB7B0]">Contacts à relancer après leur génération offerte.</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2"><span aria-label={`${filteredTrials.length} prospect${filteredTrials.length > 1 ? "s" : ""} affiché${filteredTrials.length > 1 ? "s" : ""} sur ${trials.data?.length ?? 0}`} className="border border-[#C9A15A]/60 bg-[#211d14] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#C9A15A]">{filteredTrials.length} / {trials.data?.length ?? 0} affiché{filteredTrials.length === 1 ? "" : "s"}</span><div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les essais gratuits"><button type="button" onClick={() => setTrialFilter("all")} aria-pressed={trialFilter === "all"} className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-wider ${trialFilter === "all" ? "border-[#C9A15A] bg-[#C9A15A] text-[#0F1613]" : "border-[#3A4A42] text-[#AEB7B0]"}`}>Tous</button><button type="button" onClick={() => setTrialFilter("followup")} aria-pressed={trialFilter === "followup"} className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-wider ${trialFilter === "followup" ? "border-[#C9A15A] bg-[#C9A15A] text-[#0F1613]" : "border-[#3A4A42] text-[#AEB7B0]"}`}>À relancer</button><button type="button" onClick={() => setTrialFilter("converted")} aria-pressed={trialFilter === "converted"} className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-wider ${trialFilter === "converted" ? "border-[#7C9A76] bg-[#7C9A76] text-[#0F1613]" : "border-[#3A4A42] text-[#AEB7B0]"}`}>Convertis</button><div className="flex flex-col items-start gap-1"><Button type="button" variant="outline" size="sm" onClick={() => setCsvExportKind("whatsapp")} disabled={invalidDateRange || !filteredTrials.some((trial) => trial.phone !== "À compléter")} className="border-[#C9A15A] text-[#C9A15A]" aria-label="Exporter la liste filtrée en CSV"><Download className="mr-1 h-4 w-4" />Exporter CSV</Button><span className="font-mono text-[10px] text-[#AEB7B0]">{invalidDateRange ? 0 : filteredTrials.filter((trial) => trial.phone !== "À compléter").length} contact{filteredTrials.filter((trial) => trial.phone !== "À compléter").length > 1 ? "s" : ""}</span></div><div className="flex flex-col items-start gap-1"><Button type="button" variant="outline" size="sm" onClick={() => setCsvExportKind("email")} disabled={invalidDateRange || !filteredTrials.some((trial) => trial.phone === "À compléter" && trial.email !== "À compléter")} className="border-[#7C9A76] text-[#7C9A76]" aria-label="Exporter les prospects avec e-mail uniquement en CSV"><Download className="mr-1 h-4 w-4" />Exporter e-mails</Button><span className="font-mono text-[10px] text-[#AEB7B0]">{invalidDateRange ? 0 : filteredTrials.filter((trial) => trial.phone === "À compléter" && trial.email !== "À compléter").length} contact{filteredTrials.filter((trial) => trial.phone === "À compléter" && trial.email !== "À compléter").length > 1 ? "s" : ""}</span></div><div className="flex flex-col items-start gap-1"><Button type="button" variant="outline" size="sm" onClick={() => setCsvExportKind("combined")} disabled={invalidDateRange || !filteredTrials.some((trial) => trial.phone !== "À compléter" || (trial.email && trial.email !== "À compléter"))} className="border-[#C9A15A] text-[#C9A15A]" aria-label="Exporter la liste combinée avec canal préféré en CSV"><Download className="mr-1 h-4 w-4" />Exporter combiné</Button><span className="font-mono text-[10px] text-[#AEB7B0]">{invalidDateRange ? 0 : filteredTrials.filter((trial) => trial.phone !== "À compléter" || (trial.email && trial.email !== "À compléter")).length} contact{filteredTrials.filter((trial) => trial.phone !== "À compléter" || (trial.email && trial.email !== "À compléter")).length > 1 ? "s" : ""}</span></div><Button type="button" variant="outline" size="sm" onClick={resetTrialDates} disabled={!trialStartDate && !trialEndDate} className="border-[#3A4A42] text-[#AEB7B0]" aria-label="Réinitialiser les filtres de date">Réinitialiser les dates</Button></div><div className="flex flex-wrap items-end gap-2" aria-label="Filtrer par période"><div><Label htmlFor="trial-start" className="font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]">Du</Label><Input id="trial-start" type="date" value={trialStartDate} onChange={(event) => setTrialStartDate(event.target.value)} aria-invalid={invalidDateRange} className="mt-1 h-9 border-[#3A4A42] bg-[#0F1613] text-xs text-[#EDEAE2]" /></div><div><Label htmlFor="trial-end" className="font-mono text-[10px] uppercase tracking-wider text-[#AEB7B0]">Au</Label><Input id="trial-end" type="date" value={trialEndDate} onChange={(event) => setTrialEndDate(event.target.value)} aria-invalid={invalidDateRange} className="mt-1 h-9 border-[#3A4A42] bg-[#0F1613] text-xs text-[#EDEAE2]" /></div></div></div>
            {invalidDateRange && <p role="alert" className="text-right text-xs text-[#d98472]">La date de début ne peut pas être postérieure à la date de fin.</p>}
            <p className="text-right text-[10px] text-[#7c8c83]">WhatsApp Business : nom complet + numéro international. Export e-mail : nom complet + adresse e-mail.</p>
          </CardHeader>
          <CardContent>
            {trials.isLoading ? <div className="flex items-center gap-2 text-sm text-[#AEB7B0]"><Loader2 className="h-4 w-4 animate-spin" />Chargement des essais…</div> : filteredTrials.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-[#3A4A42] font-mono text-[10px] uppercase tracking-wider text-[#C9A15A]"><tr><th className="px-3 py-3">Nom</th><th className="px-3 py-3">Téléphone</th><th className="px-3 py-3">E-mail</th><th className="px-3 py-3">Date de l’essai</th><th className="px-3 py-3">Conversion</th><th className="px-3 py-3">Dernière relance</th><th className="px-3 py-3 text-right">Action</th></tr></thead><tbody>{filteredTrials.map((trial) => <tr key={trial.id} className="border-b border-[#3A4A42]/70"><td className="px-3 py-4 font-medium">{trial.clientName}</td><td className="px-3 py-4 font-mono text-xs">{trial.phone}</td><td className="px-3 py-4 text-xs">{trial.email}</td><td className="px-3 py-4 text-[#AEB7B0]">{new Date(trial.trialAt).toLocaleDateString("fr-FR")}</td><td className={`px-3 py-4 font-mono text-xs uppercase ${trial.convertedAt ? "text-[#7C9A76]" : "text-[#C9A15A]"}`}>{trial.convertedAt ? "Converti" : "À relancer"}</td><td className="px-3 py-4 text-xs text-[#AEB7B0]">{trial.unsubscribedAt ? "Désinscrit" : trial.lastWhatsAppContactAt ? new Date(trial.lastWhatsAppContactAt).toLocaleDateString("fr-FR") : "Jamais"}</td><td className="flex flex-wrap justify-end gap-2 px-3 py-4 text-right">{trial.phone !== "À compléter" && !trial.unsubscribedAt && <a href={buildWhatsAppUrl(trial.phone, trial.clientName)} onClick={() => markTrialContacted.mutate({ id: trial.id })} target="_blank" rel="noreferrer" aria-label={`Ouvrir WhatsApp pour ${trial.clientName}`} className="inline-flex h-9 items-center justify-center gap-1 border border-[#7C9A76] px-3 font-mono text-[10px] uppercase tracking-wider text-[#7C9A76] transition-colors hover:bg-[#7C9A76] hover:text-[#0F1613]"><MessageCircle className="h-4 w-4" aria-hidden="true" />WhatsApp</a>}{!trial.convertedAt && !trial.unsubscribedAt && <Button type="button" variant="outline" size="sm" className="border-[#7C9A76] text-[#7C9A76]" onClick={() => markTrialConverted.mutate({ id: trial.id })} disabled={markTrialConverted.isPending}>Marquer converti</Button>}<Button type="button" variant="outline" size="sm" className="border-[#9d554b] text-[#d98472]" onClick={() => markTrialUnsubscribed.mutate({ id: trial.id })} disabled={markTrialUnsubscribed.isPending}>{trial.unsubscribedAt ? "Désinscrit" : "Désinscrire"}</Button></td></tr>)}</tbody></table></div> : <p className="py-8 text-sm text-[#AEB7B0]">{trials.data?.length ? "Aucun prospect dans ce filtre." : "Aucun essai gratuit enregistré."}</p>}
          </CardContent>
        </Card>

        <Card className="mt-6 border-[#3A4A42] bg-[#16201C] text-[#EDEAE2]">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Conservation des contacts</CardTitle>
            <p className="text-sm text-[#AEB7B0]">Réglez la durée pendant laquelle les essais gratuits restent dans le panneau avant suppression définitive.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => { event.preventDefault(); const value = Number(retentionDraft); if (Number.isInteger(value) && value >= 30 && value <= 730) saveRetention.mutate({ retentionDays: value }); else toast.error("Choisissez une durée entière comprise entre 30 et 730 jours."); }} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="max-w-xs flex-1">
                <Label htmlFor="trial-retention-days">Durée de conservation (jours)</Label>
                <Input id="trial-retention-days" type="number" min={30} max={730} step={1} value={retentionDraft} onChange={(event) => setRetentionDraft(event.target.value)} className="mt-2 border-[#3A4A42] bg-[#0F1613] text-[#EDEAE2]" aria-describedby="trial-retention-help" />
                <p id="trial-retention-help" className="mt-2 text-xs text-[#AEB7B0]">Valeur actuelle : {retentionDays} jours. Minimum 30, maximum 730.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="bg-[#C9A15A] text-[#0F1613] hover:bg-[#d8b574]" disabled={saveRetention.isPending}>{saveRetention.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}Enregistrer</Button>
                <Button type="button" variant="outline" className="border-[#9d554b] text-[#d98472]" onClick={() => { setPurgeFeedback(null); setPurgeRetentionOpen(true); }} disabled={purgeRetention.isPending}>Purger les contacts échus</Button>
              </div>
            </form>
            {purgeFeedback && <div className={`mt-4 flex items-start gap-3 border px-4 py-3 ${purgeFeedback.tone === "success" ? "border-[#7C9A76] bg-[#1b2a20] text-[#c9dec5]" : "border-[#9d554b] bg-[#2b1b18] text-[#f0c1b7]"}`} role={purgeFeedback.tone === "success" ? "status" : "alert"} aria-live={purgeFeedback.tone === "success" ? "polite" : "assertive"} data-purge-feedback={purgeFeedback.tone}>
              {purgeFeedback.tone === "success" ? <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
              <div><p className="font-mono text-[10px] uppercase tracking-wider">{purgeFeedback.title}</p><p className="mt-1 text-xs leading-5">{purgeFeedback.message}</p></div>
            </div>}
            <p className="mt-4 border-t border-[#3A4A42] pt-4 text-xs leading-5 text-[#AEB7B0]">La suppression est irréversible et ne concerne que les essais dont la date est antérieure au délai choisi. La purge automatique quotidienne est prête côté serveur et doit être activée après publication du site.</p>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={journeyPdfOpen} onOpenChange={setJourneyPdfOpen}>
        <AlertDialogContent className="border-[#3A4A42] bg-[#16201C] text-[#EDEAE2]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl">Générer le rapport du parcours client ?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#AEB7B0]">Le document sera présenté comme une checklist de recette. Ajoutez une note pour préciser le contexte, le test effectué ou un point à revoir.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2"><Label htmlFor="journey-pdf-notes">Notes personnalisées</Label><textarea id="journey-pdf-notes" value={journeyPdfNotes} onChange={(event) => setJourneyPdfNotes(event.target.value.slice(0, 500))} maxLength={500} rows={4} placeholder="Ex. Test pilote du 27/08/2026 — vérifier Excel Desktop avant validation finale." className="w-full border border-[#3A4A42] bg-[#0F1613] p-3 text-sm text-[#EDEAE2] outline-none focus:border-[#C9A15A]" /></div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#3A4A42] text-[#EDEAE2]">Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-[#C9A15A] text-[#0F1613] hover:bg-[#d8b574]" onClick={() => void handleJourneyPdfExport(journeyPdfNotes)} disabled={journeyPdfPending}>{journeyPdfPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}Générer et télécharger</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={purgeRetentionOpen} onOpenChange={setPurgeRetentionOpen}>
        <AlertDialogContent className="border-[#3A4A42] bg-[#16201C] text-[#EDEAE2]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl">Purger les contacts échus ?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#AEB7B0]">Les essais plus anciens que {retentionDays} jours seront supprimés définitivement. Cette action ne supprime pas les codes clients ni les demandes de paiement.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#3A4A42] text-[#EDEAE2]">Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-[#9d554b] text-[#EDEAE2] hover:bg-[#b86a5e]" onClick={() => purgeRetention.mutate()} disabled={purgeRetention.isPending}>{purgeRetention.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}Confirmer la purge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkRelanceOpen} onOpenChange={setBulkRelanceOpen}>
        <AlertDialogContent className="border-[#3A4A42] bg-[#16201C] text-[#EDEAE2]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl">Préparer les relances WhatsApp</AlertDialogTitle>
            <AlertDialogDescription className="text-[#AEB7B0]">{selectedExpiredCodes.length} forfait{selectedExpiredCodes.length > 1 ? "s" : ""} expiré{selectedExpiredCodes.length > 1 ? "s" : ""} sélectionné{selectedExpiredCodes.length > 1 ? "s" : ""}. Ouvre chaque conversation et vérifie le destinataire avant l’envoi.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {selectedExpiredCodes.map((code) => {
              const phone = phoneForCode(code.id);
              return phone ? <a key={code.id} href={buildExpiredRelanceWhatsAppUrl(phone, code.clientName, code.expiresAt, code.monthlyQuota)} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 border border-[#3A4A42] px-3 py-3 text-sm text-[#EDEAE2] hover:border-[#7C9A76] hover:text-[#7C9A76]"><span>{code.clientName}<span className="ml-2 font-mono text-xs text-[#AEB7B0]">{phone}</span></span><span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider"><MessageCircle className="h-4 w-4" aria-hidden="true" />Ouvrir</span></a> : null;
            })}
          </div>
          <AlertDialogFooter><AlertDialogCancel className="border-[#3A4A42] text-[#EDEAE2]">Fermer</AlertDialogCancel></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(codeToRevoke)}
        onOpenChange={(open) => {
          if (!open) setCodeToRevoke(null);
        }}
      >
        <AlertDialogContent className="border-[#3A4A42] bg-[#16201C] text-[#EDEAE2]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl">
              Révoquer ce code client ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#AEB7B0]">
              Le code de <strong className="text-[#EDEAE2]">{codeToRevoke?.clientName}</strong> sera immédiatement désactivé. Cette action ne supprime pas l’historique et ne peut pas être annulée depuis ce panneau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-[#3A4A42] text-[#EDEAE2]"
              onClick={() => setCodeToRevoke(null)}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#9d554b] text-[#EDEAE2] hover:bg-[#b86a5e]"
              onClick={() => {
                if (codeToRevoke) {
                  disable.mutate({ id: codeToRevoke.id });
                }
              }}
              disabled={disable.isPending}
            >
              {disable.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmer la révocation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={csvExportKind !== null} onOpenChange={(open) => { if (!open) setCsvExportKind(null); }}>
        <AlertDialogContent className="border-[#3A4A42] bg-[#16201C] text-[#EDEAE2]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl">Confirmer l’export {csvExportKind === "email" ? "e-mail" : csvExportKind === "combined" ? "combiné" : "WhatsApp Business"}</AlertDialogTitle>
            <AlertDialogDescription className="text-[#AEB7B0]">
              Le fichier contiendra <strong className="text-[#EDEAE2]">{(csvExportKind === "email" ? filteredTrials.filter((trial) => trial.phone === "À compléter" && trial.email !== "À compléter") : csvExportKind === "combined" ? filteredTrials.filter((trial) => trial.phone !== "À compléter" || (trial.email && trial.email !== "À compléter")) : filteredTrials.filter((trial) => trial.phone !== "À compléter")).length} prospect{(csvExportKind === "email" ? filteredTrials.filter((trial) => trial.phone === "À compléter" && trial.email !== "À compléter") : csvExportKind === "combined" ? filteredTrials.filter((trial) => trial.phone !== "À compléter" || (trial.email && trial.email !== "À compléter")) : filteredTrials.filter((trial) => trial.phone !== "À compléter")).length > 1 ? "s" : ""}</strong> correspondant aux filtres actifs. Il sera composé de {csvExportKind === "combined" ? "quatre colonnes : nom, téléphone, e-mail et canal préféré" : `deux colonnes : nom complet et ${csvExportKind === "email" ? "adresse e-mail" : "numéro de téléphone"}`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#3A4A42] text-[#EDEAE2]">Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-[#C9A15A] text-[#0F1613] hover:bg-[#d8b574]" onClick={downloadFilteredTrials}><Download className="mr-2 h-4 w-4" />Confirmer et télécharger</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
