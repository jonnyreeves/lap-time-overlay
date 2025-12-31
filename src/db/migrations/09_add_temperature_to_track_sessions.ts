import type Database from "better-sqlite3";

export const migration = {
  id: "09_add_temperature_to_track_sessions",
  up: (db: Database.Database): void => {
    db.exec(`
      ALTER TABLE track_sessions
        ADD COLUMN temperature TEXT NOT NULL DEFAULT '';
    `);
  },
};
