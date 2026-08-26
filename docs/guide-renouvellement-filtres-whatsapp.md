# Guide pratique — renouvellement, filtres Admin et messages WhatsApp

Ce guide décrit le fonctionnement actuellement retenu pour MÉTREXPERT IA PRO. Les quotas et tarifs sont centralisés : **5 générations = 2 000 FCFA**, **15 générations = 5 000 FCFA**, **40 générations = 12 000 FCFA**. Le renouvellement reste soumis à une vérification manuelle du paiement.

## 1. Bouton de renouvellement rapide

Le bouton ne valide pas un paiement et ne crée pas de code automatiquement. Il sélectionne le forfait actuel dans le formulaire de paiement, puis fait défiler l’utilisateur vers ce formulaire.

```tsx
import { RefreshCw } from "lucide-react";

type RenewalButtonProps = {
  currentQuota: 5 | 15 | 40;
};

export function RenewalButton({ currentQuota }: RenewalButtonProps) {
  function handleRenewal() {
    window.dispatchEvent(
      new CustomEvent("metrexpert:renew", {
        detail: { planQuota: currentQuota },
      }),
    );

    document.getElementById("paiement")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <button type="button" onClick={handleRenewal}>
      <RefreshCw aria-hidden="true" />
      Renouveler mon forfait
    </button>
  );
}
```

Le formulaire `PaymentRequestPanel` écoute ensuite l’événement et n’accepte que les quotas autorisés :

```tsx
useEffect(() => {
  const handleRenewal = (event: Event) => {
    const quota = (event as CustomEvent<{ planQuota?: number }>)
      .detail?.planQuota;

    if (quota === 5 || quota === 15 || quota === 40) {
      setPlanQuota(quota);
    }
  };

  window.addEventListener("metrexpert:renew", handleRenewal);
  return () => window.removeEventListener("metrexpert:renew", handleRenewal);
}, []);
```

La procédure serveur doit continuer à recalculer le montant à partir du quota reçu. Le prix affiché dans le navigateur ne doit jamais être considéré comme une preuve de paiement.

## 2. Filtres du tableau Admin

Les demandes de paiement et les codes clients utilisent deux filtres indépendants. Cela évite de confondre un paiement à vérifier avec un forfait déjà actif.

### Filtrer les demandes de paiement

```tsx
type PaymentFilter = "all" | "pending" | "confirmed" | "rejected";

const [paymentFilter, setPaymentFilter] =
  useState<PaymentFilter>("all");

const filteredPaymentRequests =
  paymentRequests.data?.filter((request) =>
    paymentFilter === "all" || request.status === paymentFilter,
  ) ?? [];
```

Les valeurs correspondent aux statuts serveur suivants : `pending` pour **En attente**, `confirmed` pour **Confirmé** et `rejected` pour **Refusé**. Les boutons doivent utiliser `aria-pressed` afin que le filtre actif soit compréhensible au clavier et par les technologies d’assistance.

```tsx
const filters = [
  ["all", "Tous"],
  ["pending", "En attente"],
  ["confirmed", "Confirmés"],
  ["rejected", "Refusés"],
] as const;

{filters.map(([value, label]) => (
  <Button
    key={value}
    type="button"
    variant="outline"
    aria-pressed={paymentFilter === value}
    onClick={() => setPaymentFilter(value)}
  >
    {label}
  </Button>
))}
```

Le tableau doit parcourir `filteredPaymentRequests`, et non `paymentRequests.data`, sinon le bouton changerait seulement le compteur sans filtrer les lignes.

### Afficher les expirations proches

```tsx
type CodeFilter = "all" | "expiring";
const [codeFilter, setCodeFilter] = useState<CodeFilter>("all");

const filteredCodes = codes.data?.filter((code) => {
  if (codeFilter === "all") return true;

  const daysRemaining =
    (new Date(code.expiresAt).getTime() - Date.now()) /
    (24 * 60 * 60 * 1000);

  return (
    !code.disabledAt &&
    daysRemaining >= 0 &&
    daysRemaining <= 7
  );
}) ?? [];
```

Le bouton **Expirent sous 7 jours** permet de prioriser les relances. L’expiration réelle doit toujours être contrôlée côté serveur ; ce filtre sert à l’affichage Admin et ne prolonge aucun accès.

| Filtre | Utilité |
|---|---|
| Tous | Afficher toute la file |
| En attente | Vérifier les paiements à traiter |
| Confirmés | Consulter les forfaits activés |
| Refusés | Revoir les demandes non validées |
| Expirent sous 7 jours | Préparer les renouvellements proches |

## 3. Copier le code et ouvrir WhatsApp

Après confirmation d’un paiement, Admin conserve temporairement le code activé dans `revealedCode` et le destinataire dans `revealedCodeRecipient`. Le bouton de copie utilise l’API presse-papiers :

```tsx
async function copyRevealedCode() {
  if (!revealedCode) return;
  await navigator.clipboard.writeText(revealedCode);
  setCopyState("copied");
}
```

Le lien WhatsApp doit être construit avec `encodeURIComponent` pour protéger le nom et le message :

```tsx
function buildActivatedCodeWhatsAppUrl(
  phone: string,
  clientName: string,
  code: string,
) {
  const message = `Bonjour ${clientName}, votre paiement est confirmé. Votre code d’accès MÉTREXPERT IA PRO est : ${code}.`;
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
```

Le bouton ouvre une nouvelle fenêtre avec `target="_blank"` et `rel="noreferrer"`. L’ouverture du lien ne doit pas être présentée comme un envoi automatique : Daouda relit le message et l’envoie manuellement.

## 4. Messages WhatsApp prêts à l’emploi

### Activation complète

```text
Bonjour {NOM_CLIENT},

Votre paiement de {MONTANT} FCFA pour le forfait {NOM_FORFAIT} a été vérifié.

Votre accès MÉTREXPERT IA PRO est activé pour {QUOTA} générations, jusqu’au {DATE_EXPIRATION}.

Votre code d’accès : {CODE_CLIENT}

Lien d’accès : {LIEN_ETUDE}

Merci de conserver ce code. Pensez à vérifier les hypothèses, les unités et les contrôles du fichier Excel avant tout usage professionnel.

Daouda Sidibé
MÉTREXPERT IA PRO
WhatsApp : 01 51 61 05 12
```

### Message court

```text
Bonjour {NOM_CLIENT}, votre paiement est confirmé.

Forfait : {NOM_FORFAIT}
Quota : {QUOTA} générations
Valable jusqu’au : {DATE_EXPIRATION}
Code : {CODE_CLIENT}

Accès : {LIEN_ETUDE}

Daouda — MÉTREXPERT IA PRO
```

### Renouvellement confirmé

```text
Bonjour {NOM_CLIENT},

Votre renouvellement est confirmé. Votre forfait {NOM_FORFAIT} comprend {QUOTA} nouvelles générations et reste valable jusqu’au {DATE_EXPIRATION}.

Code d’accès : {CODE_CLIENT}

Vous pouvez ouvrir l’espace de génération ici : {LIEN_ETUDE}

Daouda Sidibé — MÉTREXPERT IA PRO
```

### Paiement en attente

```text
Bonjour {NOM_CLIENT},

Votre référence {REFERENCE} pour le forfait {NOM_FORFAIT} a bien été reçue. La demande est en cours de vérification.

Le forfait et le code ne sont pas encore activés. Je vous confirmerai la décision après contrôle.

Daouda — MÉTREXPERT IA PRO
```

### Paiement refusé

```text
Bonjour {NOM_CLIENT},

La référence {REFERENCE} n’a pas pu être validée pour le moment. Aucun accès n’a été activé.

Merci de vérifier la référence ou de transmettre une preuve lisible du transfert. Ne partagez jamais de mot de passe ni de clé secrète.

Daouda — MÉTREXPERT IA PRO
```

### Rappel avant expiration

```text
Bonjour {NOM_CLIENT},

Votre forfait MÉTREXPERT IA PRO expire le {DATE_EXPIRATION}, dans {JOURS_RESTANTS} jour(s). Il vous reste {QUOTA_RESTANT} génération(s).

Pour renouveler, utilisez le bouton « Renouveler mon forfait » dans votre espace client ou contactez-moi directement sur WhatsApp.

Daouda — MÉTREXPERT IA PRO
```

## 5. Règles de sécurité

Le code ne doit être transmis qu’après confirmation du paiement. Une confirmation doit rester idempotente afin qu’un double clic ne crée pas deux accès. Les messages ne doivent jamais contenir de clé API, de mot de passe Admin ou d’information bancaire sensible.

Tant qu’aucun fournisseur officiel n’est configuré, la solution recommandée est une alerte dans l’application et un message WhatsApp prérempli relu manuellement. Pour un envoi automatique futur, il faudra ajouter un fournisseur, une clé conservée côté serveur, le consentement du client, un mécanisme de désinscription, un journal des envois et une protection contre les doublons.

## Références internes

- `client/src/components/ClientSubscriptionPanel.tsx` — tableau client et bouton de renouvellement.
- `client/src/components/PaymentRequestPanel.tsx` — formulaire de paiement et sélection du forfait.
- `client/src/pages/Admin.tsx` — filtres, copie du code et lien WhatsApp.
- `shared/plans.ts` — source unique des quotas et tarifs.
- `server/paymentRequests.ts` — demandes, statuts et activation idempotente.
