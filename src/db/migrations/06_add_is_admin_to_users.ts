import type Database from "better-sqlite3";

export const migration = {
  id: "06_add_is_admin_to_users",
  up: (db: Database.Database): void => {
    db.exec(`
      ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 1;
    `);
  },
};
