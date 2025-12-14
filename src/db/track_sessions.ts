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
  fastestLap: number | null;
  trackId: string;
  userId: string;
  conditions: TrackSessionConditions;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
  kartId: string | null;
  trackLayoutId: string;
}

interface TrackSessionRow {
  id: string;
  date: string;
  format: string;
  classification: number;
  fastest_lap: number | null;
  conditions: TrackSessionConditions;
  track_id: string;
  user_id: string;
  notes: string | null;
  created_at: number;
  updated_at: number;
  kart_id: string | null;
  track_layout_id: string;
}

function mapRow(row: TrackSessionRow): TrackSessionRecord {
  return {
    id: row.id,
    date: row.date,
    format: row.format,
    classification: row.classification,
    fastestLap: row.fastest_lap,
    conditions: row.conditions,
    trackId: row.track_id,
    userId: row.user_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    kartId: row.kart_id,
    trackLayoutId: row.track_layout_id,
  };
}

export function findTrackSessionById(id: string): TrackSessionRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], TrackSessionRow>(
      `SELECT id, date, format, classification, fastest_lap, conditions, track_id, user_id, notes, created_at, updated_at, kart_id, track_layout_id
       FROM track_sessions WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapRow(row) : null;
}

export function findTrackSessionsByTrackId(trackId: string): TrackSessionRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], TrackSessionRow>(
      `SELECT id, date, format, classification, fastest_lap, conditions, track_id, user_id, notes, created_at, updated_at, kart_id, track_layout_id
       FROM track_sessions WHERE track_id = ? ORDER BY date DESC`
    )
    .all(trackId);
  return rows.map(mapRow);
}

export function findTrackSessionsByUserId(userId: string): TrackSessionRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], TrackSessionRow>(
            `SELECT id, date, format, classification, fastest_lap, conditions, track_id, user_id, notes, created_at, updated_at, kart_id, track_layout_id
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
  trackId,
  userId,
  conditions = "Dry",
  notes = null,
  laps = [],
  now = Date.now(),
  kartId = null,
  trackLayoutId,
  fastestLap = null,
}: {
  date: string;
  format: string;
  classification: number;
  trackId: string;
  userId: string;
  conditions?: TrackSessionConditions;
  notes?: string | null;
  laps?: TrackSessionLapInput[];
  now?: number;
  kartId?: string | null;
  trackLayoutId: string;
  fastestLap?: number | null;
}): { trackSession: TrackSessionRecord; laps: LapRecord[] } {
  const db = getDb();
  const sessionId = randomUUID();
  const insertSession = db.prepare(
    `INSERT INTO track_sessions (id, date, format, classification, fastest_lap, conditions, track_id, user_id, notes, created_at, updated_at, kart_id, track_layout_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      fastestLap,
      conditions,
      trackId,
      userId,
      notes,
      now,
      now,
      kartId,
      trackLayoutId
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
    fastestLap,
    conditions,
    trackId,
    userId,
    notes: notes ?? null,
    createdAt: now,
    updatedAt: now,
    kartId: kartId ?? null,
    trackLayoutId,
  };

  return { trackSession, laps: createdLaps };
}

export function createTrackSession(
  date: string,
  format: string,
  classification: number,
  trackId: string,
  userId: string,
  notes: string | null = null,
  now = Date.now(),
  conditions: TrackSessionConditions = "Dry",
  kartId: string | null = null,
  trackLayoutId: string,
  fastestLap: number | null = null
): TrackSessionRecord {
  return createTrackSessionWithLaps({
    date,
    format,
    classification,
    trackId,
    userId,
    notes,
    conditions,
    now,
    laps: [],
    kartId,
    trackLayoutId,
    fastestLap,
  }).trackSession;
}

export function updateTrackSession({
  id,
  date,
  format,
  classification,
  trackId,
  conditions,
  notes,
  now = Date.now(),
  kartId,
  trackLayoutId,
  fastestLap,
}: {
  id: string;
  date?: string;
  format?: string;
  classification?: number;
  trackId?: string;
  conditions?: TrackSessionConditions;
  notes?: string | null;
  now?: number;
  kartId?: string | null;
  trackLayoutId?: string;
  fastestLap?: number | null;
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
    fastestLap: fastestLap === undefined ? current.fastestLap : fastestLap,
    trackId: trackId ?? current.trackId,
    userId: current.userId,
    conditions: conditions ?? current.conditions,
    notes: notes === undefined ? current.notes : notes,
    updatedAt: now,
    kartId: kartId === undefined ? current.kartId : kartId,
    trackLayoutId: trackLayoutId ?? current.trackLayoutId,
  };

  db.prepare(
    `UPDATE track_sessions
     SET date = ?, format = ?, classification = ?, fastest_lap = ?, conditions = ?, track_id = ?, notes = ?, updated_at = ?, kart_id = ?, track_layout_id = ?
     WHERE id = ?`
  ).run(
    next.date,
    next.format,
    next.classification,
    next.fastestLap,
    next.conditions,
    next.trackId,
    next.notes,
    next.updatedAt,
    next.kartId,
    next.trackLayoutId,
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
  findByTrackId: (trackId: string) => TrackSessionRecord[];
  findByUserId: (userId: string) => TrackSessionRecord[];
  createWithLaps: (input: {
    date: string;
    format: string;
    classification: number;
    trackId: string;
    userId: string;
    conditions?: TrackSessionConditions;
    notes?: string | null;
    laps?: TrackSessionLapInput[];
    now?: number;
    kartId?: string | null;
    trackLayoutId: string;
    fastestLap?: number | null;
  }) => { trackSession: TrackSessionRecord; laps: LapRecord[] };
  update: (input: {
    id: string;
    date?: string;
    format?: string;
    classification?: number;
    trackId?: string;
    conditions?: TrackSessionConditions;
    notes?: string | null;
    now?: number;
    kartId?: string | null;
    trackLayoutId?: string;
    fastestLap?: number | null;
  }) => TrackSessionRecord | null;
  replaceLapsForSession: (sessionId: string, laps: TrackSessionLapInput[], now?: number) => LapRecord[];
}

export const trackSessionsRepository: TrackSessionRepository = {
  findById: findTrackSessionById,
  findByTrackId: findTrackSessionsByTrackId,
  findByUserId: findTrackSessionsByUserId,
  createWithLaps: createTrackSessionWithLaps,
  update: updateTrackSession,
  replaceLapsForSession,
};
