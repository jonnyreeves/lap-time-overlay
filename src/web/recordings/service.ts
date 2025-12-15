import ffmpeg from "fluent-ffmpeg";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import fs from "node:fs";
import fsp from "node:fs/promises";
import type http from "node:http";
import path from "node:path";
import {
  createTrackRecordingSource,
  findTrackRecordingSourceById,
  findTrackRecordingSourcesByRecordingId,
  updateTrackRecordingSource,
  type TrackRecordingSourceRecord,
} from "../../db/track_recording_sources.js";
import {
  createTrackRecording,
  deleteTrackRecording,
  findTrackRecordingById,
  findTrackRecordingsBySessionId,
  updateTrackRecording,
  type TrackRecordingRecord,
} from "../../db/track_recordings.js";
import { findTrackSessionById } from "../../db/track_sessions.js";
import {
  sessionRecordingsDir,
  tmpUploadsDir,
} from "../config.js";

export interface RecordingSourcePlan {
  fileName: string;
  sizeBytes?: number | null;
}

export interface UploadTarget {
  source: TrackRecordingSourceRecord;
  uploadUrl: string;
}

export class RecordingUploadError extends Error {
  constructor(message: string, public readonly statusCode: number = 400) {
    super(message);
    this.name = "RecordingUploadError";
  }
}

const UPLOAD_FLUSH_BYTES = 512 * 1024;
const combiningRecordings = new Map<string, Promise<void>>();

function toPlannedMediaId(recordingId: string, sessionId: string, firstFileName: string): string {
  const ext = path.extname(firstFileName || "") || ".mp4";
  return path.posix.join(sessionId, `${recordingId}${ext}`);
}

function stagingDirForRecording(sessionId: string, recordingId: string): string {
  return path.join(tmpUploadsDir, sessionId, recordingId);
}

async function writeUploadToDisk(
  req: http.IncomingMessage,
  destination: string,
  onChunk: (uploaded: number) => void
): Promise<number> {
  await fsp.mkdir(path.dirname(destination), { recursive: true });
  await fsp.rm(destination, { force: true });

  const stream = fs.createWriteStream(destination);
  let uploaded = 0;

  try {
    for await (const chunk of req) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      uploaded += buf.length;
      if (!stream.write(buf)) {
        await once(stream, "drain");
      }
      onChunk(uploaded);
    }
    stream.end();
    await once(stream, "close");
    return uploaded;
  } catch (err) {
    stream.destroy();
    await fsp.rm(destination, { force: true });
    throw err;
  }
}

async function collectMetadata(outputPath: string): Promise<{
  sizeBytes: number;
  durationMs: number | null;
  fps: number | null;
}> {
  const stats = await fsp.stat(outputPath);
  const probe = await new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
    ffmpeg.ffprobe(outputPath, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  }).catch(() => null);

  const durationSeconds =
    probe?.format?.duration && Number.isFinite(probe.format.duration)
      ? (probe.format.duration as number)
      : null;

  const videoStream = probe?.streams?.find((stream) => stream.codec_type === "video");
  const fpsRaw =
    videoStream?.avg_frame_rate && videoStream.avg_frame_rate.includes("/")
      ? videoStream.avg_frame_rate
      : videoStream?.r_frame_rate;
  let fps: number | null = null;
  if (fpsRaw) {
    const [num, den] = fpsRaw.split("/").map(Number);
    if (num && den) {
      fps = num / den;
    }
  }

  return {
    sizeBytes: stats.size,
    durationMs: durationSeconds ? durationSeconds * 1000 : null,
    fps,
  };
}

async function combineRecording(recordingId: string): Promise<void> {
  if (combiningRecordings.has(recordingId)) {
    return combiningRecordings.get(recordingId) ?? Promise.resolve();
  }

  const promise = (async () => {
    const recording = findTrackRecordingById(recordingId);
    if (!recording) return;

    const sources = findTrackRecordingSourcesByRecordingId(recordingId);
    if (!sources.length || sources.some((src) => src.status !== "uploaded")) {
      return;
    }

    updateTrackRecording(recordingId, { status: "combining", error: null, combineProgress: 0 });

    const concatFile = path.join(stagingDirForRecording(recording.sessionId, recording.id), "concat.txt");
    const concatContents = sources
      .map((src) => `file '${src.storagePath.replace(/'/g, "'\\\\''")}'`)
      .join("\n");
    await fsp.writeFile(concatFile, concatContents, "utf8");

    const outputPath = path.join(sessionRecordingsDir, recording.mediaId);
    await fsp.mkdir(path.dirname(outputPath), { recursive: true });
    await fsp.rm(outputPath, { force: true });

    try {
      await new Promise<void>((resolve, reject) => {
        const command = ffmpeg()
          .input(concatFile)
          .inputOptions(["-safe 0", "-f concat"])
          .outputOptions(["-c copy"])
          .on("progress", (progress) => {
            if (typeof progress.percent === "number") {
              updateTrackRecording(recordingId, { combineProgress: Math.min(1, progress.percent / 100) });
            }
          })
          .on("error", (err) => reject(err))
          .on("end", () => resolve());

        command.save(outputPath);
      });

      const metadata = await collectMetadata(outputPath);
      updateTrackRecording(recordingId, {
        status: "ready",
        error: null,
        sizeBytes: metadata.sizeBytes,
        durationMs: metadata.durationMs,
        fps: metadata.fps,
        combineProgress: 1,
      });
    } catch (err) {
      updateTrackRecording(recordingId, {
        status: "failed",
        error: err instanceof Error ? err.message : "Combine failed",
        combineProgress: 0,
      });
      await fsp.rm(outputPath, { force: true });
    } finally {
      await fsp.rm(stagingDirForRecording(recording.sessionId, recording.id), {
        recursive: true,
        force: true,
      });
      await fsp.rm(concatFile, { force: true });
    }
  })();

  combiningRecordings.set(recordingId, promise);
  await promise;
  combiningRecordings.delete(recordingId);
}

export async function startRecordingUploadSession({
  sessionId,
  userId,
  description,
  lapOneOffset = 0,
  sources,
}: {
  sessionId: string;
  userId: string;
  description?: string | null;
  lapOneOffset?: number;
  sources: RecordingSourcePlan[];
}): Promise<{ recording: TrackRecordingRecord; uploadTargets: UploadTarget[] }> {
  const session = findTrackSessionById(sessionId);
  if (!session) {
    throw new RecordingUploadError("Track session not found", 404);
  }
  if (session.userId !== userId) {
    throw new RecordingUploadError("You do not have access to this session", 403);
  }
  if (!sources.length) {
    throw new RecordingUploadError("At least one source file is required", 400);
  }

  const existingRecordings = findTrackRecordingsBySessionId(sessionId);
  const shouldBePrimary = existingRecordings.length === 0 || !existingRecordings.some((rec) => rec.isPrimary);
  const recordingId = randomUUID();
  const plannedMediaId = toPlannedMediaId(recordingId, sessionId, sources[0]?.fileName ?? "");
  const recording = createTrackRecording({
    id: recordingId,
    sessionId,
    userId,
    mediaId: plannedMediaId,
    isPrimary: shouldBePrimary,
    lapOneOffset: lapOneOffset ?? 0,
    description: description ?? null,
    status: "pending_upload",
    now: Date.now(),
  });

  const stagingDir = stagingDirForRecording(sessionId, recording.id);
  await fsp.mkdir(stagingDir, { recursive: true });

  const uploadTargets: UploadTarget[] = sources.map((source, idx) => {
    const safeName = path.basename(source.fileName || `source-${idx + 1}`);
    const stagingPath = path.join(
      stagingDir,
      `${String(idx + 1).padStart(2, "0")}-${safeName}`
    );
    const record = createTrackRecordingSource({
      recordingId: recording.id,
      fileName: safeName,
      ordinal: idx + 1,
      sizeBytes: source.sizeBytes ?? null,
      storagePath: stagingPath,
    });
    const uploadUrl = `/uploads/recordings/${record.id}?token=${encodeURIComponent(record.uploadToken)}`;
    return { source: record, uploadUrl };
  });

  return { recording, uploadTargets };
}

export async function handleSourceUpload({
  sourceId,
  token,
  currentUserId,
  req,
}: {
  sourceId: string;
  token: string | null;
  currentUserId: string | null;
  req: http.IncomingMessage;
}): Promise<{ recording: TrackRecordingRecord; source: TrackRecordingSourceRecord }> {
  if (!currentUserId) {
    throw new RecordingUploadError("Authentication required", 401);
  }
  const source = findTrackRecordingSourceById(sourceId);
  if (!source) {
    throw new RecordingUploadError("Upload target not found", 404);
  }
  const recording = findTrackRecordingById(source.recordingId);
  if (!recording) {
    throw new RecordingUploadError("Recording not found", 404);
  }
  if (recording.userId !== currentUserId) {
    throw new RecordingUploadError("You do not have access to this recording", 403);
  }
  if (!token || token !== source.uploadToken) {
    throw new RecordingUploadError("Upload token is invalid", 401);
  }
  if (recording.status === "ready" || recording.status === "combining") {
    throw new RecordingUploadError("Recording cannot accept uploads right now", 400);
  }

  updateTrackRecording(recording.id, {
    status: "uploading",
    error: null,
    combineProgress: 0,
  });
  updateTrackRecordingSource(source.id, { status: "uploading", uploadedBytes: 0 });

  let uploadedBytes = 0;
  let lastPersist = 0;
  try {
    uploadedBytes = await writeUploadToDisk(req, source.storagePath, (total) => {
      uploadedBytes = total;
      if (uploadedBytes - lastPersist >= UPLOAD_FLUSH_BYTES) {
        updateTrackRecordingSource(source.id, { uploadedBytes });
        lastPersist = uploadedBytes;
      }
    });
  } catch (err) {
    updateTrackRecordingSource(source.id, { status: "failed", uploadedBytes });
    updateTrackRecording(recording.id, {
      status: "failed",
      error: "Upload failed",
    });
    throw err;
  }

  const updatedSource =
    updateTrackRecordingSource(source.id, { status: "uploaded", uploadedBytes }) ?? source;
  const allSources = findTrackRecordingSourcesByRecordingId(recording.id);
  const pending = allSources.some((src) => src.status !== "uploaded");
  if (!pending) {
    await combineRecording(recording.id);
  }

  const updatedRecording = findTrackRecordingById(recording.id) ?? recording;
  return { recording: updatedRecording, source: updatedSource };
}

export async function deleteRecordingAndFiles(recordingId: string, userId: string): Promise<boolean> {
  const recording = findTrackRecordingById(recordingId);
  if (!recording) return false;
  if (recording.userId !== userId) {
    throw new RecordingUploadError("You do not have access to this recording", 403);
  }

  const outputPath = path.join(sessionRecordingsDir, recording.mediaId);
  await fsp.rm(outputPath, { force: true });
  await fsp.rm(stagingDirForRecording(recording.sessionId, recording.id), {
    recursive: true,
    force: true,
  });
  return deleteTrackRecording(recordingId);
}
