import { randomUUID } from "node:crypto";
import { getDb } from "../db/client.js"; // Adjust path if needed

export interface TrackRecord {
  id: string;
  name: string;
  heroImage: string | null;
  postcode: string | null;
  isIndoors: boolean;
  createdAt: number;
  updatedAt: number;
}

interface TrackRow {
  id: string;
  name: string;
  hero_image: string | null;
  postcode: string | null;
  is_indoors: number;
  created_at: number;
  updated_at: number;
}

function mapRow(row: TrackRow): TrackRecord {
  return {
    id: row.id,
    name: row.name,
    heroImage: row.hero_image,
    postcode: row.postcode,
    isIndoors: Boolean(row.is_indoors),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findTrackById(id: string): TrackRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], TrackRow>(
      `SELECT id, name, hero_image, postcode, is_indoors, created_at, updated_at
       FROM tracks WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapRow(row) : null;
}

export function findAllTracks(): TrackRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], TrackRow>(
      `SELECT id, name, hero_image, postcode, is_indoors, created_at, updated_at
       FROM tracks ORDER BY created_at DESC`
    )
    .all();
  return rows.map(mapRow);
}

export function createTrack(
  name: string,
  heroImage: string | null = null,
  now = Date.now(),
  postcode: string | null = null,
  isIndoors = false
): TrackRecord {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO tracks (id, name, hero_image, postcode, is_indoors, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name, heroImage, postcode, isIndoors ? 1 : 0, now, now);

  return {
    id,
    name,
    heroImage,
    postcode,
    isIndoors,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateTrack(
  id: string,
  {
    name,
    heroImage,
    postcode,
    isIndoors,
    now = Date.now(),
  }: {
    name?: string;
    heroImage?: string | null;
    postcode?: string | null;
    isIndoors?: boolean;
    now?: number;
  }
): TrackRecord | null {
  const db = getDb();
  const current = findTrackById(id);
  if (!current) {
    return null;
  }

  const next: TrackRecord = {
    ...current,
    name: name ?? current.name,
    heroImage: heroImage === undefined ? current.heroImage : heroImage,
    postcode: postcode === undefined ? current.postcode : postcode,
    isIndoors: isIndoors === undefined ? current.isIndoors : isIndoors,
    updatedAt: now,
  };

  db.prepare(
    `UPDATE tracks
     SET name = ?, hero_image = ?, postcode = ?, is_indoors = ?, updated_at = ?
     WHERE id = ?`
  ).run(next.name, next.heroImage, next.postcode, next.isIndoors ? 1 : 0, next.updatedAt, id);

  return next;
}

export interface TrackRepository {
  findById: (id: string) => TrackRecord | null;
  findAll: () => TrackRecord[];
  create: (
    name: string,
    heroImage?: string | null,
    now?: number,
    postcode?: string | null,
    isIndoors?: boolean
  ) => TrackRecord;
  update: (id: string, input: { name?: string; heroImage?: string | null; postcode?: string | null; isIndoors?: boolean; now?: number }) => TrackRecord | null;
}

export const tracksRepository: TrackRepository = {
  findById: findTrackById,
  findAll: findAllTracks,
  create: createTrack,
  update: updateTrack,
};
