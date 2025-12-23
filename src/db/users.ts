import { randomUUID } from "node:crypto";
import { getDb } from "../../src/db/client.js";

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
  isAdmin: boolean;
}

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  is_admin: number;
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
    isAdmin: row.is_admin === 1,
  };
}

export function findUserByUsername(username: string): UserRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], UserRow>(
      `SELECT id, username, password_hash, is_admin, created_at, updated_at
       FROM users WHERE LOWER(username) = ? LIMIT 1`
    )
    .get(normalizeUsername(username));
  return row ? mapRow(row) : null;
}

export function findUserById(id: string): UserRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], UserRow>(
      `SELECT id, username, password_hash, is_admin, created_at, updated_at
       FROM users WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapRow(row) : null;
}

export function createUser(
  username: string,
  passwordHash: string,
  now = Date.now(),
  isAdmin = true
): UserRecord {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO users (id, username, password_hash, is_admin, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, username, passwordHash, isAdmin ? 1 : 0, now, now);

  return {
    id,
    username,
    passwordHash,
    createdAt: now,
    updatedAt: now,
    isAdmin,
  };
}

export function listUsers(): UserRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], UserRow>(
      `SELECT id, username, password_hash, is_admin, created_at, updated_at
       FROM users
       ORDER BY LOWER(username) ASC`
    )
    .all();

  return rows.map(mapRow);
}

export function countAdminUsers(): number {
  const db = getDb();
  const row = db
    .prepare<unknown[], { count: number }>(`SELECT COUNT(*) AS count FROM users WHERE is_admin = 1`)
    .get();
  return row?.count ?? 0;
}

export function updateUserAdminStatus(id: string, isAdmin: boolean): UserRecord | null {
  const db = getDb();
  db.prepare(
    `UPDATE users
     SET is_admin = ?, updated_at = ?
     WHERE id = ?`
  ).run(isAdmin ? 1 : 0, Date.now(), id);
  return findUserById(id);
}
