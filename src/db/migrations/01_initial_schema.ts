import type Database from "better-sqlite3";

export const migration = {
  id: "01_initial_schema",
  up: (db: Database.Database): void => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx
        ON users(LOWER(username));

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS sessions_user_id_idx
        ON sessions(user_id);

      CREATE TABLE IF NOT EXISTS circuits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        hero_image TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS karts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS track_sessions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        format TEXT NOT NULL,
        classification INTEGER NOT NULL,
        conditions TEXT NOT NULL DEFAULT 'Dry',
        circuit_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        kart_id TEXT,
        FOREIGN KEY (kart_id) REFERENCES karts(id) ON DELETE SET NULL,
        FOREIGN KEY (circuit_id) REFERENCES circuits(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS track_sessions_circuit_id_idx
        ON track_sessions(circuit_id);

      CREATE INDEX IF NOT EXISTS track_sessions_user_id_idx
        ON track_sessions(user_id);

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

      CREATE TABLE IF NOT EXISTS track_recordings (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        media_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending_upload',
        error TEXT,
        lap_one_offset REAL NOT NULL,
        description TEXT,
        size_bytes INTEGER,
        duration_ms REAL,
        fps REAL,
        combine_progress REAL NOT NULL DEFAULT 0,
        is_primary INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES track_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS track_recordings_session_id_idx
        ON track_recordings(session_id);

      CREATE INDEX IF NOT EXISTS track_recordings_user_id_idx
        ON track_recordings(user_id);

      CREATE INDEX IF NOT EXISTS track_recordings_primary_idx
        ON track_recordings(session_id, is_primary);

      CREATE TABLE IF NOT EXISTS track_recording_sources (
        id TEXT PRIMARY KEY,
        recording_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        ordinal INTEGER NOT NULL,
        size_bytes INTEGER,
        uploaded_bytes INTEGER NOT NULL,
        storage_path TEXT NOT NULL,
        upload_token TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (recording_id) REFERENCES track_recordings(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS track_recording_sources_recording_id_idx
        ON track_recording_sources(recording_id);

      CREATE TABLE IF NOT EXISTS circuit_karts (
        circuit_id TEXT NOT NULL,
        kart_id TEXT NOT NULL,
        PRIMARY KEY (circuit_id, kart_id),
        FOREIGN KEY (circuit_id) REFERENCES circuits(id) ON DELETE CASCADE,
        FOREIGN KEY (kart_id) REFERENCES karts(id) ON DELETE CASCADE
      );
    `);
  },
};
