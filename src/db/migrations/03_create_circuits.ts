import type Database from "better-sqlite3";

export const migration = {
  id: "03_create_circuits",
  up: (db: Database.Database): void => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS circuits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        hero_image TEXT,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS circuits_user_id_idx
        ON circuits(user_id);
    `);
  },
};
