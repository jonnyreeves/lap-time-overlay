import { once } from "node:events";
import fs from "node:fs";
import fsp from "node:fs/promises";
import type http from "node:http";
import path from "node:path";
import { Readable, Writable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTrackLayout } from "../../../src/db/track_layouts.js";
import { findTrackRecordingById } from "../../../src/db/track_recordings.js";
import {
  findTrackRecordingSourceById,
  findTrackRecordingSourcesByRecordingId,
} from "../../../src/db/track_recording_sources.js";
import { createTrackSessionWithLaps } from "../../../src/db/track_sessions.js";
import { createTrack } from "../../../src/db/tracks.js";
import { createUser } from "../../../src/db/users.js";
import { SESSION_COOKIE_NAME } from "../../../src/web/auth/cookies.js";
import { loadUserFromSession, refreshSession } from "../../../src/web/auth/service.js";
import { sessionRecordingsDir } from "../../../src/web/config.js";
import { handleTusUploadRequest } from "../../../src/web/http/tus.js";
import { trackRecordingResolvers } from "../../../src/web/graphql/resolvers/trackRecording.js";
import { createMockGraphQLContext } from "../graphql/context.mock.js";
import { setupTestDb, teardownTestDb } from "../../db/test_setup.js";

vi.mock("../../../src/web/config.js", () => {
  const testRoot = path.join(process.cwd(), "temp", "tus-uploads-tests");
  return {
    projectRoot: process.cwd(),
    publicDir: path.join(process.cwd(), "public"),
    sessionRecordingsDir: path.join(testRoot, "session_recordings"),
    mediaLibraryProjectionDir: path.join(testRoot, "media_library"),
    tmpUploadsDir: path.join(testRoot, "uploads"),
    tmpRendersDir: path.join(testRoot, "renders"),
    tmpPreviewsDir: path.join(testRoot, "previews"),
    ensureWorkDirs: async () => { },
  };
});

vi.mock("../../../src/web/auth/service.js", () => ({
  loadUserFromSession: vi.fn(),
  refreshSession: vi.fn(),
}));

vi.mock("fluent-ffmpeg", () => {
  const readConcatInputs = (concatPath: string) => {
    const contents = fs.readFileSync(concatPath, "utf8");
    return contents
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^file '(.*)'$/);
        if (!match) return null;
        return match[1].replace(/'\\\\''/g, "'");
      })
      .filter((value): value is string => Boolean(value));
  };

  const mock = () => {
    const inputs: string[] = [];
    const handlers: Record<string, ((payload?: unknown) => void)[]> = {
      progress: [],
      error: [],
      end: [],
      stderr: [],
    };

    const api = {
      input: (file?: string) => {
        if (file) {
          inputs.push(file);
        }
        return api;
      },
      inputOptions: () => api,
      outputOptions: () => api,
      seekInput: () => api,
      duration: () => api,
      on: (event: keyof typeof handlers, cb: (payload?: unknown) => void) => {
        handlers[event].push(cb);
        return api;
      },
      save: (output: string) => {
        try {
          fs.mkdirSync(path.dirname(output), { recursive: true });
          let buffer = Buffer.from("mock-output");
          if (inputs.length === 1) {
            const input = inputs[0];
            if (input.endsWith("concat.txt")) {
              const sources = readConcatInputs(input);
              buffer = Buffer.concat(
                sources.map((source) => fs.readFileSync(source))
              );
            } else if (fs.existsSync(input)) {
              buffer = fs.readFileSync(input);
            }
          }
          fs.writeFileSync(output, buffer);
          handlers.progress.forEach((cb) => cb({ percent: 100 }));
          handlers.end.forEach((cb) => cb());
        } catch (err) {
          handlers.error.forEach((cb) => cb(err));
        }
        return api;
      },
    };
    return api;
  };

  mock.ffprobe = (_file: string, cb: (err: Error | null, data?: unknown) => void) => {
    cb(null, {
      format: { duration: 1 },
      streams: [{ codec_type: "video", avg_frame_rate: "30/1" }],
    });
  };

  return { default: mock };
});

const testRootDir = path.join(process.cwd(), "temp", "tus-uploads-tests");

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

describe("tus upload integration", () => {
  beforeEach(async () => {
    setupTestDb();
    vi.mocked(refreshSession).mockReturnValue(null);
    await fsp.mkdir(sessionRecordingsDir, { recursive: true });
  });

  afterEach(async () => {
    vi.resetAllMocks();
    await fsp.rm(testRootDir, { recursive: true, force: true });
    teardownTestDb();
  });

  it("uploads multiple sources via tus", async () => {
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
    const sources = [Buffer.from("first-source"), Buffer.from("second-source")];
    const sourceInputs = sources.map((buffer, idx) => ({
      fileName: `source-${idx + 1}.mp4`,
      sizeBytes: buffer.length,
    }));
    const { context } = createMockGraphQLContext({ currentUser: publicUser });

    const tusSession = await trackRecordingResolvers.startTrackRecordingUpload(
      { input: { sessionId: trackSession.id, sources: sourceInputs } },
      context
    );

    for (const target of tusSession.uploadTargets) {
      const metadata = buildUploadMetadata({
        sourceId: target.id,
        uploadToken: target.uploadToken,
      });
      const createResult = await runTusRequest({
        method: "POST",
        sourceId: null,
        headers: {
          "upload-length": target.sizeBytes?.toString(10) ?? "0",
          "upload-metadata": metadata,
          "upload-token": target.uploadToken,
          cookie: cookieHeader,
        },
      });
      expect(createResult.status).toBe(201);
    }

    const [firstTarget, secondTarget] = tusSession.uploadTargets;
    const firstChunks = [sources[0].subarray(0, 5), sources[0].subarray(5)];
    const secondChunks = [sources[1].subarray(0, 6), sources[1].subarray(6)];

    await runTusRequest({
      method: "PATCH",
      sourceId: firstTarget.id,
      headers: {
        "upload-offset": "0",
        "upload-token": firstTarget.uploadToken,
        "content-length": firstChunks[0].length.toString(10),
        "content-type": "application/offset+octet-stream",
        cookie: cookieHeader,
      },
      body: firstChunks[0],
    });

    await runTusRequest({
      method: "PATCH",
      sourceId: secondTarget.id,
      headers: {
        "upload-offset": "0",
        "upload-token": secondTarget.uploadToken,
        "content-length": secondChunks[0].length.toString(10),
        "content-type": "application/offset+octet-stream",
        cookie: cookieHeader,
      },
      body: secondChunks[0],
    });

    await runTusRequest({
      method: "PATCH",
      sourceId: firstTarget.id,
      headers: {
        "upload-offset": firstChunks[0].length.toString(10),
        "upload-token": firstTarget.uploadToken,
        "content-length": firstChunks[1].length.toString(10),
        "content-type": "application/offset+octet-stream",
        cookie: cookieHeader,
      },
      body: firstChunks[1],
    });

    await runTusRequest({
      method: "PATCH",
      sourceId: secondTarget.id,
      headers: {
        "upload-offset": secondChunks[0].length.toString(10),
        "upload-token": secondTarget.uploadToken,
        "content-length": secondChunks[1].length.toString(10),
        "content-type": "application/offset+octet-stream",
        cookie: cookieHeader,
      },
      body: secondChunks[1],
    });

    const tusRecording = findTrackRecordingById(tusSession.recording.id);
    expect(tusRecording?.status).toBe("ready");
    expect(tusRecording).toBeTruthy();

    const tusSources = findTrackRecordingSourcesByRecordingId(tusSession.recording.id).sort(
      (a, b) => a.ordinal - b.ordinal
    );
    expect(tusSources).toHaveLength(2);

    for (let i = 0; i < tusSources.length; i += 1) {
      expect(tusSources[i]?.status).toBe("uploaded");
      expect(tusSources[i]?.uploadedBytes).toBe(sources[i]?.length);
      expect(tusSources[i]?.sizeBytes).toBe(sources[i]?.length);
    }

    const expectedSize = sources[0].length + sources[1].length;
    const tusOutput = path.join(sessionRecordingsDir, tusRecording!.mediaId);
    const tusStats = await fsp.stat(tusOutput);

    expect(tusStats.size).toBe(expectedSize);
    expect(tusRecording?.sizeBytes).toBe(expectedSize);
  });

  it("resumes uploads with HEAD offsets", async () => {
    const user = createUser("resume-user", "hashed");
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

    const track = createTrack("Resume Track");
    const layout = createTrackLayout(track.id, "Full");
    const { trackSession } = createTrackSessionWithLaps({
      date: "2024-01-02",
      format: "Race",
      classification: 2,
      trackId: track.id,
      userId: user.id,
      trackLayoutId: layout.id,
      laps: [{ lapNumber: 1, time: 60 }],
    });
    const source = Buffer.from("resume-data");
    const { context } = createMockGraphQLContext({ currentUser: publicUser });
    const session = await trackRecordingResolvers.startTrackRecordingUpload(
      {
        input: {
          sessionId: trackSession.id,
          sources: [{ fileName: "resume.mp4", sizeBytes: source.length }],
        },
      },
      context
    );
    const target = session.uploadTargets[0];
    const metadata = buildUploadMetadata({
      sourceId: target.id,
      uploadToken: target.uploadToken,
    });

    const createResult = await runTusRequest({
      method: "POST",
      sourceId: null,
      headers: {
        "upload-length": source.length.toString(10),
        "upload-metadata": metadata,
        "upload-token": target.uploadToken,
        cookie: cookieHeader,
      },
    });
    expect(createResult.status).toBe(201);

    const firstChunk = source.subarray(0, 6);
    const secondChunk = source.subarray(6);

    const firstPatch = await runTusRequest({
      method: "PATCH",
      sourceId: target.id,
      headers: {
        "upload-offset": "0",
        "upload-token": target.uploadToken,
        "content-length": firstChunk.length.toString(10),
        "content-type": "application/offset+octet-stream",
        cookie: cookieHeader,
      },
      body: firstChunk,
    });
    expect(firstPatch.status).toBe(204);

    const headResult = await runTusRequest({
      method: "HEAD",
      sourceId: target.id,
      headers: {
        "upload-token": target.uploadToken,
        cookie: cookieHeader,
      },
    });

    expect(headResult.status).toBe(200);
    expect(headResult.headers["Upload-Offset"]).toBe(firstChunk.length.toString(10));
    expect(headResult.headers["Upload-Length"]).toBe(source.length.toString(10));

    const secondPatch = await runTusRequest({
      method: "PATCH",
      sourceId: target.id,
      headers: {
        "upload-offset": firstChunk.length.toString(10),
        "upload-token": target.uploadToken,
        "content-length": secondChunk.length.toString(10),
        "content-type": "application/offset+octet-stream",
        cookie: cookieHeader,
      },
      body: secondChunk,
    });
    expect(secondPatch.status).toBe(204);
    expect(secondPatch.headers["Upload-Offset"]).toBe(source.length.toString(10));

    const updatedSource = findTrackRecordingSourceById(target.id);
    const updatedRecording = findTrackRecordingById(session.recording.id);
    expect(updatedSource?.status).toBe("uploaded");
    expect(updatedSource?.uploadedBytes).toBe(source.length);
    expect(updatedRecording?.status).toBe("ready");
  });

  it("rejects token mismatches without writing files", async () => {
    const user = createUser("token-user", "hashed");
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

    const track = createTrack("Token Track");
    const layout = createTrackLayout(track.id, "Full");
    const { trackSession } = createTrackSessionWithLaps({
      date: "2024-01-03",
      format: "Race",
      classification: 3,
      trackId: track.id,
      userId: user.id,
      trackLayoutId: layout.id,
      laps: [{ lapNumber: 1, time: 60 }],
    });
    const { context } = createMockGraphQLContext({ currentUser: publicUser });
    const session = await trackRecordingResolvers.startTrackRecordingUpload(
      {
        input: {
          sessionId: trackSession.id,
          sources: [{ fileName: "token.mp4", sizeBytes: 10 }],
        },
      },
      context
    );
    const target = session.uploadTargets[0];
    const metadata = buildUploadMetadata({
      sourceId: target.id,
      uploadToken: "bad-token",
    });
    const result = await runTusRequest({
      method: "POST",
      sourceId: null,
      headers: {
        "upload-length": "10",
        "upload-metadata": metadata,
        "upload-token": "bad-token",
        cookie: cookieHeader,
      },
    });

    expect(result.status).toBe(401);

    const sourceRecord = findTrackRecordingSourceById(target.id);
    expect(sourceRecord).toBeTruthy();
    expect(sourceRecord?.status).toBe("pending");
    await expect(fsp.stat(sourceRecord!.storagePath)).rejects.toThrow();
  });
});
