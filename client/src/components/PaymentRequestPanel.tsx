import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, Copy, Send, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { SUBSCRIPTION_PLANS, type SubscriptionQuota, formatXof } from "@shared/plans";
import { toast } from "sonner";

const STORAGE_KEY = "metrexpert_payment_request_key";

const PAYMENT_ACCOUNTS = [
  { method: "wave", label: "Wave", number: "0151610512", holder: "SIDIBE DAOUDA" },
  { method: "moov", label: "Moov Money", number: "0151610512", holder: "SIDIBE DAOUDA" },
  { method: "mtn", label: "MTN Money", number: "0555067892", holder: "ISSIA" },
] as const;

type PaymentMethod = "wave" | "moov" | "mtn" | "autre";

export default function PaymentRequestPanel() {
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [planQuota, setPlanQuota] = useState<SubscriptionQuota>(15);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wave");
  const [paymentReference, setPaymentReference] = useState("");
  const [requestKey, setRequestKey] = useState(() => sessionStorage.getItem(STORAGE_KEY) || "");
  const [message, setMessage] = useState("");
  const [submissionConfirmed, setSubmissionConfirmed] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofMessage, setProofMessage] = useState("");
  const observedStatus = useRef<string | undefined>(undefined);
  const submit = trpc.security.submitPaymentRequest.useMutation({
    onSuccess: (result) => {
      sessionStorage.setItem(STORAGE_KEY, result.requestKey);
      setRequestKey(result.requestKey);
      setSubmissionConfirmed(true);
      setMessage("Votre demande est enregistrée. Vous serez informé ici après vérification du paiement.");
    },
    onError: (error) => setMessage(error.message || "Impossible d’enregistrer la demande."),
  });
  const status = trpc.security.getPaymentRequest.useQuery({ requestKey }, { enabled: requestKey.length >= 16, refetchInterval: requestKey.length >= 16 ? 10000 : false });
  const uploadProof = trpc.security.uploadPaymentProof.useMutation({
    onSuccess: () => { setProofFile(null); setProofMessage("Capture reçue. Elle sera examinée avec votre demande de paiement."); void status.refetch(); },
    onError: (error) => setProofMessage(error.message || "Impossible d’envoyer la capture."),
  });

  useEffect(() => {
    const nextStatus = status.data?.status;
    if (!nextStatus) return;
    if (nextStatus === "confirmed") {
      setMessage("Paiement confirmé : votre forfait est activé. Daouda vous transmettra votre code d’accès.");
      if (observedStatus.current && observedStatus.current !== "confirmed") toast.success("Paiement confirmé : votre forfait est activé.", { icon: <CheckCircle2 className="h-5 w-5 text-[#7C9A76]" aria-hidden="true" />, className: "border-[#7C9A76] bg-[#E4F0E1] text-[#244326]" });
    }
    if (nextStatus === "rejected") setMessage("La demande a été refusée. Vérifiez la référence ou contactez MÉTREXPERT IA PRO.");
    observedStatus.current = nextStatus;
  }, [status.data?.status]);

  useEffect(() => {
    const planParam = new URLSearchParams(window.location.search).get("plan");
    const parsedPlan = Number(planParam);
    if (parsedPlan === 5 || parsedPlan === 15 || parsedPlan === 40) setPlanQuota(parsedPlan);
  }, []);

  useEffect(() => {
    const handleRenewal = (event: Event) => {
      const planValue = (event as CustomEvent<{ planQuota?: SubscriptionQuota }>).detail?.planQuota;
      if (planValue === 5 || planValue === 15 || planValue === 40) setPlanQuota(planValue);
    };
    window.addEventListener("metrexpert:renew", handleRenewal);
    return () => window.removeEventListener("metrexpert:renew", handleRenewal);
  }, []);

  function submitRequest(event: React.FormEvent) {
    event.preventDefault();
    setSubmissionConfirmed(false);
    submit.mutate({ clientName, phone, email: email || undefined, planQuota, paymentMethod, paymentReference });
  }

  function submitProof() {
    if (!requestKey || !proofFile) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(proofFile.type) || proofFile.size > 5 * 1024 * 1024) {
      setProofMessage("Choisissez une image PNG, JPEG ou WEBP de 5 Mo maximum.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) { setProofMessage("La capture ne peut pas être lue."); return; }
      uploadProof.mutate({ requestKey, fileName: proofFile.name, dataUrl });
    };
    reader.onerror = () => setProofMessage("La lecture de la capture a échoué.");
    reader.readAsDataURL(proofFile);
  }

  async function copyPaymentNumber(number: string, label: string) {
    try {
      await navigator.clipboard.writeText(number);
      toast.success(`${label} copié : ${number}`);
    } catch {
      toast.error("Copie impossible. Sélectionnez le numéro manuellement.");
    }
  }

  const plan = SUBSCRIPTION_PLANS.find((item) => item.quota === planQuota)!;
  const currentStatus = status.data?.status;
  const selectedPaymentAccount = PAYMENT_ACCOUNTS.find((account) => account.method === paymentMethod);

  return <section id="paiement" className="border-y border-[#CBD0C8] bg-[#E8E4DA] py-16"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12"><div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start"><div><p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#A8792F]">Paiement manuel</p><h2 className="mt-4 font-serif text-4xl leading-tight text-[#17221D] sm:text-5xl">Après votre transfert, envoyez la référence.</h2><p className="mt-5 max-w-md text-sm leading-6 text-[#5D6A62]">Choisissez votre forfait, payez par Wave, Moov Money ou MTN Money, puis transmettez la référence de transaction. La validation reste contrôlée manuellement.</p><div className="mt-7 border border-[#B9C0B8] bg-[#F4F0E8] p-5"><p className="font-mono text-[10px] uppercase tracking-wider text-[#A8792F]">Forfait sélectionné</p><p className="mt-3 font-serif text-3xl text-[#17221D]">{plan.name}</p><p className="mt-1 font-mono text-sm text-[#526159]">{plan.quota} générations · {formatXof(plan.priceXof)}</p><div className="mt-5 border-t border-[#B9C0B8] pt-5"><p className="font-mono text-[10px] uppercase tracking-wider text-[#A8792F]">Coordonnées de réception</p><div className="mt-3 space-y-2">{PAYMENT_ACCOUNTS.map((account) => <div key={account.method} className={`flex items-center justify-between gap-3 border p-3 ${account.method === paymentMethod ? "border-[#A8792F] bg-[#EEE8DC]" : "border-[#D0D0C6] bg-[#F4F0E8]"}`}><div><p className="font-mono text-[10px] uppercase tracking-wider text-[#526159]">{account.label}</p><p className="mt-1 font-mono text-base text-[#17221D]">{account.number}</p><p className="text-xs text-[#5D6A62]">Titulaire : {account.holder}</p></div><button type="button" onClick={() => void copyPaymentNumber(account.number, account.label)} className="inline-flex shrink-0 items-center gap-2 border border-[#B9C0B8] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#526159] hover:border-[#A8792F] hover:text-[#17221D]" aria-label={`Copier le numéro ${account.label}`}><Copy className="h-3.5 w-3.5" aria-hidden="true" />Copier</button></div>)}</div><p className="mt-3 text-xs leading-5 text-[#5D6A62]">Récapitulatif : <strong className="text-[#17221D]">{plan.name}</strong> · <strong className="font-mono text-[#17221D]">{formatXof(plan.priceXof)}</strong> à transférer par {selectedPaymentAccount?.label ?? "le moyen choisi"}{selectedPaymentAccount ? ` au ${selectedPaymentAccount.number}` : ""}.</p><div className="mt-3 border border-[#B98A44] bg-[#F7EEDC] p-3 text-xs leading-5 text-[#5D4930]" role="note"><strong>Sécurité :</strong> vérifiez le nom du bénéficiaire avant de valider le transfert. Ne communiquez jamais votre code PIN. MÉTREXPERT IA PRO ne demande pas de code secret ; envoyez uniquement la référence de transaction après paiement.</div></div></div></div><form onSubmit={submitRequest} className="border border-[#B9C0B8] bg-[#F4F0E8] p-6 sm:p-8"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-[#526159]">Nom complet<input required value={clientName} onChange={(event) => setClientName(event.target.value)} className="mt-2 h-11 w-full border border-[#B9C0B8] bg-transparent px-3 text-[#17221D]" /></label><label className="text-sm text-[#526159]">Téléphone<input required value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 h-11 w-full border border-[#B9C0B8] bg-transparent px-3 text-[#17221D]" placeholder="+225…" /></label><label className="text-sm text-[#526159]">E-mail (facultatif)<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full border border-[#B9C0B8] bg-transparent px-3 text-[#17221D]" /></label><label className="text-sm text-[#526159]">Forfait<select value={planQuota} onChange={(event) => setPlanQuota(Number(event.target.value) as SubscriptionQuota)} className="mt-2 h-11 w-full border border-[#B9C0B8] bg-[#F4F0E8] px-3 text-[#17221D]">{SUBSCRIPTION_PLANS.map((item) => <option key={item.quota} value={item.quota}>{item.name} — {formatXof(item.priceXof)}</option>)}</select></label><label className="text-sm text-[#526159]">Moyen utilisé<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)} className="mt-2 h-11 w-full border border-[#B9C0B8] bg-[#F4F0E8] px-3 text-[#17221D]"><option value="wave">Wave</option><option value="moov">Moov Money</option><option value="mtn">MTN Money</option><option value="autre">Autre</option></select></label><label className="text-sm text-[#526159]">Référence de transaction<input required minLength={3} value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} className="mt-2 h-11 w-full border border-[#B9C0B8] bg-transparent px-3 text-[#17221D]" placeholder="Ex. TX-123456" /></label></div><button disabled={submit.isPending} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 bg-[#17221D] px-5 font-mono text-[10px] uppercase tracking-wider text-[#F4F0E8] disabled:opacity-60"><Send className="h-4 w-4" aria-hidden="true" />{submit.isPending ? "Enregistrement…" : "Envoyer ma référence"}</button>{requestKey && <div className="mt-5 border-t border-[#B9C0B8] pt-5"><p className="font-mono text-[10px] uppercase tracking-wider text-[#A8792F]">Preuve de transfert (facultatif)</p><p className="mt-2 text-xs leading-5 text-[#5D6A62]">Vous pouvez joindre une capture d’écran de votre transfert Mobile Money pour faciliter la vérification Admin. PNG, JPEG ou WEBP, 5 Mo maximum. Masquez vos informations sensibles inutiles.</p><div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { setProofFile(event.target.files?.[0] ?? null); setProofMessage(""); }} className="block w-full text-xs text-[#526159] file:mr-3 file:border-0 file:bg-[#17221D] file:px-3 file:py-2 file:font-mono file:text-[10px] file:uppercase file:text-[#F4F0E8]" aria-label="Capture de preuve de paiement" /><button type="button" onClick={submitProof} disabled={!proofFile || uploadProof.isPending} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 border border-[#A8792F] px-4 font-mono text-[10px] uppercase tracking-wider text-[#526159] disabled:opacity-50">{uploadProof.isPending ? "Envoi…" : "Envoyer la capture"}</button></div>{proofMessage && <p className="mt-2 text-xs text-[#526159]" role="status" aria-live="polite">{proofMessage}</p>}</div>}{submissionConfirmed && <div className="mt-4 flex items-start gap-3 border border-[#7C9A76] bg-[#E4EEE1] p-4 text-sm text-[#25402A] motion-safe:animate-pulse" role="status" aria-live="polite"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><div><p className="font-mono text-[10px] uppercase tracking-wider">Référence reçue</p><p className="mt-1">Votre demande est bien enregistrée. Vous pourrez suivre sa validation ci-dessous.</p></div></div>}{requestKey && <div className="mt-5 border-t border-[#B9C0B8] pt-5" role="status"><p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#A8792F]">{currentStatus === "confirmed" ? <CheckCircle2 className="h-4 w-4 text-[#7C9A76]" /> : currentStatus === "rejected" ? <XCircle className="h-4 w-4 text-[#A85D51]" /> : <Clock3 className="h-4 w-4" />}Statut : {currentStatus === "confirmed" ? "Confirmé" : currentStatus === "rejected" ? "Refusé" : "En attente"}</p><p className="mt-2 text-sm leading-6 text-[#5D6A62]">{message || "Votre demande est en cours de vérification."}</p></div>}{message && !requestKey && <p className="mt-4 text-sm text-[#5D6A62]" role="status">{message}</p>}</form></div></div></section>;
}
