import fs from "node:fs";
import path from "node:path";

const DEFAULT_DB_PATH =
  process.env.DB_PATH || path.resolve(process.cwd(), "database/app.sqlite");

export function getDatabasePath(): string {
  return DEFAULT_DB_PATH;
}

export function ensureDatabaseDir(): void {
  const dir = path.dirname(DEFAULT_DB_PATH);
  fs.mkdirSync(dir, { recursive: true });
}

export function getPragmaStatements(): string[] {
  const env = process.env.DB_PRAGMAS;
  if (env && env.trim().length) {
    return env
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return ["journal_mode=WAL", "synchronous=NORMAL", "foreign_keys=ON"];
}

export function isReadOnly(): boolean {
  return process.env.DB_READONLY === "true";
}
