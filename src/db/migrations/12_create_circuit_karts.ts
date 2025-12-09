import type Database from "better-sqlite3";

export const migration = {
  id: "12_create_circuit_karts",
  up: (db: Database.Database): void => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS circuit_karts (
        circuit_id TEXT NOT NULL,
        kart_id TEXT NOT NULL,
        PRIMARY KEY (circuit_id, kart_id),
        FOREIGN KEY (circuit_id) REFERENCES circuits(id) ON DELETE CASCADE,
        FOREIGN KEY (kart_id) REFERENCES karts(id) ON DELETE CASCADE
      );
    `);
  },
};
