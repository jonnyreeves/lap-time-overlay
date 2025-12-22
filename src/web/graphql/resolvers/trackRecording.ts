import { GraphQLError } from "graphql";
import { findTrackRecordingById, markPrimaryRecording, updateTrackRecording } from "../../../db/track_recordings.js";
import type { GraphQLContext } from "../context.js";
import { RecordingUploadError, startRecordingUploadSession, deleteRecordingAndFiles } from "../../recordings/service.js";
import { generateOverlayPreview, OverlayPreviewError } from "../../recordings/overlayPreview.js";
import { burnRecordingOverlay, OverlayBurnError } from "../../recordings/overlayBurn.js";
import { toTrackRecordingPayload } from "./trackSession.js";
import type { OverlayStyle } from "../../../ffmpeg/overlay.js";

function toUploadError(err: unknown): GraphQLError {
  if (err instanceof RecordingUploadError) {
    const code =
      err.statusCode === 404
        ? "NOT_FOUND"
        : err.statusCode === 401 || err.statusCode === 403
          ? "UNAUTHENTICATED"
          : "VALIDATION_FAILED";
    return new GraphQLError(err.message, { extensions: { code } });
  }
  console.error("Unexpected recording upload error", err);
  return new GraphQLError("Internal error", { extensions: { code: "INTERNAL_SERVER_ERROR" } });
}

function toOverlayPreviewError(err: unknown): GraphQLError {
  if (err instanceof OverlayPreviewError) {
    const code = err.code ?? "VALIDATION_FAILED";
    return new GraphQLError(err.message, { extensions: { code } });
  }
  console.error("Unexpected overlay preview error", err);
  return new GraphQLError("Internal error", { extensions: { code: "INTERNAL_SERVER_ERROR" } });
}

function toOverlayBurnError(err: unknown): GraphQLError {
  if (err instanceof OverlayBurnError) {
    const code = err.code ?? "VALIDATION_FAILED";
    return new GraphQLError(err.message, { extensions: { code } });
  }
  console.error("Unexpected overlay burn error", err);
  return new GraphQLError("Internal error", { extensions: { code: "INTERNAL_SERVER_ERROR" } });
}

const overlayTextColorMap = {
  WHITE: "#ffffff",
  YELLOW: "#ffd500",
} as const;

const overlayPositionMap = {
  TOP_LEFT: "top-left",
  TOP_RIGHT: "top-right",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_RIGHT: "bottom-right",
} as const;

const overlayExportQualityMap = {
  BEST: "best",
  GOOD: "good",
} as const;

type OverlayStyleInput =
  | {
      textColor?: keyof typeof overlayTextColorMap | null;
      textSize?: number | null;
      detailTextSize?: number | null;
      overlayPosition?: keyof typeof overlayPositionMap | null;
      boxOpacity?: number | null;
      showLapCounter?: boolean | null;
      showPosition?: boolean | null;
      showLapDeltas?: boolean | null;
    }
  | null
  | undefined;

function normalizeOverlayStyleInput(style: OverlayStyleInput): Partial<OverlayStyle> {
  const overrides: Partial<OverlayStyle> = {};
  if (!style) return overrides;

  const colorKey = style.textColor;
  if (colorKey && colorKey in overlayTextColorMap) {
    overrides.textColor = overlayTextColorMap[colorKey];
  }

  const textSize = style.textSize;
  if (Number.isFinite(textSize)) {
    const rounded = Math.round(textSize as number);
    overrides.textSize = Math.min(192, Math.max(12, rounded));
  }

  const detailTextSize = style.detailTextSize;
  if (Number.isFinite(detailTextSize)) {
    const rounded = Math.round(detailTextSize as number);
    overrides.detailTextSize = Math.min(192, Math.max(12, rounded));
  }

  const positionKey = style.overlayPosition;
  if (positionKey && positionKey in overlayPositionMap) {
    overrides.overlayPosition = overlayPositionMap[positionKey];
  }

  const boxOpacity = style.boxOpacity;
  if (Number.isFinite(boxOpacity)) {
    overrides.boxOpacity = Math.min(1, Math.max(0, boxOpacity as number));
  }

  if (typeof style.showLapCounter === "boolean") {
    overrides.showLapCounter = style.showLapCounter;
  }

  if (typeof style.showPosition === "boolean") {
    overrides.showPosition = style.showPosition;
  }

  if (typeof style.showLapDeltas === "boolean") {
    overrides.showLapDeltas = style.showLapDeltas;
  }

  return overrides;
}

export const trackRecordingResolvers = {
  startTrackRecordingUpload: async (
    args: {
      input?: {
        sessionId?: string;
        description?: string | null;
        lapOneOffset?: number | null;
        sources?:
          | { fileName?: string | null; sizeBytes?: number | null; trimStartMs?: number | null; trimEndMs?: number | null }[]
          | null;
      };
    },
    context: GraphQLContext
  ) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    const input = args.input;
    if (!input?.sessionId || !input.sources || input.sources.length === 0) {
      throw new GraphQLError("sessionId and at least one source are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const totalSources = input.sources.length;

    const sources = input.sources.map((source, idx) => {
      const name = source?.fileName?.trim();
      if (!name) {
        throw new GraphQLError(`Source ${idx + 1} fileName is required`, {
          extensions: { code: "VALIDATION_FAILED" },
        });
      }
      const size = source?.sizeBytes;
      const rawTrimStart = source?.trimStartMs;
      const rawTrimEnd = source?.trimEndMs;
      const trimStartMs = rawTrimStart == null ? null : Number(rawTrimStart);
      const trimEndMs = rawTrimEnd == null ? null : Number(rawTrimEnd);

      if (trimStartMs != null && (!Number.isFinite(trimStartMs) || trimStartMs < 0)) {
        throw new GraphQLError(`Source ${idx + 1} trimStartMs must be a non-negative number`, {
          extensions: { code: "VALIDATION_FAILED" },
        });
      }
      if (trimEndMs != null && (!Number.isFinite(trimEndMs) || trimEndMs < 0)) {
        throw new GraphQLError(`Source ${idx + 1} trimEndMs must be a non-negative number`, {
          extensions: { code: "VALIDATION_FAILED" },
        });
      }

      const isFirst = idx === 0;
      const isLast = idx === totalSources - 1;

      if (trimStartMs != null && !isFirst) {
        throw new GraphQLError("trimStartMs can only be set on the first file", {
          extensions: { code: "VALIDATION_FAILED" },
        });
      }
      if (trimEndMs != null && !isLast) {
        throw new GraphQLError("trimEndMs can only be set on the last file", {
          extensions: { code: "VALIDATION_FAILED" },
        });
      }
      if (trimStartMs != null && trimEndMs != null && trimStartMs >= trimEndMs) {
        throw new GraphQLError("trimStartMs must be less than trimEndMs", {
          extensions: { code: "VALIDATION_FAILED" },
        });
      }

      return {
        fileName: name,
        sizeBytes: typeof size === "number" && size >= 0 ? size : null,
        trimStartMs,
        trimEndMs,
      };
    });

    try {
      const { recording, uploadTargets } = await startRecordingUploadSession({
        sessionId: input.sessionId,
        userId: context.currentUser.id,
        description: input.description ?? null,
        lapOneOffset: input.lapOneOffset ?? 0,
        sources,
      });

      return {
        recording: toTrackRecordingPayload(recording, context.repositories),
        uploadTargets: uploadTargets.map((target) => ({
          id: target.source.id,
          fileName: target.source.fileName,
          sizeBytes: target.source.sizeBytes,
          uploadedBytes: target.source.uploadedBytes,
          status: target.source.status.toUpperCase(),
          ordinal: target.source.ordinal,
          uploadUrl: target.uploadUrl,
        })),
      };
    } catch (err) {
      throw toUploadError(err);
    }
  },
  markPrimaryTrackRecording: async (args: { id?: string }, context: GraphQLContext) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    if (!args.id) {
      throw new GraphQLError("id is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const recording = findTrackRecordingById(args.id);
    if (!recording) {
      throw new GraphQLError("Recording not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    if (recording.userId !== context.currentUser.id) {
      throw new GraphQLError("You do not have access to this recording", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    const updated = markPrimaryRecording(recording.id);
    if (!updated) {
      throw new GraphQLError("Recording not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    return { recording: toTrackRecordingPayload(updated, context.repositories) };
  },
  updateTrackRecording: async (
    args: { input?: { id?: string; lapOneOffset?: number | null } },
    context: GraphQLContext
  ) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    const input = args.input;
    if (!input?.id) {
      throw new GraphQLError("id is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    const lapOneOffset = Number(input.lapOneOffset);
    if (!Number.isFinite(lapOneOffset) || lapOneOffset < 0) {
      throw new GraphQLError("lapOneOffset must be a non-negative number", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const recording = findTrackRecordingById(input.id);
    if (!recording) {
      throw new GraphQLError("Recording not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    if (recording.userId !== context.currentUser.id) {
      throw new GraphQLError("You do not have access to this recording", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    if (recording.status !== "ready") {
      throw new GraphQLError("Recording is not ready for lap offset updates", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const updated = updateTrackRecording(recording.id, { lapOneOffset }) ?? recording;
    return { recording: toTrackRecordingPayload(updated, context.repositories) };
  },
  renderOverlayPreview: async (
    args: {
      input?: {
        recordingId?: string;
        lapId?: string;
        offsetSeconds?: number | null;
        style?: OverlayStyleInput;
      };
    },
    context: GraphQLContext
  ) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    const input = args.input;
    if (!input?.recordingId || !input?.lapId) {
      throw new GraphQLError("recordingId and lapId are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    const offsetSeconds = Number(input.offsetSeconds);
    if (!Number.isFinite(offsetSeconds) || offsetSeconds < 0) {
      throw new GraphQLError("offsetSeconds must be zero or greater", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const styleOverrides = normalizeOverlayStyleInput(input.style);

    try {
      const preview = await generateOverlayPreview({
        recordingId: input.recordingId,
        lapId: input.lapId,
        offsetSeconds,
        currentUserId: context.currentUser.id,
        styleOverrides,
      });
      return { preview };
    } catch (err) {
      throw toOverlayPreviewError(err);
    }
  },
  burnRecordingOverlay: async (
    args: {
      input?: {
        recordingId?: string;
        quality?: keyof typeof overlayExportQualityMap | null;
        style?: OverlayStyleInput;
      };
    },
    context: GraphQLContext
  ) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    const input = args.input;
    if (!input?.recordingId || !input.quality) {
      throw new GraphQLError("recordingId and quality are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const qualityKey = input.quality;
    const quality = qualityKey in overlayExportQualityMap ? overlayExportQualityMap[qualityKey] : null;
    if (!quality) {
      throw new GraphQLError("quality must be BEST or GOOD", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const styleOverrides = normalizeOverlayStyleInput(input.style);

    try {
      const recording = await burnRecordingOverlay({
        recordingId: input.recordingId,
        quality,
        styleOverrides,
        currentUserId: context.currentUser.id,
      });
      return { recording: toTrackRecordingPayload(recording, context.repositories) };
    } catch (err) {
      throw toOverlayBurnError(err);
    }
  },
  deleteTrackRecording: async (args: { id?: string }, context: GraphQLContext) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    if (!args.id) {
      throw new GraphQLError("id is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const recording = findTrackRecordingById(args.id);
    if (!recording) {
      throw new GraphQLError("Recording not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    if (recording.userId !== context.currentUser.id) {
      throw new GraphQLError("You do not have access to this recording", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    try {
      const success = await deleteRecordingAndFiles(args.id, context.currentUser.id);
      return { success };
    } catch (err) {
      throw toUploadError(err);
    }
  },
};
