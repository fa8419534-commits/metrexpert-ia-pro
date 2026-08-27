import { describe, expect, it, beforeEach } from "vitest";
import {
  getFreeTrialRetentionDays,
  listFreeTrialContacts,
  markFreeTrialUnsubscribed,
  purgeExpiredFreeTrialContacts,
  reserveFreeTrial,
  resetSecurityStateForTests,
  setFreeTrialRetentionDays,
  unsubscribeFreeTrialContact,
} from "./security";

describe("consentement et désinscription des prospects", () => {
  beforeEach(() => resetSecurityStateForTests());

  it("enregistre la date de consentement lors de l’essai", async () => {
    const result = await reserveFreeTrial("Prospect", undefined, "prospect@example.ci", new Date("2026-08-26T10:00:00Z"));
    expect(result.allowed).toBe(true);
    const contacts = await listFreeTrialContacts();
    expect(contacts[0]?.consentedAt?.toISOString()).toBe("2026-08-26T10:00:00.000Z");
    expect(contacts[0]?.unsubscribedAt).toBeNull();
  });

  it("désinscrit un contact via son e-mail et empêche la relance Admin", async () => {
    const result = await reserveFreeTrial("Prospect", undefined, "prospect@example.ci");
    if (!result.allowed) throw new Error("La réservation de test a échoué.");
    const publicResult = await unsubscribeFreeTrialContact(undefined, "prospect@example.ci");
    expect(publicResult.updated).toBe(true);
    let contacts = await listFreeTrialContacts();
    expect(contacts[0]?.unsubscribedAt).toBeInstanceOf(Date);
    await markFreeTrialUnsubscribed(result.contactId);
    contacts = await listFreeTrialContacts();
    expect(contacts[0]?.unsubscribedAt).toBeInstanceOf(Date);
  });

  it("conserve la durée configurée et purge uniquement les essais échus", async () => {
    const oldTrial = await reserveFreeTrial("Ancien prospect", "+225 07 00 00 00 01", undefined, new Date("2025-01-01T10:00:00Z"));
    const recentTrial = await reserveFreeTrial("Prospect récent", "+225 07 00 00 00 02", undefined, new Date("2026-08-20T10:00:00Z"));
    expect(oldTrial.allowed).toBe(true);
    expect(recentTrial.allowed).toBe(true);

    await setFreeTrialRetentionDays(30);
    expect(await getFreeTrialRetentionDays()).toBe(30);

    const result = await purgeExpiredFreeTrialContacts(new Date("2026-08-27T10:00:00Z"));
    expect(result.deletedCount).toBe(1);
    expect((await listFreeTrialContacts()).map((contact) => contact.clientName)).toEqual(["Prospect récent"]);
    expect((await purgeExpiredFreeTrialContacts(new Date("2026-08-27T10:00:00Z"))).deletedCount).toBe(0);
  });

  it("refuse une durée de conservation hors des bornes opérationnelles", async () => {
    await expect(setFreeTrialRetentionDays(29)).rejects.toThrow("30");
    await expect(setFreeTrialRetentionDays(731)).rejects.toThrow("730");
  });
});
