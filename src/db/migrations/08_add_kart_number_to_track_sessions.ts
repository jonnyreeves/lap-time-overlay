import type Database from "better-sqlite3";

export const migration = {
  id: "08_add_kart_number_to_track_sessions",
  up: (db: Database.Database): void => {
    db.exec(`
      ALTER TABLE track_sessions
        ADD COLUMN kart_number TEXT NOT NULL DEFAULT '';
    `);
  },
};
