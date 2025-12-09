import { getDb } from "../db/client.js";
import { KartRecord, mapKartRow, KartRow } from "./karts.js"; // Assuming mapKartRow is exported

export interface CircuitKartRecord {
  circuitId: string;
  kartId: string;
}

interface CircuitKartRow {
  circuit_id: string;
  kart_id: string;
}

export function addKartToCircuit(
  circuitId: string,
  kartId: string,
  now = Date.now() // Although not explicitly in schema, good practice for audit.
): void {
  const db = getDb();
  db.prepare(
    `INSERT OR IGNORE INTO circuit_karts (circuit_id, kart_id)
     VALUES (?, ?)`
  ).run(circuitId, kartId);
}

export function removeKartFromCircuit(
  circuitId: string,
  kartId: string
): void {
  const db = getDb();
  db.prepare(
    `DELETE FROM circuit_karts WHERE circuit_id = ? AND kart_id = ?`
  ).run(circuitId, kartId);
}

export function findKartsForCircuit(circuitId: string): KartRecord[] {
  const db = getDb();
  const rows = db
    .prepare<unknown[], KartRow>(
      `SELECT k.id, k.name, k.created_at, k.updated_at
       FROM karts k
       JOIN circuit_karts ck ON k.id = ck.kart_id
       WHERE ck.circuit_id = ?
       ORDER BY k.name ASC`
    )
    .all(circuitId);
  return rows.map(mapKartRow);
}

export interface CircuitKartsRepository {
  addKartToCircuit: (circuitId: string, kartId: string) => void;
  removeKartFromCircuit: (circuitId: string, kartId: string) => void;
  findKartsForCircuit: (circuitId: string) => KartRecord[];
}

export const circuitKartsRepository: CircuitKartsRepository = {
  addKartToCircuit,
  removeKartFromCircuit,
  findKartsForCircuit,
};
