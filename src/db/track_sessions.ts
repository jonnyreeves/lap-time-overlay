import { randomUUID } from "node:crypto";
import { getDb } from "./client.js";
import type { LapRecord } from "./laps.js";

export interface TrackSessionLapEventInput {
  offset: number;
  event: string;
  value: string;
}

export type TrackSessionConditions = "Dry" | "Wet";

export interface TrackSessionRecord {
  id: string;
  date: string;
  format: string; // Enum: 'Race', 'Qualifying', 'Practice'
  circuitId: string;
  conditions: TrackSessionConditions;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
}

interface TrackSessionRow {
  id: string;
  date: string;
  format: string;
  conditions: TrackSessionConditions;
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
    conditions: row.conditions,
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
      `SELECT id, date, format, conditions, circuit_id, notes, created_at, updated_at
       FROM track_sessions WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapRow(row) : null;
}

export function findTrackSessionsByCircuitId(circuitId: string): TrackSessionRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], TrackSessionRow>(
      `SELECT id, date, format, conditions, circuit_id, notes, created_at, updated_at
       FROM track_sessions WHERE circuit_id = ? ORDER BY date DESC`
    )
    .all(circuitId);
  return rows.map(mapRow);
}

export type TrackSessionLapInput = Pick<LapRecord, "lapNumber" | "time"> & {
  lapEvents?: TrackSessionLapEventInput[];
};

export function createTrackSessionWithLaps({
  date,
  format,
  circuitId,
  conditions = "Dry",
  notes = null,
  laps = [],
  now = Date.now(),
}: {
  date: string;
  format: string;
  circuitId: string;
  conditions?: TrackSessionConditions;
  notes?: string | null;
  laps?: TrackSessionLapInput[];
  now?: number;
}): { trackSession: TrackSessionRecord; laps: LapRecord[] } {
  const db = getDb();
  const sessionId = randomUUID();
  const insertSession = db.prepare(
    `INSERT INTO track_sessions (id, date, format, conditions, circuit_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertLap =
    laps.length > 0
      ? db.prepare(
          `INSERT INTO laps (id, session_id, lap_number, time, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
      : null;
  const insertLapEvent =
    laps.length > 0
      ? db.prepare(
          `INSERT INTO lap_events (id, lap_id, offset, event, value, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
      : null;
  const createdLaps: LapRecord[] = [];

  db.transaction(() => {
    insertSession.run(sessionId, date, format, conditions, circuitId, notes, now, now);
    if (insertLap) {
      for (const lap of laps) {
        const lapId = randomUUID();
        insertLap.run(lapId, sessionId, lap.lapNumber, lap.time, now, now);
        createdLaps.push({
          id: lapId,
          sessionId,
          lapNumber: lap.lapNumber,
          time: lap.time,
          createdAt: now,
          updatedAt: now,
        });
        if (insertLapEvent && lap.lapEvents?.length) {
          for (const lapEvent of lap.lapEvents) {
            insertLapEvent.run(
              randomUUID(),
              lapId,
              lapEvent.offset,
              lapEvent.event,
              lapEvent.value,
              now,
              now
            );
          }
        }
      }
    }
  })();

  const trackSession: TrackSessionRecord = {
    id: sessionId,
    date,
    format,
    conditions,
    circuitId,
    notes: notes ?? null,
    createdAt: now,
    updatedAt: now,
  };

  return { trackSession, laps: createdLaps };
}

export function createTrackSession(
  date: string,
  format: string,
  circuitId: string,
  notes: string | null = null,
  now = Date.now(),
  conditions: TrackSessionConditions = "Dry"
): TrackSessionRecord {
  return createTrackSessionWithLaps({
    date,
    format,
    circuitId,
    notes,
    conditions,
    now,
    laps: [],
  }).trackSession;
}

export function updateTrackSession({
  id,
  date,
  format,
  circuitId,
  conditions,
  notes,
  now = Date.now(),
}: {
  id: string;
  date?: string;
  format?: string;
  circuitId?: string;
  conditions?: TrackSessionConditions;
  notes?: string | null;
  now?: number;
}): TrackSessionRecord | null {
  const db = getDb();
  const current = findTrackSessionById(id);
  if (!current) {
    return null;
  }

  const next: TrackSessionRecord = {
    ...current,
    date: date ?? current.date,
    format: format ?? current.format,
    circuitId: circuitId ?? current.circuitId,
    conditions: conditions ?? current.conditions,
    notes: notes === undefined ? current.notes : notes,
    updatedAt: now,
  };

  db.prepare(
    `UPDATE track_sessions
     SET date = ?, format = ?, conditions = ?, circuit_id = ?, notes = ?, updated_at = ?
     WHERE id = ?`
  ).run(next.date, next.format, next.conditions, next.circuitId, next.notes, next.updatedAt, id);

  return next;
}

export interface TrackSessionRepository {
  findById: (id: string) => TrackSessionRecord | null;
  findByCircuitId: (circuitId: string) => TrackSessionRecord[];
  createWithLaps: (input: {
    date: string;
    format: string;
    circuitId: string;
    conditions?: TrackSessionConditions;
    notes?: string | null;
    laps?: TrackSessionLapInput[];
    now?: number;
  }) => { trackSession: TrackSessionRecord; laps: LapRecord[] };
  update: (input: {
    id: string;
    date?: string;
    format?: string;
    circuitId?: string;
    conditions?: TrackSessionConditions;
    notes?: string | null;
    now?: number;
  }) => TrackSessionRecord | null;
}

export const trackSessionsRepository: TrackSessionRepository = {
  findById: findTrackSessionById,
  findByCircuitId: findTrackSessionsByCircuitId,
  createWithLaps: createTrackSessionWithLaps,
  update: updateTrackSession,
};
