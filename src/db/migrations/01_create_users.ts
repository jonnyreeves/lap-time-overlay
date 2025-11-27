import type Database from "better-sqlite3";

export const migration = {
  id: "01_create_users",
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
    `);
  },
};
