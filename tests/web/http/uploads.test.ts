import fs from "node:fs/promises";
import path from "node:path";
import { Writable } from "node:stream";
import { once } from "node:events";
import type http from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sessionRecordingsDir } from "../../../src/web/config.js";
import { handleRecordingDownloadRequest } from "../../../src/web/http/uploads.js";
import { SESSION_COOKIE_NAME } from "../../../src/web/auth/cookies.js";
import { loadUserFromSession, refreshSession } from "../../../src/web/auth/service.js";
import { findTrackRecordingById } from "../../../src/db/track_recordings.js";

vi.mock("../../../src/web/config.js", () => {
  const testRoot = path.join(process.cwd(), "temp", "tests");
  return {
    projectRoot: process.cwd(),
    publicDir: path.join(process.cwd(), "public"),
    rawMediaDir: path.join(testRoot, "session_recordings"),
    sessionRecordingsDir: path.join(testRoot, "session_recordings"),
    jellyfinProjectionDir: path.join(testRoot, "jellyfin"),
    tmpUploadsDir: path.join(testRoot, "uploads"),
    tmpRendersDir: path.join(testRoot, "renders"),
    tmpPreviewsDir: path.join(testRoot, "previews"),
    ensureWorkDirs: async () => {},
  };
});

const testRootDir = path.join(process.cwd(), "temp", "tests");

vi.mock("../../../src/web/auth/service.js", () => ({
  loadUserFromSession: vi.fn(),
  refreshSession: vi.fn(),
}));

vi.mock("../../../src/db/track_recordings.js", () => ({
  findTrackRecordingById: vi.fn(),
}));

function createMockResponse() {
  const headers: Record<string, number | string | string[]> = {};
  const chunks: Buffer[] = [];
  const res = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      callback();
    },
  }) as unknown as http.ServerResponse;

  res.statusCode = 200;

  res.writeHead = ((statusCode: number, incomingHeaders: http.OutgoingHttpHeaders = {}) => {
    res.statusCode = statusCode;
    for (const [key, value] of Object.entries(incomingHeaders)) {
      if (value !== undefined) {
        headers[key] = value as number | string | string[];
      }
    }
    return res;
  }) as typeof res.writeHead;

  res.setHeader = ((name: string, value: number | string | string[]) => {
    headers[name] = value;
  }) as typeof res.setHeader;

  res.getHeader = ((name: string) => headers[name]) as typeof res.getHeader;
  res.getHeaders = (() => ({ ...headers })) as typeof res.getHeaders;

  return {
    res,
    getBody: () => Buffer.concat(chunks),
    getHeaders: () => headers,
    getStatus: () => res.statusCode,
  };
}

describe("handleRecordingDownloadRequest", () => {
  const userId = "user-1";
  const recordingId = "rec-1";
  const sessionId = "session-1";
  const mediaId = path.posix.join("test-downloads", `${recordingId}.mp4`);
  const filePath = path.join(sessionRecordingsDir, mediaId);

  beforeEach(async () => {
    vi.mocked(loadUserFromSession).mockReturnValue({
      user: { id: userId, username: "sam", createdAt: Date.now(), isAdmin: true },
      expiresAt: Date.now() + 1000,
    });
    vi.mocked(refreshSession).mockReturnValue(null);
    vi.mocked(findTrackRecordingById).mockReturnValue({
      id: recordingId,
      sessionId,
      userId,
      mediaId,
      overlayBurned: false,
      isPrimary: true,
      lapOneOffset: 0,
      description: null,
      status: "ready",
      error: null,
      sizeBytes: null,
      durationMs: null,
      fps: null,
      combineProgress: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, "hello world", "utf8");
  });

  it("returns ranged content to support seeking", async () => {
    const req = {
      headers: { cookie: `${SESSION_COOKIE_NAME}=token`, range: "bytes=0-4" },
    } as http.IncomingMessage;
    const { res, getBody, getHeaders, getStatus } = createMockResponse();

    await handleRecordingDownloadRequest(req, res, recordingId);
    await once(res as any, "finish");

    expect(getStatus()).toBe(206);
    expect(getHeaders()["Content-Range"]).toBe("bytes 0-4/11");
    expect(getHeaders()["Accept-Ranges"]).toBe("bytes");
    expect(getHeaders()["Content-Length"]).toBe(5);
    expect(getBody().toString()).toBe("hello");
  });

  it("returns full content when no range is requested", async () => {
    const req = {
      headers: { cookie: `${SESSION_COOKIE_NAME}=token` },
    } as http.IncomingMessage;
    const { res, getBody, getHeaders, getStatus } = createMockResponse();

    await handleRecordingDownloadRequest(req, res, recordingId);
    await once(res as any, "finish");

    expect(getStatus()).toBe(200);
    expect(getHeaders()["Accept-Ranges"]).toBe("bytes");
    expect(getHeaders()["Content-Length"]).toBe(11);
    expect(getBody().toString()).toBe("hello world");
  });

  it("rejects invalid ranges", async () => {
    const req = {
      headers: { cookie: `${SESSION_COOKIE_NAME}=token`, range: "bytes=50-40" },
    } as http.IncomingMessage;
    const { res, getBody, getHeaders, getStatus } = createMockResponse();

    await handleRecordingDownloadRequest(req, res, recordingId);
    await once(res as any, "finish");

    expect(getStatus()).toBe(416);
    expect(getHeaders()["Content-Range"]).toBe("bytes */11");
    expect(getBody().length).toBe(0);
  });

  afterEach(async () => {
    vi.resetAllMocks();
    await fs.rm(testRootDir, { recursive: true, force: true });
  });
});
