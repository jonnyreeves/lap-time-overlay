import { randomUUID } from "node:crypto";
import { getDb } from "./client.js";

export type TrackRecordingStatus =
  | "pending_upload"
  | "uploading"
  | "combining"
  | "ready"
  | "failed";
const TRACK_RECORDING_STATUS_VALUES: TrackRecordingStatus[] = [
  "pending_upload",
  "uploading",
  "combining",
  "ready",
  "failed",
];

export interface TrackRecordingRecord {
  id: string;
  sessionId: string;
  userId: string;
  mediaId: string;
  overlayBurned: boolean;
  isPrimary: boolean;
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
  overlay_burned: number;
  is_primary: number;
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
    overlayBurned: Boolean(row.overlay_burned),
    isPrimary: Boolean(row.is_primary),
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
              duration_ms, fps, combine_progress, is_primary, overlay_burned, created_at, updated_at
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
              duration_ms, fps, combine_progress, is_primary, overlay_burned, created_at, updated_at
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
  overlayBurned = false,
  isPrimary = false,
  lapOneOffset,
  description = null,
  status = "pending_upload",
  now = Date.now(),
}: {
  sessionId: string;
  userId: string;
  mediaId: string;
  overlayBurned?: boolean;
  isPrimary?: boolean;
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
      combine_progress, is_primary, overlay_burned, created_at, updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
    isPrimary ? 1 : 0,
    overlayBurned ? 1 : 0,
    now,
    now
  );

  return {
    id,
    sessionId,
    userId,
    mediaId,
    overlayBurned,
    isPrimary,
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
      "mediaId" | "lapOneOffset" | "description" | "status" | "error" | "sizeBytes" | "durationMs" | "fps" | "combineProgress" | "isPrimary" | "overlayBurned"
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

  const safeCombineProgress = Number.isFinite(next.combineProgress)
    ? Math.max(0, Math.min(1, next.combineProgress))
    : current.combineProgress;
  const nextWithSafeProgress: TrackRecordingRecord = {
    ...next,
    combineProgress: safeCombineProgress,
  };

  const db = getDb();
  db.prepare(
    `UPDATE track_recordings
     SET media_id = ?, lap_one_offset = ?, description = ?, status = ?, error = ?, size_bytes = ?, duration_ms = ?, fps = ?, combine_progress = ?, is_primary = ?, overlay_burned = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    nextWithSafeProgress.mediaId,
    nextWithSafeProgress.lapOneOffset,
    nextWithSafeProgress.description,
    nextWithSafeProgress.status,
    nextWithSafeProgress.error,
    nextWithSafeProgress.sizeBytes,
    nextWithSafeProgress.durationMs,
    nextWithSafeProgress.fps,
    nextWithSafeProgress.combineProgress,
    nextWithSafeProgress.isPrimary ? 1 : 0,
    nextWithSafeProgress.overlayBurned ? 1 : 0,
    nextWithSafeProgress.updatedAt,
    id
  );

  return nextWithSafeProgress;
}

export function deleteTrackRecording(id: string): boolean {
  const db = getDb();
  const result = db.prepare(`DELETE FROM track_recordings WHERE id = ?`).run(id);
  return result.changes > 0;
}

type MediaIdRow = {
  media_id: string | null;
};

export function findAllTrackRecordingMediaIds(): string[] {
  const db = getDb();
  const rows = db.prepare<unknown[], MediaIdRow>(`SELECT media_id FROM track_recordings`).all();
  return rows
    .map((row) => row.media_id)
    .filter((mediaId): mediaId is string => typeof mediaId === "string");
}

type RecordingStatusCountRow = {
  status: string | null;
  count: number | null;
};

export function getTrackRecordingStatusCounts(): { status: TrackRecordingStatus; count: number }[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], RecordingStatusCountRow>(
      `SELECT status, COUNT(*) AS count FROM track_recordings GROUP BY status`
    )
    .all();

  const counts = new Map<TrackRecordingStatus, number>();
  for (const status of TRACK_RECORDING_STATUS_VALUES) {
    counts.set(status, 0);
  }

  for (const row of rows) {
    const status = row.status;
    if (!status) continue;
    if (!TRACK_RECORDING_STATUS_VALUES.includes(status as TrackRecordingStatus)) {
      continue;
    }
    counts.set(status as TrackRecordingStatus, Number(row.count ?? 0));
  }

  return TRACK_RECORDING_STATUS_VALUES.map((status) => ({
    status,
    count: counts.get(status) ?? 0,
  }));
}

type ReadySessionRow = {
  session_id: string;
};

export function findSessionIdsWithReadyRecordings(): string[] {
  const db = getDb();
  const rows = db.prepare<unknown[], ReadySessionRow>(
    `SELECT DISTINCT session_id FROM track_recordings WHERE status = 'ready'`
  ).all();
  return rows.map((row) => row.session_id);
}

export interface TrackRecordingRepository {
  findBySessionId: (sessionId: string) => TrackRecordingRecord[];
  findById?: (id: string) => TrackRecordingRecord | null;
  markPrimary?: (id: string) => TrackRecordingRecord | null;
}

export const trackRecordingsRepository: TrackRecordingRepository = {
  findBySessionId: findTrackRecordingsBySessionId,
  findById: findTrackRecordingById,
  markPrimary: markPrimaryRecording,
};

export function markPrimaryRecording(recordingId: string): TrackRecordingRecord | null {
  const recording = findTrackRecordingById(recordingId);
  if (!recording) return null;

  const db = getDb();
  const txn = db.transaction((id: string, sessionId: string, timestamp: number) => {
    db.prepare(`UPDATE track_recordings SET is_primary = 0 WHERE session_id = ?`).run(sessionId);
    db.prepare(`UPDATE track_recordings SET is_primary = 1, updated_at = ? WHERE id = ?`).run(timestamp, id);
  });

  txn.immediate(recordingId, recording.sessionId, Date.now());
  return findTrackRecordingById(recordingId);
}
