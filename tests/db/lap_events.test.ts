import assert from "assert";
import { describe, it, beforeEach } from "vitest";
import { getDb, setDb } from "../../src/db/client.js";
import Database from "better-sqlite3";
import { migration as userMigration } from "../../src/db/migrations/01_create_users.js";
import { migration as circuitMigration } from "../../src/db/migrations/03_create_circuits.js";
import { migration as trackSessionMigration } from "../../src/db/migrations/04_create_track_sessions.js";
import { migration as lapMigration } from "../../src/db/migrations/05_create_laps.js";
import { migration as lapEventMigration } from "../../src/db/migrations/06_create_lap_events.js";
import { createUser, type UserRecord } from "../../src/db/users.js";
import { createCircuit, type CircuitRecord } from "../../src/db/circuits.js";
import { createTrackSession, type TrackSessionRecord } from "../../src/db/track_sessions.js";
import { createLap, type LapRecord } from "../../src/db/laps.js";
import {
  createLapEvent,
  findLapEventById,
  findLapEventsByLapId,
  createLapEvents,
  type LapEventRecord,
} from "../../src/db/lap_events.js";

describe("lap_events", () => {
  let user: UserRecord;
  let circuit: CircuitRecord;
  let trackSession: TrackSessionRecord;
  let lap: LapRecord;
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    setDb(db);
    userMigration.up(db);
    circuitMigration.up(db);
    trackSessionMigration.up(db);
    lapMigration.up(db);
    lapEventMigration.up(db);
    user = createUser("testuser", "hashedpassword");
    circuit = createCircuit("Test Circuit", user.id);
    trackSession = createTrackSession(
      "2023-11-29T10:00:00Z",
      "Practice",
      circuit.id
    );
    lap = createLap(trackSession.id, 1, 60.5);
  });

  it("can create and retrieve a lap event", () => {
    const now = Date.now();
    const lapEvent = createLapEvent(lap.id, 10.2, "Brake Point", "P1", now);
    assert.ok(lapEvent.id);
    assert.strictEqual(lapEvent.lapId, lap.id);
    assert.strictEqual(lapEvent.offset, 10.2);
    assert.strictEqual(lapEvent.event, "Brake Point");
    assert.strictEqual(lapEvent.value, "P1");
    assert.strictEqual(lapEvent.createdAt, now);
    assert.strictEqual(lapEvent.updatedAt, now);

    const retrievedLapEvent = findLapEventById(lapEvent.id);
    assert.deepStrictEqual(retrievedLapEvent, lapEvent);
  });

  it("returns null for non-existent lap event", () => {
    const lapEvent = findLapEventById("non-existent-id");
    assert.strictEqual(lapEvent, null);
  });

  it("can find lap events by lap ID", () => {
    const now = Date.now();
    const event1 = createLapEvent(lap.id, 5.0, "Apex", "P2", now);
    const event2 = createLapEvent(lap.id, 15.0, "Throttle On", "P3", now + 100);
    // Create another lap and an event for it to ensure filtering works
    const anotherLap = createLap(trackSession.id, 2, 61.0);
    createLapEvent(anotherLap.id, 20.0, "Something Else", "P4", now + 200);

    const lapEvents = findLapEventsByLapId(lap.id);
    assert.strictEqual(lapEvents.length, 2);
    assert.deepStrictEqual(lapEvents[0], event1); // Ordered by offset ASC
    assert.deepStrictEqual(lapEvents[1], event2);
  });

  it("can create multiple lap events", () => {
    const now = Date.now();
    const lapEventsData = [
      { offset: 5.0, event: "Apex 1", value: "P1" },
      { offset: 10.0, event: "Brake 1", value: "P2" },
      { offset: 15.0, event: "Throttle 1", value: "P3" },
    ];
    const createdLapEvents = createLapEvents(lap.id, lapEventsData, now);
    assert.strictEqual(createdLapEvents.length, 3);
    assert.ok(createdLapEvents[0].id);
    assert.strictEqual(createdLapEvents[0].lapId, lap.id);
    assert.strictEqual(createdLapEvents[0].offset, 5.0);
    assert.strictEqual(createdLapEvents[0].event, "Apex 1");
    assert.strictEqual(createdLapEvents[0].value, "P1");
    assert.strictEqual(createdLapEvents[0].createdAt, now);

    const retrievedLapEvents = findLapEventsByLapId(lap.id);
    assert.strictEqual(retrievedLapEvents.length, 3);
    assert.deepStrictEqual(retrievedLapEvents, createdLapEvents);
  });
});
