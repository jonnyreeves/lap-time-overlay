import Database from "better-sqlite3";
import { setDb, closeDb } from "../../src/db/client.js";
import { migrations } from "../../src/db/migrations/index.js";

export function setupTestDb() {
  const db = new Database(":memory:");

  for (const migration of migrations) {
    migration.up(db);
  }

  setDb(db);

  return db;
}

export function teardownTestDb() {
  closeDb();
}
