import assert from "assert";
import { afterEach, beforeEach, describe, it } from "vitest";
import { getDb } from "../../src/db/client.js";
import { setupTestDb, teardownTestDb } from "../db/test_setup.js";
import { createUser } from "../../src/db/users.js";
import {
  deleteViewerDaytonaClubspeedCredentials,
  getViewerDaytonaClubspeedCredentialStatus,
  getViewerDaytonaClubspeedCredentialsOrThrow,
  markViewerDaytonaClubspeedCredentialInvalid,
  markViewerDaytonaClubspeedCredentialsValidated,
  saveViewerDaytonaClubspeedCredentials,
} from "../../src/web/daytonaClubspeedCredentials/service.js";

const originalKey = process.env.USER_SECRET_ENCRYPTION_KEY;

describe("daytonaClubspeedCredentials service", () => {
  beforeEach(() => {
    process.env.USER_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 5).toString("base64url");
    setupTestDb();
  });

  afterEach(() => {
    if (originalKey == null) {
      delete process.env.USER_SECRET_ENCRYPTION_KEY;
    } else {
      process.env.USER_SECRET_ENCRYPTION_KEY = originalKey;
    }
    teardownTestDb();
  });

  it("saves credentials encrypted and returns decrypted status", () => {
    const user = createUser("sam", "hash");

    const status = saveViewerDaytonaClubspeedCredentials(
      user.id,
      "clubspeed-user",
      "clubspeed-pass",
      1000
    );
    const stored = getDb()
      .prepare<unknown[], { username_encrypted: string; password_encrypted: string }>(
        `SELECT username_encrypted, password_encrypted
         FROM user_daytona_clubspeed_credentials
         WHERE user_id = ?`
      )
      .get(user.id);

    assert.deepStrictEqual(status, {
      configured: true,
      username: "clubspeed-user",
      lastValidatedAt: null,
      lastValidationError: null,
    });
    assert.notStrictEqual(stored?.username_encrypted, "clubspeed-user");
    assert.notStrictEqual(stored?.password_encrypted, "clubspeed-pass");
  });

  it("returns decrypted credentials for import use", () => {
    const user = createUser("alex", "hash");

    saveViewerDaytonaClubspeedCredentials(user.id, "clubspeed-user", "clubspeed-pass");

    assert.deepStrictEqual(getViewerDaytonaClubspeedCredentialsOrThrow(user.id), {
      username: "clubspeed-user",
      password: "clubspeed-pass",
    });
  });

  it("updates validation status on success and failure", () => {
    const user = createUser("jamie", "hash");

    saveViewerDaytonaClubspeedCredentials(user.id, "clubspeed-user", "clubspeed-pass", 1000);
    markViewerDaytonaClubspeedCredentialInvalid(
      user.id,
      "Invalid Daytona Club Speed credentials",
      2000
    );
    assert.deepStrictEqual(getViewerDaytonaClubspeedCredentialStatus(user.id), {
      configured: true,
      username: "clubspeed-user",
      lastValidatedAt: null,
      lastValidationError: "Invalid Daytona Club Speed credentials",
    });

    markViewerDaytonaClubspeedCredentialsValidated(user.id, 3000);
    assert.deepStrictEqual(getViewerDaytonaClubspeedCredentialStatus(user.id), {
      configured: true,
      username: "clubspeed-user",
      lastValidatedAt: 3000,
      lastValidationError: null,
    });
  });

  it("deletes credentials", () => {
    const user = createUser("riley", "hash");

    saveViewerDaytonaClubspeedCredentials(user.id, "clubspeed-user", "clubspeed-pass");
    assert.strictEqual(deleteViewerDaytonaClubspeedCredentials(user.id), true);
    assert.deepStrictEqual(getViewerDaytonaClubspeedCredentialStatus(user.id), {
      configured: false,
      username: null,
      lastValidatedAt: null,
      lastValidationError: null,
    });
  });
});
