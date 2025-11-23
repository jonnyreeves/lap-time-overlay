import { randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { getRenderer, type OverlayMode } from "../renderers/index.js";
import { parseLapText, type LapFormat } from "../laps.js";
import { computeStartOffsetSeconds } from "../time.js";
import { probeVideoInfo } from "../videoInfo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const publicDir = path.join(projectRoot, "public");
const uploadsDir = path.join(projectRoot, "work/uploads");
const rendersDir = path.join(projectRoot, "work/renders");

await fs.mkdir(uploadsDir, { recursive: true });
await fs.mkdir(rendersDir, { recursive: true });

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
  error?: string;
  outputPath?: string;
  outputName?: string;
  uploadId?: string;
  inputPath: string;
}

interface RenderRequestBody {
  uploadId?: string;
  inputPath?: string;
  lapText?: string;
  lapFormat?: LapFormat;
  driverName?: string;
  startFrame?: number;
  startTimestamp?: string;
  overlayMode?: OverlayMode;
}

const uploads = new Map<string, UploadedFile>();
const jobs = new Map<string, RenderJob>();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (req.method === "POST" && url.pathname === "/api/upload") {
    return void handleUpload(req, res, url);
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
  if (req.method === "POST" && url.pathname === "/api/render") {
    return void handleRender(req, res);
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

  const lapText = body.lapText?.trim();
  const lapFormat: LapFormat =
    body.lapFormat === "teamsport" ? "teamsport" : "daytona";
  const driverName = body.driverName?.trim();
  const overlayMode: OverlayMode =
    body.overlayMode === "canvas-pipe" || body.overlayMode === "images"
      ? body.overlayMode
      : "ffmpeg";

  if (!lapText) {
    sendJson(res, 400, { error: "lapText is required" });
    return;
  }

  if (lapFormat === "teamsport" && !driverName) {
    sendJson(res, 400, { error: "driverName is required for teamsport format" });
    return;
  }

  const uploadId = body.uploadId;
  const upload = uploadId ? uploads.get(uploadId) : undefined;
  const inputPath = upload?.path || body.inputPath;
  if (!inputPath) {
    sendJson(res, 400, { error: "No input video provided" });
    return;
  }

  const startFrame =
    body.startFrame === undefined || body.startFrame === null
      ? undefined
      : Number(body.startFrame);
  const startTimestamp = body.startTimestamp?.trim();
  if (startFrame != null && !Number.isFinite(startFrame)) {
    sendJson(res, 400, { error: "startFrame must be a number" });
    return;
  }
  if (startFrame == null && !startTimestamp) {
    sendJson(res, 400, {
      error: "Provide startFrame (preferred) or startTimestamp",
    });
    return;
  }

  const jobId = randomUUID();
  const job: RenderJob = {
    id: jobId,
    status: "queued",
    uploadId,
    inputPath,
  };
  jobs.set(jobId, job);

  startRenderJob({
    job,
    lapText,
    lapFormat,
    driverName,
    startFrame,
    startTimestamp,
    overlayMode,
  }).catch((err) => {
    console.error("Render job failed:", err);
  });

  sendJson(res, 202, { jobId });
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

  if (job.error) payload.error = job.error;
  if (job.outputName) payload.outputName = job.outputName;
  if (job.status === "complete") {
    payload.downloadUrl = `/api/download/${job.id}`;
  }

  sendJson(res, 200, payload);
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

async function startRenderJob(options: {
  job: RenderJob;
  lapText: string;
  lapFormat: LapFormat;
  driverName?: string;
  startFrame?: number;
  startTimestamp?: string;
  overlayMode: OverlayMode;
}) {
  const { job } = options;
  job.status = "running";
  job.startedAt = Date.now();

  try {
    const laps = parseLapText(
      options.lapText,
      options.lapFormat,
      options.driverName
    );
    if (!laps.length) {
      throw new Error("No laps parsed from lapTimes input");
    }

    const video = await probeVideoInfo(job.inputPath);
    const startOffsetS = computeStartOffsetSeconds({
      startFrame: options.startFrame,
      startTimestamp: options.startTimestamp,
      fps: video.fps,
    });
    const renderer = getRenderer(options.overlayMode);

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
      startOffsetS,
    });

    job.status = "complete";
    job.finishedAt = Date.now();
    job.outputPath = outputPath;
    job.outputName = outputName;
  } catch (err) {
    job.status = "error";
    job.finishedAt = Date.now();
    job.error = err instanceof Error ? err.message : "Render failed";
  }
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
