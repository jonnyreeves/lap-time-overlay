import type { Stats } from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { findTrackLayoutById } from "../../db/track_layouts.js";
import {
  findSessionIdsWithReadyRecordings,
  findTrackRecordingById,
  findTrackRecordingsBySessionId,
  type TrackRecordingRecord,
} from "../../db/track_recordings.js";
import { findTrackSessionById } from "../../db/track_sessions.js";
import { findTrackById } from "../../db/tracks.js";
import { findUserById } from "../../db/users.js";
import { mediaLibraryProjectionDir, sessionRecordingsDir } from "../config.js";

export interface MediaLibraryRecordingView {
  recordingId: string;
  rawPath: string;
  mediaLibraryPath: string;
  nfoPath: string;
}

export interface MediaLibrarySessionView {
  folderName: string;
  recordings: MediaLibraryRecordingView[];
}

type ProjectionErrorCode = "NOT_FOUND" | "VALIDATION_FAILED";

export class MediaLibraryProjectionError extends Error {
  constructor(message: string, public code: ProjectionErrorCode = "VALIDATION_FAILED") {
    super(message);
    this.name = "MediaLibraryProjectionError";
  }
}

const rawRoot = sessionRecordingsDir;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"] as const;
const projectionRoot = path.resolve(mediaLibraryProjectionDir);

function sanitizeName(name: string, fallback = "Unknown"): string {
  const cleaned = name.replace(/[\\/]/g, "-").replace(/^\.+/, "").replace(/\.+$/, "").trim();
  if (!cleaned || cleaned === "." || cleaned === "..") {
    return fallback;
  }
  return cleaned;
}

function sessionDateParts(dateStr: string): { isoDate: string; yearFolder: string; dayFolder: string } {
  const parsed = new Date(`${dateStr}`);
  if (Number.isNaN(parsed.getTime())) {
    const fallback = sanitizeName(dateStr, "Unknown Date");
    return { isoDate: sanitizeName(dateStr, "unknown-date"), yearFolder: "Unknown Year", dayFolder: fallback };
  }

  const isoDate = parsed.toISOString().slice(0, 10);
  const monthLabel = MONTH_NAMES[parsed.getUTCMonth()] ?? "Unknown";

  return {
    isoDate,
    yearFolder: `${parsed.getUTCFullYear()}`,
    dayFolder: `${monthLabel} ${parsed.getUTCDate()}`,
  };
}

function buildProjectionPaths({
  username,
  trackName,
  trackLayoutName,
  format,
  sessionDate,
}: {
  username: string;
  trackName: string;
  trackLayoutName: string;
  format: string;
  sessionDate: string;
}): { folderName: string; recordingBaseName: string; isoDate: string } {
  const sanitizedUser = sanitizeName(username, "user");
  const sanitizedTrack = sanitizeName(trackName, "Unknown Track");
  const sanitizedLayout = sanitizeName(trackLayoutName, "Unknown Layout");
  const sanitizedFormat = sanitizeName(format, "Unknown Format");
  const { isoDate, yearFolder, dayFolder } = sessionDateParts(sessionDate);

  return {
    folderName: path.join(sanitizedUser, yearFolder, sanitizedTrack, dayFolder),
    recordingBaseName: `${sanitizedFormat} - ${sanitizedTrack} - ${sanitizedLayout} - ${isoDate}`,
    isoDate,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatIsoDate(dateStr: string): string {
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return dateStr;
  }
  return parsed.toISOString().slice(0, 10);
}

function formatHumanDate(dateStr: string): string {
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return dateStr;
  }
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildTitle(trackName: string, date: string, classification: number): string {
  const position = Number.isFinite(classification) ? ` (P${classification})` : "";
  return `${trackName} – ${formatHumanDate(date)}${position}`;
}

function buildPlot({
  trackName,
  classification,
  sessionId,
  recordingId,
  format,
}: {
  trackName: string;
  classification: number;
  sessionId: string;
  recordingId: string;
  format?: string;
}): string {
  const lines = [
    `Go-kart session at ${trackName}.`,
    format ? `Format: ${format}.` : null,
    `Finished position: P${classification}.`,
    `Session ID: ${sessionId}`,
    `Recording ID: ${recordingId}`,
  ].filter(Boolean) as string[];

  return lines.join("\n");
}

function buildNfo({
  trackName,
  sessionDate,
  classification,
  sessionId,
  recordingId,
  format,
  isoDate,
}: {
  trackName: string;
  sessionDate: string;
  classification: number;
  sessionId: string;
  recordingId: string;
  format?: string;
  isoDate?: string;
}): string {
  const safeIsoDate = isoDate || formatIsoDate(sessionDate);
  const title = buildTitle(trackName, sessionDate, classification);
  const plot = buildPlot({ trackName, classification, sessionId, recordingId, format });

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<movie>
  <title>${escapeXml(title)}</title>
  <plot>
    ${escapeXml(plot)}
  </plot>
  <premiered>${escapeXml(safeIsoDate)}</premiered>
  <dateadded>${escapeXml(safeIsoDate)}</dateadded>
  <tag>RaceCraft</tag>
  <tag>${escapeXml(trackName)}</tag>
</movie>
`;
}

function projectionFileName({
  recording,
  rawPath,
  baseName,
  suffix,
  existingNames,
}: {
  recording: TrackRecordingRecord;
  rawPath: string;
  baseName: string;
  suffix?: string;
  existingNames: Set<string>;
}): string {
  const ext = path.extname(rawPath) || path.extname(recording.mediaId) || ".mp4";
  const withSuffix = suffix ? `${baseName} - ${suffix}` : baseName;
  let candidate = `${withSuffix}${ext || ".mp4"}`;
  let counter = 2;

  while (existingNames.has(candidate)) {
    candidate = `${withSuffix} (${counter})${ext || ".mp4"}`;
    counter += 1;
  }

  existingNames.add(candidate);
  return candidate;
}

async function findRecordingProjectionFolders(recordingIds: Set<string>): Promise<Set<string>> {
  const matches = new Set<string>();
  if (!recordingIds.size) return matches;
  const ids = Array.from(recordingIds);

  async function walk(dir: string): Promise<void> {
    const entries = await fsp.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      const baseName = path.parse(entry.name).name;
      const ext = path.extname(entry.name).toLowerCase();
      if (recordingIds.has(baseName) || ids.some((id) => baseName.endsWith(id))) {
        matches.add(path.dirname(fullPath));
        continue;
      }

      if (ext === ".nfo") {
        const contents = await fsp.readFile(fullPath, "utf8").catch(() => null);
        if (contents && ids.some((id) => contents.includes(`Recording ID: ${id}`))) {
          matches.add(path.dirname(fullPath));
        }
      }
    }
  }

  await walk(projectionRoot);
  return matches;
}

async function pruneEmptyAncestors(start: string): Promise<void> {
  let current = path.resolve(start);
  while (current.startsWith(projectionRoot) && current !== projectionRoot) {
    const entries = await fsp.readdir(current).catch(() => null);
    if (!entries || entries.length > 0) break;

    await fsp.rm(current, { recursive: true, force: true });
    current = path.dirname(current);
  }
}

function resolveRawPath(mediaId: string): string {
  const base = path.resolve(rawRoot);
  const target = path.resolve(path.join(base, mediaId));
  if (!target.startsWith(base)) {
    throw new MediaLibraryProjectionError("Recording media path is invalid");
  }
  return target;
}

async function removeProjectionFolders(recordingIds: Set<string>): Promise<void> {
  if (!recordingIds.size) return;

  const folders = await findRecordingProjectionFolders(recordingIds);
  for (const folderPath of folders) {
    if (path.resolve(folderPath) === projectionRoot) continue;
    await fsp.rm(folderPath, { recursive: true, force: true });
    await pruneEmptyAncestors(path.dirname(folderPath));
  }
}

export async function rebuildMediaLibrarySessionProjection(sessionId: string): Promise<MediaLibrarySessionView> {
  const session = findTrackSessionById(sessionId);
  if (!session) {
    throw new MediaLibraryProjectionError("Session not found", "NOT_FOUND");
  }
  const track = findTrackById(session.trackId);
  if (!track) {
    throw new MediaLibraryProjectionError("Track not found for session", "NOT_FOUND");
  }
  const trackLayout = findTrackLayoutById(session.trackLayoutId);
  if (!trackLayout) {
    throw new MediaLibraryProjectionError("Track layout not found for session", "NOT_FOUND");
  }
  const user = findUserById(session.userId);
  if (!user) {
    throw new MediaLibraryProjectionError("User not found for session", "NOT_FOUND");
  }

  const { folderName, recordingBaseName, isoDate } = buildProjectionPaths({
    username: user.username,
    trackName: track.name,
    trackLayoutName: trackLayout.name,
    format: session.format,
    sessionDate: session.date,
  });
  const folderPath = path.join(projectionRoot, folderName);
  const recordings = findTrackRecordingsBySessionId(sessionId);
  const recordingIds = new Set(recordings.map((rec) => rec.id));

  await fsp.mkdir(projectionRoot, { recursive: true });
  await removeProjectionFolders(recordingIds);
  await fsp.rm(folderPath, { recursive: true, force: true });

  const readyRecordings = recordings.filter((rec) => rec.status === "ready");
  if (!readyRecordings.length) {
    return { folderName, recordings: [] };
  }

  await fsp.mkdir(folderPath, { recursive: true });
  const views: MediaLibraryRecordingView[] = [];
  const usedFileNames = new Set<string>();

  for (const recording of readyRecordings) {
    const rawPath = resolveRawPath(recording.mediaId);
    const rawStats = await fsp.stat(rawPath).catch(() => null);
    if (!rawStats || !rawStats.isFile()) {
      throw new MediaLibraryProjectionError(`Recording file missing for ${recording.id}`, "NOT_FOUND");
    }

    const suffix =
      readyRecordings.length > 1
        ? sanitizeName(recording.description ?? recording.id, recording.id)
        : undefined;
    const videoFileName = projectionFileName({
      recording,
      rawPath,
      baseName: recordingBaseName,
      suffix,
      existingNames: usedFileNames,
    });
    const mediaLibraryPath = path.join(folderPath, videoFileName);
    const nfoBaseName = path.parse(videoFileName).name;
    const nfoPath = path.join(folderPath, `${nfoBaseName}.nfo`);

    await fsp.link(rawPath, mediaLibraryPath);
    const nfoContents = buildNfo({
      trackName: track.name,
      sessionDate: session.date,
      classification: session.classification,
      sessionId: session.id,
      recordingId: recording.id,
      format: session.format,
      isoDate,
    });
    await fsp.writeFile(nfoPath, nfoContents, "utf8");

    views.push({ recordingId: recording.id, rawPath, mediaLibraryPath, nfoPath });
  }

  return { folderName, recordings: views };
}

export async function rebuildMediaLibraryProjectionAll(): Promise<{ rebuiltSessions: number }> {
  await fsp.mkdir(projectionRoot, { recursive: true });
  const entries = await fsp.readdir(projectionRoot, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    await fsp.rm(path.join(projectionRoot, entry.name), { recursive: true, force: true });
  }

  const sessionIds = findSessionIdsWithReadyRecordings();
  let rebuilt = 0;

  for (const sessionId of sessionIds) {
    try {
      await rebuildMediaLibrarySessionProjection(sessionId);
      rebuilt++;
    } catch (err) {
      console.warn("Failed to rebuild Media Library projection for session", sessionId, err);
    }
  }

  return { rebuiltSessions: rebuilt };
}

export async function removeMediaLibraryRecordingProjection(recordingId: string): Promise<void> {
  const recording = findTrackRecordingById(recordingId);
  const suffixToken = recording
    ? sanitizeName(recording.description ?? recording.id, recording.id)
    : sanitizeName(recordingId, recordingId);
  let rawStats: Stats | null = null;
  if (recording) {
    try {
      const rawPath = resolveRawPath(recording.mediaId);
      rawStats = await fsp.stat(rawPath).catch(() => null);
    } catch {
      rawStats = null;
    }
  }

  const folders = await findRecordingProjectionFolders(new Set([recordingId]));
  for (const folderPath of folders) {
    const files = await fsp.readdir(folderPath).catch(() => []);
    if (!files.length) continue;

    const targetBaseNames = new Set<string>();
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const parsed = path.parse(file);
      const baseName = parsed.name;
      const ext = parsed.ext.toLowerCase();

      if (baseName === recordingId || baseName.endsWith(suffixToken) || baseName.endsWith(recordingId)) {
        targetBaseNames.add(baseName);
        continue;
      }

      if (ext === ".nfo") {
        const contents = await fsp.readFile(filePath, "utf8").catch(() => null);
        if (contents?.includes(`Recording ID: ${recordingId}`)) {
          targetBaseNames.add(baseName);
          continue;
        }
      }

      if (rawStats) {
        const stats = await fsp.stat(filePath).catch(() => null);
        if (stats && stats.isFile() && stats.dev === rawStats.dev && stats.ino === rawStats.ino) {
          targetBaseNames.add(baseName);
        }
      }
    }

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const baseName = path.parse(file).name;
      if (targetBaseNames.has(baseName)) {
        await fsp.rm(filePath, { force: true });
      }
    }

    const remaining = await fsp.readdir(folderPath).catch(() => []);
    const remainingNfos = remaining.filter((file) => path.extname(file).toLowerCase() === ".nfo");
    if (remaining.length === 0 || remainingNfos.length === 0) {
      await fsp.rm(folderPath, { recursive: true, force: true });
      await pruneEmptyAncestors(path.dirname(folderPath));
    }
  }
}

export async function removeMediaLibraryProjectionsForRecordings(
  recordingIds: Iterable<string>
): Promise<void> {
  const ids = new Set(recordingIds);
  if (!ids.size) return;
  await removeProjectionFolders(ids);
}
