import { randomUUID } from "node:crypto";
import { getDb } from "../db/client.js"; // Adjust path if needed

export interface TrackRecord {
  id: string;
  name: string;
  heroImage: string | null;
  createdAt: number;
  updatedAt: number;
}

interface TrackRow {
  id: string;
  name: string;
  hero_image: string | null;
  created_at: number;
  updated_at: number;
}

function mapRow(row: TrackRow): TrackRecord {
  return {
    id: row.id,
    name: row.name,
    heroImage: row.hero_image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findTrackById(id: string): TrackRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], TrackRow>(
      `SELECT id, name, hero_image, created_at, updated_at
       FROM tracks WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapRow(row) : null;
}

export function findAllTracks(): TrackRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], TrackRow>(
      `SELECT id, name, hero_image, created_at, updated_at
       FROM tracks ORDER BY created_at DESC`
    )
    .all();
  return rows.map(mapRow);
}

export function createTrack(
  name: string,
  heroImage: string | null = null,
  now = Date.now()
): TrackRecord {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO tracks (id, name, hero_image, created_at, updated_at)
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

export interface TrackRepository {
  findById: (id: string) => TrackRecord | null;
  findAll: () => TrackRecord[];
  create: (name: string, heroImage?: string | null) => TrackRecord;
}

export const tracksRepository: TrackRepository = {
  findById: findTrackById,
  findAll: findAllTracks,
  create: createTrack,
};
