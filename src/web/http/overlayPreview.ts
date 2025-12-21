import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import type http from "node:http";
import path from "node:path";
import { findTrackRecordingById } from "../../db/track_recordings.js";
import {
  appendSetCookie,
  buildSessionCookie,
  clearSessionCookie as buildClearCookie,
  parseCookies,
  SESSION_COOKIE_NAME,
} from "../auth/cookies.js";
import { loadUserFromSession, refreshSession } from "../auth/service.js";
import { tmpPreviewsDir } from "../config.js";
import { sendJson } from "./respond.js";

export async function handleOverlayPreviewRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  recordingId: string,
  fileName: string
): Promise<boolean> {
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken =
    typeof cookies[SESSION_COOKIE_NAME] === "string" ? cookies[SESSION_COOKIE_NAME] : null;
  const auth = sessionToken ? loadUserFromSession(sessionToken) : null;

  if (!auth && sessionToken) {
    appendSetCookie(res, buildClearCookie());
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

  if (!fileName.endsWith(".png")) {
    sendJson(res, 400, { error: "Invalid preview path" });
    return true;
  }

  const previewsDir = path.join(tmpPreviewsDir, recordingId);
  const targetPath = path.resolve(path.join(previewsDir, fileName));
  const allowedRoot = path.resolve(previewsDir);
  if (!targetPath.startsWith(allowedRoot)) {
    sendJson(res, 400, { error: "Invalid preview path" });
    return true;
  }

  try {
    const stats = await fs.stat(targetPath);
    if (!stats.isFile()) {
      throw new Error("Not a file");
    }
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache",
      "Content-Length": stats.size,
    });
    createReadStream(targetPath).pipe(res);
  } catch {
    sendJson(res, 404, { error: "Preview not found" });
  }

  return true;
}
