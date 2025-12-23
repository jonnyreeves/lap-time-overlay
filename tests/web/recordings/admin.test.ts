import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";

function getTempRoot() {
  return path.join(os.tmpdir(), "racercraft-admin-tests");
}

function sessionRecordingsDir() {
  return path.join(getTempRoot(), "session");
}

function tmpUploadsDir() {
  return path.join(getTempRoot(), "uploads");
}

function tmpRendersDir() {
  return path.join(getTempRoot(), "renders");
}

function tmpPreviewsDir() {
  return path.join(getTempRoot(), "previews");
}

const { findAllMediaIdsMock, getStatusCountsMock } = vi.hoisted(() => ({
  findAllMediaIdsMock: vi.fn<string[]>(),
  getStatusCountsMock: vi.fn(),
}));

vi.mock("../../../src/web/config.js", () => ({
  sessionRecordingsDir: sessionRecordingsDir(),
  tmpUploadsDir: tmpUploadsDir(),
  tmpRendersDir: tmpRendersDir(),
  tmpPreviewsDir: tmpPreviewsDir(),
}));
vi.mock("../../../src/db/track_recordings.js", () => ({
  findAllTrackRecordingMediaIds: findAllMediaIdsMock,
  getTrackRecordingStatusCounts: getStatusCountsMock,
}));

import {
  listOrphanedMedia,
  deleteOrphanedMedia,
  collectTempDirStats,
  emptyTempDirectory,
  getRecordingHealthOverview,
  type AdminTempDirName,
} from "../../../src/web/recordings/admin.js";

async function cleanupDirectories() {
  await fsp.rm(getTempRoot(), { recursive: true, force: true }).catch(() => {});
}

async function ensureDirectories() {
  const dirs = [sessionRecordingsDir(), tmpUploadsDir(), tmpRendersDir(), tmpPreviewsDir()];
  await Promise.all(dirs.map((dir) => fsp.mkdir(dir, { recursive: true })));
}

async function createSessionFile(relative: string, contents: string) {
  const target = path.join(sessionRecordingsDir(), relative);
  await fsp.mkdir(path.dirname(target), { recursive: true });
  await fsp.writeFile(target, contents);
}

async function createSessionDirectory(relative: string) {
  const target = path.join(sessionRecordingsDir(), relative);
  await fsp.mkdir(target, { recursive: true });
}

async function createTempFile(name: AdminTempDirName, fileName: string, contents: string) {
  const dirFunction =
    name === "UPLOADS"
      ? tmpUploadsDir
      : name === "RENDERS"
        ? tmpRendersDir
        : tmpPreviewsDir;
  const target = path.join(dirFunction(), fileName);
  await fsp.mkdir(path.dirname(target), { recursive: true });
  await fsp.writeFile(target, contents);
}

describe("admin recordings utilities", () => {
  beforeEach(async () => {
    await cleanupDirectories();
    await ensureDirectories();
    findAllMediaIdsMock.mockReturnValue([]);
    getStatusCountsMock.mockReturnValue([]);
  });

  afterEach(async () => {
    await cleanupDirectories();
  });

  it("lists orphaned media that are not referenced", async () => {
    await createSessionFile("sessionA/orphan.mp4", "data");
    const items = await listOrphanedMedia();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      mediaId: "sessionA/orphan.mp4",
      sizeBytes: 4,
    });
    expect(new Date(items[0].modifiedAt).getTime()).toBeGreaterThan(0);
  });

  it("ignores .DS_Store files when listing orphans", async () => {
    await createSessionFile("sessionA/.DS_Store", "meta");
    await createSessionFile("sessionA/orphan.mp4", "data");
    const items = await listOrphanedMedia();
    expect(items).toHaveLength(1);
    expect(items[0].mediaId).toBe("sessionA/orphan.mp4");
  });

  it("reports empty directories as orphaned media", async () => {
    await createSessionDirectory("sessionD/empty");
    const items = await listOrphanedMedia();
    expect(items.some((entry) => entry.mediaId === "sessionD/empty")).toBe(true);
  });

  it("ignores media linked to recordings", async () => {
    await createSessionFile("sessionB/recording.mp4", "bits");
    findAllMediaIdsMock.mockReturnValue(["sessionB/recording.mp4"]);
    const items = await listOrphanedMedia();
    expect(items).toHaveLength(0);
  });

  it("deletes only orphan media files", async () => {
    await createSessionFile("sessionC/orphan.mp4", "data");
    await createSessionFile("sessionC/keep.mp4", "queue");
    findAllMediaIdsMock.mockReturnValue(["sessionC/keep.mp4"]);

    const deleted = await deleteOrphanedMedia([
      "sessionC/orphan.mp4",
      "sessionC/keep.mp4",
      "sessionC/missing.mp4",
    ]);
    expect(deleted).toEqual(["sessionC/orphan.mp4"]);
    await expect(fsp.stat(path.join(sessionRecordingsDir(), "sessionC/orphan.mp4"))).rejects.toThrow();
    await expect(fsp.stat(path.join(sessionRecordingsDir(), "sessionC/keep.mp4"))).resolves.toBeTruthy();
  });

  it("deletes empty directories only when they are orphaned", async () => {
    await createSessionDirectory("sessionE/empty");
    const deleted = await deleteOrphanedMedia(["sessionE/empty"]);
    expect(deleted).toEqual(["sessionE/empty"]);
    await expect(fsp.stat(path.join(sessionRecordingsDir(), "sessionE/empty"))).rejects.toThrow();
  });

  it("calculates temp dir statistics", async () => {
    await createTempFile("UPLOADS", "upload.dat", "1234");
    await createTempFile("RENDERS", "render.mov", "abcd");
    await createTempFile("PREVIEWS", "preview.png", "xx");

    const stats = await collectTempDirStats();
    const lookup = Object.fromEntries(stats.map((entry) => [entry.name, entry]));
    expect(lookup.UPLOADS.fileCount).toBe(1);
    expect(lookup.UPLOADS.sizeBytes).toBe(4);
    expect(lookup.RENDERS.fileCount).toBe(1);
    expect(lookup.PREVIEWS.fileCount).toBe(1);
  });

  it("empties the requested temp directory", async () => {
    await createTempFile("UPLOADS", "keep.txt", "abc");
    await emptyTempDirectory("UPLOADS");
    const entries = await fsp.readdir(tmpUploadsDir());
    expect(entries).toHaveLength(0);
  });

  it("proxies recording health counts", async () => {
    const snapshot = [
      { status: "PENDING_UPLOAD", count: 2 },
      { status: "READY", count: 5 },
    ];
    getStatusCountsMock.mockReturnValue(snapshot);
    expect(await getRecordingHealthOverview()).toEqual(snapshot);
  });
});
