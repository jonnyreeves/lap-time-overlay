import { randomUUID } from "node:crypto";
import { getDb } from "./client.js";

export interface TrackLayoutRecord {
  id: string;
  trackId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

interface TrackLayoutRow {
  id: string;
  track_id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

function mapRow(row: TrackLayoutRow): TrackLayoutRecord {
  return {
    id: row.id,
    trackId: row.track_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findTrackLayoutById(id: string): TrackLayoutRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], TrackLayoutRow>(
      `SELECT id, track_id, name, created_at, updated_at
       FROM track_layouts WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapRow(row) : null;
}

export function findTrackLayoutsByTrackId(trackId: string): TrackLayoutRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], TrackLayoutRow>(
      `SELECT id, track_id, name, created_at, updated_at
       FROM track_layouts
       WHERE track_id = ?
       ORDER BY created_at DESC`
    )
    .all(trackId);
  return rows.map(mapRow);
}

export function createTrackLayout(
  trackId: string,
  name: string,
  now = Date.now()
): TrackLayoutRecord {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO track_layouts (id, track_id, name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, trackId, name, now, now);

  return {
    id,
    trackId,
    name,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateTrackLayout(id: string, name: string, now = Date.now()): TrackLayoutRecord | null {
  const existing = findTrackLayoutById(id);
  if (!existing) {
    return null;
  }

  const db = getDb();
  db.prepare(
    `UPDATE track_layouts SET name = ?, updated_at = ? WHERE id = ?`
  ).run(name, now, id);

  return { ...existing, name, updatedAt: now };
}

export function deleteTrackLayout(id: string): boolean {
  const db = getDb();
  const result = db.prepare(
    `DELETE FROM track_layouts WHERE id = ?`
  ).run(id);

  return result.changes > 0;
}

export interface TrackLayoutsRepository {
  findById: (id: string) => TrackLayoutRecord | null;
  findByTrackId: (trackId: string) => TrackLayoutRecord[];
  create: (trackId: string, name: string) => TrackLayoutRecord;
  update: (id: string, name: string) => TrackLayoutRecord | null;
  delete: (id: string) => boolean;
}

export const trackLayoutsRepository: TrackLayoutsRepository = {
  findById: findTrackLayoutById,
  findByTrackId: findTrackLayoutsByTrackId,
  create: createTrackLayout,
  update: updateTrackLayout,
  delete: deleteTrackLayout,
};
