import fs from "node:fs";
import path from "node:path";
import { ensureDatabaseDir, getDatabasePath, isReadOnly } from "../src/db/config.js";
import { closeDb } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrations/runner.js";

async function resetDatabase() {
  if (isReadOnly()) {
    throw new Error("Cannot reset database while DB_READONLY=true");
  }

  const dbPath = getDatabasePath();
  // Make sure we don't have an open handle to the DB before deleting files.
  closeDb();

  const candidates = [`${dbPath}`, `${dbPath}-wal`, `${dbPath}-shm`];
  for (const filePath of candidates) {
    try {
      fs.rmSync(filePath);
      console.log(`Deleted ${path.basename(filePath)}`);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== "ENOENT") {
        throw err;
      }
    }
  }

  ensureDatabaseDir();
  await runMigrations();
  closeDb();
  console.log("Database recreated.");
}

resetDatabase().catch((err) => {
  console.error("Failed to reset database:", err);
  process.exit(1);
});
