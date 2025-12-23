import { getDb } from "./client.js";

export interface TempCleanupScheduleRecord {
  hour: number;
  days: number[];
  lastRunAt: number | null;
  createdAt: number;
  updatedAt: number;
}

interface TempCleanupScheduleRow {
  id: string;
  hour: number;
  days: string;
  last_run_at: number | null;
  created_at: number;
  updated_at: number;
}

const DEFAULT_HOUR = 3;

function normalizeDays(days: unknown): number[] {
  if (!Array.isArray(days)) return [];
  const unique = new Set<number>();
  for (const value of days) {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 6) {
      unique.add(parsed);
    }
  }
  return Array.from(unique).sort((a, b) => a - b);
}

function ensureScheduleRow(): void {
  const db = getDb();
  const existing = db
    .prepare<unknown[], TempCleanupScheduleRow>(
      `SELECT id, hour, days, last_run_at, created_at, updated_at FROM temp_cleanup_schedule WHERE id = ? LIMIT 1`
    )
    .get("default");
  if (existing) return;

  const now = Date.now();
  db.prepare(
    `INSERT INTO temp_cleanup_schedule (id, hour, days, last_run_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run("default", DEFAULT_HOUR, "[]", null, now, now);
}

function mapRow(row: TempCleanupScheduleRow): TempCleanupScheduleRecord {
  let parsedDays: unknown = [];
  try {
    parsedDays = JSON.parse(row.days);
  } catch {
    parsedDays = [];
  }
  return {
    hour: row.hour,
    days: normalizeDays(parsedDays),
    lastRunAt: row.last_run_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getTempCleanupScheduleRecord(): TempCleanupScheduleRecord {
  ensureScheduleRow();
  const db = getDb();
  const row = db
    .prepare<unknown[], TempCleanupScheduleRow>(
      `SELECT id, hour, days, last_run_at, created_at, updated_at FROM temp_cleanup_schedule WHERE id = ? LIMIT 1`
    )
    .get("default");
  if (!row) {
    const now = Date.now();
    return { hour: DEFAULT_HOUR, days: [], lastRunAt: null, createdAt: now, updatedAt: now };
  }
  return mapRow(row);
}

export function updateTempCleanupScheduleRecord({
  hour,
  days,
  now = Date.now(),
}: {
  hour: number;
  days: number[];
  now?: number;
}): TempCleanupScheduleRecord {
  ensureScheduleRow();
  const db = getDb();
  const normalizedDays = normalizeDays(days);
  const safeHour = Math.min(23, Math.max(0, Math.trunc(hour)));

  db.prepare(
    `UPDATE temp_cleanup_schedule
     SET hour = ?, days = ?, updated_at = ?
     WHERE id = ?`
  ).run(safeHour, JSON.stringify(normalizedDays), now, "default");

  const row = db
    .prepare<unknown[], TempCleanupScheduleRow>(
      `SELECT id, hour, days, last_run_at, created_at, updated_at FROM temp_cleanup_schedule WHERE id = ? LIMIT 1`
    )
    .get("default");

  return row ? mapRow(row) : { hour: safeHour, days: normalizedDays, lastRunAt: null, createdAt: now, updatedAt: now };
}

export function markTempCleanupRun(lastRunAt = Date.now()): TempCleanupScheduleRecord {
  ensureScheduleRow();
  const db = getDb();
  db.prepare(
    `UPDATE temp_cleanup_schedule
     SET last_run_at = ?, updated_at = ?
     WHERE id = ?`
  ).run(lastRunAt, lastRunAt, "default");
  const row = db
    .prepare<unknown[], TempCleanupScheduleRow>(
      `SELECT id, hour, days, last_run_at, created_at, updated_at FROM temp_cleanup_schedule WHERE id = ? LIMIT 1`
    )
    .get("default");
  return row
    ? mapRow(row)
    : { hour: DEFAULT_HOUR, days: [], lastRunAt, createdAt: lastRunAt, updatedAt: lastRunAt };
}
