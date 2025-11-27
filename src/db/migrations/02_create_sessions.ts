import type Database from "better-sqlite3";

export const migration = {
  id: "02_create_sessions",
  up: (db: Database.Database): void => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS sessions_user_id_idx
        ON sessions(user_id);
    `);
  },
};
