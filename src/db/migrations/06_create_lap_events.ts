import type Database from "better-sqlite3";

export const migration = {
  id: "06_create_lap_events",
  up: (db: Database.Database): void => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS lap_events (
        id TEXT PRIMARY KEY,
        lap_id TEXT NOT NULL,
        offset REAL NOT NULL,
        event TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (lap_id) REFERENCES laps(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS lap_events_lap_id_idx
        ON lap_events(lap_id);
    `);
  },
  down: (db: Database.Database): void => {
    db.exec(`
      DROP TABLE IF EXISTS lap_events;
    `);
  },
};
