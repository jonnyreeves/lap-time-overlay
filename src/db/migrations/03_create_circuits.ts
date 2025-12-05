import type Database from "better-sqlite3";

export const migration = {
  id: "03_create_circuits",
  up: (db: Database.Database): void => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS circuits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        hero_image TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  },
};
