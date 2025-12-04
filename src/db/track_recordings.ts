import { randomUUID } from "node:crypto";
import { getDb } from "./client.js";

export interface TrackRecordingRecord {
  id: string;
  sessionId: string;
  mediaId: string;
  lapOneOffset: number;
  description: string | null;
  createdAt: number;
  updatedAt: number;
}

interface TrackRecordingRow {
  id: string;
  session_id: string;
  media_id: string;
  lap_one_offset: number;
  description: string | null;
  created_at: number;
  updated_at: number;
}

function mapRow(row: TrackRecordingRow): TrackRecordingRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    mediaId: row.media_id,
    lapOneOffset: row.lap_one_offset,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findTrackRecordingById(id: string): TrackRecordingRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], TrackRecordingRow>(
      `SELECT id, session_id, media_id, lap_one_offset, description, created_at, updated_at
       FROM track_recordings WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapRow(row) : null;
}

export function findTrackRecordingsBySessionId(sessionId: string): TrackRecordingRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], TrackRecordingRow>(
      `SELECT id, session_id, media_id, lap_one_offset, description, created_at, updated_at
       FROM track_recordings WHERE session_id = ? ORDER BY created_at DESC`
    )
    .all(sessionId);
  return rows.map(mapRow);
}

export function createTrackRecording(
  sessionId: string,
  mediaId: string,
  lapOneOffset: number,
  description: string | null = null,
  now = Date.now()
): TrackRecordingRecord {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO track_recordings (id, session_id, media_id, lap_one_offset, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, sessionId, mediaId, lapOneOffset, description, now, now);

  return {
    id,
    sessionId,
    mediaId,
    lapOneOffset,
    description,
    createdAt: now,
    updatedAt: now,
  };
}

export interface TrackRecordingRepository {
  findBySessionId: (sessionId: string) => TrackRecordingRecord[];
}

export const trackRecordingsRepository: TrackRecordingRepository = {
  findBySessionId: findTrackRecordingsBySessionId,
};
