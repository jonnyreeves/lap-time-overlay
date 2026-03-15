import { getDb } from "./client.js";

export interface TrackSessionParticipantRecord {
  id: string;
  sessionId: string;
  name: string;
  classification: number | null;
  kartNumber: string;
  isSelf: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TrackSessionParticipantLapRecord {
  id: string;
  participantId: string;
  lapNumber: number;
  time: number;
  createdAt: number;
  updatedAt: number;
}

interface TrackSessionParticipantRow {
  id: string;
  session_id: string;
  name: string;
  classification: number | null;
  kart_number: string | null;
  is_self: number;
  created_at: number;
  updated_at: number;
}

interface TrackSessionParticipantLapRow {
  id: string;
  participant_id: string;
  lap_number: number;
  time: number;
  created_at: number;
  updated_at: number;
}

function mapParticipantRow(row: TrackSessionParticipantRow): TrackSessionParticipantRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    name: row.name,
    classification: row.classification,
    kartNumber: row.kart_number ?? "",
    isSelf: Boolean(row.is_self),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapParticipantLapRow(row: TrackSessionParticipantLapRow): TrackSessionParticipantLapRecord {
  return {
    id: row.id,
    participantId: row.participant_id,
    lapNumber: row.lap_number,
    time: row.time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findTrackSessionParticipantsBySessionId(
  sessionId: string
): TrackSessionParticipantRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], TrackSessionParticipantRow>(
      `SELECT id, session_id, name, classification, kart_number, is_self, created_at, updated_at
       FROM track_session_participants
       WHERE session_id = ?
       ORDER BY is_self DESC, name ASC, created_at ASC`
    )
    .all(sessionId);
  return rows.map(mapParticipantRow);
}

export function findTrackSessionParticipantsBySessionIds(
  sessionIds: string[]
): TrackSessionParticipantRecord[] {
  if (sessionIds.length === 0) return [];
  const db = getDb();
  const placeholders = sessionIds.map(() => "?").join(", ");
  const rows = db
    .prepare<unknown[], TrackSessionParticipantRow>(
      `SELECT id, session_id, name, classification, kart_number, is_self, created_at, updated_at
       FROM track_session_participants
       WHERE session_id IN (${placeholders})
       ORDER BY created_at ASC`
    )
    .all(...sessionIds);
  return rows.map(mapParticipantRow);
}

export function findTrackSessionParticipantLapsByParticipantId(
  participantId: string
): TrackSessionParticipantLapRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], TrackSessionParticipantLapRow>(
      `SELECT id, participant_id, lap_number, time, created_at, updated_at
       FROM track_session_participant_laps
       WHERE participant_id = ?
       ORDER BY lap_number ASC`
    )
    .all(participantId);
  return rows.map(mapParticipantLapRow);
}

export function findTrackSessionParticipantLapsByParticipantIds(
  participantIds: string[]
): TrackSessionParticipantLapRecord[] {
  if (participantIds.length === 0) return [];
  const db = getDb();
  const placeholders = participantIds.map(() => "?").join(", ");
  const rows = db
    .prepare<unknown[], TrackSessionParticipantLapRow>(
      `SELECT id, participant_id, lap_number, time, created_at, updated_at
       FROM track_session_participant_laps
       WHERE participant_id IN (${placeholders})
       ORDER BY participant_id ASC, lap_number ASC`
    )
    .all(...participantIds);
  return rows.map(mapParticipantLapRow);
}

export interface TrackSessionParticipantsRepository {
  findBySessionId: (sessionId: string) => TrackSessionParticipantRecord[];
  findBySessionIds: (sessionIds: string[]) => TrackSessionParticipantRecord[];
  findLapsByParticipantId: (participantId: string) => TrackSessionParticipantLapRecord[];
  findLapsByParticipantIds: (participantIds: string[]) => TrackSessionParticipantLapRecord[];
}

export const trackSessionParticipantsRepository: TrackSessionParticipantsRepository = {
  findBySessionId: findTrackSessionParticipantsBySessionId,
  findBySessionIds: findTrackSessionParticipantsBySessionIds,
  findLapsByParticipantId: findTrackSessionParticipantLapsByParticipantId,
  findLapsByParticipantIds: findTrackSessionParticipantLapsByParticipantIds,
};
