import type Database from "better-sqlite3";

export const migration = {
  id: "09_extend_track_recordings",
  up: (db: Database.Database): void => {
    db.exec(`
      CREATE TABLE track_recordings_new (
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
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES track_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      INSERT INTO track_recordings_new (
        id, session_id, user_id, media_id, status, error, lap_one_offset, description, size_bytes,
        duration_ms, fps, combine_progress, created_at, updated_at
      )
      SELECT
        tr.id,
        tr.session_id,
        ts.user_id,
        tr.media_id,
        'ready',
        NULL,
        tr.lap_one_offset,
        tr.description,
        NULL,
        NULL,
        NULL,
        1,
        tr.created_at,
        tr.updated_at
      FROM track_recordings tr
      LEFT JOIN track_sessions ts ON ts.id = tr.session_id;

      DROP TABLE track_recordings;
      ALTER TABLE track_recordings_new RENAME TO track_recordings;

      CREATE INDEX IF NOT EXISTS track_recordings_session_id_idx
        ON track_recordings(session_id);

      CREATE INDEX IF NOT EXISTS track_recordings_user_id_idx
        ON track_recordings(user_id);

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
    `);
  },
  down: (db: Database.Database): void => {
    db.exec(`
      DROP TABLE IF EXISTS track_recording_sources;

      CREATE TABLE track_recordings_legacy (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        media_id TEXT NOT NULL,
        lap_one_offset REAL NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES track_sessions(id) ON DELETE CASCADE
      );

      INSERT INTO track_recordings_legacy (id, session_id, media_id, lap_one_offset, description, created_at, updated_at)
        SELECT id, session_id, media_id, lap_one_offset, description, created_at, updated_at
        FROM track_recordings;

      DROP TABLE track_recordings;
      ALTER TABLE track_recordings_legacy RENAME TO track_recordings;

      CREATE INDEX IF NOT EXISTS track_recordings_session_id_idx
        ON track_recordings(session_id);
    `);
  },
};
