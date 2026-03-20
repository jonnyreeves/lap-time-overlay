import type Database from "better-sqlite3";

export const migration = {
  id: "14_add_user_daytona_clubspeed_credentials",
  up: (db: Database.Database): void => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_daytona_clubspeed_credentials (
        user_id TEXT PRIMARY KEY,
        username_encrypted TEXT NOT NULL,
        password_encrypted TEXT NOT NULL,
        last_validated_at INTEGER,
        last_validation_error TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS user_daytona_clubspeed_credentials_last_validated_idx
        ON user_daytona_clubspeed_credentials(last_validated_at);
    `);
  },
};
