import assert from "assert";
import { describe, it, beforeEach } from "vitest";
import { getDb, setDb } from "../../src/db/client.js";
import Database from "better-sqlite3";
import { migration as userMigration } from "../../src/db/migrations/01_create_users.js";
import { migration as circuitMigration } from "../../src/db/migrations/03_create_circuits.js";
import { migration as trackSessionMigration } from "../../src/db/migrations/04_create_track_sessions.js";
import { migration as trackRecordingMigration } from "../../src/db/migrations/07_create_track_recordings.js";
import { migration as trackSessionConditionsMigration } from "../../src/db/migrations/08_add_track_session_conditions.js";
import { createUser, type UserRecord } from "../../src/db/users.js";
import { createCircuit, type CircuitRecord } from "../../src/db/circuits.js";
import { createTrackSession, type TrackSessionRecord } from "../../src/db/track_sessions.js";
import {
  createTrackRecording,
  findTrackRecordingById,
  findTrackRecordingsBySessionId,
  type TrackRecordingRecord,
} from "../../src/db/track_recordings.js";

describe("track_recordings", () => {
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
    trackRecordingMigration.up(db);
    user = createUser("testuser", "hashedpassword");
    circuit = createCircuit("Test Circuit", user.id);
    trackSession = createTrackSession(
      "2023-11-29T10:00:00Z",
      "Practice",
      circuit.id
    );
  });

  it("can create and retrieve a track recording", () => {
    const now = Date.now();
    const trackRecording = createTrackRecording(
      trackSession.id,
      "media-uuid-123",
      1.5,
      "Dashcam footage",
      now
    );
    assert.ok(trackRecording.id);
    assert.strictEqual(trackRecording.sessionId, trackSession.id);
    assert.strictEqual(trackRecording.mediaId, "media-uuid-123");
    assert.strictEqual(trackRecording.lapOneOffset, 1.5);
    assert.strictEqual(trackRecording.description, "Dashcam footage");
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
      trackSession.id,
      "media-uuid-a",
      0.1,
      "External cam",
      now
    );
    const recording2 = createTrackRecording(
      trackSession.id,
      "media-uuid-b",
      0.2,
      "Internal cam",
      now + 100
    );
    // Create another session and a recording for it to ensure filtering works
    const anotherTrackSession = createTrackSession(
      "2023-11-29T14:00:00Z",
      "Qualifying",
      circuit.id
    );
    createTrackRecording(
      anotherTrackSession.id,
      "media-uuid-c",
      0.3,
      "Other session",
      now + 200
    );

    const recordings = findTrackRecordingsBySessionId(trackSession.id);
    assert.strictEqual(recordings.length, 2);
    assert.deepStrictEqual(recordings[0], recording2); // Ordered by created_at DESC
    assert.deepStrictEqual(recordings[1], recording1);
  });
});
