import fsp from "node:fs/promises";
import path from "node:path";
import { tmpUploadsDir, tmpRendersDir, tmpPreviewsDir } from "../config.js";
import {
  getTempCleanupScheduleRecord,
  markTempCleanupRun,
  updateTempCleanupScheduleRecord,
  type TempCleanupScheduleRecord,
} from "../../db/temp_cleanup_schedule.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TEMP_DIRS = [tmpUploadsDir, tmpRendersDir, tmpPreviewsDir];

export interface TempCleanupSchedule {
  hour: number;
  days: number[];
  enabled: boolean;
  lastRunAt: number | null;
  nextRunAt: number | null;
}

function normalizeDays(days: number[]): number[] {
  const unique = new Set<number>();
  for (const value of days) {
    if (Number.isInteger(value) && value >= 0 && value <= 6) {
      unique.add(value);
    }
  }
  return Array.from(unique).sort((a, b) => a - b);
}

function validateScheduleInput({
  hour,
  days,
}: {
  hour: number;
  days: number[];
}): { hour: number; days: number[] } {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error("Hour must be an integer between 0 and 23");
  }
  const hasInvalidDay = days.some((value) => !Number.isInteger(value) || value < 0 || value > 6);
  if (hasInvalidDay) {
    throw new Error("Days must be integers between 0 (Sunday) and 6 (Saturday)");
  }
  const normalizedDays = normalizeDays(days);

  return { hour, days: normalizedDays };
}

function computeNextRunDate(record: Pick<TempCleanupScheduleRecord, "hour" | "days">, now = new Date()): Date | null {
  if (!record.days.length) {
    return null;
  }

  const currentDay = now.getDay();
  const currentTime = new Date(now);
  currentTime.setHours(record.hour, 0, 0, 0);

  if (record.days.includes(currentDay) && currentTime.getTime() > now.getTime()) {
    return currentTime;
  }

  for (let offset = 1; offset <= 7; offset++) {
    const candidateDay = (currentDay + offset) % 7;
    if (record.days.includes(candidateDay)) {
      const candidate = new Date(now);
      candidate.setDate(now.getDate() + offset);
      candidate.setHours(record.hour, 0, 0, 0);
      return candidate;
    }
  }

  return null;
}

async function cleanupEntry(entryPath: string, now: number, maxAgeMs: number): Promise<void> {
  const stats = await fsp.lstat(entryPath).catch(() => null);
  if (!stats) return;

  const modifiedAtMs = stats.mtime instanceof Date ? stats.mtime.getTime() : stats.mtimeMs;
  const ageMs = now - modifiedAtMs;
  const isStale = Number.isFinite(ageMs) && ageMs >= maxAgeMs;

  if (stats.isDirectory()) {
    const entries = await fsp.readdir(entryPath, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      await cleanupEntry(path.join(entryPath, entry.name), now, maxAgeMs);
    }
    const remaining = await fsp.readdir(entryPath).catch(() => []);
    if (remaining.length === 0 && isStale) {
      await fsp.rm(entryPath, { recursive: true, force: true }).catch(() => {});
    }
    return;
  }

  if ((stats.isFile() || stats.isSymbolicLink()) && isStale) {
    await fsp.rm(entryPath, { force: true }).catch(() => {});
  }
}

export async function cleanupTempDirectories({
  now = Date.now(),
  maxAgeMs = ONE_DAY_MS,
}: {
  now?: number;
  maxAgeMs?: number;
} = {}): Promise<void> {
  const referenceTime = now;
  for (const dir of TEMP_DIRS) {
    const entries = await fsp.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      await cleanupEntry(path.join(dir, entry.name), referenceTime, maxAgeMs);
    }
  }
}

function toSchedule(record: TempCleanupScheduleRecord, now = new Date()): TempCleanupSchedule {
  const nextRun = computeNextRunDate(record, now);
  return {
    hour: record.hour,
    days: record.days,
    enabled: record.days.length > 0,
    lastRunAt: record.lastRunAt,
    nextRunAt: nextRun ? nextRun.getTime() : null,
  };
}

export async function getTempCleanupSchedule(): Promise<TempCleanupSchedule> {
  const record = getTempCleanupScheduleRecord();
  return toSchedule(record, new Date());
}

export async function setTempCleanupSchedule(input: { hour: number; days: number[] }): Promise<TempCleanupSchedule> {
  const validated = validateScheduleInput(input);
  const record = updateTempCleanupScheduleRecord(validated);
  return toSchedule(record, new Date());
}

export async function runTempCleanupNow(now = Date.now()): Promise<TempCleanupSchedule> {
  await cleanupTempDirectories({ now });
  const record = markTempCleanupRun(now);
  return toSchedule(record, new Date(now));
}

export function getMaxTempCleanupAgeMs(): number {
  return ONE_DAY_MS;
}
