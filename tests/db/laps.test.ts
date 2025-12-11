import assert from "assert";
import { describe, it, beforeEach, afterEach } from "vitest";
import { setupTestDb, teardownTestDb } from "../db/test_setup.js";
import { createUser, type UserRecord } from "../../src/db/users.js";
import { createTrack, type TrackRecord } from "../../src/db/tracks.js";
import { createTrackSession, type TrackSessionRecord } from "../../src/db/track_sessions.js";
import { createTrackLayout, type TrackLayoutRecord } from "../../src/db/track_layouts.js";
import {
  createLap,
  findLapById,
  findLapsBySessionId,
  createLaps,
  type LapRecord,
} from "../../src/db/laps.js";

describe("laps", () => {
  let user: UserRecord;
  let track: TrackRecord;
  let layout: TrackLayoutRecord;
  let trackSession: TrackSessionRecord;

  beforeEach(() => {
    setupTestDb();
    user = createUser("testuser", "hashedpassword");
    track = createTrack("Test Circuit");
    layout = createTrackLayout(track.id, "GP");
    trackSession = createTrackSession(
      "2023-11-29T10:00:00Z",
      "Practice",
      3,
      track.id,
      user.id,
      null,
      Date.now(),
      "Dry",
      null,
      layout.id
    );
  });

  afterEach(() => {
    teardownTestDb();
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
      track.id,
      user.id,
      null,
      now,
      "Dry",
      null,
      layout.id
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
