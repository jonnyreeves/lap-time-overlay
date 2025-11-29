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
];
