import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import type http from "node:http";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import {
  DEFAULT_OVERLAY_STYLE,
  buildDrawtextFilterGraph,
  getRenderer,
  type OverlayStyle,
} from "../../ffmpeg/overlay.js";
import { normalizeLapInputs, parseLapText, type LapFormat } from "../../laps.js";
import type { Lap, LapInput } from "../../lapTypes.js";
import { computeStartOffsetSeconds, parseStartTimestamp } from "../../time.js";
import { probeVideoInfo } from "../../ffmpeg/videoInfo.js";
import { previewsDir, rendersDir } from "../config.js";
import { readJsonBody } from "../http/body.js";
import { sendJson } from "../http/respond.js";
import { getUpload } from "../state/uploads.js";
import { getJob, registerJob, type RenderJob } from "../state/jobs.js";

interface RenderRequestBody {
  uploadId?: string;
  inputPath?: string;
  laps?: LapInput[];
  lapText?: string;
  lapFormat?: LapFormat;
  driverName?: string;
  startFrame?: number;
  startTimestamp?: string;
  sessionStartFrame?: number;
  sessionStartTimestamp?: string;
  sessionEndFrame?: number;
  sessionEndTimestamp?: string;
  overlayTextColor?: string;
  overlayTextSize?: number;
  overlayBoxColor?: string;
  overlayBoxOpacity?: number;
  showLapCounter?: boolean;
  showPosition?: boolean;
  showCurrentLapTime?: boolean;
  overlayPosition?: OverlayStyle["overlayPosition"];
  overlayWidthRatio?: number;
  previewLapNumber?: number;
}

// Deprecated REST endpoints: keep for compatibility while GraphQL migrates features.
export async function handleRender(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  let body: RenderRequestBody;
  try {
    body = (await readJsonBody(req)) as RenderRequestBody;
  } catch (err) {
    sendJson(res, 400, { error: (err as Error).message });
    return;
  }

  const parsed = parseOverlayRequest(body);
  if ("error" in parsed) {
    sendJson(res, 400, { error: parsed.error });
    return;
  }
  const {
    laps,
    uploadId,
    inputPath,
    startFrame,
    startTimestamp,
    sessionStartFrame,
    sessionStartTimestamp,
    sessionEndFrame,
    sessionEndTimestamp,
    style,
  } = parsed;

  const jobId = randomUUID();
  const job: RenderJob = {
    id: jobId,
    status: "queued",
    uploadId,
    inputPath,
    progress: 0,
  };
  registerJob(job);

  startRenderJob({
    job,
    laps,
    startFrame,
    startTimestamp,
    sessionStartFrame,
    sessionStartTimestamp,
    sessionEndFrame,
    sessionEndTimestamp,
    style,
  }).catch((err) => {
    console.error("Render job failed:", err);
  });

  sendJson(res, 202, { jobId });
}

export async function handlePreview(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  let body: RenderRequestBody;
  try {
    body = (await readJsonBody(req)) as RenderRequestBody;
  } catch (err) {
    sendJson(res, 400, { error: (err as Error).message });
    return;
  }

  const parsed = parseOverlayRequest(body);
  if ("error" in parsed) {
    sendJson(res, 400, { error: parsed.error });
    return;
  }

  const {
    laps,
    inputPath,
    startFrame,
    startTimestamp,
    sessionStartFrame,
    sessionStartTimestamp,
    sessionEndFrame,
    sessionEndTimestamp,
    style,
  } = parsed;

  try {
    const lapCount = laps.length;

    const video = await probeVideoInfo(inputPath);
    const timing = resolveTimingInputs({
      fps: video.fps,
      duration: video.duration,
      startFrame,
      startTimestamp,
      sessionStartFrame,
      sessionStartTimestamp,
      sessionEndFrame,
      sessionEndTimestamp,
    });
    if ("error" in timing) {
      sendJson(res, 400, { error: timing.error });
      return;
    }
    const { lapStartS, sessionStartS, sessionEndS } = timing;
    const selection = resolvePreviewSelection(body.previewLapNumber, lapCount);
    const selectedLap = selection.selected;
    const isFinish = selection.isFinish;
    const lapIndex = Math.min(selectedLap, lapCount) - 1;
    const lap = laps[Math.max(0, lapIndex)];
    const sessionEnd = lap.startS + lap.durationS;
    const lapStartAbs = isFinish
      ? lapStartS + sessionEnd
      : lapStartS + lap.startS;
    let previewTime = lapStartAbs;
    const clipEnd = sessionEndS ?? video.duration;
    previewTime = Math.min(
      previewTime,
      Math.max(clipEnd - 0.05, sessionStartS)
    );
    previewTime = Math.max(previewTime, sessionStartS);

    const previewId = randomUUID();
    const outputPath = path.join(previewsDir, `${previewId}.png`);
    await renderPreviewFrame({
      inputVideo: inputPath,
      outputFile: outputPath,
      laps,
      startOffsetS: lapStartS,
      video,
      style,
      timeSeconds: previewTime,
    });
    sendJson(res, 200, {
      previewUrl: `/api/preview/${previewId}`,
      lapCount,
      selectedLap,
    });
  } catch (err) {
    console.error("Preview failed:", err);
    sendJson(res, 500, { error: "Preview failed" });
  }
}

export async function handleJobStatus(
  res: http.ServerResponse,
  jobId: string
): Promise<void> {
  const job = getJob(jobId);
  if (!job) {
    sendJson(res, 404, { error: "Job not found" });
    return;
  }

  const payload: Record<string, unknown> = {
    id: job.id,
    status: job.status,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
  };

  if (job.progress != null) payload.progress = job.progress;
  if (job.error) payload.error = job.error;
  if (job.outputName) payload.outputName = job.outputName;
  if (job.status === "complete") {
    payload.downloadUrl = `/api/download/${job.id}`;
  }

  sendJson(res, 200, payload);
}

export async function handlePreviewImage(
  res: http.ServerResponse,
  previewId: string
): Promise<void> {
  if (!previewId) {
    sendJson(res, 400, { error: "Missing preview id" });
    return;
  }

  const filePath = path.join(previewsDir, `${previewId}.png`);
  if (!filePath.startsWith(previewsDir)) {
    sendJson(res, 400, { error: "Invalid path" });
    return;
  }

  try {
    const stats = await fs.stat(filePath);
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": stats.size,
      "Cache-Control": "no-cache",
    });
    createReadStream(filePath).pipe(res);
  } catch {
    sendJson(res, 404, { error: "Preview not found" });
  }
}

export async function handleDownload(
  res: http.ServerResponse,
  jobId: string
): Promise<void> {
  const job = getJob(jobId);
  if (!job || job.status !== "complete" || !job.outputPath) {
    sendJson(res, 404, { error: "No rendered file for this job" });
    return;
  }

  try {
    const stats = await fs.stat(job.outputPath);
    const filename =
      job.outputName || path.basename(job.outputPath) || "output.mp4";

    res.writeHead(200, {
      "Content-Type": "video/mp4",
      "Content-Length": stats.size,
      "Content-Disposition": `attachment; filename="${filename}"`,
    });
    createReadStream(job.outputPath).pipe(res);
  } catch (err) {
    console.error("Download failed:", err);
    sendJson(res, 500, { error: "Failed to read rendered file" });
  }
}

function normalizeHex(input?: string | null): string | null {
  const str = typeof input === "string" ? input : null;
  const match = str?.match(/^#?([0-9a-fA-F]{6})$/);
  return match ? `#${match[1].toLowerCase()}` : null;
}

function resolveOverlayStyle(body: RenderRequestBody): OverlayStyle {
  const textColor = normalizeHex(body.overlayTextColor);
  const boxColor = normalizeHex(body.overlayBoxColor);
  const opacity =
    body.overlayBoxOpacity != null && Number.isFinite(body.overlayBoxOpacity)
      ? Math.min(1, Math.max(0, Number(body.overlayBoxOpacity)))
      : DEFAULT_OVERLAY_STYLE.boxOpacity;
  const textSize =
    body.overlayTextSize != null && Number.isFinite(body.overlayTextSize)
      ? Math.min(64, Math.max(16, Number(body.overlayTextSize)))
      : DEFAULT_OVERLAY_STYLE.textSize;
  const boxWidthRatio =
    body.overlayWidthRatio != null && Number.isFinite(body.overlayWidthRatio)
      ? Math.min(0.9, Math.max(0.15, Number(body.overlayWidthRatio)))
      : DEFAULT_OVERLAY_STYLE.boxWidthRatio;
  const showLapCounter =
    typeof body.showLapCounter === "boolean"
      ? body.showLapCounter
      : DEFAULT_OVERLAY_STYLE.showLapCounter;
  const showPosition =
    typeof body.showPosition === "boolean"
      ? body.showPosition
      : DEFAULT_OVERLAY_STYLE.showPosition;
  const showCurrentLapTime =
    typeof body.showCurrentLapTime === "boolean"
      ? body.showCurrentLapTime
      : DEFAULT_OVERLAY_STYLE.showCurrentLapTime;

  return {
    textColor: textColor ?? DEFAULT_OVERLAY_STYLE.textColor,
    textSize,
    boxColor: boxColor ?? DEFAULT_OVERLAY_STYLE.boxColor,
    boxOpacity: opacity,
    showLapCounter,
    showPosition,
    showCurrentLapTime,
    boxWidthRatio,
    overlayPosition:
      body.overlayPosition &&
      ["bottom-left", "top-left", "top-right", "bottom-right"].includes(
        body.overlayPosition
      )
        ? body.overlayPosition
        : DEFAULT_OVERLAY_STYLE.overlayPosition,
  };
}

function resolvePreviewSelection(
  input: unknown,
  lapCount: number
): { selected: number; isFinish: boolean } {
  const maxSelectable = lapCount + (lapCount > 0 ? 1 : 0);
  const n = Number(input);
  if (!Number.isFinite(n) || maxSelectable < 1) {
    return { selected: 1, isFinish: false };
  }
  const clamped = Math.min(maxSelectable, Math.max(1, Math.round(n)));
  return { selected: clamped, isFinish: clamped === maxSelectable && lapCount > 0 };
}

type ParsedOverlayRequest = {
  laps: Lap[];
  uploadId?: string;
  inputPath: string;
  startFrame?: number;
  startTimestamp?: string;
  sessionStartFrame?: number;
  sessionStartTimestamp?: string;
  sessionEndFrame?: number;
  sessionEndTimestamp?: string;
  style: OverlayStyle;
};

function parseOverlayRequest(
  body: RenderRequestBody
): ParsedOverlayRequest | { error: string } {
  const uploadId = body.uploadId;
  const upload = uploadId ? getUpload(uploadId) : undefined;
  const inputPath = upload?.path || body.inputPath;
  if (!inputPath) {
    return { error: "No input video provided" };
  }

  const startFrame =
    body.startFrame === undefined || body.startFrame === null
      ? undefined
      : Number(body.startFrame);
  const startTimestamp = body.startTimestamp?.trim();
  if (startFrame != null && !Number.isFinite(startFrame)) {
    return { error: "startFrame must be a number" };
  }
  if (startFrame == null && !startTimestamp) {
    return {
      error: "Provide startFrame (preferred) or startTimestamp",
    };
  }
  const sessionStartFrame =
    body.sessionStartFrame === undefined || body.sessionStartFrame === null
      ? undefined
      : Number(body.sessionStartFrame);
  if (sessionStartFrame != null && !Number.isFinite(sessionStartFrame)) {
    return { error: "sessionStartFrame must be a number" };
  }
  const sessionEndFrame =
    body.sessionEndFrame === undefined || body.sessionEndFrame === null
      ? undefined
      : Number(body.sessionEndFrame);
  if (sessionEndFrame != null && !Number.isFinite(sessionEndFrame)) {
    return { error: "sessionEndFrame must be a number" };
  }
  const sessionStartTimestamp = body.sessionStartTimestamp?.trim();
  const sessionEndTimestamp = body.sessionEndTimestamp?.trim();

  let laps: Lap[] | null = null;

  if (Array.isArray(body.laps)) {
    try {
      laps = normalizeLapInputs(body.laps);
    } catch (err) {
      return { error: (err as Error).message };
    }
  } else {
    const lapText = body.lapText?.trim();
    if (!lapText) {
      return { error: "Lap data is required" };
    }

    const lapFormat: LapFormat =
      body.lapFormat === "teamsport" ? "teamsport" : "daytona";
    const driverName = body.driverName?.trim();
    if (lapFormat === "teamsport" && !driverName) {
      return { error: "driverName is required for teamsport format" };
    }

    try {
      laps = parseLapText(lapText, lapFormat, driverName);
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  if (!laps?.length) {
    return { error: "At least one lap is required" };
  }

  return {
    laps,
    uploadId,
    inputPath,
    startFrame,
    startTimestamp,
    sessionStartFrame,
    sessionStartTimestamp,
    sessionEndFrame,
    sessionEndTimestamp,
    style: resolveOverlayStyle(body),
  };
}

function resolveTimeSeconds(options: {
  frame?: number;
  timestamp?: string;
  fps: number;
  defaultValue?: number;
  label: string;
}): { value?: number; error?: string } {
  const { frame, timestamp, fps, defaultValue, label } = options;
  if (frame != null) {
    const asNum = Number(frame);
    if (!Number.isFinite(asNum)) {
      return { error: `${label} frame must be a number` };
    }
    if (!Number.isInteger(asNum)) {
      return { error: `${label} frame must be an integer` };
    }
    if (!Number.isFinite(fps) || fps <= 0) {
      return { error: `Cannot use ${label} frame without a valid fps` };
    }
    if (asNum < 0) {
      return { error: `${label} frame must be >= 0` };
    }
    return { value: asNum / fps };
  }

  const ts = timestamp?.toString().trim();
  if (ts) {
    try {
      return { value: parseStartTimestamp(ts) };
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? `Invalid ${label} timestamp: ${err.message}`
            : `Invalid ${label} timestamp`,
      };
    }
  }

  return { value: defaultValue };
}

function resolveTimingInputs(options: {
  fps: number;
  duration: number;
  startFrame?: number;
  startTimestamp?: string;
  sessionStartFrame?: number;
  sessionStartTimestamp?: string;
  sessionEndFrame?: number;
  sessionEndTimestamp?: string;
}):
  | { error: string }
  | { lapStartS: number; sessionStartS: number; sessionEndS?: number } {
  const { fps, duration } = options;
  let lapStartS: number;
  try {
    lapStartS = computeStartOffsetSeconds({
      startFrame: options.startFrame,
      startTimestamp: options.startTimestamp,
      fps,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid lap start" };
  }

  const sessionStart = resolveTimeSeconds({
    frame: options.sessionStartFrame,
    timestamp: options.sessionStartTimestamp,
    fps,
    defaultValue: 0,
    label: "session start",
  });
  if (sessionStart.error) return { error: sessionStart.error };
  const sessionStartS = sessionStart.value ?? 0;
  if (sessionStartS < 0) {
    return { error: "Session start must be >= 0" };
  }
  if (sessionStartS > duration) {
    return { error: "Session start must be within the video duration" };
  }

  const sessionEnd = resolveTimeSeconds({
    frame: options.sessionEndFrame,
    timestamp: options.sessionEndTimestamp,
    fps,
    defaultValue: undefined,
    label: "session end",
  });
  if (sessionEnd.error) return { error: sessionEnd.error };
  let sessionEndS = sessionEnd.value;
  if (sessionEndS != null) {
    if (sessionEndS <= sessionStartS) {
      return { error: "Session end must be later than the session start" };
    }
    sessionEndS = Math.min(sessionEndS, duration);
    if (sessionEndS <= sessionStartS) {
      return { error: "Session end must be later than the session start" };
    }
  }

  if (lapStartS < sessionStartS) {
    return { error: "Lap 1 start must be on or after the session start" };
  }
  if (lapStartS > duration) {
    return { error: "Lap 1 start must be within the video duration" };
  }
  if (sessionEndS != null && lapStartS >= sessionEndS) {
    return { error: "Lap 1 start must be before the session end" };
  }

  return { lapStartS, sessionStartS, sessionEndS };
}

async function renderPreviewFrame(options: {
  inputVideo: string;
  outputFile: string;
  video: Awaited<ReturnType<typeof probeVideoInfo>>;
  laps: Lap[];
  startOffsetS: number;
  style: OverlayStyle;
  timeSeconds: number;
}) {
  const relativeStartOffset = options.startOffsetS - options.timeSeconds;
  const { filterGraph, outputLabel } = buildDrawtextFilterGraph({
    inputVideo: options.inputVideo,
    outputFile: options.outputFile,
    video: options.video,
    laps: options.laps,
    startOffsetS: relativeStartOffset,
    style: options.style,
  });

  return new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg()
      .input(options.inputVideo)
      .seekInput(Math.max(0, options.timeSeconds))
      .complexFilter(filterGraph)
      .outputOptions(["-map", `[${outputLabel}]`, "-frames:v", "1", "-q:v", "2"])
      .output(options.outputFile);

    cmd
      .on("end", () => resolve())
      .on("error", (err) => reject(err));

    cmd.run();
  });
}

async function startRenderJob(options: {
  job: RenderJob;
  laps: Lap[];
  startFrame?: number;
  startTimestamp?: string;
  sessionStartFrame?: number;
  sessionStartTimestamp?: string;
  sessionEndFrame?: number;
  sessionEndTimestamp?: string;
  style: OverlayStyle;
}) {
  const { job } = options;
  job.status = "running";
  job.startedAt = Date.now();
  job.progress = 0;

  const updateProgress = (pct: number) => {
    if (!Number.isFinite(pct)) return;
    job.progress = Math.min(100, Math.max(0, Number(pct)));
  };

  try {
    const laps = options.laps;
    if (!laps.length) {
      throw new Error("No laps provided");
    }

    const video = await probeVideoInfo(job.inputPath);
    const timing = resolveTimingInputs({
      fps: video.fps,
      duration: video.duration,
      startFrame: options.startFrame,
      startTimestamp: options.startTimestamp,
      sessionStartFrame: options.sessionStartFrame,
      sessionStartTimestamp: options.sessionStartTimestamp,
      sessionEndFrame: options.sessionEndFrame,
      sessionEndTimestamp: options.sessionEndTimestamp,
    });
    if ("error" in timing) {
      throw new Error(timing.error);
    }
    const { lapStartS, sessionStartS, sessionEndS } = timing;
    const renderer = getRenderer();

    const clipEnd = sessionEndS ?? video.duration;
    const clipDuration = clipEnd - sessionStartS;
    if (!Number.isFinite(clipDuration) || clipDuration <= 0) {
      throw new Error("Session end must be later than the session start");
    }

    const safeStem = path
      .basename(job.inputPath, path.extname(job.inputPath))
      .replace(/[^\w.\-]+/g, "_");
    const outputName = `${safeStem}-overlay.mp4`;
    const outputPath = path.join(rendersDir, outputName);

    await renderer({
      inputVideo: job.inputPath,
      outputFile: outputPath,
      video,
      laps,
      startOffsetS: lapStartS - sessionStartS,
      trimStartS: sessionStartS,
      trimEndS: sessionEndS,
      style: options.style,
      onProgress: updateProgress,
    });

    job.status = "complete";
    job.finishedAt = Date.now();
    job.outputPath = outputPath;
    job.outputName = outputName;
    job.progress = 100;
  } catch (err) {
    job.status = "error";
    job.finishedAt = Date.now();
    job.error = err instanceof Error ? err.message : "Render failed";
  }
}
