import type Database from "better-sqlite3";

export const migration = {
  id: "05_add_temp_cleanup_schedule",
  up: (db: Database.Database): void => {
    const now = Date.now();

    db.exec(`
      CREATE TABLE IF NOT EXISTS temp_cleanup_schedule (
        id TEXT PRIMARY KEY,
        hour INTEGER NOT NULL,
        days TEXT NOT NULL,
        last_run_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    db.prepare(
      `INSERT OR IGNORE INTO temp_cleanup_schedule (id, hour, days, last_run_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run("default", 3, "[]", null, now, now);
  },
};
