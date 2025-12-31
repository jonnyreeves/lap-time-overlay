import type Database from "better-sqlite3";

export const migration = {
  id: "10_add_postcode_to_tracks",
  up: (db: Database.Database): void => {
    db.exec(`
      ALTER TABLE tracks
        ADD COLUMN postcode TEXT;
    `);
  },
};
