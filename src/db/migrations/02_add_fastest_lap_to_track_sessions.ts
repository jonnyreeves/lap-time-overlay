import type Database from "better-sqlite3";

export const migration = {
  id: "02_add_fastest_lap_to_track_sessions",
  up: (db: Database.Database): void => {
    db.exec(`
      ALTER TABLE track_sessions
      ADD COLUMN fastest_lap REAL;
    `);
  },
};
