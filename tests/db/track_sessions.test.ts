import assert from "assert";
import { describe, it, beforeEach, afterEach } from "vitest";
import { setupTestDb, teardownTestDb } from "../db/test_setup.js";
import { createUser, type UserRecord } from "../../src/db/users.js";
import { createTrack, type TrackRecord } from "../../src/db/tracks.js";
import { createTrackLayout, type TrackLayoutRecord } from "../../src/db/track_layouts.js";
import { findLapsBySessionId } from "../../src/db/laps.js";
import { findLapEventsByLapId } from "../../src/db/lap_events.js";
import {
  createTrackSession,
  createTrackSessionWithLaps,
  findTrackSessionById,
  findTrackSessionsByTrackId,
  findTrackSessionsByUserId,
  updateTrackSession,
  type TrackSessionRecord,
} from "../../src/db/track_sessions.js";

describe("track_sessions", () => {
  let user: UserRecord;
  let track: TrackRecord;
  let layout: TrackLayoutRecord;

  beforeEach(() => {
    setupTestDb();
    user = createUser("testuser", "hashedpassword");
    track = createTrack("Test Circuit");
    layout = createTrackLayout(track.id, "GP");
  });

  afterEach(() => {
    teardownTestDb();
  });

  it("can create and retrieve a track session", () => {
    const now = Date.now();
    const trackSession = createTrackSession(
      "2023-11-29T10:00:00Z",
      "Practice",
      5,
      track.id,
      user.id,
      "Some notes",
      now,
      "Dry",
      null,
      layout.id
    );
    assert.ok(trackSession.id);
    assert.strictEqual(trackSession.date, "2023-11-29T10:00:00Z");
    assert.strictEqual(trackSession.format, "Practice");
    assert.strictEqual(trackSession.classification, 5);
    assert.strictEqual(trackSession.conditions, "Dry");
    assert.strictEqual(trackSession.trackId, track.id);
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
      trackId: track.id,
      userId: user.id,
      notes: "with laps",
      laps: [
        { lapNumber: 1, time: 60.1 },
        { lapNumber: 2, time: 59.5 },
      ],
      now,
      trackLayoutId: layout.id,
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
      trackId: track.id,
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
      trackLayoutId: layout.id,
    });

    const lapOneEvents = findLapEventsByLapId(laps[0].id);
    assert.strictEqual(lapOneEvents.length, 2);
    assert.strictEqual(lapOneEvents[0].offset, 5.5);
    assert.strictEqual(lapOneEvents[0].value, "P1");
    assert.strictEqual(lapOneEvents[1].offset, 10.2);

    const lapTwoEvents = findLapEventsByLapId(laps[1].id);
    assert.strictEqual(lapTwoEvents.length, 0);
  });

  it("can find track sessions by track ID", () => {
    const now = Date.now();
    const session1 = createTrackSession(
      "2023-11-29T10:00:00Z",
      "Practice",
      6,
      track.id,
      user.id,
      null,
      now,
      "Dry",
      null,
      layout.id
    );
    const session2 = createTrackSession(
      "2023-11-29T11:00:00Z",
      "Qualifying",
      3,
      track.id,
      user.id,
      null,
      now + 1000,
      "Dry",
      null,
      layout.id
    );
    // Create another track and a session for it to ensure filtering works
    const anotherTrack = createTrack("Another Circuit");
    const anotherLayout = createTrackLayout(anotherTrack.id, "Inner");
    createTrackSession(
      "2023-11-29T12:00:00Z",
      "Race",
      4,
      anotherTrack.id,
      user.id,
      null,
      now + 2000,
      "Dry",
      null,
      anotherLayout.id
    );

    const sessions = findTrackSessionsByTrackId(track.id);
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
      track.id,
      user.id,
      null,
      now,
      "Dry",
      null,
      layout.id
    );
    const session2 = createTrackSession(
      "2023-11-30T09:00:00Z",
      "Race",
      9,
      track.id,
      user.id,
      null,
      now + 1000,
      "Dry",
      null,
      layout.id
    );
    const otherUser = createUser("another-user", "hashed");
    const otherTrack = createTrack("Other User Circuit");
    const otherLayout = createTrackLayout(otherTrack.id, "Outer");
    createTrackSession(
      "2023-12-01T09:00:00Z",
      "Race",
      2,
      otherTrack.id,
      otherUser.id,
      null,
      now + 2000,
      "Dry",
      null,
      otherLayout.id
    );

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
      track.id,
      user.id,
      "notes",
      now,
      "Dry",
      null,
      layout.id
    );
    const otherTrack = createTrack("Other Circuit");
    const otherLayout = createTrackLayout(otherTrack.id, "Short");

    const updated = updateTrackSession({
      id: session.id,
      date: "2023-12-01",
      format: "Race",
      classification: 2,
      trackId: otherTrack.id,
      conditions: "Wet",
      notes: "Updated",
      now: now + 1000,
      trackLayoutId: otherLayout.id,
    });

    assert.ok(updated);
    assert.strictEqual(updated?.date, "2023-12-01");
    assert.strictEqual(updated?.format, "Race");
    assert.strictEqual(updated?.classification, 2);
    assert.strictEqual(updated?.trackId, otherTrack.id);
    assert.strictEqual(updated?.userId, user.id);
    assert.strictEqual(updated?.conditions, "Wet");
    assert.strictEqual(updated?.notes, "Updated");
    assert.strictEqual(updated?.trackLayoutId, otherLayout.id);
    assert.strictEqual(updated?.updatedAt, now + 1000);

    const persisted = findTrackSessionById(session.id);
    assert.deepStrictEqual(persisted, updated);
  });
});
