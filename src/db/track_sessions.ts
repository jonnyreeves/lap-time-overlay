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
  classification: number;
  circuitId: string;
  userId: string;
  conditions: TrackSessionConditions;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
  kartId: string | null;
}

interface TrackSessionRow {
  id: string;
  date: string;
  format: string;
  classification: number;
  conditions: TrackSessionConditions;
  circuit_id: string;
  user_id: string;
  notes: string | null;
  created_at: number;
  updated_at: number;
  kart_id: string | null;
}

function mapRow(row: TrackSessionRow): TrackSessionRecord {
  return {
    id: row.id,
    date: row.date,
    format: row.format,
    classification: row.classification,
    conditions: row.conditions,
    circuitId: row.circuit_id,
    userId: row.user_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    kartId: row.kart_id,
  };
}

export function findTrackSessionById(id: string): TrackSessionRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], TrackSessionRow>(
      `SELECT id, date, format, classification, conditions, circuit_id, user_id, notes, created_at, updated_at, kart_id
       FROM track_sessions WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapRow(row) : null;
}

export function findTrackSessionsByCircuitId(circuitId: string): TrackSessionRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], TrackSessionRow>(
      `SELECT id, date, format, classification, conditions, circuit_id, user_id, notes, created_at, updated_at, kart_id
       FROM track_sessions WHERE circuit_id = ? ORDER BY date DESC`
    )
    .all(circuitId);
  return rows.map(mapRow);
}

export function findTrackSessionsByUserId(userId: string): TrackSessionRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], TrackSessionRow>(
            `SELECT id, date, format, classification, conditions, circuit_id, user_id, notes, created_at, updated_at, kart_id
                 FROM track_sessions WHERE user_id = ? ORDER BY date DESC`    )
    .all(userId);
  return rows.map(mapRow);
}

export type TrackSessionLapInput = Pick<LapRecord, "lapNumber" | "time"> & {
  lapEvents?: TrackSessionLapEventInput[];
};

export function createTrackSessionWithLaps({
  date,
  format,
   classification,
  circuitId,
  userId,
  conditions = "Dry",
  notes = null,
  laps = [],
  now = Date.now(),
  kartId = null,
}: {
  date: string;
  format: string;
  classification: number;
  circuitId: string;
  userId: string;
  conditions?: TrackSessionConditions;
  notes?: string | null;
  laps?: TrackSessionLapInput[];
  now?: number;
  kartId?: string | null;
}): { trackSession: TrackSessionRecord; laps: LapRecord[] } {
  const db = getDb();
  const sessionId = randomUUID();
  const insertSession = db.prepare(
    `INSERT INTO track_sessions (id, date, format, classification, conditions, circuit_id, user_id, notes, created_at, updated_at, kart_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
    insertSession.run(
      sessionId,
      date,
      format,
      classification,
      conditions,
      circuitId,
      userId,
      notes,
      now,
      now,
      kartId
    );
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
    classification,
    conditions,
    circuitId,
    userId,
    notes: notes ?? null,
    createdAt: now,
    updatedAt: now,
    kartId: kartId ?? null,
  };

  return { trackSession, laps: createdLaps };
}

export function createTrackSession(
  date: string,
  format: string,
  classification: number,
  circuitId: string,
  userId: string,
  notes: string | null = null,
  now = Date.now(),
  conditions: TrackSessionConditions = "Dry",
  kartId: string | null = null
): TrackSessionRecord {
  return createTrackSessionWithLaps({
    date,
    format,
    classification,
    circuitId,
    userId,
    notes,
    conditions,
    now,
    laps: [],
    kartId,
  }).trackSession;
}

export function updateTrackSession({
  id,
  date,
  format,
  classification,
  circuitId,
  conditions,
  notes,
  now = Date.now(),
  kartId,
}: {
  id: string;
  date?: string;
  format?: string;
  classification?: number;
  circuitId?: string;
  conditions?: TrackSessionConditions;
  notes?: string | null;
  now?: number;
  kartId?: string | null;
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
    classification: classification ?? current.classification,
    circuitId: circuitId ?? current.circuitId,
    userId: current.userId,
    conditions: conditions ?? current.conditions,
    notes: notes === undefined ? current.notes : notes,
    updatedAt: now,
    kartId: kartId === undefined ? current.kartId : kartId,
  };

  db.prepare(
    `UPDATE track_sessions
     SET date = ?, format = ?, classification = ?, conditions = ?, circuit_id = ?, notes = ?, updated_at = ?, kart_id = ?
     WHERE id = ?`
  ).run(
    next.date,
    next.format,
    next.classification,
    next.conditions,
    next.circuitId,
    next.notes,
    next.updatedAt,
    next.kartId,
    id
  );

  return next;
}

export function replaceLapsForSession(
  sessionId: string,
  laps: TrackSessionLapInput[],
  now = Date.now()
): LapRecord[] {
  const db = getDb();
  const insertLap = db.prepare(
    `INSERT INTO laps (id, session_id, lap_number, time, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertLapEvent = db.prepare(
    `INSERT INTO lap_events (id, lap_id, offset, event, value, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const created: LapRecord[] = [];

  db.transaction(() => {
    db.prepare(
      `DELETE FROM lap_events WHERE lap_id IN (SELECT id FROM laps WHERE session_id = ?)`
    ).run(sessionId);
    db.prepare(`DELETE FROM laps WHERE session_id = ?`).run(sessionId);

    for (const lap of laps) {
      const lapId = randomUUID();
      insertLap.run(lapId, sessionId, lap.lapNumber, lap.time, now, now);
      created.push({
        id: lapId,
        sessionId,
        lapNumber: lap.lapNumber,
        time: lap.time,
        createdAt: now,
        updatedAt: now,
      });
      if (lap.lapEvents?.length) {
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
  })();

  return created;
}

export interface TrackSessionRepository {
  findById: (id: string) => TrackSessionRecord | null;
  findByCircuitId: (circuitId: string) => TrackSessionRecord[];
  findByUserId: (userId: string) => TrackSessionRecord[];
  createWithLaps: (input: {
    date: string;
    format: string;
    classification: number;
    circuitId: string;
    userId: string;
    conditions?: TrackSessionConditions;
    notes?: string | null;
    laps?: TrackSessionLapInput[];
    now?: number;
    kartId?: string | null;
  }) => { trackSession: TrackSessionRecord; laps: LapRecord[] };
  update: (input: {
    id: string;
    date?: string;
    format?: string;
    classification?: number;
    circuitId?: string;
    conditions?: TrackSessionConditions;
    notes?: string | null;
    now?: number;
    kartId?: string | null;
  }) => TrackSessionRecord | null;
  replaceLapsForSession: (sessionId: string, laps: TrackSessionLapInput[], now?: number) => LapRecord[];
}

export const trackSessionsRepository: TrackSessionRepository = {
  findById: findTrackSessionById,
  findByCircuitId: findTrackSessionsByCircuitId,
  findByUserId: findTrackSessionsByUserId,
  createWithLaps: createTrackSessionWithLaps,
  update: updateTrackSession,
  replaceLapsForSession,
};
