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
  Download,
  KeyRound,
  Loader2,
  MessageCircle,
  ShieldCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import React, { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";

const quotaOptions = [5, 15, 40] as const;

function buildWhatsAppUrl(phone: string, clientName: string) {
  const digits = phone.replace(/\D/g, "");
  const internationalPhone = digits.startsWith("0") ? `225${digits.slice(1)}` : digits;
  const message = `Bonjour ${clientName}, merci pour votre intérêt pour MÉTREXPERT IA PRO. Je reste disponible pour échanger sur votre étude de métré et votre abonnement.`;
  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`;
}

type CsvTrial = { clientName: string; phone: string; email?: string };

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
  ].map((row) => row.map((value) => escape(String(value))).join(";")) .join("\r\n");
}

type CodeToRevoke = { id: number; clientName: string } | null;

export default function Admin() {
  const [adminCode, setAdminCode] = useState("");
  const [clientName, setClientName] = useState("");
  const [monthlyQuota, setMonthlyQuota] =
    useState<(typeof quotaOptions)[number]>(15);
  const [revealedCode, setRevealedCode] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [sessionUnlocked, setSessionUnlocked] = useState(false);
  const [codeToRevoke, setCodeToRevoke] = useState<CodeToRevoke>(null);
  const [trialFilter, setTrialFilter] = useState<"all" | "followup" | "converted">("all");
  const [trialStartDate, setTrialStartDate] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem("metrexpert.trials.startDate") ?? "");
  const [trialEndDate, setTrialEndDate] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem("metrexpert.trials.endDate") ?? "");
  const [csvExportKind, setCsvExportKind] = useState<"whatsapp" | "email" | "combined" | null>(null);

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

  const login = trpc.security.verifyAdminCode.useMutation({
    onSuccess: () => {
      setSessionUnlocked(true);
      void adminStatus.refetch();
      toast.success("Accès administrateur ouvert pour cette session.");
    },
    onError: (error) => toast.error(error.message),
  });

  const codes = trpc.security.adminListCodes.useQuery(undefined, {
    enabled: isAdminUnlocked,
  });
  const trials = trpc.security.adminListFreeTrials.useQuery(undefined, {
    enabled: isAdminUnlocked,
  });

  const create = trpc.security.adminCreateCode.useMutation({
    onSuccess: (data) => {
      setClientName("");
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

  const activeCodesCount =
    codes.data?.filter(
      (code) =>
        !code.disabledAt && new Date(code.expiresAt).getTime() > Date.now(),
    ).length ?? 0;
  const invalidDateRange = Boolean(trialStartDate && trialEndDate && trialStartDate > trialEndDate);
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
    create.mutate({ clientName, monthlyQuota });
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
              <span className="border border-[#7C9A76] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#7C9A76]">
                Session protégée
              </span>
            </div>
          </div>
        </header>

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
                    <option value={5}>5 générations</option>
                    <option value={15}>15 générations</option>
                    <option value={40}>40 générations</option>
                  </select>
                  <p className="mt-2 text-xs text-[#AEB7B0]">
                    Expiration automatique : un mois après la création.
                  </p>
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
            <CardHeader>
              <CardTitle className="font-serif text-2xl">
                Codes actifs et historiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              {codes.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-[#AEB7B0]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des accès…
                </div>
              ) : codes.data?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="border-b border-[#3A4A42] font-mono text-[10px] uppercase tracking-wider text-[#C9A15A]">
                      <tr>
                        <th className="px-3 py-3">Client</th>
                        <th className="px-3 py-3">Quota restant</th>
                        <th className="px-3 py-3">Expiration</th>
                        <th className="px-3 py-3">État</th>
                        <th className="px-3 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.data.map((code) => {
                        const disabled =
                          Boolean(code.disabledAt) ||
                          new Date(code.expiresAt).getTime() <= Date.now();
                        return (
                          <tr
                            key={code.id}
                            className="border-b border-[#3A4A42]/70"
                          >
                            <td className="px-3 py-4 font-medium">
                              {code.clientName}
                            </td>
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
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-8 text-sm text-[#AEB7B0]">
                  Aucun code client créé.
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
      </div>

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
