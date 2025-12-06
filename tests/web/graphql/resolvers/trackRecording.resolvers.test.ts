import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockGraphQLContext } from "../context.mock.js";
import { trackRecordingResolvers } from "../../../../src/web/graphql/resolvers/trackRecording.js";
import * as recordingsDb from "../../../../src/db/track_recordings.js";
import {
  deleteRecordingAndFiles,
  RecordingUploadError,
  startRecordingUploadSession,
} from "../../../../src/web/recordings/service.js";

vi.mock("../../../../src/web/recordings/service.js", async () => {
  const actual = await vi.importActual<typeof import("../../../../src/web/recordings/service.js")>(
    "../../../../src/web/recordings/service.js"
  );
  return {
    ...actual,
    startRecordingUploadSession: vi.fn(),
    deleteRecordingAndFiles: vi.fn(),
    RecordingUploadError: class MockUploadError extends Error {
      constructor(message: string, public statusCode: number = 400) {
        super(message);
      }
    },
  };
});

describe("trackRecording resolvers", () => {
  const { context } = createMockGraphQLContext({
    currentUser: { id: "user-1", username: "sam", createdAt: Date.now() },
    sessionToken: "token",
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects unauthenticated upload requests", async () => {
    await expect(
      trackRecordingResolvers.startTrackRecordingUpload(
        { input: { sessionId: "s1", sources: [{ fileName: "clip.mp4", sizeBytes: 10 }] } },
        { ...context, currentUser: null }
      )
    ).rejects.toThrowError("Authentication required");
  });

  it("calls service to start upload and returns payload", async () => {
    const recording: recordingsDb.TrackRecordingRecord = {
      id: "rec1",
      sessionId: "s1",
      userId: "user-1",
      mediaId: "media/path",
      lapOneOffset: 0,
      description: "desc",
      status: "pending_upload",
      error: null,
      sizeBytes: null,
      durationMs: null,
      fps: null,
      combineProgress: 0,
      createdAt: 0,
      updatedAt: 0,
    };
    vi.mocked(startRecordingUploadSession).mockResolvedValue({
      recording,
      uploadTargets: [
        {
          source: {
            id: "src1",
            recordingId: "rec1",
            fileName: "clip.mp4",
            ordinal: 1,
            sizeBytes: 10,
            uploadedBytes: 0,
            storagePath: "/tmp/clip",
            uploadToken: "t",
            status: "pending",
            createdAt: 0,
            updatedAt: 0,
          },
          uploadUrl: "/upload",
        },
      ],
    });

    const result = await trackRecordingResolvers.startTrackRecordingUpload(
      {
        input: {
          sessionId: "s1",
          description: "desc",
          sources: [{ fileName: "clip.mp4", sizeBytes: 10 }],
        },
      },
      context
    );

    expect(startRecordingUploadSession).toHaveBeenCalledWith({
      sessionId: "s1",
      userId: "user-1",
      description: "desc",
      lapOneOffset: 0,
      sources: [{ fileName: "clip.mp4", sizeBytes: 10 }],
    });
    expect(result.uploadTargets[0]?.uploadUrl).toBe("/upload");
    expect(result.recording.id).toBe("rec1");
  });

  it("maps service errors to GraphQL errors", async () => {
    vi.mocked(startRecordingUploadSession).mockRejectedValue(
      new RecordingUploadError("boom", 404)
    );
    await expect(
      trackRecordingResolvers.startTrackRecordingUpload(
        { input: { sessionId: "s1", sources: [{ fileName: "clip.mp4" }] } },
        context
      )
    ).rejects.toThrowError("boom");
  });

  it("deletes a recording when owned by the user", async () => {
    vi.spyOn(recordingsDb, "findTrackRecordingById").mockReturnValue({
      id: "rec1",
      sessionId: "s1",
      userId: "user-1",
      mediaId: "media/path",
      lapOneOffset: 0,
      description: null,
      status: "ready",
      error: null,
      sizeBytes: null,
      durationMs: null,
      fps: null,
      combineProgress: 1,
      createdAt: 0,
      updatedAt: 0,
    });
    vi.mocked(deleteRecordingAndFiles).mockResolvedValue(true);

    const result = await trackRecordingResolvers.deleteTrackRecording({ id: "rec1" }, context);

    expect(deleteRecordingAndFiles).toHaveBeenCalledWith("rec1", "user-1");
    expect(result.success).toBe(true);
  });
});
