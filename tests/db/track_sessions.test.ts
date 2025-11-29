import assert from "assert";
import { describe, it, beforeEach } from "vitest";
import { getDb, setDb } from "../../src/db/client.js";
import Database from "better-sqlite3";
import { migration as userMigration } from "../../src/db/migrations/01_create_users.js";
import { migration as circuitMigration } from "../../src/db/migrations/03_create_circuits.js";
import { migration as trackSessionMigration } from "../../src/db/migrations/04_create_track_sessions.js";
import { createUser, type UserRecord } from "../../src/db/users.js";
import { createCircuit, type CircuitRecord } from "../../src/db/circuits.js";
import {
  createTrackSession,
  findTrackSessionById,
  findTrackSessionsByCircuitId,
  type TrackSessionRecord,
} from "../../src/db/track_sessions.js";

describe("track_sessions", () => {
  let user: UserRecord;
  let circuit: CircuitRecord;
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    setDb(db);
    userMigration.up(db);
    circuitMigration.up(db);
    trackSessionMigration.up(db);
    user = createUser("testuser", "hashedpassword");
    circuit = createCircuit("Test Circuit", user.id);
  });

  it("can create and retrieve a track session", () => {
    const now = Date.now();
    const trackSession = createTrackSession(
      "2023-11-29T10:00:00Z",
      "Practice",
      circuit.id,
      "Some notes",
      now
    );
    assert.ok(trackSession.id);
    assert.strictEqual(trackSession.date, "2023-11-29T10:00:00Z");
    assert.strictEqual(trackSession.format, "Practice");
    assert.strictEqual(trackSession.circuitId, circuit.id);
    assert.strictEqual(trackSession.notes, "Some notes");
    assert.strictEqual(trackSession.createdAt, now);
    assert.strictEqual(trackSession.updatedAt, now);

    const retrievedSession = findTrackSessionById(trackSession.id);
    assert.deepStrictEqual(retrievedSession, trackSession);
  });

  it("returns null for non-existent track session", () => {
    const session = findTrackSessionById("non-existent-id");
    assert.strictEqual(session, null);
  });

  it("can find track sessions by circuit ID", () => {
    const now = Date.now();
    const session1 = createTrackSession("2023-11-29T10:00:00Z", "Practice", circuit.id, null, now);
    const session2 = createTrackSession(
      "2023-11-29T11:00:00Z",
      "Qualifying",
      circuit.id,
      null,
      now + 1000
    );
    // Create another circuit and a session for it to ensure filtering works
    const anotherCircuit = createCircuit("Another Circuit", user.id);
    createTrackSession("2023-11-29T12:00:00Z", "Race", anotherCircuit.id, null, now + 2000);

    const sessions = findTrackSessionsByCircuitId(circuit.id);
    assert.strictEqual(sessions.length, 2);
    assert.deepStrictEqual(sessions[0], session2); // Ordered by date DESC (createdAt in this case)
    assert.deepStrictEqual(sessions[1], session1);
  });
});
