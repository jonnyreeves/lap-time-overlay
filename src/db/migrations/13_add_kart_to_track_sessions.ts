import type Database from "better-sqlite3";

export const migration = {
  id: "13_add_kart_to_track_sessions",
  up: (db: Database.Database): void => {
    db.transaction(() => {
      // 1. Create a new table with the desired schema, including the kart_id column and the foreign key constraint
      db.exec(`
        CREATE TABLE new_track_sessions (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          format TEXT NOT NULL,
          classification INTEGER NOT NULL,
          conditions TEXT NOT NULL,
          circuit_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          notes TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          kart_id TEXT,
          FOREIGN KEY (kart_id) REFERENCES karts(id) ON DELETE SET NULL,
          FOREIGN KEY (circuit_id) REFERENCES circuits(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      // 2. Copy data from the old table to the new table
      db.exec(`
        INSERT INTO new_track_sessions (id, date, format, classification, conditions, circuit_id, user_id, notes, created_at, updated_at, kart_id)
        SELECT id, date, format, classification, conditions, circuit_id, user_id, notes, created_at, updated_at, NULL
        FROM track_sessions;
      `);

      // 3. Drop the old table
      db.exec(`
        DROP TABLE track_sessions;
      `);

      // 4. Rename the new table to the old table's name
      db.exec(`
        ALTER TABLE new_track_sessions RENAME TO track_sessions;
      `);
    })(); // Execute the transaction
  },
};