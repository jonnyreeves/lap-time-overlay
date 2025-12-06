import { randomUUID } from "node:crypto";
import { getDb } from "./client.js";

export type TrackRecordingStatus =
  | "pending_upload"
  | "uploading"
  | "combining"
  | "ready"
  | "failed";

export interface TrackRecordingRecord {
  id: string;
  sessionId: string;
  userId: string;
  mediaId: string;
  lapOneOffset: number;
  description: string | null;
  status: TrackRecordingStatus;
  error: string | null;
  sizeBytes: number | null;
  durationMs: number | null;
  fps: number | null;
  combineProgress: number;
  createdAt: number;
  updatedAt: number;
}

interface TrackRecordingRow {
  id: string;
  session_id: string;
  user_id: string;
  media_id: string;
  lap_one_offset: number;
  description: string | null;
  status: TrackRecordingStatus;
  error: string | null;
  size_bytes: number | null;
  duration_ms: number | null;
  fps: number | null;
  combine_progress: number;
  created_at: number;
  updated_at: number;
}

function mapRow(row: TrackRecordingRow): TrackRecordingRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    mediaId: row.media_id,
    lapOneOffset: row.lap_one_offset,
    description: row.description,
    status: row.status,
    error: row.error,
    sizeBytes: row.size_bytes,
    durationMs: row.duration_ms,
    fps: row.fps,
    combineProgress: row.combine_progress,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findTrackRecordingById(id: string): TrackRecordingRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], TrackRecordingRow>(
      `SELECT id, session_id, user_id, media_id, lap_one_offset, description, status, error, size_bytes,
              duration_ms, fps, combine_progress, created_at, updated_at
       FROM track_recordings WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapRow(row) : null;
}

export function findTrackRecordingsBySessionId(sessionId: string): TrackRecordingRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], TrackRecordingRow>(
      `SELECT id, session_id, user_id, media_id, lap_one_offset, description, status, error, size_bytes,
              duration_ms, fps, combine_progress, created_at, updated_at
       FROM track_recordings WHERE session_id = ? ORDER BY created_at DESC`
    )
    .all(sessionId);
  return rows.map(mapRow);
}

export function createTrackRecording({
  id = randomUUID(),
  sessionId,
  userId,
  mediaId,
  lapOneOffset,
  description = null,
  status = "pending_upload",
  now = Date.now(),
}: {
  sessionId: string;
  userId: string;
  mediaId: string;
  lapOneOffset: number;
  description?: string | null;
  status?: TrackRecordingStatus;
  now?: number;
  id?: string;
}): TrackRecordingRecord {
  const db = getDb();
  db.prepare(
    `INSERT INTO track_recordings (
      id, session_id, user_id, media_id, status, error, lap_one_offset, description, size_bytes, duration_ms, fps,
      combine_progress, created_at, updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    sessionId,
    userId,
    mediaId,
    status,
    null,
    lapOneOffset,
    description,
    null,
    null,
    null,
    0,
    now,
    now
  );

  return {
    id,
    sessionId,
    userId,
    mediaId,
    lapOneOffset,
    description: description ?? null,
    status,
    error: null,
    sizeBytes: null,
    durationMs: null,
    fps: null,
    combineProgress: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateTrackRecording(
  id: string,
  fields: Partial<
    Pick<
      TrackRecordingRecord,
      "mediaId" | "lapOneOffset" | "description" | "status" | "error" | "sizeBytes" | "durationMs" | "fps" | "combineProgress"
    >
  >,
  now = Date.now()
): TrackRecordingRecord | null {
  const current = findTrackRecordingById(id);
  if (!current) return null;

  const next: TrackRecordingRecord = {
    ...current,
    ...fields,
    updatedAt: now,
  };

  const db = getDb();
  db.prepare(
    `UPDATE track_recordings
     SET media_id = ?, lap_one_offset = ?, description = ?, status = ?, error = ?, size_bytes = ?, duration_ms = ?, fps = ?, combine_progress = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    next.mediaId,
    next.lapOneOffset,
    next.description,
    next.status,
    next.error,
    next.sizeBytes,
    next.durationMs,
    next.fps,
    next.combineProgress,
    next.updatedAt,
    id
  );

  return next;
}

export function deleteTrackRecording(id: string): boolean {
  const db = getDb();
  const result = db.prepare(`DELETE FROM track_recordings WHERE id = ?`).run(id);
  return result.changes > 0;
}

export interface TrackRecordingRepository {
  findBySessionId: (sessionId: string) => TrackRecordingRecord[];
  findById?: (id: string) => TrackRecordingRecord | null;
}

export const trackRecordingsRepository: TrackRecordingRepository = {
  findBySessionId: findTrackRecordingsBySessionId,
  findById: findTrackRecordingById,
};
