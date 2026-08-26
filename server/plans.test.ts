import { describe, expect, it } from "vitest";
import { SUBSCRIPTION_PLANS, formatXof, getSubscriptionPlan } from "@shared/plans";

describe("forfaits MÉTREXPERT IA PRO", () => {
  it("conserve les quotas et tarifs confirmés", () => {
    expect(SUBSCRIPTION_PLANS.map((plan) => [plan.quota, plan.priceXof])).toEqual([[5, 2000], [15, 5000], [40, 12000]]);
    expect(formatXof(getSubscriptionPlan(15)!.priceXof)).toBe("5 000 FCFA");
  });
});
