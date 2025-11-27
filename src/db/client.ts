import Database from "better-sqlite3";
import {
  ensureDatabaseDir,
  getDatabasePath,
  getPragmaStatements,
  isReadOnly,
} from "./config.js";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = getDatabasePath();
  ensureDatabaseDir();

  db = new Database(dbPath, {
    readonly: isReadOnly(),
    fileMustExist: false,
  });

  const pragmas = getPragmaStatements();
  for (const pragma of pragmas) {
    try {
      db.pragma(pragma);
    } catch (err) {
      console.error(`Failed to apply PRAGMA '${pragma}':`, err);
    }
  }

  return db;
}

export function closeDb(): void {
  if (!db) return;
  db.close();
  db = null;
}
