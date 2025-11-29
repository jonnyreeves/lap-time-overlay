import { randomUUID } from "node:crypto";
import { getDb } from "./client.js";

export interface LapEventRecord {
  id: string;
  lapId: string;
  offset: number;
  event: string;
  createdAt: number;
  updatedAt: number;
}

interface LapEventRow {
  id: string;
  lap_id: string;
  offset: number;
  event: string;
  created_at: number;
  updated_at: number;
}

function mapRow(row: LapEventRow): LapEventRecord {
  return {
    id: row.id,
    lapId: row.lap_id,
    offset: row.offset,
    event: row.event,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findLapEventById(id: string): LapEventRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], LapEventRow>(
      `SELECT id, lap_id, offset, event, created_at, updated_at
       FROM lap_events WHERE id = ? LIMIT 1`
    )
    .get(id);
  return row ? mapRow(row) : null;
}

export function findLapEventsByLapId(lapId: string): LapEventRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], LapEventRow>(
      `SELECT id, lap_id, offset, event, created_at, updated_at
       FROM lap_events WHERE lap_id = ? ORDER BY offset ASC`
    )
    .all(lapId);
  return rows.map(mapRow);
}

export function createLapEvent(
  lapId: string,
  offset: number,
  event: string,
  now = Date.now()
): LapEventRecord {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO lap_events (id, lap_id, offset, event, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, lapId, offset, event, now, now);

  return {
    id,
    lapId,
    offset,
    event,
    createdAt: now,
    updatedAt: now,
  };
}

export function createLapEvents(
  lapId: string,
  lapEventsData: Omit<LapEventRecord, "id" | "lapId" | "createdAt" | "updatedAt">[],
  now = Date.now()
): LapEventRecord[] {
  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO lap_events (id, lap_id, offset, event, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const newLapEvents: LapEventRecord[] = [];
  db.transaction(() => {
    for (const lapEvent of lapEventsData) {
      const id = randomUUID();
      insert.run(id, lapId, lapEvent.offset, lapEvent.event, now, now);
      newLapEvents.push({ ...lapEvent, id, lapId, createdAt: now, updatedAt: now });
    }
  })();
  return newLapEvents;
}
