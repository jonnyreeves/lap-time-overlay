import type Database from "better-sqlite3";

export const migration = {
  id: "10_add_primary_track_recording",
  up: (db: Database.Database): void => {
    db.exec(`
      ALTER TABLE track_recordings ADD COLUMN is_primary INTEGER NOT NULL DEFAULT 0;

      UPDATE track_recordings
      SET is_primary = 1
      WHERE id IN (
        SELECT id FROM track_recordings tr
        WHERE tr.created_at = (
          SELECT MIN(created_at) FROM track_recordings WHERE session_id = tr.session_id
        )
        GROUP BY tr.session_id
      );

      CREATE INDEX IF NOT EXISTS track_recordings_primary_idx
        ON track_recordings(session_id, is_primary);
    `);
  },
  down: (db: Database.Database): void => {
    db.exec(`
      CREATE TABLE track_recordings_tmp AS
        SELECT id, session_id, user_id, media_id, status, error, lap_one_offset, description,
               size_bytes, duration_ms, fps, combine_progress, created_at, updated_at
        FROM track_recordings;

      DROP TABLE track_recordings;

      CREATE TABLE track_recordings (
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

      INSERT INTO track_recordings (
        id, session_id, user_id, media_id, status, error, lap_one_offset, description, size_bytes,
        duration_ms, fps, combine_progress, created_at, updated_at
      )
      SELECT id, session_id, user_id, media_id, status, error, lap_one_offset, description, size_bytes,
             duration_ms, fps, combine_progress, created_at, updated_at
      FROM track_recordings_tmp;

      DROP TABLE track_recordings_tmp;
      DROP INDEX IF EXISTS track_recordings_primary_idx;
    `);
  },
};
