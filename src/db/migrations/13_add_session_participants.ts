import type Database from "better-sqlite3";

export const migration = {
  id: "13_add_session_participants",
  up: (db: Database.Database): void => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS track_session_participants (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        name TEXT NOT NULL,
        classification INTEGER,
        kart_number TEXT NOT NULL DEFAULT '',
        is_self INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES track_sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS track_session_participants_session_id_idx
        ON track_session_participants(session_id);

      CREATE INDEX IF NOT EXISTS track_session_participants_name_idx
        ON track_session_participants(name);

      CREATE TABLE IF NOT EXISTS track_session_participant_laps (
        id TEXT PRIMARY KEY,
        participant_id TEXT NOT NULL,
        lap_number INTEGER NOT NULL,
        time REAL NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (participant_id) REFERENCES track_session_participants(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS track_session_participant_laps_participant_id_idx
        ON track_session_participant_laps(participant_id);

      CREATE UNIQUE INDEX IF NOT EXISTS track_session_participant_laps_unique_lap_idx
        ON track_session_participant_laps(participant_id, lap_number);
    `);
  },
};
