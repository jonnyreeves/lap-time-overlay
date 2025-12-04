import type Database from "better-sqlite3";

export const migration = {
  id: "08_add_track_session_conditions",
  up: (db: Database.Database): void => {
    db.exec(`
      ALTER TABLE track_sessions
      ADD COLUMN conditions TEXT NOT NULL DEFAULT 'Dry';
    `);
  },
  down: (db: Database.Database): void => {
    db.exec(`
      CREATE TABLE track_sessions_tmp (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        format TEXT NOT NULL,
        circuit_id TEXT NOT NULL,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (circuit_id) REFERENCES circuits(id) ON DELETE CASCADE
      );

      INSERT INTO track_sessions_tmp (id, date, format, circuit_id, notes, created_at, updated_at)
        SELECT id, date, format, circuit_id, notes, created_at, updated_at FROM track_sessions;

      DROP TABLE track_sessions;
      ALTER TABLE track_sessions_tmp RENAME TO track_sessions;

      CREATE INDEX IF NOT EXISTS track_sessions_circuit_id_idx
        ON track_sessions(circuit_id);
    `);
  },
};
