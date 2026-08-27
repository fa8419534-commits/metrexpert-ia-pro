import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { purgeExpiredFreeTrialContacts } from "./security";

/**
 * Projet-level cleanup callback. It is intentionally cron-only and idempotent:
 * running it twice removes zero additional rows after the first successful run.
 */
export async function cleanupFreeTrialsHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const result = await purgeExpiredFreeTrialContacts();
    console.info("[Retention] Free-trial cleanup completed", {
      deletedCount: result.deletedCount,
      retentionDays: result.retentionDays,
      cutoff: result.cutoff.toISOString(),
      taskUid: user.taskUid,
    });
    return res.json({ ok: true, ...result, cutoff: result.cutoff.toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Retention] Free-trial cleanup failed", error);
    return res.status(500).json({
      error: message,
      timestamp: new Date().toISOString(),
      context: { url: req.originalUrl },
    });
  }
}
