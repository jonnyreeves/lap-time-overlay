import type Database from "better-sqlite3";

export const migration = {
  id: "03_add_trim_offsets_to_recording_sources",
  up: (db: Database.Database): void => {
    db.exec(`
      ALTER TABLE track_recording_sources
      ADD COLUMN trim_start_ms REAL;

      ALTER TABLE track_recording_sources
      ADD COLUMN trim_end_ms REAL;
    `);
  },
};
