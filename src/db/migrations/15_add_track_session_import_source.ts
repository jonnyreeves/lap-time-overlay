import type Database from "better-sqlite3";

export const migration = {
  id: "15_add_track_session_import_source",
  up: (db: Database.Database): void => {
    db.exec(`
      ALTER TABLE track_sessions ADD COLUMN import_source_provider TEXT;
      ALTER TABLE track_sessions ADD COLUMN import_source_id TEXT;

      CREATE UNIQUE INDEX IF NOT EXISTS track_sessions_user_import_source_unique_idx
        ON track_sessions(user_id, import_source_provider, import_source_id)
        WHERE import_source_provider IS NOT NULL AND import_source_id IS NOT NULL;
    `);
  },
};
