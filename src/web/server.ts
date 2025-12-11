import ffmpeg from "fluent-ffmpeg";
import { randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { normalizeLapInputs, parseLapText, type LapFormat } from "../laps.js";
import type { Lap, LapInput } from "../lapTypes.js";
import { buildDrawtextFilterGraph, MAX_FONT_SIZE, MIN_FONT_SIZE } from "../renderers/ffmpegDrawtext.js";
import {
  DEFAULT_OVERLAY_STYLE,
  getRenderer,
  type OverlayStyle,
} from "../renderers/index.js";
import { computeStartOffsetSeconds, parseStartTimestamp } from "../time.js";
import { probeVideoInfo } from "../videoInfo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const publicDir = path.join(projectRoot, "public");
const uploadsDir = path.join(projectRoot, "work/uploads");
const rendersDir = path.join(projectRoot, "work/renders");
const previewsDir = path.join(projectRoot, "work/previews");
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const UPLOAD_RETENTION_MS = 24 * 60 * 60 * 1000;
const RENDER_RETENTION_MS = 24 * 60 * 60 * 1000;
const PREVIEW_RETENTION_MS = 6 * 60 * 60 * 1000;
const cleanupTargets = [
  { dir: uploadsDir, maxAgeMs: UPLOAD_RETENTION_MS },
  { dir: rendersDir, maxAgeMs: RENDER_RETENTION_MS },
  { dir: previewsDir, maxAgeMs: PREVIEW_RETENTION_MS },
];

await fs.mkdir(uploadsDir, { recursive: true });
await fs.mkdir(rendersDir, { recursive: true });
await fs.mkdir(previewsDir, { recursive: true });

type JobStatus = "queued" | "running" | "error" | "complete";

interface UploadedFile {
  id: string;
  filename: string;
  path: string;
  size: number;
  createdAt: number;
}

interface RenderJob {
  id: string;
  status: JobStatus;
  startedAt?: number;
  finishedAt?: number;
  progress?: number;
  error?: string;
  outputPath?: string;
  outputName?: string;
  uploadId?: string;
  inputPath: string;
}

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

const uploads = new Map<string, UploadedFile>();
const jobs = new Map<string, RenderJob>();

scheduleWorkDirCleanup();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (req.method === "POST" && url.pathname === "/api/upload") {
    return void handleUpload(req, res, url);
  }
  if (req.method === "POST" && url.pathname === "/api/upload/combine") {
    return void handleCombineUploads(req, res);
  }
  if (
    req.method === "GET" &&
    url.pathname.startsWith("/api/upload/") &&
    url.pathname.endsWith("/info")
  ) {
    const parts = url.pathname.split("/").filter(Boolean); // api, upload, {id}, info
    const uploadId = parts[2];
    return void handleUploadInfo(res, uploadId);
  }
  if (
    req.method === "GET" &&
    url.pathname.startsWith("/api/upload/") &&
    url.pathname.endsWith("/file")
  ) {
    const parts = url.pathname.split("/").filter(Boolean);
    const uploadId = parts[2];
    return void handleUploadFile(req, res, uploadId);
  }
  if (req.method === "POST" && url.pathname === "/api/preview") {
    return void handlePreview(req, res);
  }
  if (req.method === "POST" && url.pathname === "/api/render") {
    return void handleRender(req, res);
  }
  if (req.method === "GET" && url.pathname.startsWith("/api/preview/")) {
    const previewId = url.pathname.replace("/api/preview/", "");
    return void handlePreviewImage(res, previewId);
  }
  if (req.method === "GET" && url.pathname.startsWith("/api/jobs/")) {
    const jobId = url.pathname.replace("/api/jobs/", "");
    return void handleJobStatus(res, jobId);
  }
  if (req.method === "GET" && url.pathname.startsWith("/api/download/")) {
    const jobId = url.pathname.replace("/api/download/", "");
    return void handleDownload(res, jobId);
  }

  if (req.method === "GET") {
    return void serveStatic(res, url.pathname);
  }

  res.writeHead(404).end();
});

server.listen(process.env.PORT || 3000, () => {
  const address = server.address();
  if (address && typeof address === "object") {
    console.log(`Web UI running on http://localhost:${address.port}`);
  } else {
    console.log("Web UI server started.");
  }
});

function sendJson(
  res: http.ServerResponse,
  status: number,
  payload: unknown
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

async function handleUpload(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL
): Promise<void> {
  if (req.headers["content-type"]?.startsWith("application/json")) {
    sendJson(res, 415, { error: "Send the video as raw binary (octet-stream)" });
    return;
  }

  const originalName =
    url.searchParams.get("filename") ||
    (typeof req.headers["x-filename"] === "string"
      ? req.headers["x-filename"]
      : null) ||
    "upload.mp4";

  const safeName = path.basename(originalName).replace(/[^\w.\-]+/g, "_");
  const uploadId = randomUUID();
  const destPath = path.join(uploadsDir, `${Date.now()}-${safeName}`);
  const fileStream = createWriteStream(destPath);
  let bytesWritten = 0;

  req.on("data", (chunk) => {
    bytesWritten += chunk.length;
  });

  req.on("aborted", async () => {
    fileStream.destroy();
    await safeUnlink(destPath);
  });

  try {
    await pipeline(req, fileStream);
    uploads.set(uploadId, {
      id: uploadId,
      filename: safeName,
      path: destPath,
      size: bytesWritten,
      createdAt: Date.now(),
    });
    sendJson(res, 200, { uploadId, filename: safeName, size: bytesWritten });
  } catch (err) {
    await safeUnlink(destPath);
    console.error("Upload failed:", err);
    sendJson(res, 500, { error: "Upload failed" });
  }
}

async function handleCombineUploads(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  let body: { uploadIds?: unknown };
  try {
    body = (await readJsonBody(req)) as { uploadIds?: unknown };
  } catch (err) {
    sendJson(res, 400, { error: (err as Error).message });
    return;
  }

  const ids = Array.isArray(body.uploadIds)
    ? body.uploadIds.filter((id): id is string => typeof id === "string")
    : [];
  if (!ids.length) {
    sendJson(res, 400, { error: "uploadIds is required" });
    return;
  }

  const files: UploadedFile[] = [];
  for (const id of ids) {
    const upload = uploads.get(id as string);
    if (!upload) {
      sendJson(res, 404, { error: "One or more uploads not found" });
      return;
    }
    files.push(upload);
  }

  if (files.length === 1) {
    const single = files[0];
    sendJson(res, 200, {
      uploadId: single.id,
      filename: single.filename,
      size: single.size,
    });
    return;
  }

  try {
    const combined = await concatenateUploads(files);
    sendJson(res, 200, {
      uploadId: combined.id,
      filename: combined.filename,
      size: combined.size,
    });
  } catch (err) {
    console.error("Combine failed:", err);
    sendJson(res, 500, { error: "Combine failed" });
  }
}

async function handleUploadInfo(
  res: http.ServerResponse,
  uploadId?: string
): Promise<void> {
  if (!uploadId) {
    sendJson(res, 400, { error: "Missing upload id" });
    return;
  }
  const upload = uploads.get(uploadId);
  if (!upload) {
    sendJson(res, 404, { error: "Upload not found" });
    return;
  }

  try {
    const info = await probeVideoInfo(upload.path);
    sendJson(res, 200, {
      uploadId,
      filename: upload.filename,
      size: upload.size,
      width: info.width,
      height: info.height,
      fps: info.fps,
      duration: info.duration,
    });
  } catch (err) {
    console.error("ffprobe failed:", err);
    sendJson(res, 500, { error: "Failed to probe video" });
  }
}

async function handleUploadFile(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  uploadId?: string
): Promise<void> {
  if (!uploadId) {
    sendJson(res, 400, { error: "Missing upload id" });
    return;
  }
  const upload = uploads.get(uploadId);
  if (!upload) {
    sendJson(res, 404, { error: "Upload not found" });
    return;
  }

  try {
    const stats = await fs.stat(upload.path);
    const fileSize = stats.size;
    const range = req.headers.range;

    if (range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (!match) {
        sendJson(res, 416, { error: "Invalid range" });
        return;
      }
      const start = Number(match[1]);
      const endRaw = match[2];
      const end = endRaw ? Number(endRaw) : fileSize - 1;
      if (
        !Number.isFinite(start) ||
        start < 0 ||
        !Number.isFinite(end) ||
        start >= fileSize
      ) {
        sendJson(res, 416, { error: "Invalid range" });
        return;
      }
      const finalEnd = Math.min(fileSize - 1, Math.max(start, end));
      const chunkSize = finalEnd - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${finalEnd}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
        "Cache-Control": "no-cache",
      });
      createReadStream(upload.path, { start, end: finalEnd }).pipe(res);
      return;
    }

    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
      "Cache-Control": "no-cache",
    });
    createReadStream(upload.path).pipe(res);
  } catch (err) {
    console.error("Stream upload failed:", err);
    sendJson(res, 500, { error: "Failed to stream upload" });
  }
}

async function handleRender(
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
  jobs.set(jobId, job);

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

async function handlePreview(
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
    // keep within video bounds
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

async function handleJobStatus(res: http.ServerResponse, jobId: string) {
  const job = jobs.get(jobId);
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

async function handlePreviewImage(res: http.ServerResponse, previewId: string) {
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

async function handleDownload(res: http.ServerResponse, jobId: string) {
  const job = jobs.get(jobId);
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

async function serveStatic(res: http.ServerResponse, requestPath: string) {
  let relativePath = requestPath.split("?")[0];
  if (relativePath === "/") {
    relativePath = "/index.html";
  }

  const targetPath = path.join(publicDir, relativePath);
  if (!targetPath.startsWith(publicDir)) {
    sendJson(res, 400, { error: "Invalid path" });
    return;
  }

  try {
    const stats = await fs.stat(targetPath);
    if (stats.isDirectory()) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }
    const stream = createReadStream(targetPath);
    res.writeHead(200, {
      "Content-Type": getContentType(targetPath),
      "Cache-Control": "no-cache",
    });
    stream.pipe(res);
  } catch {
    sendJson(res, 404, { error: "Not found" });
  }
}

async function readJsonBody(
  req: http.IncomingMessage,
  limitBytes = 2_000_000
): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > limitBytes) {
      throw new Error("Request body too large");
    }
    chunks.push(buf);
  }

  if (!chunks.length) return {};
  const text = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(text);
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
      ? Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Number(body.overlayTextSize)))
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
  const upload = uploadId ? uploads.get(uploadId) : undefined;
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

async function concatenateUploads(
  files: UploadedFile[]
): Promise<UploadedFile> {
  const concatId = randomUUID();
  const listPath = path.join(uploadsDir, `${Date.now()}-${concatId}.txt`);
  const firstName = files[0]?.filename ?? "combined";
  const baseName =
    path.basename(firstName, path.extname(firstName)).replace(/[^\w.\-]+/g, "_") ||
    "combined";
  const outputName = `${baseName}-combined.mp4`;
  const outputPath = path.join(uploadsDir, `${Date.now()}-${outputName}`);
  const listContent = files
    .map((file) => {
      const escaped = file.path.replace(/'/g, "''");
      return `file '${escaped}'`;
    })
    .join("\n");
  await fs.writeFile(listPath, listContent, "utf8");

  try {
    await runConcatCommand(listPath, outputPath);
    const stats = await fs.stat(outputPath);
    const combined: UploadedFile = {
      id: concatId,
      filename: outputName,
      path: outputPath,
      size: stats.size,
      createdAt: Date.now(),
    };
    uploads.set(concatId, combined);
    return combined;
  } catch (err) {
    await safeUnlink(outputPath);
    throw err;
  } finally {
    await safeUnlink(listPath);
  }
}

function runConcatCommand(
  listPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg()
      .input(listPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-c", "copy", "-fflags", "+genpts"])
      .output(outputPath);

    cmd
      .on("end", () => resolve())
      .on("error", (err) => reject(err));

    cmd.run();
  });
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

function scheduleWorkDirCleanup(): void {
  const runCleanup = () => {
    cleanupWorkDir().catch((err) => {
      console.error("Work dir cleanup failed:", err);
    });
  };
  runCleanup();
  const timer = setInterval(runCleanup, CLEANUP_INTERVAL_MS);
  if (typeof timer.unref === "function") {
    timer.unref();
  }
}

async function cleanupWorkDir(): Promise<void> {
  const now = Date.now();
  const activePaths = collectActivePaths();

  for (const target of cleanupTargets) {
    try {
      const entries = await fs.readdir(target.dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) continue;
        const filePath = path.join(target.dir, entry.name);
        if (activePaths.has(path.resolve(filePath))) continue;
        try {
          const stats = await fs.stat(filePath);
          const ageMs = now - stats.mtimeMs;
          if (ageMs > target.maxAgeMs) {
            await safeUnlink(filePath);
          }
        } catch (err) {
          console.error(`Failed to inspect ${filePath} during cleanup`, err);
        }
      }
    } catch (err) {
      console.error(`Unable to read ${target.dir} for cleanup`, err);
      continue;
    }
  }
}

function collectActivePaths(): Set<string> {
  const active = new Set<string>();
  for (const upload of uploads.values()) {
    active.add(path.resolve(upload.path));
  }
  for (const job of jobs.values()) {
    if (job.inputPath) active.add(path.resolve(job.inputPath));
    if (job.outputPath) active.add(path.resolve(job.outputPath));
  }
  return active;
}

async function safeUnlink(p: string): Promise<void> {
  try {
    await fs.unlink(p);
  } catch {
    // ignore
  }
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    default:
      return "application/octet-stream";
  }
}
