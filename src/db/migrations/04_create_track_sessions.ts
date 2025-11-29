import type Database from "better-sqlite3";

export const migration = {
  id: "04_create_track_sessions",
  up: (db: Database.Database): void => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS track_sessions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        format TEXT NOT NULL,
        circuit_id TEXT NOT NULL,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (circuit_id) REFERENCES circuits(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS track_sessions_circuit_id_idx
        ON track_sessions(circuit_id);
    `);
  },
  down: (db: Database.Database): void => {
    db.exec(`
      DROP TABLE IF EXISTS track_sessions;
    `);
  },
};
