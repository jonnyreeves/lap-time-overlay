import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTrackRecording, findTrackRecordingById, findTrackRecordingsBySessionId } from "../../../src/db/track_recordings.js";
import { createTrackLayout } from "../../../src/db/track_layouts.js";
import { createTrack } from "../../../src/db/tracks.js";
import { createUser } from "../../../src/db/users.js";
import { createTrackSessionWithLaps } from "../../../src/db/track_sessions.js";
import { sessionRecordingsDir } from "../../../src/web/config.js";
import { burnRecordingOverlay } from "../../../src/web/recordings/overlayBurn.js";
import { setupTestDb, teardownTestDb } from "../../db/test_setup.js";

vi.mock("../../../src/web/config.js", () => {
  const testRoot = path.join(process.cwd(), "temp", "tests");
  return {
    projectRoot: process.cwd(),
    publicDir: path.join(process.cwd(), "public"),
    sessionRecordingsDir: path.join(testRoot, "session_recordings"),
    tmpUploadsDir: path.join(testRoot, "uploads"),
    tmpRendersDir: path.join(testRoot, "renders"),
    tmpPreviewsDir: path.join(testRoot, "previews"),
    ensureWorkDirs: async () => {},
  };
});

const testRootDir = path.join(process.cwd(), "temp", "tests");

vi.mock("fluent-ffmpeg", () => {
  return {
    default: () => {
      const handlers: Record<string, ((payload?: unknown) => void)[]> = {
        progress: [],
        error: [],
        end: [],
      };
      const api = {
        input: () => api,
        complexFilter: () => api,
        outputOptions: () => api,
        on: (event: keyof typeof handlers, cb: (payload?: unknown) => void) => {
          handlers[event].push(cb);
          return api;
        },
        save: (output: string) => {
          fs.writeFileSync(output, "overlay-output");
          handlers.progress.forEach((cb) => cb({ percent: 50 }));
          handlers.progress.forEach((cb) => cb({ percent: 100 }));
          handlers.end.forEach((cb) => cb());
          return api;
        },
      };
      return api;
    },
  };
});

vi.mock("../../../src/ffmpeg/videoInfo.js", () => ({
  probeVideoInfo: vi.fn(async () => ({ duration: 2, fps: 30 })),
}));

describe("burnRecordingOverlay", () => {
  beforeEach(async () => {
    setupTestDb();
    await fsp.mkdir(sessionRecordingsDir, { recursive: true });
  });

  afterEach(async () => {
    await fsp.rm(testRootDir, { recursive: true, force: true });
    teardownTestDb();
  });

  it("creates a new overlay recording without mutating the original", async () => {
    const user = createUser("encoder", "hashed");
    const track = createTrack("Overlay Track");
    const layout = createTrackLayout(track.id, "Full");
    const userId = user.id;
    const { trackSession } = createTrackSessionWithLaps({
      date: "2024-01-01",
      format: "Race",
      classification: 1,
      trackId: track.id,
      userId,
      trackLayoutId: layout.id,
      laps: [{ lapNumber: 1, time: 60 }],
    });

    const recording = createTrackRecording({
      sessionId: trackSession.id,
      userId,
      mediaId: `${trackSession.id}/base.mp4`,
      lapOneOffset: 1,
      description: "Base recording",
      status: "ready",
      isPrimary: true,
    });

    const inputPath = path.join(sessionRecordingsDir, recording.mediaId);
    await fsp.mkdir(path.dirname(inputPath), { recursive: true });
    await fsp.writeFile(inputPath, "source");

    const result = await burnRecordingOverlay({
      recordingId: recording.id,
      currentUserId: userId,
      quality: "good",
    });

    const original = findTrackRecordingById(recording.id);
    expect(original?.overlayBurned).toBe(false);
    expect(original?.status).toBe("ready");
    expect(original?.mediaId).toBe(recording.mediaId);
    expect(original?.combineProgress).toBe(0);

    const recordings = findTrackRecordingsBySessionId(trackSession.id);
    expect(recordings).toHaveLength(2);

    const overlayRecording = recordings.find((rec) => rec.id === result.id);
    expect(overlayRecording).toBeDefined();
    expect(overlayRecording?.id).not.toBe(recording.id);
    expect(overlayRecording?.overlayBurned).toBe(true);
    expect(overlayRecording?.status).toBe("ready");
    expect(overlayRecording?.isPrimary).toBe(false);
    expect(overlayRecording?.mediaId.endsWith("-overlay.mp4")).toBe(true);
    expect(overlayRecording?.combineProgress).toBe(1);
    expect(overlayRecording?.lapOneOffset).toBe(recording.lapOneOffset);

    const overlayPath = path.join(sessionRecordingsDir, overlayRecording!.mediaId);
    await expect(fsp.stat(overlayPath)).resolves.toBeTruthy();
    await expect(fsp.stat(inputPath)).resolves.toBeTruthy();
  });
});
