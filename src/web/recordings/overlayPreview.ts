import ffmpeg from "fluent-ffmpeg";
import { randomUUID } from "node:crypto";
import fsp from "node:fs/promises";
import path from "node:path";
import type { LapRecord } from "../../db/laps.js";
import { findLapsBySessionId } from "../../db/laps.js";
import {
  findTrackRecordingById,
  type TrackRecordingRecord,
} from "../../db/track_recordings.js";
import { findTrackSessionById } from "../../db/track_sessions.js";
import {
  buildDrawtextFilterGraph,
  DEFAULT_OVERLAY_STYLE,
  type OverlayStyle,
} from "../../ffmpeg/overlay.js";
import type { Lap } from "../../ffmpeg/lapTypes.js";
import { probeVideoInfo, type VideoInfo } from "../../ffmpeg/videoInfo.js";
import { sessionRecordingsDir, tmpPreviewsDir } from "../config.js";

export class OverlayPreviewError extends Error {
  constructor(
    message: string,
    public code:
      | "NOT_FOUND"
      | "UNAUTHENTICATED"
      | "VALIDATION_FAILED"
      | "INTERNAL_SERVER_ERROR" = "VALIDATION_FAILED"
  ) {
    super(message);
    this.name = "OverlayPreviewError";
  }
}

type OverlayLap = Lap & { lapId: string };

export type OverlayPreviewResult = {
  id: string;
  previewUrl: string;
  previewTimeSeconds: number;
  requestedOffsetSeconds: number;
  usedOffsetSeconds: number;
  lapId: string;
  lapNumber: number;
  recordingId: string;
  generatedAt: string;
};

const VALID_POSITIONS: OverlayStyle["overlayPosition"][] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

const MIN_TEXT_SIZE = 12;
const MAX_TEXT_SIZE = 192;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildOverlayStyle(overrides?: Partial<OverlayStyle>): OverlayStyle {
  const base = DEFAULT_OVERLAY_STYLE;
  const nextPosition = overrides?.overlayPosition;
  const overlayPosition = VALID_POSITIONS.includes(nextPosition as OverlayStyle["overlayPosition"])
    ? (nextPosition as OverlayStyle["overlayPosition"])
    : base.overlayPosition;

  const textSize = Number.isFinite(overrides?.textSize)
    ? clamp(Math.round(overrides?.textSize as number), MIN_TEXT_SIZE, MAX_TEXT_SIZE)
    : base.textSize;

  const detailTextSize = Number.isFinite(overrides?.detailTextSize)
    ? clamp(Math.round(overrides?.detailTextSize as number), MIN_TEXT_SIZE, MAX_TEXT_SIZE)
    : base.detailTextSize;

  const boxOpacity = Number.isFinite(overrides?.boxOpacity)
    ? clamp(overrides?.boxOpacity as number, 0, 1)
    : base.boxOpacity;

  return {
    ...base,
    ...overrides,
    overlayPosition,
    textSize,
    detailTextSize,
    boxOpacity,
    textColor: overrides?.textColor ?? base.textColor,
    boxColor: overrides?.boxColor ?? base.boxColor,
    showLapCounter: overrides?.showLapCounter ?? base.showLapCounter,
    showPosition: overrides?.showPosition ?? base.showPosition,
    showLapDeltas: overrides?.showLapDeltas ?? base.showLapDeltas,
  };
}

function assertRecordingOwnership(
  recordingId: string,
  currentUserId: string
): TrackRecordingRecord {
  const recording = findTrackRecordingById(recordingId);
  if (!recording) {
    throw new OverlayPreviewError("Recording not found", "NOT_FOUND");
  }
  if (recording.userId !== currentUserId) {
    throw new OverlayPreviewError("You do not have access to this recording", "UNAUTHENTICATED");
  }
  if (recording.status !== "ready") {
    throw new OverlayPreviewError("Recording is not ready for overlays", "VALIDATION_FAILED");
  }
  return recording;
}

function loadSession(recording: TrackRecordingRecord) {
  const session = findTrackSessionById(recording.sessionId);
  if (!session) {
    throw new OverlayPreviewError("Session not found for recording", "NOT_FOUND");
  }
  if (session.userId !== recording.userId) {
    throw new OverlayPreviewError("Session does not belong to the recording owner", "UNAUTHENTICATED");
  }
  return session;
}

function buildOverlayLaps(laps: LapRecord[]): OverlayLap[] {
  const sorted = [...laps].sort((a, b) => a.lapNumber - b.lapNumber);
  let elapsed = 0;
  return sorted.map((lap) => {
    const durationS = Number(lap.time);
    if (!Number.isFinite(durationS) || durationS <= 0) {
      throw new OverlayPreviewError(
        `Lap ${lap.lapNumber} is missing a valid time`,
        "VALIDATION_FAILED"
      );
    }
    const startS = elapsed;
    elapsed += durationS;
    return {
      lapId: lap.id,
      number: lap.lapNumber,
      durationS,
      position: 0,
      positionChanges: [],
      startS,
    };
  });
}

function resolvePreviewTiming(options: {
  laps: OverlayLap[];
  lapId: string;
  requestedOffset: number;
  lapOneOffset: number;
  video: VideoInfo;
}) {
  const { laps, lapId, requestedOffset, lapOneOffset, video } = options;
  const targetLap = laps.find((lap) => lap.lapId === lapId);
  if (!targetLap) {
    throw new OverlayPreviewError("Lap not found", "NOT_FOUND");
  }

  const lapDuration = targetLap.durationS;
  const rawOffset = Number.isFinite(requestedOffset) ? requestedOffset : 0;
  const nonNegativeOffset = Math.max(0, rawOffset);
  const maxOffset = Math.max(0, lapDuration - 0.05);
  const usedOffsetSeconds = Math.min(nonNegativeOffset, maxOffset);
  const previewTimeSeconds = lapOneOffset + targetLap.startS + usedOffsetSeconds;

  if (!Number.isFinite(lapOneOffset) || lapOneOffset < 0) {
    throw new OverlayPreviewError(
      "Lap 1 offset must be set to zero or greater before generating a preview",
      "VALIDATION_FAILED"
    );
  }
  if (!Number.isFinite(previewTimeSeconds) || previewTimeSeconds < 0) {
    throw new OverlayPreviewError(
      "Preview time could not be calculated from lap data",
      "VALIDATION_FAILED"
    );
  }
  if (previewTimeSeconds >= video.duration) {
    const message = [
      "Preview time exceeds the length of the recording.",
      "Adjust the Lap 1 offset or choose an earlier lap/offset.",
    ].join(" ");
    throw new OverlayPreviewError(message, "VALIDATION_FAILED");
  }

  return { targetLap, usedOffsetSeconds, previewTimeSeconds };
}

function buildPreviewFileName(lapNumber: number, offsetSeconds: number, updatedAt: number): string {
  const offsetMs = Math.round(Math.max(0, offsetSeconds) * 1000);
  const revision = Math.max(0, Math.floor(updatedAt));
  return `overlay-lap${lapNumber}-o${offsetMs}-v${revision}.png`;
}

export async function renderOverlayPreviewImage(options: {
  inputVideo: string;
  outputFile: string;
  filterGraph: string[];
  outputLabel: string;
  seekTo: number;
}): Promise<void> {
  const { inputVideo, outputFile, filterGraph, outputLabel, seekTo } = options;
  await fsp.rm(outputFile, { force: true });

  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(inputVideo)
      .seekInput(Math.max(0, seekTo))
      .complexFilter(filterGraph)
      .outputOptions(["-map", `[${outputLabel}]`, "-frames:v", "1"])
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outputFile);
  });
}

export async function generateOverlayPreview(options: {
  recordingId: string;
  lapId: string;
  offsetSeconds: number;
  currentUserId: string;
  styleOverrides?: Partial<OverlayStyle>;
}): Promise<OverlayPreviewResult> {
  const { recordingId, lapId, offsetSeconds, currentUserId, styleOverrides } = options;
  const recording = assertRecordingOwnership(recordingId, currentUserId);
  const session = loadSession(recording);

  const laps = findLapsBySessionId(session.id);
  if (!laps.length) {
    throw new OverlayPreviewError("Add lap times before rendering overlays", "VALIDATION_FAILED");
  }

  const videoPath = path.join(sessionRecordingsDir, recording.mediaId);
  let video: VideoInfo;
  try {
    video = await probeVideoInfo(videoPath);
  } catch (err) {
    throw new OverlayPreviewError("Recording file not found or unreadable", "NOT_FOUND");
  }

  const overlayLaps = buildOverlayLaps(laps);
  const { targetLap, usedOffsetSeconds, previewTimeSeconds } = resolvePreviewTiming({
    laps: overlayLaps,
    lapId,
    requestedOffset: offsetSeconds,
    lapOneOffset: recording.lapOneOffset,
    video,
  });

  const previewDir = path.join(tmpPreviewsDir, recording.id);
  await fsp.mkdir(previewDir, { recursive: true });
  const fileName = buildPreviewFileName(targetLap.number, usedOffsetSeconds, recording.updatedAt);
  const outputFile = path.join(previewDir, fileName);

  const startOffsetS = recording.lapOneOffset - previewTimeSeconds;
  const style = buildOverlayStyle(styleOverrides);
  const { filterGraph, outputLabel } = buildDrawtextFilterGraph({
    inputVideo: videoPath,
    outputFile,
    video,
    laps: overlayLaps.map(({ lapId: _lapId, ...lap }) => lap),
    startOffsetS,
    style,
  });

  try {
    await renderOverlayPreviewImage({
      inputVideo: videoPath,
      outputFile,
      filterGraph,
      outputLabel,
      seekTo: previewTimeSeconds,
    });
  } catch (err) {
    throw new OverlayPreviewError(
      err instanceof Error ? err.message : "Preview render failed",
      "INTERNAL_SERVER_ERROR"
    );
  }

  return {
    id: randomUUID(),
    previewUrl: `/previews/${recording.id}/${fileName}`,
    previewTimeSeconds,
    requestedOffsetSeconds: Math.max(0, offsetSeconds),
    usedOffsetSeconds,
    lapId,
    lapNumber: targetLap.number,
    recordingId: recording.id,
    generatedAt: new Date().toISOString(),
  };
}
