import { randomUUID } from "node:crypto";
import { getDb } from "./client.js";

export interface LapRecord {
  id: string;
  sessionId: string;
  lapNumber: number;
  time: number;
  createdAt: number;
  updatedAt: number;
}

interface LapRow {
  id: string;
  session_id: string;
  lap_number: number;
  time: number;
  created_at: number;
  updated_at: number;
}

function mapRow(row: LapRow): LapRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    lapNumber: row.lap_number,
    time: row.time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findLapById(id: string): LapRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], LapRow>(
      `SELECT id, session_id, lap_number, time, created_at, updated_at
       FROM laps WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapRow(row) : null;
}

export function findLapsBySessionId(sessionId: string): LapRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], LapRow>(
      `SELECT id, session_id, lap_number, time, created_at, updated_at
       FROM laps WHERE session_id = ? ORDER BY lap_number ASC`
    )
    .all(sessionId);
  return rows.map(mapRow);
}

export function createLap(
  sessionId: string,
  lapNumber: number,
  time: number,
  now = Date.now()
): LapRecord {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO laps (id, session_id, lap_number, time, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, sessionId, lapNumber, time, now, now);

  return {
    id,
    sessionId,
    lapNumber,
    time,
    createdAt: now,
    updatedAt: now,
  };
}

export function createLaps(
  sessionId: string,
  lapsData: Omit<LapRecord, "id" | "sessionId" | "createdAt" | "updatedAt">[],
  now = Date.now()
): LapRecord[] {
  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO laps (id, session_id, lap_number, time, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const newLaps: LapRecord[] = [];
  db.transaction(() => {
    for (const lap of lapsData) {
      const id = randomUUID();
      insert.run(id, sessionId, lap.lapNumber, lap.time, now, now);
      newLaps.push({ ...lap, id, sessionId, createdAt: now, updatedAt: now });
    }
  })();
  return newLaps;
}

export interface LapRepository {
  findById: (id: string) => LapRecord | null;
  findBySessionId: (sessionId: string) => LapRecord[];
}

export const lapsRepository: LapRepository = {
  findById: findLapById,
  findBySessionId: findLapsBySessionId,
};
