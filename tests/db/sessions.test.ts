import assert from "assert";
import { describe, it, beforeEach } from "vitest";
import { getDb, setDb } from "../../src/db/client.js";
import { createUser, type UserRecord } from "../../src/db/users.js";
import { createSession, getSession, deleteSession, slideSession, purgeExpired } from "../../src/db/sessions.js";
import Database from "better-sqlite3";
import { migration as userMigration } from "../../src/db/migrations/01_create_users.js";
import { migration as sessionMigration } from "../../src/db/migrations/02_create_sessions.js";


describe("sessions", () => {
  let user: UserRecord;
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    setDb(db);
    userMigration.up(db); // Apply user migration
    sessionMigration.up(db); // Apply session migration
    user = createUser("testuser", "hashedpassword");
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
