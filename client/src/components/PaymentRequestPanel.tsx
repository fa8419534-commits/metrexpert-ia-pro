import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Send, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { SUBSCRIPTION_PLANS, type SubscriptionQuota, formatXof } from "@shared/plans";

const STORAGE_KEY = "metrexpert_payment_request_key";

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
  const submit = trpc.security.submitPaymentRequest.useMutation({
    onSuccess: (result) => {
      sessionStorage.setItem(STORAGE_KEY, result.requestKey);
      setRequestKey(result.requestKey);
      setMessage("Votre demande est enregistrée. Vous serez informé ici après vérification du paiement.");
    },
    onError: (error) => setMessage(error.message || "Impossible d’enregistrer la demande."),
  });
  const status = trpc.security.getPaymentRequest.useQuery({ requestKey }, { enabled: requestKey.length >= 16, refetchInterval: requestKey.length >= 16 ? 10000 : false });

  useEffect(() => {
    if (status.data?.status === "confirmed") setMessage("Paiement confirmé : votre forfait est activé. Daouda vous transmettra votre code d’accès.");
    if (status.data?.status === "rejected") setMessage("La demande a été refusée. Vérifiez la référence ou contactez MÉTREXPERT IA PRO.");
  }, [status.data?.status]);

  function submitRequest(event: React.FormEvent) {
    event.preventDefault();
    submit.mutate({ clientName, phone, email: email || undefined, planQuota, paymentMethod, paymentReference });
  }

  const plan = SUBSCRIPTION_PLANS.find((item) => item.quota === planQuota)!;
  const currentStatus = status.data?.status;

  return <section id="paiement" className="border-y border-[#CBD0C8] bg-[#E8E4DA] py-16"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12"><div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start"><div><p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#A8792F]">Paiement manuel</p><h2 className="mt-4 font-serif text-4xl leading-tight text-[#17221D] sm:text-5xl">Après votre transfert, envoyez la référence.</h2><p className="mt-5 max-w-md text-sm leading-6 text-[#5D6A62]">Choisissez votre forfait, payez par Wave, Moov Money ou MTN Money, puis transmettez la référence de transaction. La validation reste contrôlée manuellement.</p><div className="mt-7 border border-[#B9C0B8] bg-[#F4F0E8] p-5"><p className="font-mono text-[10px] uppercase tracking-wider text-[#A8792F]">Forfait sélectionné</p><p className="mt-3 font-serif text-3xl text-[#17221D]">{plan.name}</p><p className="mt-1 font-mono text-sm text-[#526159]">{plan.quota} générations · {formatXof(plan.priceXof)}</p></div></div><form onSubmit={submitRequest} className="border border-[#B9C0B8] bg-[#F4F0E8] p-6 sm:p-8"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-[#526159]">Nom complet<input required value={clientName} onChange={(event) => setClientName(event.target.value)} className="mt-2 h-11 w-full border border-[#B9C0B8] bg-transparent px-3 text-[#17221D]" /></label><label className="text-sm text-[#526159]">Téléphone<input required value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 h-11 w-full border border-[#B9C0B8] bg-transparent px-3 text-[#17221D]" placeholder="+225…" /></label><label className="text-sm text-[#526159]">E-mail (facultatif)<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full border border-[#B9C0B8] bg-transparent px-3 text-[#17221D]" /></label><label className="text-sm text-[#526159]">Forfait<select value={planQuota} onChange={(event) => setPlanQuota(Number(event.target.value) as SubscriptionQuota)} className="mt-2 h-11 w-full border border-[#B9C0B8] bg-[#F4F0E8] px-3 text-[#17221D]">{SUBSCRIPTION_PLANS.map((item) => <option key={item.quota} value={item.quota}>{item.name} — {formatXof(item.priceXof)}</option>)}</select></label><label className="text-sm text-[#526159]">Moyen utilisé<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)} className="mt-2 h-11 w-full border border-[#B9C0B8] bg-[#F4F0E8] px-3 text-[#17221D]"><option value="wave">Wave</option><option value="moov">Moov Money</option><option value="mtn">MTN Money</option><option value="autre">Autre</option></select></label><label className="text-sm text-[#526159]">Référence de transaction<input required minLength={3} value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} className="mt-2 h-11 w-full border border-[#B9C0B8] bg-transparent px-3 text-[#17221D]" placeholder="Ex. TX-123456" /></label></div><button disabled={submit.isPending} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 bg-[#17221D] px-5 font-mono text-[10px] uppercase tracking-wider text-[#F4F0E8] disabled:opacity-60"><Send className="h-4 w-4" aria-hidden="true" />{submit.isPending ? "Enregistrement…" : "Envoyer ma référence"}</button>{requestKey && <div className="mt-5 border-t border-[#B9C0B8] pt-5" role="status"><p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#A8792F]">{currentStatus === "confirmed" ? <CheckCircle2 className="h-4 w-4 text-[#7C9A76]" /> : currentStatus === "rejected" ? <XCircle className="h-4 w-4 text-[#A85D51]" /> : <Clock3 className="h-4 w-4" />}Statut : {currentStatus === "confirmed" ? "Confirmé" : currentStatus === "rejected" ? "Refusé" : "En attente"}</p><p className="mt-2 text-sm leading-6 text-[#5D6A62]">{message || "Votre demande est en cours de vérification."}</p></div>}{message && !requestKey && <p className="mt-4 text-sm text-[#5D6A62]" role="status">{message}</p>}</form></div></div></section>;
}
