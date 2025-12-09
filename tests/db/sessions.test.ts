import assert from "assert";
import { describe, it, beforeEach, afterEach } from "vitest";
import { setupTestDb, teardownTestDb } from "../db/test_setup.js";
import { createUser, type UserRecord } from "../../src/db/users.js";
import { createSession, getSession, deleteSession, slideSession, purgeExpired } from "../../src/db/sessions.js";
import { getDb } from "../../src/db/client.js";


describe("sessions", () => {
  let user: UserRecord;

  beforeEach(() => {
    setupTestDb();
    user = createUser("testuser", "hashedpassword");
  });

  afterEach(() => {
    teardownTestDb();
  });

  it("can create and retrieve a session", () => {
    const now = Date.now();
    const { token, expiresAt } = createSession(user.id, now);
    assert.ok(token);
    assert.ok(expiresAt > now);

    const session = getSession(token);
    assert.ok(session);
    assert.strictEqual(session?.userId, user.id);
    assert.strictEqual(session?.expiresAt, expiresAt);
    assert.strictEqual(session?.createdAt, now);
  });

  it("returns null for non-existent session", () => {
    const session = getSession("non-existent-token");
    assert.strictEqual(session, null);
  });

  it("can delete a session", () => {
    const { token } = createSession(user.id);
    assert.ok(getSession(token));

    deleteSession(token);
    assert.strictEqual(getSession(token), null);
  });

  it("can slide a session (update expiry)", () => {
    const now = Date.now();
    const { token } = createSession(user.id, now);
    const originalExpiresAt = getSession(token)?.expiresAt;
    assert.ok(originalExpiresAt);

    const newNow = now + 1000 * 60 * 60; // 1 hour later
    const newExpiresAt = slideSession(token, newNow);
    assert.ok(newExpiresAt);
    assert.ok(newExpiresAt > originalExpiresAt!);
    assert.strictEqual(getSession(token)?.expiresAt, newExpiresAt);
  });

  it("slideSession returns null for non-existent session", () => {
    const newExpiresAt = slideSession("non-existent-token");
    assert.strictEqual(newExpiresAt, null);
  });

  it("can purge expired sessions", () => {
    const now = Date.now();
    createSession(user.id, now - 1000 * 60 * 60 * 24 * 30); // Expired a month ago
    createSession(user.id, now + 1000 * 60 * 60); // Still valid

    const changes = purgeExpired(now);
    assert.strictEqual(changes, 1);

    const sessions = getDb().prepare("SELECT * FROM sessions").all();
    assert.strictEqual(sessions.length, 1);
  });
});
