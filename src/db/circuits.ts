import { randomUUID } from "node:crypto";
import { getDb } from "../db/client.js"; // Adjust path if needed

export interface CircuitRecord {
  id: string;
  name: string;
  heroImage: string | null;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

interface CircuitRow {
  id: string;
  name: string;
  hero_image: string | null;
  user_id: string;
  created_at: number;
  updated_at: number;
}

function mapRow(row: CircuitRow): CircuitRecord {
  return {
    id: row.id,
    name: row.name,
    heroImage: row.hero_image,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findCircuitById(id: string): CircuitRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], CircuitRow>(
      `SELECT id, name, hero_image, user_id, created_at, updated_at
       FROM circuits WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapRow(row) : null;
}

export function findCircuitsByUserId(userId: string): CircuitRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], CircuitRow>(
      `SELECT id, name, hero_image, user_id, created_at, updated_at
       FROM circuits WHERE user_id = ? ORDER BY created_at DESC`
    )
    .all(userId);
  return rows.map(mapRow);
}

export function findAllCircuits(): CircuitRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], CircuitRow>(
      `SELECT id, name, hero_image, user_id, created_at, updated_at
       FROM circuits ORDER BY created_at DESC`
    )
    .all();
  return rows.map(mapRow);
}

export function createCircuit(
  name: string,
  userId: string,
  heroImage: string | null = null,
  now = Date.now()
): CircuitRecord {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO circuits (id, name, hero_image, user_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, name, heroImage, userId, now, now);

  return {
    id,
    name,
    heroImage,
    userId,
    createdAt: now,
    updatedAt: now,
  };
}

export interface CircuitRepository {
  findById: (id: string) => CircuitRecord | null;
  findByUserId: (userId: string) => CircuitRecord[];
  findAll: () => CircuitRecord[];
  create: (name: string, userId: string, heroImage?: string | null) => CircuitRecord;
}

export const circuitsRepository: CircuitRepository = {
  findById: findCircuitById,
  findByUserId: findCircuitsByUserId,
  findAll: findAllCircuits,
  create: createCircuit,
};
