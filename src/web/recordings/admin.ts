import fsp from "node:fs/promises";
import path from "node:path";
import { getTrackRecordingStatusCounts, findAllTrackRecordingMediaIds, type TrackRecordingStatus } from "../../db/track_recordings.js";
import {
  sessionRecordingsDir,
  tmpPreviewsDir,
  tmpRendersDir,
  tmpUploadsDir,
} from "../config.js";

export type AdminTempDirName = "UPLOADS" | "RENDERS" | "PREVIEWS";

export interface AdminOrphanedMediaItem {
  mediaId: string;
  sizeBytes: number;
  modifiedAt: string;
}

export interface AdminTempDirInfo {
  name: AdminTempDirName;
  path: string;
  sizeBytes: number;
  fileCount: number;
}

export interface AdminRecordingHealthEntry {
  status: Uppercase<TrackRecordingStatus>;
  count: number;
}

const TEMP_DIR_MAP: Record<AdminTempDirName, string> = {
  UPLOADS: tmpUploadsDir,
  RENDERS: tmpRendersDir,
  PREVIEWS: tmpPreviewsDir,
};

const TEMP_DIR_SOURCES: { name: AdminTempDirName; path: string }[] = [
  { name: "UPLOADS", path: tmpUploadsDir },
  { name: "RENDERS", path: tmpRendersDir },
  { name: "PREVIEWS", path: tmpPreviewsDir },
];

function resolveSessionRoot(): string {
  return path.resolve(sessionRecordingsDir);
}

type TraverseCallback = (filePath: string) => Promise<void>;

async function traverseSessionFiles(callback: TraverseCallback) {
  const root = resolveSessionRoot();
  if (!(await pathExists(root))) {
    return;
  }
  await traverseDirectory(root, callback);
}

async function traverseDirectory(directory: string, callback: TraverseCallback): Promise<void> {
  const entries = await fsp.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await traverseDirectory(entryPath, callback);
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      await callback(entryPath);
    }
  }
}

function toRelativeMediaId(filePath: string): string {
  const root = resolveSessionRoot();
  const relative = path.relative(root, filePath);
  return relative.split(path.sep).join("/");
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fsp.access(target);
    return true;
  } catch {
    return false;
  }
}

function isWithinSessionRoot(resolvedPath: string): boolean {
  const root = resolveSessionRoot();
  const relative = path.relative(root, resolvedPath);
  if (!relative) {
    return false;
  }
  if (path.isAbsolute(relative)) {
    return false;
  }
  const segments = relative.split(path.sep);
  return !segments.includes("..");
}

export async function listOrphanedMedia(): Promise<AdminOrphanedMediaItem[]> {
  const referenced = new Set(await findAllTrackRecordingMediaIds());
  const items: AdminOrphanedMediaItem[] = [];

  await traverseSessionFiles(async (filePath) => {
    const mediaId = toRelativeMediaId(filePath);
    if (!mediaId || referenced.has(mediaId)) {
      return;
    }
    const stats = await fsp.stat(filePath).catch(() => null);
    if (!stats?.isFile()) {
      return;
    }
    items.push({
      mediaId,
      sizeBytes: stats.size,
      modifiedAt: stats.mtime.toISOString(),
    });
  });

  items.sort((a, b) => a.mediaId.localeCompare(b.mediaId));
  return items;
}

export async function deleteOrphanedMedia(mediaIds: string[]): Promise<string[]> {
  const referenced = new Set(await findAllTrackRecordingMediaIds());
  const cleanedIds = [...new Set(mediaIds.filter(Boolean))];
  const deleted: string[] = [];

  for (const mediaId of cleanedIds) {
    if (referenced.has(mediaId)) {
      continue;
    }
    const resolved = path.resolve(sessionRecordingsDir, mediaId);
    if (!isWithinSessionRoot(resolved)) {
      continue;
    }
    const stats = await fsp.stat(resolved).catch(() => null);
    if (!stats?.isFile()) {
      continue;
    }
    await fsp.rm(resolved, { force: true });
    deleted.push(mediaId);
  }

  return deleted;
}

async function accumulateDirectoryStats(dir: string): Promise<{ sizeBytes: number; fileCount: number }> {
  if (!(await pathExists(dir))) {
    return { sizeBytes: 0, fileCount: 0 };
  }

  let sizeBytes = 0;
  let fileCount = 0;
  const entries = await fsp.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await accumulateDirectoryStats(entryPath);
      sizeBytes += nested.sizeBytes;
      fileCount += nested.fileCount;
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      const stats = await fsp.stat(entryPath).catch(() => null);
      if (stats?.isFile()) {
        sizeBytes += stats.size;
        fileCount += 1;
      }
    }
  }

  return { sizeBytes, fileCount };
}

export async function collectTempDirStats(): Promise<AdminTempDirInfo[]> {
  const results: AdminTempDirInfo[] = [];
  for (const entry of TEMP_DIR_SOURCES) {
    const stats = await accumulateDirectoryStats(entry.path);
    results.push({
      name: entry.name,
      path: entry.path,
      sizeBytes: stats.sizeBytes,
      fileCount: stats.fileCount,
    });
  }
  return results;
}

export async function emptyTempDirectory(name: AdminTempDirName): Promise<void> {
  const dirPath = TEMP_DIR_MAP[name];
  await fsp.rm(dirPath, { recursive: true, force: true });
  await fsp.mkdir(dirPath, { recursive: true });
}

export async function getRecordingHealthOverview(): Promise<AdminRecordingHealthEntry[]> {
  return getTrackRecordingStatusCounts().map((entry) => ({
    status: entry.status.toUpperCase() as Uppercase<TrackRecordingStatus>,
    count: entry.count,
  }));
}
