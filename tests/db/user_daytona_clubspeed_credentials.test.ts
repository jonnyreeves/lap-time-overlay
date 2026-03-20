import assert from "assert";
import { afterEach, beforeEach, describe, it } from "vitest";
import { getDb } from "../../src/db/client.js";
import { setupTestDb, teardownTestDb } from "../db/test_setup.js";
import { createUser } from "../../src/db/users.js";
import {
  deleteUserDaytonaClubspeedCredentials,
  findUserDaytonaClubspeedCredentialsByUserId,
  updateUserDaytonaClubspeedCredentialValidation,
  upsertUserDaytonaClubspeedCredentials,
} from "../../src/db/user_daytona_clubspeed_credentials.js";

describe("user daytona clubspeed credentials", () => {
  beforeEach(() => {
    setupTestDb();
  });

  afterEach(() => {
    teardownTestDb();
  });

  it("creates and finds credentials by user id", () => {
    const user = createUser("sam", "hash");

    upsertUserDaytonaClubspeedCredentials(user.id, "enc-user", "enc-pass", 1000);
    const record = findUserDaytonaClubspeedCredentialsByUserId(user.id);

    assert.strictEqual(record?.userId, user.id);
    assert.strictEqual(record?.usernameEncrypted, "enc-user");
    assert.strictEqual(record?.passwordEncrypted, "enc-pass");
    assert.strictEqual(record?.lastValidatedAt, null);
    assert.strictEqual(record?.lastValidationError, null);
  });

  it("updates validation metadata", () => {
    const user = createUser("alex", "hash");

    upsertUserDaytonaClubspeedCredentials(user.id, "enc-user", "enc-pass", 1000);
    const updated = updateUserDaytonaClubspeedCredentialValidation(
      user.id,
      {
        lastValidatedAt: 2000,
        lastValidationError: "Invalid Daytona Club Speed credentials",
      },
      2000
    );

    assert.strictEqual(updated?.lastValidatedAt, 2000);
    assert.strictEqual(updated?.lastValidationError, "Invalid Daytona Club Speed credentials");
  });

  it("deletes credentials", () => {
    const user = createUser("jamie", "hash");

    upsertUserDaytonaClubspeedCredentials(user.id, "enc-user", "enc-pass");
    assert.strictEqual(deleteUserDaytonaClubspeedCredentials(user.id), true);
    assert.strictEqual(findUserDaytonaClubspeedCredentialsByUserId(user.id), null);
  });

  it("stores only the encrypted values written to the table", () => {
    const user = createUser("stored", "hash");

    upsertUserDaytonaClubspeedCredentials(user.id, "enc-user-value", "enc-pass-value");
    const row = getDb()
      .prepare<unknown[], { username_encrypted: string; password_encrypted: string }>(
        `SELECT username_encrypted, password_encrypted
         FROM user_daytona_clubspeed_credentials
         WHERE user_id = ?`
      )
      .get(user.id);

    assert.deepStrictEqual(row, {
      username_encrypted: "enc-user-value",
      password_encrypted: "enc-pass-value",
    });
  });
});
