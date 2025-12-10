import { randomUUID } from "node:crypto";
import { getDb } from "../db/client.js";

export interface KartRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface KartRow {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

export function mapKartRow(row: KartRow): KartRecord {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findKartById(id: string): KartRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], KartRow>(
      `SELECT id, name, created_at, updated_at
       FROM karts WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapKartRow(row) : null;
}

export function findAllKarts(): KartRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], KartRow>(
      `SELECT id, name, created_at, updated_at
       FROM karts ORDER BY created_at DESC`
    )
    .all();
  return rows.map(mapKartRow);
}

export function createKart(name: string, now = Date.now()): KartRecord {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO karts (id, name, created_at, updated_at)
     VALUES (?, ?, ?, ?)`
  ).run(id, name, now, now);

  return {
    id,
    name,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateKart(id: string, name: string, now = Date.now()): KartRecord | null {
  const db = getDb();
  const current = findKartById(id);
  if (!current) {
    return null;
  }
  db.prepare(
    `UPDATE karts
     SET name = ?, updated_at = ?
     WHERE id = ?`
  ).run(name, now, id);

  return { ...current, name, updatedAt: now };
}

export function deleteKart(id: string): boolean {
  const db = getDb();
  const result = db.prepare(`DELETE FROM karts WHERE id = ?`).run(id);
  return result.changes > 0;
}

export interface KartsRepository {
  findById: (id: string) => KartRecord | null;
  findAll: () => KartRecord[];
  create: (name: string) => KartRecord;
  update: (id: string, name: string) => KartRecord | null;
  delete: (id: string) => boolean;
}

export const kartsRepository: KartsRepository = {
  findById: findKartById,
  findAll: findAllKarts,
  create: createKart,
  update: updateKart,
  delete: deleteKart,
};
