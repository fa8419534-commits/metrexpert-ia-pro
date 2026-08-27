import { beforeEach, describe, expect, it, vi } from "vitest";
import { sdk } from "./_core/sdk";
import { cleanupFreeTrialsHandler } from "./scheduled";
import { listFreeTrialContacts, reserveFreeTrial, resetSecurityStateForTests, setFreeTrialRetentionDays } from "./security";

vi.mock("./_core/sdk", () => ({
  sdk: { authenticateRequest: vi.fn() },
}));

type FakeResponse = {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

function createResponse(): FakeResponse {
  const response = {} as FakeResponse;
  response.json = vi.fn(() => response);
  response.status = vi.fn(() => response);
  return response;
}

describe("callback planifiée de rétention", () => {
  beforeEach(() => {
    resetSecurityStateForTests();
    vi.mocked(sdk.authenticateRequest).mockReset();
  });

  it("refuse un appel qui ne provient pas d’une tâche planifiée", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({ isCron: false } as never);
    const response = createResponse();

    await cleanupFreeTrialsHandler({ originalUrl: "/api/scheduled/cleanup-free-trials" } as never, response as never);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({ error: "cron-only" });
  });

  it("purge les contacts échus et renvoie un résultat idempotent", async () => {
    await reserveFreeTrial("Ancien", "+225 07 00 00 00 11", undefined, new Date("2025-01-01T10:00:00Z"));
    await reserveFreeTrial("Récent", "+225 07 00 00 00 12", undefined, new Date("2026-08-20T10:00:00Z"));
    await setFreeTrialRetentionDays(30);
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({ isCron: true, taskUid: "task-retention" } as never);
    const response = createResponse();

    await cleanupFreeTrialsHandler({ originalUrl: "/api/scheduled/cleanup-free-trials" } as never, response as never);

    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, deletedCount: 1, retentionDays: 30 }));
    expect((await listFreeTrialContacts()).map((contact) => contact.clientName)).toEqual(["Récent"]);
  });
});
