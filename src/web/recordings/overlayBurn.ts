import ffmpeg from "fluent-ffmpeg";
import fsp from "node:fs/promises";
import path from "node:path";
import type { LapRecord } from "../../db/laps.js";
import { findLapsBySessionId } from "../../db/laps.js";
import {
  findTrackRecordingById,
  updateTrackRecording,
  createTrackRecording,
  type TrackRecordingRecord,
} from "../../db/track_recordings.js";
import { findTrackSessionById } from "../../db/track_sessions.js";
import type { OverlayStyle } from "../../ffmpeg/overlay.js";
import { buildDrawtextFilterGraph } from "../../ffmpeg/overlay.js";
import type { Lap } from "../../ffmpeg/lapTypes.js";
import { probeVideoInfo, type VideoInfo } from "../../ffmpeg/videoInfo.js";
import { sessionRecordingsDir, tmpRendersDir } from "../config.js";
import { buildOverlayLaps, buildOverlayStyle } from "./overlayPreview.js";
import { buildChapterMarkers, buildChapterMetadataFile } from "./chapterMetadata.js";
import { rebuildMediaLibrarySessionProjection } from "./mediaLibraryProjection.js";

type BurnQuality = "best" | "good" | "ultrafast";
type BurnCodec = "h264" | "h265";

export class OverlayBurnError extends Error {
  constructor(
    message: string,
    public code:
      | "NOT_FOUND"
      | "UNAUTHENTICATED"
      | "VALIDATION_FAILED"
      | "INTERNAL_SERVER_ERROR" = "VALIDATION_FAILED"
  ) {
    super(message);
    this.name = "OverlayBurnError";
  }
}

function assertRecording(recordingId: string, currentUserId: string): TrackRecordingRecord {
  const recording = findTrackRecordingById(recordingId);
  if (!recording) {
    throw new OverlayBurnError("Recording not found", "NOT_FOUND");
  }
  if (recording.userId !== currentUserId) {
    throw new OverlayBurnError("You do not have access to this recording", "UNAUTHENTICATED");
  }
  if (recording.status !== "ready") {
    throw new OverlayBurnError("Recording must be ready before burning the overlay", "VALIDATION_FAILED");
  }
  if (recording.overlayBurned) {
    throw new OverlayBurnError("Overlay has already been burned into this recording", "VALIDATION_FAILED");
  }
  if (!Number.isFinite(recording.lapOneOffset) || recording.lapOneOffset < 0) {
    throw new OverlayBurnError("Lap 1 offset must be set to zero or greater", "VALIDATION_FAILED");
  }
  return recording;
}

function loadSessionLaps(recording: TrackRecordingRecord): LapRecord[] {
  const session = findTrackSessionById(recording.sessionId);
  if (!session) {
    throw new OverlayBurnError("Session not found for recording", "NOT_FOUND");
  }
  if (session.userId !== recording.userId) {
    throw new OverlayBurnError("Session does not belong to the recording owner", "UNAUTHENTICATED");
  }
  const laps = findLapsBySessionId(session.id);
  if (!laps.length) {
    throw new OverlayBurnError("Add lap times before rendering overlays", "VALIDATION_FAILED");
  }
  return laps;
}

function buildOverlayFileInfo(recording: TrackRecordingRecord) {
  const parsed = path.parse(recording.mediaId);
  const overlayFileName = `${parsed.name}-overlay${parsed.ext || ".mp4"}`;
  const overlayMediaId = path.posix.join(parsed.dir, overlayFileName);
  return { overlayFileName, overlayMediaId };
}

function qualityOptions(quality: BurnQuality): { preset: string; crf: number } {
  if (quality === "best") {
    return { preset: "slow", crf: 18 };
  }
  if (quality === "ultrafast") {
    return { preset: "ultrafast", crf: 28 };
  }
  return { preset: "medium", crf: 23 };
}

function toLapPayload(laps: LapRecord[]): Lap[] {
  return buildOverlayLaps(laps).map(({ lapId: _lapId, ...lap }) => lap);
}

async function writeChapterMetadataFile({
  filePath,
  laps,
  lapOneOffsetS,
  videoDurationMs,
}: {
  filePath: string;
  laps: Lap[];
  lapOneOffsetS: number;
  videoDurationMs?: number;
}): Promise<void> {
  const chapters = buildChapterMarkers({ laps, lapOneOffsetS, videoDurationMs });
  const metadata = buildChapterMetadataFile(chapters);
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, metadata, "utf8");
}

async function runOverlayRender({
  inputVideo,
  outputFile,
  laps,
  startOffsetS,
  style,
  quality,
  codec,
  video,
  chapterMetadataFile,
  onProgress,
}: {
  inputVideo: string;
  outputFile: string;
  laps: Lap[];
  startOffsetS: number;
  style: OverlayStyle;
  quality: BurnQuality;
  codec: BurnCodec;
  video: VideoInfo;
  chapterMetadataFile?: string | null;
  onProgress?: (percent: number) => void;
}) {
  const { filterGraph, outputLabel } = buildDrawtextFilterGraph({
    inputVideo,
    outputFile,
    video,
    laps,
    startOffsetS,
    style,
  });

  await fsp.mkdir(path.dirname(outputFile), { recursive: true });
  await fsp.rm(outputFile, { force: true });

  const { preset, crf } = qualityOptions(quality);
  const videoCodec = codec === "h264" ? "libx264" : "libx265";

  return new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg().input(inputVideo);
    const metadataInputIndex = chapterMetadataFile ? 1 : null;
    if (chapterMetadataFile) {
      cmd.input(chapterMetadataFile);
    }

    const outputOptions = [
      "-map",
      `[${outputLabel}]`,
      "-map",
      "0:a?",
      "-c:v",
      videoCodec,
      "-preset",
      preset,
      "-crf",
      String(crf),
      "-c:a",
      "copy",
      "-movflags",
      "+faststart",
    ];

    if (metadataInputIndex != null) {
      outputOptions.push("-map_metadata", String(metadataInputIndex), "-map_chapters", String(metadataInputIndex));
    }

    cmd
      .complexFilter(filterGraph)
      .outputOptions(outputOptions)
      .on("progress", (progress) => {
        if (onProgress && typeof progress.percent === "number") {
          onProgress(progress.percent);
        }
      })
      .on("error", (err) => reject(err))
      .on("end", () => resolve());

    cmd.save(outputFile);
  });
}

async function safeMove(src: string, dest: string): Promise<void> {
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  await fsp.rm(dest, { force: true });

  try {
    await fsp.rename(src, dest);
    return;
  } catch (err: any) {
    if (err?.code !== "EXDEV") {
      throw err;
    }
  }

  await fsp.copyFile(src, dest);
  const destHandle = await fsp.open(dest, "r");
  try {
    await destHandle.sync();
  } finally {
    await destHandle.close();
  }
  await fsp.unlink(src);
}

async function moveRenderedOverlay(tempOutputFile: string, finalOutputFile: string): Promise<void> {
  await safeMove(tempOutputFile, finalOutputFile);
  await fsp.rm(path.dirname(tempOutputFile), { recursive: true, force: true }).catch(() => {});
}

export async function burnRecordingOverlay(options: {
  recordingId: string;
  currentUserId: string;
  quality: BurnQuality;
  codec?: BurnCodec;
  styleOverrides?: Partial<OverlayStyle>;
  embedChapters?: boolean | null;
}): Promise<TrackRecordingRecord> {
  const { recordingId, currentUserId, quality, styleOverrides, codec } = options;
  const recording = assertRecording(recordingId, currentUserId);
  const laps = loadSessionLaps(recording);
  const embedChapters = options.embedChapters ?? true;

  const inputVideo = path.join(sessionRecordingsDir, recording.mediaId);
  const style = buildOverlayStyle(styleOverrides);
  let overlayLaps: Lap[];
  try {
    overlayLaps = toLapPayload(laps);
  } catch (err) {
    throw new OverlayBurnError(
      err instanceof Error ? err.message : "Invalid lap data for overlay",
      "VALIDATION_FAILED"
    );
  }
  const startOffsetS = recording.lapOneOffset;

  const { overlayFileName, overlayMediaId } = buildOverlayFileInfo(recording);
  const overlayRecording = createTrackRecording({
    sessionId: recording.sessionId,
    userId: recording.userId,
    mediaId: overlayMediaId,
    overlayBurned: false,
    isPrimary: false,
    lapOneOffset: recording.lapOneOffset,
    description: recording.description ? `${recording.description} (Overlay)` : "Recording with overlay",
    status: "combining",
  });
  updateTrackRecording(overlayRecording.id, { sizeBytes: recording.sizeBytes ?? 0 });

  const renderDir = path.join(tmpRendersDir, "overlay-burns", overlayRecording.id);
  const tempOutputFile = path.join(renderDir, overlayFileName);
  const finalOutputFile = path.join(sessionRecordingsDir, overlayMediaId);
  const chapterMetadataFile = path.join(renderDir, "chapters.ffmetadata");

  try {
    updateTrackRecording(overlayRecording.id, { status: "combining", combineProgress: 0, error: null });
    const video = await probeVideoInfo(inputVideo);

    if (embedChapters) {
      await writeChapterMetadataFile({
        filePath: chapterMetadataFile,
        laps: overlayLaps,
        lapOneOffsetS: startOffsetS,
        videoDurationMs: video.duration * 1000,
      });
    }

    await runOverlayRender({
      inputVideo,
      outputFile: tempOutputFile,
      laps: overlayLaps,
      startOffsetS,
      style,
      quality,
      codec: codec ?? "h265",
      video,
      chapterMetadataFile: embedChapters ? chapterMetadataFile : null,
      onProgress: (percent) => {
        updateTrackRecording(overlayRecording.id, { combineProgress: Math.max(0, Math.min(1, percent / 100)) });
      },
    });
    await moveRenderedOverlay(tempOutputFile, finalOutputFile);
  } catch (err) {
    await fsp.rm(tempOutputFile, { force: true }).catch(() => {});
    await fsp.rm(chapterMetadataFile, { force: true }).catch(() => {});
    const message = err instanceof Error ? err.message : "Overlay burn failed";
    updateTrackRecording(overlayRecording.id, { status: "failed", combineProgress: 0, error: message });
    throw new OverlayBurnError(message, "INTERNAL_SERVER_ERROR");
  }

  const videoMeta = await probeVideoInfo(finalOutputFile).catch(() => null);
  const sizeBytes = (await fsp.stat(finalOutputFile).catch(() => null))?.size ?? null;

  const updated =
    updateTrackRecording(overlayRecording.id, {
      mediaId: overlayMediaId,
      overlayBurned: true,
      sizeBytes,
      durationMs: videoMeta ? videoMeta.duration * 1000 : recording.durationMs,
      fps: videoMeta?.fps ?? recording.fps,
      status: "ready",
      combineProgress: 1,
      error: null,
    }) ?? recording;
  await rebuildMediaLibrarySessionProjection(recording.sessionId).catch((err) => {
    console.warn("Failed to rebuild Media Library projection after overlay burn", err);
  });
  return updated;
}
