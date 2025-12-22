import type Database from "better-sqlite3";

export const migration = {
  id: "04_add_overlay_burned_to_track_recordings",
  up: (db: Database.Database): void => {
    db.exec(`
      ALTER TABLE track_recordings
        ADD COLUMN overlay_burned INTEGER NOT NULL DEFAULT 0;
    `);
  },
};
