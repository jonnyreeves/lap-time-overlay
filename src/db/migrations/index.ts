import type Database from "better-sqlite3";

export interface Migration {
  id: string;
  up: (db: Database.Database) => void;
}

// Add new migrations here; keep order stable.
export const migrations: Migration[] = [
  (await import("./01_create_users.js")).migration,
  (await import("./02_create_sessions.js")).migration,
  (await import("./03_create_circuits.js")).migration,
  (await import("./04_create_track_sessions.js")).migration,
  (await import("./05_create_laps.js")).migration,
  (await import("./06_create_lap_events.js")).migration,
  (await import("./07_create_track_recordings.js")).migration,
];
