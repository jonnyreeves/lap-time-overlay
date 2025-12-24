import type Database from "better-sqlite3";

export const migration = {
  id: "07_add_show_in_media_library_to_track_recordings",
  up: (db: Database.Database): void => {
    db.exec(`
      ALTER TABLE track_recordings
        ADD COLUMN show_in_media_library INTEGER NOT NULL DEFAULT 1;
    `);
  },
};
