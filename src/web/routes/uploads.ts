import { randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import type http from "node:http";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import ffmpeg from "fluent-ffmpeg";
import { uploadsDir } from "../config.js";
import { readJsonBody } from "../http/body.js";
import { sendJson } from "../http/respond.js";
import { safeUnlink } from "../shared/fs.js";
import {
  getUpload,
  saveUpload,
  type UploadedFile,
} from "../state/uploads.js";
import { probeVideoInfo } from "../../ffmpeg/videoInfo.js";

// Deprecated REST endpoints: keep for compatibility while GraphQL migrates features.
export async function handleUpload(
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
    saveUpload({
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

export async function handleCombineUploads(
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
    const upload = getUpload(id as string);
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

export async function handleUploadInfo(
  res: http.ServerResponse,
  uploadId?: string
): Promise<void> {
  if (!uploadId) {
    sendJson(res, 400, { error: "Missing upload id" });
    return;
  }
  const upload = getUpload(uploadId);
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

export async function handleUploadFile(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  uploadId?: string
): Promise<void> {
  if (!uploadId) {
    sendJson(res, 400, { error: "Missing upload id" });
    return;
  }
  const upload = getUpload(uploadId);
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

async function concatenateUploads(files: UploadedFile[]): Promise<UploadedFile> {
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
    saveUpload(combined);
    return combined;
  } catch (err) {
    await safeUnlink(outputPath);
    throw err;
  } finally {
    await safeUnlink(listPath);
  }
}

function runConcatCommand(listPath: string, outputPath: string): Promise<void> {
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
