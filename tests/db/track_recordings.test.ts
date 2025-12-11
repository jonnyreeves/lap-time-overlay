import assert from "assert";
import { describe, it, beforeEach, afterEach } from "vitest";
import { setupTestDb, teardownTestDb } from "../db/test_setup.js";
import { createUser, type UserRecord } from "../../src/db/users.js";
import { createTrack, type TrackRecord } from "../../src/db/tracks.js";
import { createTrackSession, type TrackSessionRecord } from "../../src/db/track_sessions.js";
import { createTrackLayout, type TrackLayoutRecord } from "../../src/db/track_layouts.js";
import {
  createTrackRecording,
  findTrackRecordingById,
  findTrackRecordingsBySessionId,
  type TrackRecordingRecord,
} from "../../src/db/track_recordings.js";

describe("track_recordings", () => {
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
      4,
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

  it("can create and retrieve a track recording", () => {
    const now = Date.now();
    const trackRecording = createTrackRecording(
      {
        sessionId: trackSession.id,
        userId: trackSession.userId,
        mediaId: "media-uuid-123",
        isPrimary: true,
        lapOneOffset: 1.5,
        description: "Dashcam footage",
        now,
      }
    );
    assert.ok(trackRecording.id);
    assert.strictEqual(trackRecording.sessionId, trackSession.id);
    assert.strictEqual(trackRecording.userId, trackSession.userId);
    assert.strictEqual(trackRecording.mediaId, "media-uuid-123");
    assert.strictEqual(trackRecording.isPrimary, true);
    assert.strictEqual(trackRecording.lapOneOffset, 1.5);
    assert.strictEqual(trackRecording.description, "Dashcam footage");
    assert.strictEqual(trackRecording.status, "pending_upload");
    assert.strictEqual(trackRecording.error, null);
    assert.strictEqual(trackRecording.combineProgress, 0);
    assert.strictEqual(trackRecording.createdAt, now);
    assert.strictEqual(trackRecording.updatedAt, now);

    const retrievedRecording = findTrackRecordingById(trackRecording.id);
    assert.deepStrictEqual(retrievedRecording, trackRecording);
  });

  it("returns null for non-existent track recording", () => {
    const recording = findTrackRecordingById("non-existent-id");
    assert.strictEqual(recording, null);
  });

  it("can find track recordings by session ID", () => {
    const now = Date.now();
    const recording1 = createTrackRecording(
      {
        sessionId: trackSession.id,
        userId: trackSession.userId,
        mediaId: "media-uuid-a",
        isPrimary: true,
        lapOneOffset: 0.1,
        description: "External cam",
        now,
        status: "ready",
      }
    );
    const recording2 = createTrackRecording(
      {
        sessionId: trackSession.id,
        userId: trackSession.userId,
        mediaId: "media-uuid-b",
        isPrimary: false,
        lapOneOffset: 0.2,
        description: "Internal cam",
        now: now + 100,
        status: "ready",
      }
    );
    // Create another session and a recording for it to ensure filtering works
    const anotherTrackSession = createTrackSession(
      "2023-11-29T14:00:00Z",
      "Qualifying",
      2,
      track.id,
      user.id,
      null,
      now,
      "Dry",
      null,
      layout.id
    );
    createTrackRecording({
      sessionId: anotherTrackSession.id,
      userId: anotherTrackSession.userId,
      mediaId: "media-uuid-c",
      lapOneOffset: 0.3,
      description: "Other session",
      now: now + 200,
      status: "ready",
    });

    const recordings = findTrackRecordingsBySessionId(trackSession.id);
    assert.strictEqual(recordings.length, 2);
    assert.deepStrictEqual(recordings[0], recording2); // Ordered by created_at DESC
    assert.deepStrictEqual(recordings[1], recording1);
    assert.strictEqual(recordings[1]?.isPrimary, true);
  });
});
