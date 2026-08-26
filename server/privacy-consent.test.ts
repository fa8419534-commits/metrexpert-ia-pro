import { describe, expect, it, beforeEach } from "vitest";
import { listFreeTrialContacts, markFreeTrialUnsubscribed, reserveFreeTrial, resetSecurityStateForTests, unsubscribeFreeTrialContact } from "./security";

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
});
