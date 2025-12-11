import { getDb } from "../db/client.js";
import { KartRecord, mapKartRow, KartRow } from "./karts.js"; // Assuming mapKartRow is exported

export interface TrackKartRecord {
  trackId: string;
  kartId: string;
}

interface TrackKartRow {
  track_id: string;
  kart_id: string;
}

export function addKartToTrack(trackId: string, kartId: string): void {
  const db = getDb();
  db.prepare(
    `INSERT OR IGNORE INTO track_karts (track_id, kart_id)
     VALUES (?, ?)`
  ).run(trackId, kartId);
}

export function removeKartFromTrack(trackId: string, kartId: string): void {
  const db = getDb();
  db.prepare(
    `DELETE FROM track_karts WHERE track_id = ? AND kart_id = ?`
  ).run(trackId, kartId);
}

export function findKartsForTrack(trackId: string): KartRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], KartRow>(
      `SELECT k.id, k.name, k.created_at, k.updated_at
       FROM karts k
       JOIN track_karts ck ON k.id = ck.kart_id
       WHERE ck.track_id = ?
       ORDER BY k.name ASC`
    )
    .all(trackId);
  return rows.map(mapKartRow);
}

export interface TrackKartsRepository {
  addKartToTrack: (trackId: string, kartId: string) => void;
  removeKartFromTrack: (trackId: string, kartId: string) => void;
  findKartsForTrack: (trackId: string) => KartRecord[];
}

export const trackKartsRepository: TrackKartsRepository = {
  addKartToTrack,
  removeKartFromTrack,
  findKartsForTrack,
};
