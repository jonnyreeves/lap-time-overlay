import { GraphQLError } from "graphql";
import { findTrackRecordingById } from "../../../db/track_recordings.js";
import type { GraphQLContext } from "../context.js";
import { RecordingUploadError, startRecordingUploadSession, deleteRecordingAndFiles } from "../../recordings/service.js";
import { toTrackRecordingPayload } from "./trackSession.js";

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

export const trackRecordingResolvers = {
  startTrackRecordingUpload: async (
    args: {
      input?: {
        sessionId?: string;
        description?: string | null;
        lapOneOffset?: number | null;
        sources?: { fileName?: string | null; sizeBytes?: number | null }[] | null;
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

    const sources = input.sources.map((source, idx) => {
      const name = source?.fileName?.trim();
      if (!name) {
        throw new GraphQLError(`Source ${idx + 1} fileName is required`, {
          extensions: { code: "VALIDATION_FAILED" },
        });
      }
      const size = source?.sizeBytes;
      return {
        fileName: name,
        sizeBytes: typeof size === "number" && size >= 0 ? size : null,
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
