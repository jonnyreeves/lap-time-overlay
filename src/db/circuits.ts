import { randomUUID } from "node:crypto";
import { getDb } from "../db/client.js"; // Adjust path if needed

export interface CircuitRecord {
  id: string;
  name: string;
  heroImage: string | null;
  createdAt: number;
  updatedAt: number;
}

interface CircuitRow {
  id: string;
  name: string;
  hero_image: string | null;
  created_at: number;
  updated_at: number;
}

function mapRow(row: CircuitRow): CircuitRecord {
  return {
    id: row.id,
    name: row.name,
    heroImage: row.hero_image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findCircuitById(id: string): CircuitRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], CircuitRow>(
      `SELECT id, name, hero_image, created_at, updated_at
       FROM circuits WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapRow(row) : null;
}

export function findAllCircuits(): CircuitRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], CircuitRow>(
      `SELECT id, name, hero_image, created_at, updated_at
       FROM circuits ORDER BY created_at DESC`
    )
    .all();
  return rows.map(mapRow);
}

export function createCircuit(
  name: string,
  heroImage: string | null = null,
  now = Date.now()
): CircuitRecord {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO circuits (id, name, hero_image, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, name, heroImage, now, now);

  return {
    id,
    name,
    heroImage,
    createdAt: now,
    updatedAt: now,
  };
}

export interface CircuitRepository {
  findById: (id: string) => CircuitRecord | null;
  findAll: () => CircuitRecord[];
  create: (name: string, heroImage?: string | null) => CircuitRecord;
}

export const circuitsRepository: CircuitRepository = {
  findById: findCircuitById,
  findAll: findAllCircuits,
  create: createCircuit,
};
