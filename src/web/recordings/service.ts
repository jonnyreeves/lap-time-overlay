import ffmpeg from "fluent-ffmpeg";
import { randomUUID } from "node:crypto";
import fsp from "node:fs/promises";
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
import {
  rebuildMediaLibrarySessionProjection,
  removeMediaLibraryRecordingProjection,
} from "./mediaLibraryProjection.js";
import { getRenderJob, startRenderJob } from "./renderJobs.js";

export interface RecordingSourcePlan {
  fileName: string;
  sizeBytes?: number | null;
  trimStartMs?: number | null;
  trimEndMs?: number | null;
}

export interface UploadTarget {
  source: TrackRecordingSourceRecord;
}

export class RecordingUploadError extends Error {
  constructor(message: string, public readonly statusCode: number = 400) {
    super(message);
    this.name = "RecordingUploadError";
  }
}

const DEBUG_UPLOAD_PROGRESS = process.env.DEBUG_UPLOAD_PROGRESS === "1";

function tokenSuffix(token: string | null | undefined): string | null {
  if (!token) return null;
  return token.slice(-6);
}


export function validateRecordingUpload({
  sourceId,
  token,
  currentUserId,
}: {
  sourceId: string;
  token: string | null;
  currentUserId: string | null;
}): { recording: TrackRecordingRecord; source: TrackRecordingSourceRecord } {
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
  return { recording, source };
}

export function startSourceUpload({
  recordingId,
  sourceId,
  sizeBytes,
  uploadedBytes = 0,
}: {
  recordingId: string;
  sourceId: string;
  sizeBytes: number | null;
  uploadedBytes?: number;
}): void {
  updateTrackRecording(recordingId, {
    status: "uploading",
    error: null,
    combineProgress: 0,
  });
  updateTrackRecordingSource(sourceId, {
    status: "uploading",
    uploadedBytes,
    sizeBytes,
  });
}

function toPlannedMediaId(recordingId: string, sessionId: string, firstFileName: string): string {
  const ext = path.extname(firstFileName || "") || ".mp4";
  return path.posix.join(sessionId, `${recordingId}${ext}`);
}

function stagingDirForRecording(sessionId: string, recordingId: string): string {
  return path.join(tmpUploadsDir, sessionId, recordingId);
}

export async function finalizeSourceUpload({
  recording,
  source,
  uploadedBytes,
}: {
  recording: TrackRecordingRecord;
  source: TrackRecordingSourceRecord;
  uploadedBytes: number;
}): Promise<{ recording: TrackRecordingRecord; source: TrackRecordingSourceRecord }> {
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

async function prepareSourceForConcat(
  source: TrackRecordingSourceRecord,
  {
    isFirst,
    isLast,
    stagingDir,
  }: {
    isFirst: boolean;
    isLast: boolean;
    stagingDir: string;
  }
): Promise<{ storagePath: string }> {
  const shouldTrimStart = isFirst && source.trimStartMs != null && source.trimStartMs > 0;
  const shouldTrimEnd = isLast && source.trimEndMs != null;

  if (!shouldTrimStart && !shouldTrimEnd) {
    return { storagePath: source.storagePath };
  }

  const metadata = await collectMetadata(source.storagePath);
  const durationMs = metadata.durationMs;
  const startMs = shouldTrimStart ? Math.max(0, Math.floor(source.trimStartMs ?? 0)) : 0;
  const endMsRaw = shouldTrimEnd ? Math.max(0, Math.floor(source.trimEndMs ?? 0)) : null;
  const endMs = endMsRaw == null ? null : endMsRaw;

  if (endMs != null && endMs <= startMs) {
    throw new RecordingUploadError(`End offset must be after start for ${source.fileName}`);
  }
  if (durationMs != null) {
    if (startMs >= durationMs) {
      throw new RecordingUploadError(`Start offset exceeds duration for ${source.fileName}`);
    }
    if (endMs != null && endMs > durationMs) {
      throw new RecordingUploadError(`End offset exceeds duration for ${source.fileName}`);
    }
  }

  const trimDurationSeconds = endMs != null ? (endMs - startMs) / 1000 : undefined;
  const outputPath = path.join(
    stagingDir,
    `trimmed-${String(source.ordinal).padStart(2, "0")}-${source.fileName}`
  );

  await fsp.rm(outputPath, { force: true });

  await new Promise<void>((resolve, reject) => {
    const command = ffmpeg()
      .input(source.storagePath)
      .seekInput(startMs / 1000)
      .outputOptions(["-c copy", "-avoid_negative_ts make_zero"])
      .on("error", (err) => reject(err))
      .on("end", () => resolve());

    if (trimDurationSeconds != null) {
      command.duration(trimDurationSeconds);
    }

    command.save(outputPath);
  });

  const trimmedMetadata = await collectMetadata(outputPath);
  updateTrackRecordingSource(source.id, {
    storagePath: outputPath,
    sizeBytes: trimmedMetadata.sizeBytes,
  });

  await fsp.rm(source.storagePath, { force: true });

  return { storagePath: outputPath };
}

async function combineRecording(recordingId: string): Promise<void> {
  const existingJob = getRenderJob(recordingId);
  if (existingJob) {
    return existingJob.promise;
  }

  const recording = findTrackRecordingById(recordingId);
  if (!recording) return;

  const sources = findTrackRecordingSourcesByRecordingId(recordingId);
  if (!sources.length || sources.some((src) => src.status !== "uploaded")) {
    return;
  }

  updateTrackRecording(recordingId, { status: "combining", error: null, combineProgress: 0 });

  const stagingDir = stagingDirForRecording(recording.sessionId, recording.id);
  const outputPath = path.join(sessionRecordingsDir, recording.mediaId);
  const concatFile = path.join(stagingDir, "concat.txt");

  let ffmpegCommand: ReturnType<typeof ffmpeg> | null = null;
  const promise = (async () => {
    try {
      const processedSources = await Promise.all(
        sources.map((src, idx) =>
          prepareSourceForConcat(src, {
            isFirst: idx === 0,
            isLast: idx === sources.length - 1,
            stagingDir,
          })
        )
      );

      const concatContents = processedSources
        .map((src) => `file '${src.storagePath.replace(/'/g, "'\\\\''")}'`)
        .join("\n");
      await fsp.writeFile(concatFile, concatContents, "utf8");

      await fsp.mkdir(path.dirname(outputPath), { recursive: true });
      await fsp.rm(outputPath, { force: true });

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

        ffmpegCommand = command;
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
      await rebuildMediaLibrarySessionProjection(recording.sessionId).catch((err) => {
        console.warn("Failed to rebuild Media Library projection after combine", err);
      });
    } catch (err) {
      const recordingAfterCancel = findTrackRecordingById(recordingId);
      if (recordingAfterCancel?.error !== "Canceled by admin") {
        updateTrackRecording(recordingId, {
          status: "failed",
          error: err instanceof Error ? err.message : "Combine failed",
          combineProgress: 0,
        });
      }
      await fsp.rm(outputPath, { force: true });
    } finally {
      await fsp.rm(stagingDir, {
        recursive: true,
        force: true,
      });
      await fsp.rm(concatFile, { force: true });
    }
  })();

  return startRenderJob({
    recordingId,
    userId: recording.userId,
    type: "combine",
    promise,
    cancel: () => {
      ffmpegCommand?.kill("SIGKILL");
    },
  });
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

  if (DEBUG_UPLOAD_PROGRESS) {
    console.info("Recording upload session initialized", {
      recordingId,
      sessionId,
      userId,
      sourceCount: sources.length,
      sources: sources.map((source, idx) => ({
        ordinal: idx + 1,
        fileName: source.fileName,
        sizeBytes: source.sizeBytes ?? null,
      })),
    });
  }

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
      trimStartMs: source.trimStartMs ?? null,
      trimEndMs: source.trimEndMs ?? null,
      storagePath: stagingPath,
    });
    if (DEBUG_UPLOAD_PROGRESS) {
      console.info("Recording upload source created", {
        recordingId: recording.id,
        sourceId: record.id,
        ordinal: record.ordinal,
        fileName: record.fileName,
        sizeBytes: record.sizeBytes ?? null,
        uploadTokenSuffix: tokenSuffix(record.uploadToken),
      });
    }
    return { source: record };
  });

  return { recording, uploadTargets };
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
  await removeMediaLibraryRecordingProjection(recordingId).catch((err) => {
    console.warn("Failed to remove Media Library projection for recording", err);
  });
  return deleteTrackRecording(recordingId);
}
