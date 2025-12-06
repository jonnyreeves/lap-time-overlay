import { randomUUID } from "node:crypto";
import { getDb } from "./client.js";

export type TrackRecordingSourceStatus = "pending" | "uploading" | "uploaded" | "failed";

export interface TrackRecordingSourceRecord {
  id: string;
  recordingId: string;
  fileName: string;
  ordinal: number;
  sizeBytes: number | null;
  uploadedBytes: number;
  storagePath: string;
  uploadToken: string;
  status: TrackRecordingSourceStatus;
  createdAt: number;
  updatedAt: number;
}

interface TrackRecordingSourceRow {
  id: string;
  recording_id: string;
  file_name: string;
  ordinal: number;
  size_bytes: number | null;
  uploaded_bytes: number;
  storage_path: string;
  upload_token: string;
  status: TrackRecordingSourceStatus;
  created_at: number;
  updated_at: number;
}

function mapRow(row: TrackRecordingSourceRow): TrackRecordingSourceRecord {
  return {
    id: row.id,
    recordingId: row.recording_id,
    fileName: row.file_name,
    ordinal: row.ordinal,
    sizeBytes: row.size_bytes,
    uploadedBytes: row.uploaded_bytes,
    storagePath: row.storage_path,
    uploadToken: row.upload_token,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findTrackRecordingSourceById(id: string): TrackRecordingSourceRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], TrackRecordingSourceRow>(
      `SELECT id, recording_id, file_name, ordinal, size_bytes, uploaded_bytes, storage_path, upload_token, status, created_at, updated_at
       FROM track_recording_sources WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapRow(row) : null;
}

export function findTrackRecordingSourcesByRecordingId(
  recordingId: string
): TrackRecordingSourceRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], TrackRecordingSourceRow>(
      `SELECT id, recording_id, file_name, ordinal, size_bytes, uploaded_bytes, storage_path, upload_token, status, created_at, updated_at
       FROM track_recording_sources WHERE recording_id = ? ORDER BY ordinal ASC`
    )
    .all(recordingId);
  return rows.map(mapRow);
}

export function createTrackRecordingSource({
  recordingId,
  fileName,
  ordinal,
  sizeBytes = null,
  storagePath,
  uploadToken = randomUUID(),
  now = Date.now(),
}: {
  recordingId: string;
  fileName: string;
  ordinal: number;
  sizeBytes?: number | null;
  storagePath: string;
  uploadToken?: string;
  now?: number;
}): TrackRecordingSourceRecord {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO track_recording_sources (
      id, recording_id, file_name, ordinal, size_bytes, uploaded_bytes, storage_path, upload_token, status, created_at, updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    recordingId,
    fileName,
    ordinal,
    sizeBytes,
    0,
    storagePath,
    uploadToken,
    "pending",
    now,
    now
  );

  return {
    id,
    recordingId,
    fileName,
    ordinal,
    sizeBytes: sizeBytes ?? null,
    uploadedBytes: 0,
    storagePath,
    uploadToken,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
}

export function updateTrackRecordingSource(
  id: string,
  fields: Partial<
    Pick<
      TrackRecordingSourceRecord,
      "uploadedBytes" | "status" | "sizeBytes" | "storagePath"
    >
  >,
  now = Date.now()
): TrackRecordingSourceRecord | null {
  const current = findTrackRecordingSourceById(id);
  if (!current) return null;

  const next: TrackRecordingSourceRecord = {
    ...current,
    ...fields,
    updatedAt: now,
  };

  const db = getDb();
  db.prepare(
    `UPDATE track_recording_sources
     SET uploaded_bytes = ?, status = ?, size_bytes = ?, storage_path = ?, updated_at = ?
     WHERE id = ?`
  ).run(next.uploadedBytes, next.status, next.sizeBytes, next.storagePath, next.updatedAt, id);

  return next;
}

export interface TrackRecordingSourceRepository {
  findByRecordingId: (recordingId: string) => TrackRecordingSourceRecord[];
  findById?: (id: string) => TrackRecordingSourceRecord | null;
}

export const trackRecordingSourcesRepository: TrackRecordingSourceRepository = {
  findByRecordingId: findTrackRecordingSourcesByRecordingId,
  findById: findTrackRecordingSourceById,
};
