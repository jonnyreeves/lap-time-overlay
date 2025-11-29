import type Database from "better-sqlite3";

export const migration = {
  id: "05_create_laps",
  up: (db: Database.Database): void => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS laps (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        lap_number INTEGER NOT NULL,
        time REAL NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES track_sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS laps_session_id_idx
        ON laps(session_id);
    `);
  },
  down: (db: Database.Database): void => {
    db.exec(`
      DROP TABLE IF EXISTS laps;
    `);
  },
};
