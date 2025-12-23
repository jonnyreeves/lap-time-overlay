import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { setupTestDb, teardownTestDb } from "../../db/test_setup.js";

const tempRoot = path.join(os.tmpdir(), "racecraft-temp-cleanup");

vi.mock("../../../src/web/config.js", () => {
  const root = path.join(os.tmpdir(), "racecraft-temp-cleanup");
  return {
    tmpUploadsDir: path.join(root, "uploads"),
    tmpRendersDir: path.join(root, "renders"),
    tmpPreviewsDir: path.join(root, "previews"),
  };
});

import {
  cleanupTempDirectories,
  getMaxTempCleanupAgeMs,
  getTempCleanupSchedule,
  runTempCleanupNow,
  setTempCleanupSchedule,
} from "../../../src/web/recordings/tempCleanup.js";

function filePath(relative: string) {
  return path.join(tempRoot, relative);
}

async function createFile(relative: string, contents: string, mtime: number) {
  const target = filePath(relative);
  await fsp.mkdir(path.dirname(target), { recursive: true });
  await fsp.writeFile(target, contents);
  const when = new Date(mtime);
  await fsp.utimes(target, when, when);
}

async function listRelativeFiles(dir: string): Promise<string[]> {
  const base = filePath(dir);
  const entries = await fsp.readdir(base, { withFileTypes: true }).catch(() => []);
  const results: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    results.push(entryPath);
  }
  return results;
}

describe("temp cleanup scheduler utilities", () => {
  beforeEach(async () => {
    setupTestDb();
    await fsp.rm(tempRoot, { recursive: true, force: true }).catch(() => {});
    await Promise.all([
      fsp.mkdir(filePath("uploads"), { recursive: true }),
      fsp.mkdir(filePath("renders"), { recursive: true }),
      fsp.mkdir(filePath("previews"), { recursive: true }),
    ]);
  });

  afterEach(async () => {
    teardownTestDb();
    await fsp.rm(tempRoot, { recursive: true, force: true }).catch(() => {});
  });

  it("removes only temp files older than one day", async () => {
    const now = Date.now();
    await createFile("uploads/old.txt", "old", now - getMaxTempCleanupAgeMs() - 1000);
    await createFile("uploads/new.txt", "new", now - 1000);
    await cleanupTempDirectories({ now });

    const remaining = await listRelativeFiles("uploads");
    expect(remaining).toEqual(["uploads/new.txt"]);
  });

  it("stores and returns schedules with next run in local time", async () => {
    const schedule = await setTempCleanupSchedule({ hour: 2, days: [1, 3, 1] });
    expect(schedule.enabled).toBe(true);
    expect(schedule.days).toEqual([1, 3]);
    expect(schedule.hour).toBe(2);
    expect(schedule.nextRunAt).toBeGreaterThan(Date.now() - 1000);
  });

  it("disables scheduling when days are empty", async () => {
    const schedule = await setTempCleanupSchedule({ hour: 5, days: [] });
    expect(schedule.enabled).toBe(false);
    expect(schedule.nextRunAt).toBeNull();
  });

  it("records last run time when running immediately", async () => {
    await setTempCleanupSchedule({ hour: 4, days: [0] });
    const now = Date.now();
    const schedule = await runTempCleanupNow(now);
    expect(schedule.lastRunAt).toBe(now);

    const persisted = await getTempCleanupSchedule();
    expect(persisted.lastRunAt).toBeGreaterThan(0);
  });
});
