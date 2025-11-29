import { randomUUID } from "node:crypto";
import { getDb } from "./client.js";

export interface TrackSessionRecord {
  id: string;
  date: string;
  format: string; // Enum: 'Race', 'Qualifying', 'Practice'
  circuitId: string;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
}

interface TrackSessionRow {
  id: string;
  date: string;
  format: string;
  circuit_id: string;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

function mapRow(row: TrackSessionRow): TrackSessionRecord {
  return {
    id: row.id,
    date: row.date,
    format: row.format,
    circuitId: row.circuit_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findTrackSessionById(id: string): TrackSessionRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], TrackSessionRow>(
      `SELECT id, date, format, circuit_id, notes, created_at, updated_at
       FROM track_sessions WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapRow(row) : null;
}

export function findTrackSessionsByCircuitId(circuitId: string): TrackSessionRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], TrackSessionRow>(
      `SELECT id, date, format, circuit_id, notes, created_at, updated_at
       FROM track_sessions WHERE circuit_id = ? ORDER BY date DESC`
    )
    .all(circuitId);
  return rows.map(mapRow);
}

export function createTrackSession(
  date: string,
  format: string,
  circuitId: string,
  notes: string | null = null,
  now = Date.now()
): TrackSessionRecord {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO track_sessions (id, date, format, circuit_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, date, format, circuitId, notes, now, now);

  return {
    id,
    date,
    format,
    circuitId,
    notes,
    createdAt: now,
    updatedAt: now,
  };
}
