import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTrackRecording, findTrackRecordingById, findTrackRecordingsBySessionId } from "../../../src/db/track_recordings.js";
import { createTrackLayout } from "../../../src/db/track_layouts.js";
import { createTrack } from "../../../src/db/tracks.js";
import { createUser } from "../../../src/db/users.js";
import { createTrackSessionWithLaps } from "../../../src/db/track_sessions.js";
import { sessionRecordingsDir, tmpRendersDir } from "../../../src/web/config.js";
import { burnRecordingOverlay } from "../../../src/web/recordings/overlayBurn.js";
import { setupTestDb, teardownTestDb } from "../../db/test_setup.js";

vi.mock("../../../src/web/config.js", () => {
  const testRoot = path.join(process.cwd(), "temp", "tests");
  return {
    projectRoot: process.cwd(),
    publicDir: path.join(process.cwd(), "public"),
    rawMediaDir: path.join(testRoot, "session_recordings"),
    sessionRecordingsDir: path.join(testRoot, "session_recordings"),
    jellyfinProjectionDir: path.join(testRoot, "jellyfin"),
    tmpUploadsDir: path.join(testRoot, "uploads"),
    tmpRendersDir: path.join(testRoot, "renders"),
    tmpPreviewsDir: path.join(testRoot, "previews"),
    ensureWorkDirs: async () => {},
  };
});

const testRootDir = path.join(process.cwd(), "temp", "tests");

let savedOutputs: string[] = [];
let savedMetadataInputs: string[] = [];
let savedMetadataContents: string[] = [];
let savedOutputOptions: string[][] = [];

vi.mock("fluent-ffmpeg", () => {
  return {
    default: () => {
      const handlers: Record<string, ((payload?: unknown) => void)[]> = {
        progress: [],
        error: [],
        end: [],
      };
      const outputOptionsCalls: string[][] = [];
      const api = {
        input: (file?: string) => {
          if (file) {
            if (file.endsWith(".ffmetadata")) {
              savedMetadataInputs.push(file);
            }
          }
          return api;
        },
        complexFilter: () => api,
        outputOptions: (...options: unknown[]) => {
          const flattened = options.flatMap((opt) =>
            Array.isArray(opt) ? opt : typeof opt === "string" ? [opt] : []
          );
          outputOptionsCalls.push(flattened as string[]);
          return api;
        },
        on: (event: keyof typeof handlers, cb: (payload?: unknown) => void) => {
          handlers[event].push(cb);
          return api;
        },
        save: (output: string) => {
          savedOutputs.push(output);
          savedOutputOptions.push(...outputOptionsCalls);
          for (const metadataFile of savedMetadataInputs) {
            try {
              savedMetadataContents.push(fs.readFileSync(metadataFile, "utf8"));
            } catch {
              // Ignore metadata read failures in tests
            }
          }
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
  probeVideoInfo: vi.fn(async () => ({ duration: 2, fps: 30, width: 1920, height: 1080 })),
}));

describe("burnRecordingOverlay", () => {
  beforeEach(async () => {
    setupTestDb();
    await fsp.mkdir(sessionRecordingsDir, { recursive: true });
    savedOutputs = [];
    savedMetadataInputs = [];
    savedMetadataContents = [];
    savedOutputOptions = [];
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
      laps: [
        { lapNumber: 1, time: 60 },
        { lapNumber: 2, time: 62 },
      ],
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

    expect(savedOutputs).toHaveLength(1);
    const [tempOutput] = savedOutputs;
    expect(tempOutput.startsWith(path.join(tmpRendersDir, "overlay-burns"))).toBe(true);

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
    await expect(fsp.stat(tempOutput)).rejects.toThrow();
    await expect(fsp.stat(inputPath)).resolves.toBeTruthy();

    expect(savedMetadataInputs).toHaveLength(1);
    expect(savedMetadataContents[0]).toContain("START=1000");
    expect(savedMetadataContents[0]).toContain("END=61000");
    expect(savedMetadataContents[0]).toContain("START=61000");
    expect(savedMetadataContents[0]).toContain("END=9999999");
    expect(savedOutputOptions.some((opts) => opts.includes("-map_chapters"))).toBe(true);
    const chapterMetadataPath = path.join(tmpRendersDir, "overlay-burns", overlayRecording!.id, "chapters.ffmetadata");
    await expect(fsp.stat(chapterMetadataPath)).rejects.toThrow();
  });

  it("skips chapter embedding when disabled", async () => {
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
      laps: [
        { lapNumber: 1, time: 60 },
        { lapNumber: 2, time: 62 },
      ],
    });

    const recording = createTrackRecording({
      sessionId: trackSession.id,
      userId,
      mediaId: `${trackSession.id}/base.mp4`,
      lapOneOffset: 0,
      description: "Base recording",
      status: "ready",
      isPrimary: true,
    });

    const inputPath = path.join(sessionRecordingsDir, recording.mediaId);
    await fsp.mkdir(path.dirname(inputPath), { recursive: true });
    await fsp.writeFile(inputPath, "source");

    await burnRecordingOverlay({
      recordingId: recording.id,
      currentUserId: userId,
      quality: "best",
      embedChapters: false,
    });

    expect(savedMetadataInputs).toHaveLength(0);
    expect(savedOutputOptions.some((opts) => opts.includes("-map_chapters"))).toBe(false);
  });
});
