import { getDb } from "./client.js";

export interface SettingRecord {
  key: string;
  value: string;
  updatedAt: number;
}

interface SettingRow {
  key: string;
  value: string;
  updated_at: number;
}

export function getSetting(key: string): SettingRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], SettingRow>(
      `SELECT key, value, updated_at FROM app_settings WHERE key = ? LIMIT 1`
    )
    .get(key);
  return row ? { key: row.key, value: row.value, updatedAt: row.updated_at } : null;
}

export function setSetting(key: string, value: string, now = Date.now()): SettingRecord {
  const db = getDb();
  db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(key, value, now);

  return { key, value, updatedAt: now };
}
