import { once } from "node:events";
import fs from "node:fs";
import fsp from "node:fs/promises";
import type http from "node:http";
import path from "node:path";
import {
  appendSetCookie,
  buildSessionCookie,
  clearSessionCookie,
  parseCookies,
  SESSION_COOKIE_NAME,
} from "../auth/cookies.js";
import { loadUserFromSession, refreshSession } from "../auth/service.js";
import {
  findTrackRecordingSourceByUploadToken,
  updateTrackRecordingSource,
} from "../../db/track_recording_sources.js";
import { updateTrackRecording } from "../../db/track_recordings.js";
import {
  finalizeSourceUpload,
  RecordingUploadError,
  startSourceUpload,
  validateRecordingUpload,
} from "../recordings/service.js";

const TUS_VERSION = "1.0.0";
const TUS_MAX_SIZE_BYTES = 4 * 1024 * 1024 * 1024;
const UPLOAD_FLUSH_BYTES = 512 * 1024;
const DEBUG_UPLOAD_PROGRESS = process.env.DEBUG_UPLOAD_PROGRESS === "1";

function tokenSuffix(token: string | null | undefined): string | null {
  if (!token) return null;
  return token.slice(-6);
}

function headerValue(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value.join(", ") : value;
}

function parsePositiveInt(value: string | string[] | undefined): number | null {
  const normalized = headerValue(value);
  if (!normalized) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseUploadMetadata(value: string | string[] | undefined): Record<string, string> {
  const normalized = headerValue(value);
  if (!normalized) return {};

  const entries = normalized.split(",");
  const out: Record<string, string> = {};
  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const splitAt = trimmed.indexOf(" ");
    const key = splitAt === -1 ? trimmed : trimmed.slice(0, splitAt);
    const rawValue = splitAt === -1 ? "" : trimmed.slice(splitAt + 1);
    if (!key) continue;
    if (!rawValue) {
      out[key] = "";
      continue;
    }
    try {
      out[key] = Buffer.from(rawValue, "base64").toString("utf8");
    } catch {
      out[key] = "";
    }
  }
  return out;
}

function writeTusResponse(
  res: http.ServerResponse,
  status: number,
  headers: http.OutgoingHttpHeaders = {}
): void {
  res.writeHead(status, { "Tus-Resumable": TUS_VERSION, ...headers });
  res.end();
}

function writeTusError(
  res: http.ServerResponse,
  status: number,
  message: string,
  headers: http.OutgoingHttpHeaders = {}
): void {
  res.writeHead(status, {
    "Tus-Resumable": TUS_VERSION,
    "Content-Type": "text/plain; charset=utf-8",
    ...headers,
  });
  res.end(message);
}

async function getUploadOffset(storagePath: string): Promise<number> {
  try {
    const stats = await fsp.stat(storagePath);
    return stats.isFile() ? stats.size : 0;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return 0;
    throw err;
  }
}

async function appendUploadChunk(
  req: http.IncomingMessage,
  destination: string,
  onChunk: (uploaded: number) => void
): Promise<number> {
  await fsp.mkdir(path.dirname(destination), { recursive: true });
  const stream = fs.createWriteStream(destination, { flags: "a" });
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
    throw err;
  }
}

function loadAuthFromRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken =
    typeof cookies[SESSION_COOKIE_NAME] === "string" ? cookies[SESSION_COOKIE_NAME] : null;
  const auth = sessionToken ? loadUserFromSession(sessionToken) : null;

  if (!auth && sessionToken) {
    appendSetCookie(res, clearSessionCookie());
  }
  if (auth && sessionToken) {
    const newExpires = refreshSession(sessionToken);
    if (newExpires) {
      appendSetCookie(res, buildSessionCookie(sessionToken, newExpires));
    }
  }

  return auth;
}

export async function handleTusUploadRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  sourceId: string | null
): Promise<boolean> {
  const uploadToken = headerValue(req.headers["upload-token"]);
  const auth = loadAuthFromRequest(req, res);
  const baseLog = {
    sourceId,
    hasToken: Boolean(uploadToken),
    contentLength: headerValue(req.headers["content-length"]),
    uploadOffset: headerValue(req.headers["upload-offset"]),
    userAgent: headerValue(req.headers["user-agent"]),
    remoteAddress: req.socket.remoteAddress ?? null,
  };

  const method = req.method ?? "GET";

  if (method === "OPTIONS") {
    writeTusResponse(res, 204, {
      "Tus-Version": TUS_VERSION,
      "Tus-Extension": "creation",
      "Tus-Max-Size": TUS_MAX_SIZE_BYTES.toString(10),
    });
    return true;
  }

  if (!uploadToken) {
    writeTusError(res, 401, "Upload token is required");
    return true;
  }

  if (method === "POST") {
    const metadata = parseUploadMetadata(req.headers["upload-metadata"]);
    const metadataSourceId = metadata.sourceId?.trim() || null;
    const resolvedSourceId = metadataSourceId || sourceId;

    const length = parsePositiveInt(req.headers["upload-length"]);
    if (length == null) {
      writeTusError(res, 400, "Upload-Length is required");
      return true;
    }
    if (length > TUS_MAX_SIZE_BYTES) {
      writeTusError(res, 413, "Upload is too large");
      return true;
    }

    let finalSourceId = resolvedSourceId;
    if (!finalSourceId) {
      const source = findTrackRecordingSourceByUploadToken(uploadToken);
      if (!source) {
        writeTusError(res, 404, "Upload target not found");
        return true;
      }
      finalSourceId = source.id;
    }

    let recording;
    let source;
    try {
      ({ recording, source } = validateRecordingUpload({
        sourceId: finalSourceId,
        token: uploadToken,
        currentUserId: auth?.user.id ?? null,
      }));
    } catch (err) {
      if (err instanceof RecordingUploadError) {
        writeTusError(res, err.statusCode, err.message);
        return true;
      }
      console.error("Unexpected tus upload error", baseLog, err);
      writeTusError(res, 500, "Upload failed");
      return true;
    }

    if (DEBUG_UPLOAD_PROGRESS) {
      console.info("Tus upload create debug", {
        sourceId: source.id,
        recordingId: recording.id,
        sessionId: recording.sessionId,
        metadataSourceId,
        resolvedSourceId,
        uploadLength: length,
        sourceSizeBytes: source.sizeBytes ?? null,
        uploadTokenSuffix: tokenSuffix(uploadToken),
      });
    }

    if (source.sizeBytes != null && length < source.sizeBytes) {
      console.warn("Tus upload length mismatch", {
        ...baseLog,
        sourceId: source.id,
        recordingId: recording.id,
        sessionId: recording.sessionId,
        uploadLength: length,
        sourceSizeBytes: source.sizeBytes,
      });
      writeTusError(res, 409, "Upload-Length is smaller than expected");
      return true;
    }

    const storagePath = source.storagePath;
    await fsp.mkdir(path.dirname(storagePath), { recursive: true });
    await fsp.rm(storagePath, { force: true });

    console.info("Tus upload created", {
      ...baseLog,
      sourceId: source.id,
      recordingId: recording.id,
      sessionId: recording.sessionId,
      uploadLength: length,
    });

    const sizeBytes =
      source.sizeBytes != null && length > source.sizeBytes ? length : source.sizeBytes ?? length;

    startSourceUpload({
      recordingId: recording.id,
      sourceId: source.id,
      sizeBytes,
      uploadedBytes: 0,
    });

    writeTusResponse(res, 201, {
      Location: `/api/uploads/tus/${source.id}`,
      "Upload-Offset": "0",
    });
    return true;
  }

  if (method === "HEAD") {
    if (!sourceId) {
      writeTusError(res, 404, "Upload target not found");
      return true;
    }

    let recording;
    let source;
    try {
      ({ recording, source } = validateRecordingUpload({
        sourceId,
        token: uploadToken,
        currentUserId: auth?.user.id ?? null,
      }));
    } catch (err) {
      if (err instanceof RecordingUploadError) {
        writeTusError(res, err.statusCode, err.message);
        return true;
      }
      console.error("Unexpected tus upload error", baseLog, err);
      writeTusError(res, 500, "Upload failed");
      return true;
    }

    const totalBytes = source.sizeBytes;
    if (totalBytes == null) {
      writeTusError(res, 400, "Upload-Length is required");
      return true;
    }

    const offset = await getUploadOffset(source.storagePath);
    if (offset !== source.uploadedBytes) {
      updateTrackRecordingSource(source.id, { uploadedBytes: offset });
    }

    console.info("Tus upload status", {
      ...baseLog,
      sourceId: source.id,
      recordingId: recording.id,
      sessionId: recording.sessionId,
      uploadOffset: offset,
    });

    writeTusResponse(res, 200, {
      "Upload-Offset": offset.toString(10),
      "Upload-Length": totalBytes.toString(10),
    });
    return true;
  }

  if (method === "PATCH") {
    if (!sourceId) {
      writeTusError(res, 404, "Upload target not found");
      return true;
    }

    let recording;
    let source;
    try {
      ({ recording, source } = validateRecordingUpload({
        sourceId,
        token: uploadToken,
        currentUserId: auth?.user.id ?? null,
      }));
    } catch (err) {
      if (err instanceof RecordingUploadError) {
        writeTusError(res, err.statusCode, err.message);
        return true;
      }
      console.error("Unexpected tus upload error", baseLog, err);
      writeTusError(res, 500, "Upload failed");
      return true;
    }

    const totalBytes = source.sizeBytes;
    if (totalBytes == null) {
      writeTusError(res, 400, "Upload-Length is required");
      return true;
    }

    const expectedOffset = parsePositiveInt(req.headers["upload-offset"]);
    if (expectedOffset == null) {
      writeTusError(res, 400, "Upload-Offset is required");
      return true;
    }

    const currentOffset = await getUploadOffset(source.storagePath);
    if (currentOffset !== expectedOffset) {
      writeTusError(res, 409, "Upload-Offset mismatch", {
        "Upload-Offset": currentOffset.toString(10),
      });
      return true;
    }

    if (DEBUG_UPLOAD_PROGRESS) {
      console.info("Tus upload patch start", {
        sourceId: source.id,
        recordingId: recording.id,
        sessionId: recording.sessionId,
        expectedOffset,
        currentOffset,
        totalBytes,
        uploadTokenSuffix: tokenSuffix(uploadToken),
      });
    }

    let uploadedBytes = currentOffset;
    let lastPersist = currentOffset;
    try {
      const appended = await appendUploadChunk(req, source.storagePath, (chunkBytes) => {
        uploadedBytes = currentOffset + chunkBytes;
        if (uploadedBytes - lastPersist >= UPLOAD_FLUSH_BYTES) {
          updateTrackRecordingSource(source.id, { uploadedBytes });
          lastPersist = uploadedBytes;
        }
      });
      uploadedBytes = currentOffset + appended;
    } catch (err) {
      console.error("Tus upload failed", { ...baseLog, sourceId, uploadedBytes }, err);
      updateTrackRecordingSource(source.id, { status: "failed", uploadedBytes });
      updateTrackRecording(recording.id, { status: "failed", error: "Upload failed" });
      writeTusError(res, 500, "Upload failed");
      return true;
    }

    if (DEBUG_UPLOAD_PROGRESS) {
      console.info("Tus upload patch progress", {
        sourceId: source.id,
        recordingId: recording.id,
        sessionId: recording.sessionId,
        uploadedBytes,
        totalBytes,
        isComplete: uploadedBytes === totalBytes,
      });
    }

    if (uploadedBytes > totalBytes) {
      await fsp.truncate(source.storagePath, totalBytes);
      updateTrackRecordingSource(source.id, { uploadedBytes: totalBytes });
      writeTusError(res, 413, "Upload is too large", {
        "Upload-Offset": totalBytes.toString(10),
      });
      return true;
    }

    if (uploadedBytes === totalBytes) {
      console.info("Tus upload finished", {
        ...baseLog,
        sourceId: source.id,
        recordingId: recording.id,
        sessionId: recording.sessionId,
        uploadedBytes,
      });
      await finalizeSourceUpload({
        recording,
        source,
        uploadedBytes,
      });
    } else {
      updateTrackRecordingSource(source.id, { uploadedBytes });
    }

    writeTusResponse(res, 204, {
      "Upload-Offset": uploadedBytes.toString(10),
    });
    return true;
  }

  writeTusError(res, 405, "Method not allowed");
  return true;
}
