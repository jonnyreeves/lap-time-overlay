import { getDb } from "./client.js";

export interface UserDaytonaClubspeedCredentialRecord {
  userId: string;
  usernameEncrypted: string;
  passwordEncrypted: string;
  lastValidatedAt: number | null;
  lastValidationError: string | null;
  createdAt: number;
  updatedAt: number;
}

interface UserDaytonaClubspeedCredentialRow {
  user_id: string;
  username_encrypted: string;
  password_encrypted: string;
  last_validated_at: number | null;
  last_validation_error: string | null;
  created_at: number;
  updated_at: number;
}

function mapRow(
  row: UserDaytonaClubspeedCredentialRow
): UserDaytonaClubspeedCredentialRecord {
  return {
    userId: row.user_id,
    usernameEncrypted: row.username_encrypted,
    passwordEncrypted: row.password_encrypted,
    lastValidatedAt: row.last_validated_at,
    lastValidationError: row.last_validation_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findUserDaytonaClubspeedCredentialsByUserId(
  userId: string
): UserDaytonaClubspeedCredentialRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], UserDaytonaClubspeedCredentialRow>(
      `SELECT user_id, username_encrypted, password_encrypted, last_validated_at,
              last_validation_error, created_at, updated_at
       FROM user_daytona_clubspeed_credentials
       WHERE user_id = ?
       LIMIT 1`
    )
    .get(userId);

  return row ? mapRow(row) : null;
}

export function upsertUserDaytonaClubspeedCredentials(
  userId: string,
  usernameEncrypted: string,
  passwordEncrypted: string,
  now = Date.now()
): UserDaytonaClubspeedCredentialRecord {
  const db = getDb();
  db.prepare(
    `INSERT INTO user_daytona_clubspeed_credentials (
       user_id, username_encrypted, password_encrypted,
       last_validated_at, last_validation_error, created_at, updated_at
     ) VALUES (?, ?, ?, NULL, NULL, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       username_encrypted = excluded.username_encrypted,
       password_encrypted = excluded.password_encrypted,
       last_validated_at = NULL,
       last_validation_error = NULL,
       updated_at = excluded.updated_at`
  ).run(userId, usernameEncrypted, passwordEncrypted, now, now);

  return findUserDaytonaClubspeedCredentialsByUserId(userId)!;
}

export function updateUserDaytonaClubspeedCredentialValidation(
  userId: string,
  input: {
    lastValidatedAt: number | null;
    lastValidationError: string | null;
  },
  now = Date.now()
): UserDaytonaClubspeedCredentialRecord | null {
  const existing = findUserDaytonaClubspeedCredentialsByUserId(userId);
  if (!existing) {
    return null;
  }

  const db = getDb();
  db.prepare(
    `UPDATE user_daytona_clubspeed_credentials
     SET last_validated_at = ?, last_validation_error = ?, updated_at = ?
     WHERE user_id = ?`
  ).run(input.lastValidatedAt, input.lastValidationError, now, userId);

  return findUserDaytonaClubspeedCredentialsByUserId(userId);
}

export function deleteUserDaytonaClubspeedCredentials(userId: string): boolean {
  const db = getDb();
  const result = db
    .prepare(`DELETE FROM user_daytona_clubspeed_credentials WHERE user_id = ?`)
    .run(userId);

  return result.changes > 0;
}

export interface UserDaytonaClubspeedCredentialsRepository {
  findByUserId: (userId: string) => UserDaytonaClubspeedCredentialRecord | null;
  upsert: (
    userId: string,
    usernameEncrypted: string,
    passwordEncrypted: string,
    now?: number
  ) => UserDaytonaClubspeedCredentialRecord;
  updateValidation: (
    userId: string,
    input: {
      lastValidatedAt: number | null;
      lastValidationError: string | null;
    },
    now?: number
  ) => UserDaytonaClubspeedCredentialRecord | null;
  delete: (userId: string) => boolean;
}

export const userDaytonaClubspeedCredentialsRepository: UserDaytonaClubspeedCredentialsRepository =
  {
    findByUserId: findUserDaytonaClubspeedCredentialsByUserId,
    upsert: upsertUserDaytonaClubspeedCredentials,
    updateValidation: updateUserDaytonaClubspeedCredentialValidation,
    delete: deleteUserDaytonaClubspeedCredentials,
  };
