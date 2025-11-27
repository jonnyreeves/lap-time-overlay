import { getDb } from "../client.js";
import { migrations } from "./index.js";

const MIGRATIONS_TABLE = "schema_migrations";

export async function runMigrations(): Promise<void> {
  const db = getDb();
  db.exec(
    `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (id TEXT PRIMARY KEY, run_at INTEGER NOT NULL)`
  );

  const applied = new Set<string>();
  const rows = db.prepare<[], { id: string }>(
    `SELECT id FROM ${MIGRATIONS_TABLE}`
  ).all();
  for (const row of rows) {
    applied.add(row.id);
  }

  const insert = db.prepare(
    `INSERT INTO ${MIGRATIONS_TABLE} (id, run_at) VALUES (?, ?)`
  );

  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;

    const run = db.transaction(() => {
      migration.up(db);
      insert.run(migration.id, Date.now());
    });

    run();
    console.log(`Applied migration: ${migration.id}`);
  }
}
