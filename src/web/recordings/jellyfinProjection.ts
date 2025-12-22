import fsp from "node:fs/promises";
import path from "node:path";
import { findTrackRecordingsBySessionId, type TrackRecordingRecord } from "../../db/track_recordings.js";
import { findTrackSessionById } from "../../db/track_sessions.js";
import { findTrackById } from "../../db/tracks.js";
import { jellyfinProjectionDir, rawMediaDir, sessionRecordingsDir } from "../config.js";

export interface JellyfinRecordingView {
  recordingId: string;
  rawPath: string;
  jellyfinPath: string;
  nfoPath: string;
}

export interface JellyfinSessionView {
  folderName: string;
  recordings: JellyfinRecordingView[];
}

type ProjectionErrorCode = "NOT_FOUND" | "VALIDATION_FAILED";

export class JellyfinProjectionError extends Error {
  constructor(message: string, public code: ProjectionErrorCode = "VALIDATION_FAILED") {
    super(message);
    this.name = "JellyfinProjectionError";
  }
}

const rawRoot = rawMediaDir || sessionRecordingsDir;

function sanitizeName(name: string): string {
  const cleaned = name.replace(/[\\/]/g, "-").trim();
  return cleaned || "Unknown Track";
}

function sessionFolderName(date: string, trackName: string): string {
  return `${date.trim()} - ${sanitizeName(trackName)}`;
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
}: {
  trackName: string;
  sessionDate: string;
  classification: number;
  sessionId: string;
  recordingId: string;
  format?: string;
}): string {
  const isoDate = formatIsoDate(sessionDate);
  const title = buildTitle(trackName, sessionDate, classification);
  const plot = buildPlot({ trackName, classification, sessionId, recordingId, format });

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<movie>
  <title>${escapeXml(title)}</title>
  <plot>
    ${escapeXml(plot)}
  </plot>
  <premiered>${escapeXml(isoDate)}</premiered>
  <dateadded>${escapeXml(isoDate)}</dateadded>
  <tag>RaceCraft</tag>
  <tag>${escapeXml(trackName)}</tag>
</movie>
`;
}

function projectionFileName(recording: TrackRecordingRecord, rawPath: string): string {
  const ext = path.extname(rawPath) || path.extname(recording.mediaId) || ".mp4";
  return `${recording.id}${ext || ".mp4"}`;
}

function resolveRawPath(mediaId: string): string {
  const base = path.resolve(rawRoot);
  const target = path.resolve(path.join(base, mediaId));
  if (!target.startsWith(base)) {
    throw new JellyfinProjectionError("Recording media path is invalid");
  }
  return target;
}

async function removeProjectionFolders(recordingIds: Set<string>): Promise<void> {
  if (!recordingIds.size) return;

  const entries = await fsp.readdir(jellyfinProjectionDir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const folderPath = path.join(jellyfinProjectionDir, entry.name);
    const files = await fsp.readdir(folderPath).catch(() => []);
    const hasRecording = files.some((file) => recordingIds.has(path.parse(file).name));
    if (hasRecording) {
      await fsp.rm(folderPath, { recursive: true, force: true });
    }
  }
}

export async function rebuildJellyfinSessionProjection(sessionId: string): Promise<JellyfinSessionView> {
  const session = findTrackSessionById(sessionId);
  if (!session) {
    throw new JellyfinProjectionError("Session not found", "NOT_FOUND");
  }
  const track = findTrackById(session.trackId);
  if (!track) {
    throw new JellyfinProjectionError("Track not found for session", "NOT_FOUND");
  }

  const folderName = sessionFolderName(session.date, track.name);
  const folderPath = path.join(jellyfinProjectionDir, folderName);
  const recordings = findTrackRecordingsBySessionId(sessionId);
  const recordingIds = new Set(recordings.map((rec) => rec.id));

  await fsp.mkdir(jellyfinProjectionDir, { recursive: true });
  await removeProjectionFolders(recordingIds);
  await fsp.rm(folderPath, { recursive: true, force: true });

  const readyRecordings = recordings.filter((rec) => rec.status === "ready");
  if (!readyRecordings.length) {
    return { folderName, recordings: [] };
  }

  await fsp.mkdir(folderPath, { recursive: true });
  const views: JellyfinRecordingView[] = [];

  for (const recording of readyRecordings) {
    const rawPath = resolveRawPath(recording.mediaId);
    const rawStats = await fsp.stat(rawPath).catch(() => null);
    if (!rawStats || !rawStats.isFile()) {
      throw new JellyfinProjectionError(`Recording file missing for ${recording.id}`, "NOT_FOUND");
    }

    const jellyfinPath = path.join(folderPath, projectionFileName(recording, rawPath));
    const nfoPath = path.join(folderPath, `${recording.id}.nfo`);

    await fsp.link(rawPath, jellyfinPath);
    const nfoContents = buildNfo({
      trackName: track.name,
      sessionDate: session.date,
      classification: session.classification,
      sessionId: session.id,
      recordingId: recording.id,
      format: session.format,
    });
    await fsp.writeFile(nfoPath, nfoContents, "utf8");

    views.push({ recordingId: recording.id, rawPath, jellyfinPath, nfoPath });
  }

  return { folderName, recordings: views };
}

export async function removeJellyfinRecordingProjection(recordingId: string): Promise<void> {
  const entries = await fsp.readdir(jellyfinProjectionDir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const folderPath = path.join(jellyfinProjectionDir, entry.name);
    const files = await fsp.readdir(folderPath).catch(() => []);
    const matches = files.filter((file) => path.parse(file).name === recordingId);
    if (!matches.length) continue;

    for (const file of matches) {
      await fsp.rm(path.join(folderPath, file), { force: true });
    }

    const remaining = await fsp.readdir(folderPath).catch(() => []);
    if (remaining.length === 0) {
      await fsp.rm(folderPath, { recursive: true, force: true });
    }
  }
}

export async function removeJellyfinProjectionsForRecordings(
  recordingIds: Iterable<string>
): Promise<void> {
  const ids = new Set(recordingIds);
  if (!ids.size) return;
  await removeProjectionFolders(ids);
}
