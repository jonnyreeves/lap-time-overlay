import { createHash, randomBytes } from "node:crypto";
import { getDb } from "../../src/db/client.js";

export const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

interface SessionRow {
  id: string;
  user_id: string;
  created_at: number;
  expires_at: number;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSession(
  userId: string,
  now = Date.now()
): { token: string; expiresAt: number } {
  const token = randomBytes(32).toString("base64url");
  const hashed = hashToken(token);
  const expiresAt = now + SESSION_TTL_MS;

  const db = getDb();
  db.prepare(
    `INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`
  ).run(hashed, userId, now, expiresAt);

  return { token, expiresAt };
}

export function getSession(
  token: string
): { userId: string; expiresAt: number; createdAt: number } | null {
  const hashed = hashToken(token);
  const db = getDb();
  const row = db
    .prepare<unknown[], SessionRow>(
      `SELECT id, user_id, created_at, expires_at FROM sessions WHERE id = ? LIMIT 1`
    )
    .get(hashed);
  if (!row) return null;
  return {
    userId: row.user_id,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export function deleteSession(token: string): void {
  const hashed = hashToken(token);
  const db = getDb();
  db.prepare(`DELETE FROM sessions WHERE id = ?`).run(hashed);
}

export function slideSession(
  token: string,
  now = Date.now()
): number | null {
  const hashed = hashToken(token);
  const newExpiresAt = now + SESSION_TTL_MS;
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE sessions SET expires_at = ? WHERE id = ?`
    )
    .run(newExpiresAt, hashed);
  if (result.changes === 0) {
    return null;
  }
  return newExpiresAt;
}

export function purgeExpired(now = Date.now()): number {
  const db = getDb();
  const result = db
    .prepare(`DELETE FROM sessions WHERE expires_at <= ?`)
    .run(now);
  return result.changes;
}
