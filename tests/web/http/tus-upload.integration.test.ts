import { once } from "node:events";
import type http from "node:http";
import path from "node:path";
import { Readable, Writable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTrackLayout } from "../../../src/db/track_layouts.js";
import { findTrackRecordingSourceById } from "../../../src/db/track_recording_sources.js";
import { createTrackSessionWithLaps } from "../../../src/db/track_sessions.js";
import { createTrack } from "../../../src/db/tracks.js";
import { createUser } from "../../../src/db/users.js";
import { SESSION_COOKIE_NAME } from "../../../src/web/auth/cookies.js";
import { loadUserFromSession, refreshSession } from "../../../src/web/auth/service.js";
import { handleTusUploadRequest } from "../../../src/web/http/tus.js";
import { trackRecordingResolvers } from "../../../src/web/graphql/resolvers/trackRecording.js";
import { createMockGraphQLContext } from "../graphql/context.mock.js";
import { setupTestDb, teardownTestDb } from "../../db/test_setup.js";

vi.mock("../../../src/web/config.js", () => {
  const testRoot = path.join(process.cwd(), "temp", "tus-upload-tests");
  return {
    projectRoot: process.cwd(),
    publicDir: path.join(process.cwd(), "public"),
    sessionRecordingsDir: path.join(testRoot, "session_recordings"),
    mediaLibraryProjectionDir: path.join(testRoot, "media_library"),
    tmpUploadsDir: path.join(testRoot, "uploads"),
    tmpRendersDir: path.join(testRoot, "renders"),
    tmpPreviewsDir: path.join(testRoot, "previews"),
    ensureWorkDirs: async () => {},
  };
});

vi.mock("../../../src/web/auth/service.js", () => ({
  loadUserFromSession: vi.fn(),
  refreshSession: vi.fn(),
}));

const sessionToken = "session-token";
const cookieHeader = `${SESSION_COOKIE_NAME}=${sessionToken}`;

function createMockRequest({
  method,
  headers,
  body,
}: {
  method: string;
  headers?: http.IncomingHttpHeaders;
  body?: Buffer;
}): http.IncomingMessage {
  const stream = Readable.from(body ? [body] : []) as http.IncomingMessage;
  stream.method = method;
  stream.headers = headers ?? {};
  stream.socket = { remoteAddress: "127.0.0.1" } as http.IncomingMessage["socket"];
  return stream;
}

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

function buildUploadMetadata(fields: Record<string, string>) {
  return Object.entries(fields)
    .map(([key, value]) => `${key} ${Buffer.from(value).toString("base64")}`)
    .join(",");
}

async function runTusRequest({
  method,
  sourceId,
  headers,
  body,
}: {
  method: string;
  sourceId: string | null;
  headers?: http.IncomingHttpHeaders;
  body?: Buffer;
}) {
  const req = createMockRequest({ method, headers, body });
  const { res, getBody, getHeaders, getStatus } = createMockResponse();
  await handleTusUploadRequest(req, res, sourceId);
  await once(res as any, "finish");
  return { status: getStatus(), headers: getHeaders(), body: getBody() };
}

describe("tus upload creation constraints", () => {
  beforeEach(() => {
    setupTestDb();
    vi.mocked(refreshSession).mockReturnValue(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
    teardownTestDb();
  });

  it("rejects Upload-Length smaller than the source sizeBytes", async () => {
    const user = createUser("upload-user", "hashed");
    const publicUser = {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      isAdmin: user.isAdmin,
    };
    vi.mocked(loadUserFromSession).mockImplementation((token) => {
      if (token !== sessionToken) return null;
      return { user: publicUser, expiresAt: Date.now() + 1000 };
    });

    const track = createTrack("Tus Track");
    const layout = createTrackLayout(track.id, "Full");
    const { trackSession } = createTrackSessionWithLaps({
      date: "2024-01-01",
      format: "Race",
      classification: 1,
      trackId: track.id,
      userId: user.id,
      trackLayoutId: layout.id,
      laps: [{ lapNumber: 1, time: 60 }],
    });
    const { context } = createMockGraphQLContext({ currentUser: publicUser });
    const sourceSize = 12;
    const session = await trackRecordingResolvers.startTrackRecordingUpload(
      {
        input: {
          sessionId: trackSession.id,
          sources: [{ fileName: "mismatch.mp4", sizeBytes: sourceSize }],
        },
      },
      context
    );

    const target = session.uploadTargets[0];
    const metadata = buildUploadMetadata({
      sourceId: target.id,
      uploadToken: target.uploadToken,
    });

    const result = await runTusRequest({
      method: "POST",
      sourceId: null,
      headers: {
        "upload-length": "10",
        "upload-metadata": metadata,
        "upload-token": target.uploadToken,
        cookie: cookieHeader,
      },
    });

    expect(result.status).toBe(409);

    const sourceRecord = findTrackRecordingSourceById(target.id);
    expect(sourceRecord?.sizeBytes).toBe(sourceSize);
    expect(sourceRecord?.status).toBe("pending");
  });
});
