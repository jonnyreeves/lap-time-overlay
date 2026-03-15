import assert from "assert";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  findTrackSessionParticipantLapsByParticipantId,
  findTrackSessionParticipantsBySessionId,
} from "../../src/db/track_session_participants.js";
import { createTrackLayout } from "../../src/db/track_layouts.js";
import {
  createTrackSessionWithLaps,
  deleteTrackSession,
} from "../../src/db/track_sessions.js";
import { createTrack } from "../../src/db/tracks.js";
import { createUser } from "../../src/db/users.js";
import { setupTestDb, teardownTestDb } from "../db/test_setup.js";

describe("track_session_participants", () => {
  beforeEach(() => {
    setupTestDb();
  });

  afterEach(() => {
    teardownTestDb();
  });

  it("persists imported participants and their laps with the track session", () => {
    const user = createUser("driver", "hashed");
    const track = createTrack("Buckmore Park");
    const layout = createTrackLayout(track.id, "GP");

    const { trackSession } = createTrackSessionWithLaps({
      date: "2026-03-14T18:23:00Z",
      format: "Practice",
      classification: 2,
      trackId: track.id,
      userId: user.id,
      trackLayoutId: layout.id,
      participants: [
        {
          name: "John Reeves",
          classification: 2,
          kartNumber: "16",
          isSelf: true,
          laps: [
            { lapNumber: 1, time: 52.111 },
            { lapNumber: 2, time: 51.9 },
          ],
        },
        {
          name: "Robert Seaman",
          classification: 1,
          kartNumber: "7",
          isSelf: false,
          laps: [
            { lapNumber: 1, time: 51.62 },
            { lapNumber: 2, time: 51.44 },
          ],
        },
      ],
    });

    const participants = findTrackSessionParticipantsBySessionId(trackSession.id);
    assert.strictEqual(participants.length, 2);
    const self = participants.find((participant) => participant.isSelf);
    assert.ok(self);
    assert.strictEqual(self?.name, "John Reeves");
    assert.strictEqual(self?.classification, 2);

    const selfLaps = findTrackSessionParticipantLapsByParticipantId(self!.id);
    assert.deepStrictEqual(
      selfLaps.map((lap) => ({ lapNumber: lap.lapNumber, time: lap.time })),
      [
        { lapNumber: 1, time: 52.111 },
        { lapNumber: 2, time: 51.9 },
      ]
    );
  });

  it("cascades participant rows when a track session is deleted", async () => {
    const user = createUser("driver", "hashed");
    const track = createTrack("Buckmore Park");
    const layout = createTrackLayout(track.id, "GP");
    const { trackSession } = createTrackSessionWithLaps({
      date: "2026-03-14T18:23:00Z",
      format: "Practice",
      classification: 2,
      trackId: track.id,
      userId: user.id,
      trackLayoutId: layout.id,
      participants: [
        {
          name: "John Reeves",
          classification: 2,
          kartNumber: "16",
          isSelf: true,
          laps: [{ lapNumber: 1, time: 52.111 }],
        },
      ],
    });

    const deleted = await deleteTrackSession(trackSession.id, user.id);
    assert.strictEqual(deleted, true);
    const participants = findTrackSessionParticipantsBySessionId(trackSession.id);
    assert.strictEqual(participants.length, 0);
  });
});
