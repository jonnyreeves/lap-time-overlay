import type Database from "better-sqlite3";

export const migration = {
  id: "07_create_track_recordings",
  up: (db: Database.Database): void => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS track_recordings (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        media_id TEXT NOT NULL,
        lap_one_offset REAL NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES track_sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS track_recordings_session_id_idx
        ON track_recordings(session_id);
    `);
  },
  down: (db: Database.Database): void => {
    db.exec(`
      DROP TABLE IF EXISTS track_recordings;
    `);
  },
};
