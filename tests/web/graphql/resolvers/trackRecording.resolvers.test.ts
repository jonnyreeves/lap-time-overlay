import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockGraphQLContext } from "../context.mock.js";
import { trackRecordingResolvers } from "../../../../src/web/graphql/resolvers/trackRecording.js";
import * as recordingsDb from "../../../../src/db/track_recordings.js";
import {
  deleteRecordingAndFiles,
  RecordingUploadError,
  startRecordingUploadSession,
} from "../../../../src/web/recordings/service.js";
import {
  generateOverlayPreview,
  OverlayPreviewError,
} from "../../../../src/web/recordings/overlayPreview.js";

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

vi.mock("../../../../src/web/recordings/overlayPreview.js", () => ({
  generateOverlayPreview: vi.fn(),
  OverlayPreviewError: class MockOverlayPreviewError extends Error {
    constructor(message: string, public code: string = "VALIDATION_FAILED") {
      super(message);
    }
  },
}));

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
      isPrimary: true,
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
            trimStartMs: null,
            trimEndMs: null,
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
      sources: [{ fileName: "clip.mp4", sizeBytes: 10, trimStartMs: null, trimEndMs: null }],
    });
    expect(result.uploadTargets[0]?.uploadUrl).toBe("/upload");
    expect(result.recording.id).toBe("rec1");
  });

  it("validates trim offsets belong to first/last file", async () => {
    await expect(
      trackRecordingResolvers.startTrackRecordingUpload(
        {
          input: {
            sessionId: "s1",
            sources: [
              { fileName: "first.mp4", sizeBytes: 10 },
              { fileName: "second.mp4", sizeBytes: 20, trimStartMs: 500 },
            ],
          },
        },
        context
      )
    ).rejects.toThrowError("trimStartMs can only be set on the first file");

    await expect(
      trackRecordingResolvers.startTrackRecordingUpload(
        {
          input: {
            sessionId: "s1",
            sources: [
              { fileName: "only.mp4", sizeBytes: 10, trimStartMs: 1000, trimEndMs: 500 },
            ],
          },
        },
        context
      )
    ).rejects.toThrowError("trimStartMs must be less than trimEndMs");
  });

  it("updates lap one offset on a ready recording", async () => {
    const recording: recordingsDb.TrackRecordingRecord = {
      id: "rec-ready",
      sessionId: "s1",
      userId: "user-1",
      mediaId: "media/path",
      isPrimary: true,
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
    };
    vi.spyOn(recordingsDb, "findTrackRecordingById").mockReturnValue(recording);
    vi.spyOn(recordingsDb, "updateTrackRecording").mockReturnValue({
      ...recording,
      lapOneOffset: 1.25,
    });

    const result = await trackRecordingResolvers.updateTrackRecording(
      { input: { id: recording.id, lapOneOffset: 1.25 } },
      context
    );

    expect(recordingsDb.updateTrackRecording).toHaveBeenCalledWith(recording.id, {
      lapOneOffset: 1.25,
    });
    expect(result.recording.lapOneOffset).toBe(1.25);
  });

  it("rejects lap offset updates when recording is not ready", async () => {
    const recording: recordingsDb.TrackRecordingRecord = {
      id: "rec-uploading",
      sessionId: "s1",
      userId: "user-1",
      mediaId: "media/path",
      isPrimary: true,
      lapOneOffset: 0,
      description: null,
      status: "uploading",
      error: null,
      sizeBytes: null,
      durationMs: null,
      fps: null,
      combineProgress: 0.2,
      createdAt: 0,
      updatedAt: 0,
    };
    vi.spyOn(recordingsDb, "findTrackRecordingById").mockReturnValue(recording);

    await expect(
      trackRecordingResolvers.updateTrackRecording(
        { input: { id: recording.id, lapOneOffset: 0.5 } },
        context
      )
    ).rejects.toThrowError("Recording is not ready for lap offset updates");
  });

  it("marks a recording as primary", async () => {
    const recording: recordingsDb.TrackRecordingRecord = {
      id: "rec-primary",
      sessionId: "s1",
      userId: "user-1",
      mediaId: "media/path",
      isPrimary: false,
      lapOneOffset: 1,
      description: null,
      status: "ready",
      error: null,
      sizeBytes: null,
      durationMs: null,
      fps: null,
      combineProgress: 1,
      createdAt: 0,
      updatedAt: 0,
    };
    vi.spyOn(recordingsDb, "findTrackRecordingById").mockReturnValue(recording);
    vi.spyOn(recordingsDb, "markPrimaryRecording").mockReturnValue({ ...recording, isPrimary: true });

    const result = await trackRecordingResolvers.markPrimaryTrackRecording(
      { id: recording.id },
      context
    );

    expect(recordingsDb.markPrimaryRecording).toHaveBeenCalledWith(recording.id);
    expect(result.recording.isPrimary).toBe(true);
  });

  it("rejects unauthenticated overlay preview requests", async () => {
    await expect(
      trackRecordingResolvers.renderOverlayPreview(
        { input: { recordingId: "rec1", lapId: "lap1", offsetSeconds: 0 } },
        { ...context, currentUser: null }
      )
    ).rejects.toThrowError("Authentication required");
  });

  it("delegates overlay preview generation", async () => {
    vi.mocked(generateOverlayPreview).mockResolvedValue({
      id: "prev1",
      previewUrl: "/previews/rec1/file.png",
      previewTimeSeconds: 12,
      requestedOffsetSeconds: 5,
      usedOffsetSeconds: 5,
      lapId: "lap1",
      lapNumber: 1,
      recordingId: "rec1",
      generatedAt: new Date(0).toISOString(),
    });

    const result = await trackRecordingResolvers.renderOverlayPreview(
      { input: { recordingId: "rec1", lapId: "lap1", offsetSeconds: 5 } },
      context
    );

    expect(generateOverlayPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        recordingId: "rec1",
        lapId: "lap1",
        offsetSeconds: 5,
        currentUserId: "user-1",
        styleOverrides: {},
      })
    );
    expect(result.preview.previewUrl).toContain("/previews/rec1/");
  });

  it("normalizes overlay style input", async () => {
    vi.mocked(generateOverlayPreview).mockResolvedValue({
      id: "prev1",
      previewUrl: "/previews/rec1/file.png",
      previewTimeSeconds: 8,
      requestedOffsetSeconds: 2,
      usedOffsetSeconds: 2,
      lapId: "lap1",
      lapNumber: 1,
      recordingId: "rec1",
      generatedAt: new Date(0).toISOString(),
    });

    await trackRecordingResolvers.renderOverlayPreview(
      {
        input: {
          recordingId: "rec1",
          lapId: "lap1",
          offsetSeconds: 2,
          style: {
          textColor: "YELLOW",
          textSize: 200,
          overlayPosition: "TOP_RIGHT",
          boxOpacity: 1.2,
          showLapDeltas: false,
        },
      },
    },
      context
    );

    expect(generateOverlayPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        styleOverrides: {
          textColor: "#ffd500",
          textSize: 192,
          overlayPosition: "top-right",
          boxOpacity: 1,
          showLapDeltas: false,
        },
      })
    );
  });

  it("maps overlay preview errors", async () => {
    vi.mocked(generateOverlayPreview).mockRejectedValue(
      new OverlayPreviewError("no preview", "NOT_FOUND")
    );

    await expect(
      trackRecordingResolvers.renderOverlayPreview(
        { input: { recordingId: "rec1", lapId: "lap1", offsetSeconds: 0 } },
        context
      )
    ).rejects.toThrowError("no preview");
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
      isPrimary: true,
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
