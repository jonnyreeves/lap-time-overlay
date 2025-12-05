import assert from "assert";
import { describe, it, beforeEach } from "vitest";
import { getDb, setDb } from "../../src/db/client.js";
import Database from "better-sqlite3";
import { migration as userMigration } from "../../src/db/migrations/01_create_users.js";
import { migration as circuitMigration } from "../../src/db/migrations/03_create_circuits.js";
import { migration as trackSessionMigration } from "../../src/db/migrations/04_create_track_sessions.js";
import { migration as lapMigration } from "../../src/db/migrations/05_create_laps.js";
import { migration as lapEventsMigration } from "../../src/db/migrations/06_create_lap_events.js";
import { migration as trackSessionConditionsMigration } from "../../src/db/migrations/08_add_track_session_conditions.js";
import { createUser, type UserRecord } from "../../src/db/users.js";
import { createCircuit, type CircuitRecord } from "../../src/db/circuits.js";
import { findLapsBySessionId } from "../../src/db/laps.js";
import { findLapEventsByLapId } from "../../src/db/lap_events.js";
import {
  createTrackSession,
  createTrackSessionWithLaps,
  findTrackSessionById,
  findTrackSessionsByCircuitId,
  findTrackSessionsByUserId,
  updateTrackSession,
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
    trackSessionConditionsMigration.up(db);
    lapMigration.up(db);
    lapEventsMigration.up(db);
    user = createUser("testuser", "hashedpassword");
    circuit = createCircuit("Test Circuit");
  });

  it("can create and retrieve a track session", () => {
    const now = Date.now();
    const trackSession = createTrackSession(
      "2023-11-29T10:00:00Z",
      "Practice",
      5,
      circuit.id,
      user.id,
      "Some notes",
      now
    );
    assert.ok(trackSession.id);
    assert.strictEqual(trackSession.date, "2023-11-29T10:00:00Z");
    assert.strictEqual(trackSession.format, "Practice");
    assert.strictEqual(trackSession.classification, 5);
    assert.strictEqual(trackSession.conditions, "Dry");
    assert.strictEqual(trackSession.circuitId, circuit.id);
    assert.strictEqual(trackSession.userId, user.id);
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

  it("can create a track session with laps in one go", () => {
    const now = Date.now();
    const { trackSession, laps } = createTrackSessionWithLaps({
      date: "2023-11-29T12:00:00Z",
      format: "Race",
      classification: 4,
      conditions: "Wet",
      circuitId: circuit.id,
      userId: user.id,
      notes: "with laps",
      laps: [
        { lapNumber: 1, time: 60.1 },
        { lapNumber: 2, time: 59.5 },
      ],
      now,
    });

    assert.ok(trackSession.id);
    assert.strictEqual(trackSession.createdAt, now);
    assert.strictEqual(trackSession.classification, 4);
    assert.strictEqual(trackSession.conditions, "Wet");
    assert.strictEqual(trackSession.notes, "with laps");
    assert.strictEqual(trackSession.userId, user.id);
    assert.strictEqual(laps.length, 2);
    assert.strictEqual(laps[0].sessionId, trackSession.id);
    assert.deepStrictEqual(findLapsBySessionId(trackSession.id), laps);
  });

  it("creates lap events alongside laps", () => {
    const now = Date.now();
    const { laps } = createTrackSessionWithLaps({
      date: "2023-11-29T12:00:00Z",
      format: "Race",
      classification: 6,
      circuitId: circuit.id,
      userId: user.id,
      laps: [
        {
          lapNumber: 1,
          time: 60.1,
          lapEvents: [
            { offset: 5.5, event: "position", value: "P1" },
            { offset: 10.2, event: "position", value: "P2" },
          ],
        },
        { lapNumber: 2, time: 59.5 },
      ],
      now,
    });

    const lapOneEvents = findLapEventsByLapId(laps[0].id);
    assert.strictEqual(lapOneEvents.length, 2);
    assert.strictEqual(lapOneEvents[0].offset, 5.5);
    assert.strictEqual(lapOneEvents[0].value, "P1");
    assert.strictEqual(lapOneEvents[1].offset, 10.2);

    const lapTwoEvents = findLapEventsByLapId(laps[1].id);
    assert.strictEqual(lapTwoEvents.length, 0);
  });

  it("can find track sessions by circuit ID", () => {
    const now = Date.now();
    const session1 = createTrackSession("2023-11-29T10:00:00Z", "Practice", 6, circuit.id, user.id, null, now);
    const session2 = createTrackSession(
      "2023-11-29T11:00:00Z",
      "Qualifying",
      3,
      circuit.id,
      user.id,
      null,
      now + 1000
    );
    // Create another circuit and a session for it to ensure filtering works
    const anotherCircuit = createCircuit("Another Circuit");
    createTrackSession("2023-11-29T12:00:00Z", "Race", 4, anotherCircuit.id, user.id, null, now + 2000);

    const sessions = findTrackSessionsByCircuitId(circuit.id);
    assert.strictEqual(sessions.length, 2);
    assert.deepStrictEqual(sessions[0], session2); // Ordered by date DESC (createdAt in this case)
    assert.deepStrictEqual(sessions[1], session1);
  });

  it("can find track sessions by user ID", () => {
    const now = Date.now();
    const session1 = createTrackSession(
      "2023-11-29T09:00:00Z",
      "Practice",
      8,
      circuit.id,
      user.id,
      null,
      now
    );
    const session2 = createTrackSession(
      "2023-11-30T09:00:00Z",
      "Race",
      9,
      circuit.id,
      user.id,
      null,
      now + 1000
    );
    const otherUser = createUser("another-user", "hashed");
    const otherCircuit = createCircuit("Other User Circuit");
    createTrackSession("2023-12-01T09:00:00Z", "Race", 2, otherCircuit.id, otherUser.id, null, now + 2000);

    const sessions = findTrackSessionsByUserId(user.id);
    assert.strictEqual(sessions.length, 2);
    assert.deepStrictEqual(sessions[0], session2);
    assert.deepStrictEqual(sessions[1], session1);
  });

  it("updates a track session", () => {
    const now = Date.now();
    const session = createTrackSession(
      "2023-11-29T10:00:00Z",
      "Practice",
      7,
      circuit.id,
      user.id,
      "notes",
      now
    );
    const otherCircuit = createCircuit("Other Circuit");

    const updated = updateTrackSession({
      id: session.id,
      date: "2023-12-01",
      format: "Race",
      classification: 2,
      circuitId: otherCircuit.id,
      conditions: "Wet",
      notes: "Updated",
      now: now + 1000,
    });

    assert.ok(updated);
    assert.strictEqual(updated?.date, "2023-12-01");
    assert.strictEqual(updated?.format, "Race");
    assert.strictEqual(updated?.classification, 2);
    assert.strictEqual(updated?.circuitId, otherCircuit.id);
    assert.strictEqual(updated?.userId, user.id);
    assert.strictEqual(updated?.conditions, "Wet");
    assert.strictEqual(updated?.notes, "Updated");
    assert.strictEqual(updated?.updatedAt, now + 1000);

    const persisted = findTrackSessionById(session.id);
    assert.deepStrictEqual(persisted, updated);
  });
});
