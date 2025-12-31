import type Database from "better-sqlite3";

export const migration = {
  id: "11_add_is_indoors_to_tracks",
  up: (db: Database.Database): void => {
    db.exec(`
      ALTER TABLE tracks ADD COLUMN is_indoors INTEGER NOT NULL DEFAULT 0;
    `);
  },
};
