export const SUBSCRIPTION_PLANS = [
  { quota: 5, name: "Essentiel", priceXof: 2000, description: "Pour un besoin ponctuel ou un premier projet." },
  { quota: 15, name: "Professionnel", priceXof: 5000, description: "Pour une activité régulière d’artisan ou d’entrepreneur." },
  { quota: 40, name: "Bureau d’études", priceXof: 12000, description: "Pour un usage fréquent sur plusieurs projets." },
] as const;

export type SubscriptionQuota = (typeof SUBSCRIPTION_PLANS)[number]["quota"];

export function getSubscriptionPlan(quota: number) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.quota === quota) ?? null;
}

export function formatXof(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
}
