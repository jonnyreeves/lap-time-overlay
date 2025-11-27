import { randomUUID } from "node:crypto";
import { getDb } from "../../db/client.js";

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
}

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  created_at: number;
  updated_at: number;
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function mapRow(row: UserRow): UserRecord {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findUserByUsername(username: string): UserRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], UserRow>(
      `SELECT id, username, password_hash, created_at, updated_at
       FROM users WHERE LOWER(username) = ? LIMIT 1`
    )
    .get(normalizeUsername(username));
  return row ? mapRow(row) : null;
}

export function findUserById(id: string): UserRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], UserRow>(
      `SELECT id, username, password_hash, created_at, updated_at
       FROM users WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapRow(row) : null;
}

export function createUser(
  username: string,
  passwordHash: string,
  now = Date.now()
): UserRecord {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO users (id, username, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, username, passwordHash, now, now);

  return {
    id,
    username,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };
}
