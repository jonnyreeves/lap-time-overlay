import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
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
import { handleSourceUpload, RecordingUploadError } from "../recordings/service.js";
import { findTrackRecordingById } from "../../db/track_recordings.js";
import { sessionRecordingsDir } from "../config.js";
import { sendJson } from "./respond.js";

export async function handleRecordingUploadRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  sourceId: string,
  token: string | null
): Promise<boolean> {
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

  try {
    const result = await handleSourceUpload({
      sourceId,
      token,
      currentUserId: auth?.user.id ?? null,
      req,
    });

    sendJson(res, 200, {
      recordingId: result.recording.id,
      status: result.recording.status,
      uploadedBytes: result.source.uploadedBytes,
    });
  } catch (err) {
    if (err instanceof RecordingUploadError) {
      sendJson(res, err.statusCode, { error: err.message });
      return true;
    }
    console.error("Unexpected recording upload error", err);
    sendJson(res, 500, { error: "Upload failed" });
  }

  return true;
}

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".mkv") return "video/x-matroska";
  return "application/octet-stream";
}

export async function handleRecordingDownloadRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  recordingId: string
): Promise<boolean> {
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
  if (!auth) {
    sendJson(res, 401, { error: "Authentication required" });
    return true;
  }

  const recording = findTrackRecordingById(recordingId);
  if (!recording) {
    sendJson(res, 404, { error: "Recording not found" });
    return true;
  }
  if (recording.userId !== auth.user.id) {
    sendJson(res, 403, { error: "You do not have access to this recording" });
    return true;
  }

  const targetPath = path.resolve(path.join(sessionRecordingsDir, recording.mediaId));
  const allowedRoot = path.resolve(sessionRecordingsDir);
  if (!targetPath.startsWith(allowedRoot)) {
    sendJson(res, 400, { error: "Invalid recording path" });
    return true;
  }

  try {
    const stats = await fs.stat(targetPath);
    if (!stats.isFile()) {
      throw new Error("Not a file");
    }
    const totalSize = stats.size;
    const rangeHeader = typeof req.headers.range === "string" ? req.headers.range : null;

    if (rangeHeader) {
      const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
      if (!match) {
        res.writeHead(416, { "Content-Range": `bytes */${totalSize}` });
        res.end();
        return true;
      }

      const start = match[1] ? Number.parseInt(match[1], 10) : 0;
      const requestedEnd = match[2] ? Number.parseInt(match[2], 10) : totalSize - 1;
      const end = Math.min(requestedEnd, totalSize - 1);

      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        start < 0 ||
        end < start ||
        start >= totalSize
      ) {
        res.writeHead(416, { "Content-Range": `bytes */${totalSize}` });
        res.end();
        return true;
      }

      res.writeHead(206, {
        "Content-Type": contentTypeFor(targetPath),
        "Content-Length": end - start + 1,
        "Content-Range": `bytes ${start}-${end}/${totalSize}`,
        "Accept-Ranges": "bytes",
      });
      createReadStream(targetPath, { start, end }).pipe(res);
      return true;
    }

    res.writeHead(200, {
      "Content-Type": contentTypeFor(targetPath),
      "Content-Length": totalSize,
      "Accept-Ranges": "bytes",
    });
    createReadStream(targetPath).pipe(res);
  } catch (err) {
    console.warn("Recording file missing", err);
    sendJson(res, 404, { error: "Recording file not found" });
  }

  return true;
}
