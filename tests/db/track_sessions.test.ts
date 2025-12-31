import assert from "assert";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { afterEach, beforeEach, describe, it } from "vitest";
import { getDb } from "../../src/db/client.js";
import { findLapEventsByLapId } from "../../src/db/lap_events.js";
import { findLapsBySessionId } from "../../src/db/laps.js";
import { createTrackLayout, type TrackLayoutRecord } from "../../src/db/track_layouts.js";
import { createTrackRecordingSource } from "../../src/db/track_recording_sources.js";
import { createTrackRecording } from "../../src/db/track_recordings.js";
import {
  createTrackSession,
  createTrackSessionWithLaps,
  deleteTrackSession,
  findTrackSessionById,
  findTrackSessionsByTrackId,
  findTrackSessionsByUserId,
  updateTrackSession
} from "../../src/db/track_sessions.js";
import { createTrack, type TrackRecord } from "../../src/db/tracks.js";
import { createUser, type UserRecord } from "../../src/db/users.js";
import { setupTestDb, teardownTestDb } from "../db/test_setup.js";

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
    assert.strictEqual(trackSession.kartNumber, "");

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
    assert.strictEqual(trackSession.kartNumber, "");
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
      kartNumber: "77",
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
    assert.strictEqual(updated?.kartNumber, "77");
    assert.strictEqual(updated?.trackLayoutId, otherLayout.id);
    assert.strictEqual(updated?.updatedAt, now + 1000);

    const persisted = findTrackSessionById(session.id);
    assert.deepStrictEqual(persisted, updated);
  });

  describe("deleteTrackSession", () => {
    let recordingFilePath1: string;
    let recordingFilePath2: string;
    let tempDir: string;

    beforeEach(() => {
      tempDir = join(process.env.TEMP_DIR!, "track_sessions_test");
      mkdirSync(tempDir, { recursive: true });
      // Create dummy files for recordings
      recordingFilePath1 = join(tempDir, "recording1.txt");
      recordingFilePath2 = join(tempDir, "recording2.txt");
      writeFileSync(recordingFilePath1, "dummy content 1");
      writeFileSync(recordingFilePath2, "dummy content 2");
    });

    afterEach(() => {
      // Clean up dummy files
      if (existsSync(recordingFilePath1)) {
        unlinkSync(recordingFilePath1);
      }
      if (existsSync(recordingFilePath2)) {
        unlinkSync(recordingFilePath2);
      }
    });

    it("successfully deletes a track session and its dependent data", async () => {
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
          {
            lapNumber: 1,
            time: 60.1,
            lapEvents: [{ offset: 5.5, event: "position", value: "P1" }],
          },
          { lapNumber: 2, time: 59.5 },
        ],
        now,
        trackLayoutId: layout.id,
      });

      const recording1 = createTrackRecording({
        sessionId: trackSession.id,
        userId: user.id,
        mediaId: "media1",
        isPrimary: true,
        lapOneOffset: 0,
      });

      const recording2 = createTrackRecording({
        sessionId: trackSession.id,
        userId: user.id,
        mediaId: "media2",
        isPrimary: false,
        lapOneOffset: 0,
      });

      createTrackRecordingSource({
        recordingId: recording1.id,
        fileName: "file1.mp4",
        sizeBytes: 100,
        ordinal: 0,
        uploadToken: "token1",
        storagePath: recordingFilePath1,
      });

      createTrackRecordingSource({
        recordingId: recording2.id,
        fileName: "file2.mp4",
        sizeBytes: 200,
        ordinal: 0,
        uploadToken: "token2",
        storagePath: recordingFilePath2,
      });

      const success = await deleteTrackSession(trackSession.id, user.id);
      assert.strictEqual(success, true);

      assert.strictEqual(findTrackSessionById(trackSession.id), null);
      assert.deepStrictEqual(findLapsBySessionId(trackSession.id), []);
      assert.deepStrictEqual(findLapEventsByLapId(laps[0].id), []);

      const db = getDb();
      const recordings = db
        .prepare(`SELECT * FROM track_recordings WHERE session_id = ?`)
        .all(trackSession.id);
      assert.strictEqual(recordings.length, 0);

      const recordingSources = db
        .prepare(`SELECT * FROM track_recording_sources WHERE recording_id IN (?, ?)`)
        .all(recording1.id, recording2.id);
      assert.strictEqual(recordingSources.length, 0);

      assert.strictEqual(existsSync(recordingFilePath1), false);
      assert.strictEqual(existsSync(recordingFilePath2), false);
    });

    it("returns false for unauthorized deletion", async () => {
      const otherUser = createUser("otheruser", "hashedpassword");
      const trackSession = createTrackSession(
        "2023-11-29T10:00:00Z",
        "Practice",
        5,
        track.id,
        user.id,
        "Some notes",
        Date.now(),
        "Dry",
        null,
        layout.id
      );

      const success = await deleteTrackSession(trackSession.id, otherUser.id);
      assert.strictEqual(success, false);

      assert.ok(findTrackSessionById(trackSession.id));
    });

    it("returns false for deleting a non-existent session", async () => {
      const success = await deleteTrackSession("non-existent-id", user.id);
      assert.strictEqual(success, false);
    });
  });
});
