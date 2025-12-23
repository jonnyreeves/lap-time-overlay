import fsp from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTrackLayout } from "../../../src/db/track_layouts.js";
import { createTrackRecording } from "../../../src/db/track_recordings.js";
import { createTrackSessionWithLaps } from "../../../src/db/track_sessions.js";
import { createTrack } from "../../../src/db/tracks.js";
import { createUser } from "../../../src/db/users.js";
import {
  rebuildJellyfinSessionProjection,
  removeJellyfinRecordingProjection,
} from "../../../src/web/recordings/jellyfinProjection.js";
import { setupTestDb, teardownTestDb } from "../../db/test_setup.js";

vi.mock("../../../src/web/config.js", () => {
  const root = path.join(process.cwd(), "temp", "jellyfin-projection");
  return {
    projectRoot: process.cwd(),
    publicDir: path.join(process.cwd(), "public"),
    sessionRecordingsDir: path.join(root, "session_recordings"),
    jellyfinProjectionDir: path.join(root, "jellyfin"),
    tmpUploadsDir: path.join(root, "uploads"),
    tmpRendersDir: path.join(root, "renders"),
    tmpPreviewsDir: path.join(root, "previews"),
    ensureWorkDirs: async () => { },
  };
});

const testRoot = path.join(process.cwd(), "temp", "jellyfin-projection");
const rawDir = path.join(testRoot, "session_recordings");
const projectionDir = path.join(testRoot, "jellyfin");

describe("Jellyfin projection", () => {
  beforeEach(async () => {
    setupTestDb();
    await fsp.rm(testRoot, { recursive: true, force: true });
  });

  afterEach(async () => {
    await fsp.rm(testRoot, { recursive: true, force: true });
    teardownTestDb();
  });

  it("rebuilds session projection with hard links and NFO metadata", async () => {
    const user = createUser("viewer", "hash");
    const track = createTrack("Daytona Sandown Park");
    const layout = createTrackLayout(track.id, "Full");
    const { trackSession } = createTrackSessionWithLaps({
      date: "2025-12-03",
      format: "Race",
      classification: 3,
      trackId: track.id,
      userId: user.id,
      trackLayoutId: layout.id,
      laps: [{ lapNumber: 1, time: 60 }],
    });
    const recording = createTrackRecording({
      id: "rec-a",
      sessionId: trackSession.id,
      userId: user.id,
      mediaId: `${trackSession.id}/rec-a.mp4`,
      status: "ready",
      lapOneOffset: 0,
      description: "Main cam",
      isPrimary: true,
    });

    const rawPath = path.join(rawDir, recording.mediaId);
    await fsp.mkdir(path.dirname(rawPath), { recursive: true });
    await fsp.writeFile(rawPath, "raw-file");

    const staleFolder = path.join(projectionDir, "viewer", "2025", "Old Track", "Dec 3");
    await fsp.mkdir(staleFolder, { recursive: true });
    await fsp.writeFile(path.join(staleFolder, `${recording.id}.mp4`), "stale");

    const view = await rebuildJellyfinSessionProjection(trackSession.id);

    const expectedFolderName = path.join("viewer", "2025", track.name, "Dec 3");
    expect(view.folderName).toBe(expectedFolderName);
    expect(view.recordings).toHaveLength(1);

    const projection = view.recordings[0]!;
    const rawStats = await fsp.stat(rawPath);
    const projectionStats = await fsp.stat(projection.jellyfinPath);

    expect(rawStats.ino).toBe(projectionStats.ino);
    expect(path.parse(projection.jellyfinPath).name).toBe(path.parse(projection.nfoPath).name);
    await expect(fsp.stat(projection.nfoPath)).resolves.toBeTruthy();
    await expect(fsp.stat(staleFolder)).rejects.toBeTruthy();

    const nfo = await fsp.readFile(projection.nfoPath, "utf8");
    expect(nfo).toContain("Daytona Sandown Park");
    expect(nfo).toContain("P3");
    expect(nfo).toContain(`Recording ID: ${recording.id}`);
    expect(nfo).toContain(`Session ID: ${trackSession.id}`);
    expect(path.basename(projection.jellyfinPath)).toBe(
      "Race - Daytona Sandown Park - Full - 2025-12-03.mp4"
    );
    expect(projection.jellyfinPath).toContain(expectedFolderName);
  });

  it("removes a single recording projection without disturbing the session folder", async () => {
    const user = createUser("viewer", "hash");
    const track = createTrack("Bayford Meadows");
    const layout = createTrackLayout(track.id, "Short");
    const { trackSession } = createTrackSessionWithLaps({
      date: "2024-06-10",
      format: "Practice",
      classification: 4,
      trackId: track.id,
      userId: user.id,
      trackLayoutId: layout.id,
      laps: [{ lapNumber: 1, time: 70 }],
    });

    const rec1 = createTrackRecording({
      id: "rec-one",
      sessionId: trackSession.id,
      userId: user.id,
      mediaId: `${trackSession.id}/rec-one.mp4`,
      status: "ready",
      lapOneOffset: 0,
      description: null,
      isPrimary: true,
    });
    const rec2 = createTrackRecording({
      id: "rec-two",
      sessionId: trackSession.id,
      userId: user.id,
      mediaId: `${trackSession.id}/rec-two.mp4`,
      status: "ready",
      lapOneOffset: 0,
      description: null,
      isPrimary: false,
    });

    for (const rec of [rec1, rec2]) {
      const p = path.join(rawDir, rec.mediaId);
      await fsp.mkdir(path.dirname(p), { recursive: true });
      await fsp.writeFile(p, rec.id);
    }

    const view = await rebuildJellyfinSessionProjection(trackSession.id);
    const rec1Projection = view.recordings.find((r) => r.recordingId === rec1.id);
    const rec2Projection = view.recordings.find((r) => r.recordingId === rec2.id);
    const expectedFolderName = path.join("viewer", "2024", track.name, "Jun 10");

    expect(view.folderName).toBe(expectedFolderName);
    expect(rec1Projection).toBeDefined();
    expect(rec2Projection).toBeDefined();
    expect(path.basename(rec1Projection!.jellyfinPath)).toBe(
      "Practice - Bayford Meadows - Short - 2024-06-10 - rec-one.mp4"
    );
    expect(path.basename(rec2Projection!.jellyfinPath)).toBe(
      "Practice - Bayford Meadows - Short - 2024-06-10 - rec-two.mp4"
    );

    await removeJellyfinRecordingProjection(rec1.id);

    await expect(fsp.stat(rec1Projection!.jellyfinPath)).rejects.toBeTruthy();
    await expect(fsp.stat(rec1Projection!.nfoPath)).rejects.toBeTruthy();
    await expect(fsp.stat(rec2Projection!.jellyfinPath)).resolves.toBeTruthy();
    await expect(fsp.stat(rec2Projection!.nfoPath)).resolves.toBeTruthy();

    const sessionFolder = path.join(projectionDir, expectedFolderName);
    await expect(fsp.stat(sessionFolder)).resolves.toBeTruthy();
  });
});
