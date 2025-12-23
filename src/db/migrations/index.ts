import type Database from "better-sqlite3";

export interface Migration {
  id: string;
  up: (db: Database.Database) => void;
}

// Add new migrations here; keep order stable.
export const migrations: Migration[] = [
  (await import("./01_initial_schema.js")).migration,
  (await import("./02_add_fastest_lap_to_track_sessions.js")).migration,
  (await import("./03_add_trim_offsets_to_recording_sources.js")).migration,
  (await import("./04_add_overlay_burned_to_track_recordings.js")).migration,
  (await import("./05_add_temp_cleanup_schedule.js")).migration,
];
