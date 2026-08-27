import { beforeEach, describe, expect, it } from "vitest";
import { getLastSuccessfulBackupAt, listPurgeRuns, markSuccessfulBackupAt, recordPurgeRun, resetOpsTrackingForTests } from "./opsTracking";

describe("suivi opérationnel Admin", () => {
  beforeEach(() => resetOpsTrackingForTests());

  it("enregistre et relit la date de la dernière sauvegarde réussie", async () => {
    const at = new Date("2026-08-27T10:00:00Z");
    await markSuccessfulBackupAt(at);
    expect((await getLastSuccessfulBackupAt())?.toISOString()).toBe(at.toISOString());
  });

  it("conserve les purges automatiques et leurs statuts dans l’ordre récent", async () => {
    await recordPurgeRun({ runType: "automatic", status: "failed", deletedCount: 0, retentionDays: 365, cutoff: new Date("2025-08-27T00:00:00Z"), errorMessage: "timeout", completedAt: new Date("2026-08-27T10:00:00Z") });
    await recordPurgeRun({ runType: "automatic", status: "success", deletedCount: 3, retentionDays: 365, cutoff: new Date("2025-08-27T00:00:00Z"), completedAt: new Date("2026-08-27T11:00:00Z") });
    const runs = await listPurgeRuns();
    expect(runs).toHaveLength(2);
    expect(runs[0]?.status).toBe("success");
    expect(runs[1]?.errorMessage).toBe("timeout");
  });
});
