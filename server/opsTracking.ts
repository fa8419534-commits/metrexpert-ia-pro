import { desc, eq } from "drizzle-orm";
import { adminSettings, purgeRuns } from "../drizzle/schema";
import { getDb } from "./db";

const BACKUP_SETTING_KEY = "last_successful_backup_at";
const isTestRuntime = process.env.NODE_ENV === "test" || process.env.VITEST === "true" || Boolean(process.env.VITEST_WORKER_ID) || process.argv.some((argument) => argument.includes("vitest"));

type PurgeRunInput = {
  runType: "manual" | "automatic";
  status: "success" | "failed";
  deletedCount: number;
  retentionDays: number;
  cutoff: Date;
  taskUid?: string | null;
  errorMessage?: string | null;
  startedAt?: Date;
  completedAt?: Date;
};

let memoryLastSuccessfulBackupAt: Date | null = null;
let memoryPurgeRuns: Array<PurgeRunInput & { id: number; startedAt: Date; completedAt: Date }> = [];
let nextMemoryPurgeRunId = 1;

export function resetOpsTrackingForTests() {
  memoryLastSuccessfulBackupAt = null;
  memoryPurgeRuns = [];
  nextMemoryPurgeRunId = 1;
}

export async function getLastSuccessfulBackupAt() {
  const db = isTestRuntime ? null : await getDb();
  if (!db) return memoryLastSuccessfulBackupAt;
  const row = (await db.select({ settingValue: adminSettings.settingValue }).from(adminSettings).where(eq(adminSettings.settingKey, BACKUP_SETTING_KEY)).limit(1))[0];
  return row?.settingValue ? new Date(row.settingValue) : null;
}

export async function markSuccessfulBackupAt(at = new Date()) {
  const db = isTestRuntime ? null : await getDb();
  if (!db) {
    memoryLastSuccessfulBackupAt = at;
    return at;
  }
  await db.insert(adminSettings).values({ settingKey: BACKUP_SETTING_KEY, settingValue: at.toISOString() }).onDuplicateKeyUpdate({ set: { settingValue: at.toISOString() } });
  return at;
}

export async function recordPurgeRun(input: PurgeRunInput) {
  const startedAt = input.startedAt ?? new Date();
  const completedAt = input.completedAt ?? new Date();
  const db = isTestRuntime ? null : await getDb();
  if (!db) {
    const row = { ...input, id: nextMemoryPurgeRunId++, startedAt, completedAt };
    memoryPurgeRuns.unshift(row);
    return row;
  }
  const result = await db.insert(purgeRuns).values({ ...input, taskUid: input.taskUid ?? null, errorMessage: input.errorMessage ?? null, startedAt, completedAt });
  return { ...input, id: Number(result[0].insertId), startedAt, completedAt };
}

export async function listPurgeRuns(limit = 30) {
  const db = isTestRuntime ? null : await getDb();
  if (!db) return memoryPurgeRuns.slice(0, limit);
  return db.select().from(purgeRuns).orderBy(desc(purgeRuns.completedAt)).limit(Math.min(Math.max(limit, 1), 100));
}
