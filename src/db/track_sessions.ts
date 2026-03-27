import { randomUUID } from "node:crypto";
import { getDb } from "./client.js";
import type { LapRecord } from "./laps.js";
import { safeUnlink } from "../web/shared/fs.js";

export interface TrackSessionLapEventInput {
  offset: number;
  event: string;
  value: string;
}

export interface TrackSessionParticipantLapInput {
  lapNumber: number;
  time: number;
}

export interface TrackSessionParticipantInput {
  name: string;
  classification: number | null;
  kartNumber?: string | null;
  isSelf: boolean;
  laps: TrackSessionParticipantLapInput[];
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
  temperature: string;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
  kartId: string | null;
  kartNumber: string;
  trackLayoutId: string;
  importSourceProvider?: string | null;
  importSourceId?: string | null;
}

interface TrackSessionRow {
  id: string;
  date: string;
  format: string;
  classification: number;
  fastest_lap: number | null;
  conditions: TrackSessionConditions;
  temperature: string;
  track_id: string;
  user_id: string;
  notes: string | null;
  created_at: number;
  updated_at: number;
  kart_id: string | null;
  kart_number: string | null;
  track_layout_id: string;
  import_source_provider: string | null;
  import_source_id: string | null;
}

function mapRow(row: TrackSessionRow): TrackSessionRecord {
  return {
    id: row.id,
    date: row.date,
    format: row.format,
    classification: row.classification,
    fastestLap: row.fastest_lap,
    conditions: row.conditions,
    temperature: row.temperature,
    trackId: row.track_id,
    userId: row.user_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    kartId: row.kart_id,
    kartNumber: row.kart_number ?? "",
    trackLayoutId: row.track_layout_id,
    importSourceProvider: row.import_source_provider ?? null,
    importSourceId: row.import_source_id ?? null,
  };
}

export function findTrackSessionById(id: string): TrackSessionRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], TrackSessionRow>(
      `SELECT id, date, format, classification, fastest_lap, conditions, track_id, user_id, notes, created_at, updated_at, kart_id, kart_number, track_layout_id, temperature
              , import_source_provider, import_source_id
       FROM track_sessions WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapRow(row) : null;
}

export function findTrackSessionsByTrackId(trackId: string): TrackSessionRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], TrackSessionRow>(
      `SELECT id, date, format, classification, fastest_lap, conditions, track_id, user_id, notes, created_at, updated_at, kart_id, kart_number, track_layout_id, temperature
              , import_source_provider, import_source_id
       FROM track_sessions WHERE track_id = ? ORDER BY date DESC`
    )
    .all(trackId);
  return rows.map(mapRow);
}

export function findTrackSessionsByUserId(userId: string): TrackSessionRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], TrackSessionRow>(
            `SELECT id, date, format, classification, fastest_lap, conditions, track_id, user_id, notes, created_at, updated_at, kart_id, kart_number, track_layout_id, temperature, import_source_provider, import_source_id
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
  kartNumber = "",
  trackLayoutId,
  fastestLap = null,
  temperature = "",
  participants = [],
  importSourceProvider = null,
  importSourceId = null,
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
  kartNumber?: string;
  trackLayoutId: string;
  fastestLap?: number | null;
  temperature?: string;
  participants?: TrackSessionParticipantInput[];
  importSourceProvider?: string | null;
  importSourceId?: string | null;
}): { trackSession: TrackSessionRecord; laps: LapRecord[] } {
  const db = getDb();
  const sessionId = randomUUID();
  const normalizedTemperature = temperature ?? "";
  const insertSession = db.prepare(
    `INSERT INTO track_sessions (id, date, format, classification, fastest_lap, conditions, track_id, user_id, notes, created_at, updated_at, kart_id, kart_number, track_layout_id, temperature, import_source_provider, import_source_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
  const insertParticipant =
    participants.length > 0
      ? db.prepare(
          `INSERT INTO track_session_participants (
            id, session_id, name, classification, kart_number, is_self, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
      : null;
  const insertParticipantLap =
    participants.length > 0
      ? db.prepare(
          `INSERT INTO track_session_participant_laps (
            id, participant_id, lap_number, time, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)`
        )
      : null;

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
      kartNumber,
      trackLayoutId,
      normalizedTemperature,
      importSourceProvider,
      importSourceId
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
    if (insertParticipant && insertParticipantLap) {
      for (const participant of participants) {
        const participantId = randomUUID();
        insertParticipant.run(
          participantId,
          sessionId,
          participant.name,
          participant.classification,
          participant.kartNumber ?? "",
          participant.isSelf ? 1 : 0,
          now,
          now
        );
        for (const lap of participant.laps) {
          insertParticipantLap.run(
            randomUUID(),
            participantId,
            lap.lapNumber,
            lap.time,
            now,
            now
          );
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
    temperature: normalizedTemperature,
    trackId,
    userId,
    notes: notes ?? null,
    createdAt: now,
    updatedAt: now,
    kartId: kartId ?? null,
    kartNumber,
    trackLayoutId,
    importSourceProvider,
    importSourceId,
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
  fastestLap: number | null = null,
  kartNumber: string = "",
  temperature: string = "",
  importSourceProvider: string | null = null,
  importSourceId: string | null = null
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
    kartNumber,
    trackLayoutId,
    fastestLap,
    temperature,
    importSourceProvider,
    importSourceId,
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
  kartNumber,
  trackLayoutId,
  fastestLap,
  temperature,
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
  kartNumber?: string;
  trackLayoutId?: string;
  fastestLap?: number | null;
  temperature?: string;
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
    temperature: temperature === undefined ? current.temperature : temperature ?? "",
    notes: notes === undefined ? current.notes : notes,
    updatedAt: now,
    kartId: kartId === undefined ? current.kartId : kartId,
    kartNumber: kartNumber === undefined ? current.kartNumber : kartNumber,
    trackLayoutId: trackLayoutId ?? current.trackLayoutId,
    importSourceProvider: current.importSourceProvider,
    importSourceId: current.importSourceId,
  };

  db.prepare(
    `UPDATE track_sessions
     SET date = ?, format = ?, classification = ?, fastest_lap = ?, conditions = ?, track_id = ?, notes = ?, updated_at = ?, kart_id = ?, kart_number = ?, track_layout_id = ?, temperature = ?
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
    next.kartNumber,
    next.trackLayoutId,
    next.temperature,
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

interface RecordingFilePathRow {
  storage_path: string;
}

export async function deleteTrackSession(
  id: string,
  userId: string,
): Promise<boolean> {
  const db = getDb();
  const session = findTrackSessionById(id);

  if (!session) {
    return false;
  }

  if (session.userId !== userId) {
    return false;
  }

  const recordingFilePaths = db
    .prepare<[string], RecordingFilePathRow>(
      `SELECT trs.storage_path FROM track_recordings tr JOIN track_recording_sources trs ON tr.id = trs.recording_id WHERE tr.session_id = ?`
    )
    .all(id);

  db.transaction(() => {
    // Delete lap events
    db.prepare(
      `DELETE FROM lap_events WHERE lap_id IN (SELECT id FROM laps WHERE session_id = ?)`
    ).run(id);

    // Delete laps
    db.prepare(`DELETE FROM laps WHERE session_id = ?`).run(id);

    // Delete track recording sources
    db.prepare(
      `DELETE FROM track_recording_sources WHERE recording_id IN (SELECT id FROM track_recordings WHERE session_id = ?)`
    ).run(id);

    // Delete track recordings
    db.prepare(`DELETE FROM track_recordings WHERE session_id = ?`).run(id);

    // Delete track session
    db.prepare(`DELETE FROM track_sessions WHERE id = ?`).run(id);
  })();

  for (const { storage_path } of recordingFilePaths) {
    await safeUnlink(storage_path);
  }

  return true;
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
    kartNumber?: string;
    trackLayoutId: string;
    fastestLap?: number | null;
    temperature?: string;
    participants?: TrackSessionParticipantInput[];
    importSourceProvider?: string | null;
    importSourceId?: string | null;
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
    kartNumber?: string;
    trackLayoutId?: string;
    fastestLap?: number | null;
    temperature?: string;
  }) => TrackSessionRecord | null;
  replaceLapsForSession: (sessionId: string, laps: TrackSessionLapInput[], now?: number) => LapRecord[];
  delete: (id: string, userId: string) => Promise<boolean>;
}

export const trackSessionsRepository: TrackSessionRepository = {
  findById: findTrackSessionById,
  findByTrackId: findTrackSessionsByTrackId,
  findByUserId: findTrackSessionsByUserId,
  createWithLaps: createTrackSessionWithLaps,
  update: updateTrackSession,
  replaceLapsForSession,
  delete: deleteTrackSession,
};
