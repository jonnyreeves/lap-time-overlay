import assert from "assert";
import { describe, it, beforeEach } from "vitest";
import { getDb, setDb } from "../../src/db/client.js";
import Database from "better-sqlite3";
import { migration as userMigration } from "../../src/db/migrations/01_create_users.js";
import { migration as circuitMigration } from "../../src/db/migrations/03_create_circuits.js";
import { migration as trackSessionMigration } from "../../src/db/migrations/04_create_track_sessions.js";
import { migration as lapMigration } from "../../src/db/migrations/05_create_laps.js";
import { migration as trackSessionConditionsMigration } from "../../src/db/migrations/08_add_track_session_conditions.js";
import { createUser, type UserRecord } from "../../src/db/users.js";
import { createCircuit, type CircuitRecord } from "../../src/db/circuits.js";
import { createTrackSession, type TrackSessionRecord } from "../../src/db/track_sessions.js";
import {
  createLap,
  findLapById,
  findLapsBySessionId,
  createLaps,
  type LapRecord,
} from "../../src/db/laps.js";

describe("laps", () => {
  let user: UserRecord;
  let circuit: CircuitRecord;
  let trackSession: TrackSessionRecord;
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    setDb(db);
    userMigration.up(db);
    circuitMigration.up(db);
    trackSessionMigration.up(db);
    trackSessionConditionsMigration.up(db);
    lapMigration.up(db);
    user = createUser("testuser", "hashedpassword");
    circuit = createCircuit("Test Circuit");
    trackSession = createTrackSession(
      "2023-11-29T10:00:00Z",
      "Practice",
      3,
      circuit.id,
      user.id
    );
  });

  it("can create and retrieve a lap", () => {
    const now = Date.now();
    const lap = createLap(trackSession.id, 1, 60.5, now);
    assert.ok(lap.id);
    assert.strictEqual(lap.sessionId, trackSession.id);
    assert.strictEqual(lap.lapNumber, 1);
    assert.strictEqual(lap.time, 60.5);
    assert.strictEqual(lap.createdAt, now);
    assert.strictEqual(lap.updatedAt, now);

    const retrievedLap = findLapById(lap.id);
    assert.deepStrictEqual(retrievedLap, lap);
  });

  it("returns null for non-existent lap", () => {
    const lap = findLapById("non-existent-id");
    assert.strictEqual(lap, null);
  });

  it("can find laps by session ID", () => {
    const now = Date.now();
    const lap1 = createLap(trackSession.id, 1, 60.1, now);
    const lap2 = createLap(trackSession.id, 2, 60.2, now + 100);
    // Create another session and a lap for it to ensure filtering works
    const anotherTrackSession = createTrackSession(
      "2023-11-29T13:00:00Z",
      "Race",
      4,
      circuit.id,
      user.id
    );
    createLap(anotherTrackSession.id, 1, 65.0, now + 200);

    const laps = findLapsBySessionId(trackSession.id);
    assert.strictEqual(laps.length, 2);
    assert.deepStrictEqual(laps[0], lap1); // Ordered by lapNumber ASC
    assert.deepStrictEqual(laps[1], lap2);
  });

  it("can create multiple laps", () => {
    const now = Date.now();
    const lapsData = [
      { lapNumber: 1, time: 60.0 },
      { lapNumber: 2, time: 61.0 },
      { lapNumber: 3, time: 62.0 },
    ];
    const createdLaps = createLaps(trackSession.id, lapsData, now);
    assert.strictEqual(createdLaps.length, 3);
    assert.ok(createdLaps[0].id);
    assert.strictEqual(createdLaps[0].sessionId, trackSession.id);
    assert.strictEqual(createdLaps[0].lapNumber, 1);
    assert.strictEqual(createdLaps[0].time, 60.0);
    assert.strictEqual(createdLaps[0].createdAt, now);

    const retrievedLaps = findLapsBySessionId(trackSession.id);
    assert.strictEqual(retrievedLaps.length, 3);
    assert.deepStrictEqual(retrievedLaps, createdLaps);
  });
});
