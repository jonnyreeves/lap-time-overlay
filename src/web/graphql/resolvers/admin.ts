import { GraphQLError } from "graphql";
import type { GraphQLContext } from "../context.js";
import {
  listOrphanedMedia,
  deleteOrphanedMedia,
  collectTempDirStats,
  emptyTempDirectory,
  getRecordingHealthOverview,
  getUserMediaLibrarySizes,
  type AdminTempDirName,
} from "../../recordings/admin.js";
import {
  listLocalUsers,
  getAdminUserCount,
  getUserById,
  setUserAdminFlag,
} from "../../auth/service.js";
import { findTrackRecordingById } from "../../../db/track_recordings.js";
import { rebuildMediaLibraryProjectionAll } from "../../recordings/mediaLibraryProjection.js";
import { getTempCleanupSchedule } from "../../recordings/tempCleanup.js";
import { tempCleanupScheduler } from "../../recordings/tempCleanupScheduler.js";
import type { TempCleanupSchedule } from "../../recordings/tempCleanup.js";
import { cancelRenderJob, getActiveRenderJobs } from "../../recordings/renderJobs.js";
import {
  getVideoAccelerationStatus,
  updateVideoAccelerationPreference,
} from "../../video/hardwareEncoding.js";

function requireAuthentication(context: GraphQLContext): void {
  if (!context.currentUser) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
}

function requireAdmin(context: GraphQLContext): void {
  requireAuthentication(context);
  if (!context.currentUser?.isAdmin) {
    throw new GraphQLError("Admin privileges required", {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

const allowedTempDirs: AdminTempDirName[] = ["UPLOADS", "RENDERS", "PREVIEWS"];

function toGraphQLSchedule(schedule: TempCleanupSchedule) {
  return {
    ...schedule,
    lastRunAt: schedule.lastRunAt ? new Date(schedule.lastRunAt).toISOString() : null,
    nextRunAt: schedule.nextRunAt ? new Date(schedule.nextRunAt).toISOString() : null,
  };
}

function toAdminUserPayload(user: { id: string; username: string; createdAt: number; isAdmin: boolean }) {
  return {
    id: user.id,
    username: user.username,
    createdAt: new Date(user.createdAt).toISOString(),
    isAdmin: user.isAdmin,
  };
}

function toGraphQLRenderJobType(type: "combine" | "overlay") {
  return type === "combine" ? "COMBINE" : "OVERLAY";
}

function toAdminRenderJobPayload(job: {
  recordingId: string;
  userId: string;
  type: "combine" | "overlay";
  startedAt: number;
}) {
  const recording = findTrackRecordingById(job.recordingId);
  const username = getUserById(job.userId)?.username ?? null;
  const progress = recording?.combineProgress ?? 0;
  return {
    recordingId: job.recordingId,
    sessionId: recording?.sessionId ?? null,
    description: recording?.description ?? null,
    userId: job.userId,
    username,
    type: toGraphQLRenderJobType(job.type),
    progress: Math.max(0, Math.min(1, progress)),
    startedAt: new Date(job.startedAt).toISOString(),
  };
}

export const adminResolvers = {
  adminOrphanedMedia: async (_args: unknown, context: GraphQLContext) => {
    requireAdmin(context);
    return listOrphanedMedia();
  },
  adminRenderJobs: async (_args: unknown, context: GraphQLContext) => {
    requireAdmin(context);
    return getActiveRenderJobs().map((job) => toAdminRenderJobPayload(job));
  },
  adminTempDirs: async (_args: unknown, context: GraphQLContext) => {
    requireAdmin(context);
    return collectTempDirStats();
  },
  adminRecordingHealth: async (_args: unknown, context: GraphQLContext) => {
    requireAdmin(context);
    return getRecordingHealthOverview();
  },
  adminUserMediaLibraries: async (_args: unknown, context: GraphQLContext) => {
    requireAdmin(context);
    return getUserMediaLibrarySizes();
  },
  adminUsers: async (_args: unknown, context: GraphQLContext) => {
    requireAdmin(context);
    return listLocalUsers()
      .slice()
      .sort((a, b) =>
        a.username.localeCompare(b.username, undefined, { sensitivity: "base" })
      )
      .map(toAdminUserPayload);
  },
  adminTempCleanupSchedule: async (_args: unknown, context: GraphQLContext) => {
    requireAdmin(context);
    const schedule = await getTempCleanupSchedule();
    return toGraphQLSchedule(schedule);
  },
  adminVideoAcceleration: async (_args: unknown, context: GraphQLContext) => {
    requireAdmin(context);
    return getVideoAccelerationStatus();
  },
  rebuildMediaLibraryProjectionAll: async (_args: unknown, context: GraphQLContext) => {
    requireAdmin(context);
    const result = await rebuildMediaLibraryProjectionAll();
    return { rebuiltSessions: result.rebuiltSessions };
  },
  deleteOrphanedMedia: async (
    args: { input?: { mediaIds?: (string | null)[] | null } },
    context: GraphQLContext
  ) => {
    requireAdmin(context);
    const mediaIds = args.input?.mediaIds?.filter((token): token is string => typeof token === "string" && token.trim().length > 0) ?? [];
    if (!mediaIds.length) {
      throw new GraphQLError("mediaIds is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const deleted = await deleteOrphanedMedia(mediaIds);
    return { deleted };
  },
  emptyTempDir: async (args: { input?: { name?: string | null } }, context: GraphQLContext) => {
    requireAdmin(context);
    const name = args.input?.name;
    if (!name || !allowedTempDirs.includes(name as AdminTempDirName)) {
      throw new GraphQLError("Invalid temp directory", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    try {
      await emptyTempDirectory(name as AdminTempDirName);
      return { name: name as AdminTempDirName };
    } catch (err) {
      console.error("Failed to empty temp directory", err);
      throw new GraphQLError("Failed to empty temp directory", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },
  updateTempCleanupSchedule: async (
    args: { input?: { hour?: number | null; days?: (number | null)[] | null } },
    context: GraphQLContext
  ) => {
    requireAdmin(context);
    const hour = args.input?.hour;
    const days = (args.input?.days ?? []).filter((value): value is number => typeof value === "number");
    if (hour === null || hour === undefined) {
      throw new GraphQLError("Hour is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    try {
      const schedule = await tempCleanupScheduler.updateSchedule({ hour, days });
      return { schedule: toGraphQLSchedule(schedule) };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update schedule";
      throw new GraphQLError(message, {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
  },
  runTempCleanup: async (_args: unknown, context: GraphQLContext) => {
    requireAdmin(context);
    try {
      const result = await tempCleanupScheduler.runNow();
      return {
        started: result.started,
        schedule: toGraphQLSchedule(result.schedule),
      };
    } catch (err) {
      console.error("Failed to run temp cleanup", err);
      throw new GraphQLError("Failed to run temp cleanup", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },
  cancelRenderJob: async (args: { recordingId?: string | null }, context: GraphQLContext) => {
    requireAdmin(context);
    const recordingId = args.recordingId?.trim();
    if (!recordingId) {
      throw new GraphQLError("recordingId is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    const canceled = cancelRenderJob(recordingId);
    if (!canceled) {
      throw new GraphQLError("Render job not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    return { success: true };
  },
  updateUserAdminStatus: async (
    args: { input?: { userId?: string | null; isAdmin?: boolean | null } },
    context: GraphQLContext
  ) => {
    requireAdmin(context);
    const userId = args.input?.userId?.trim();
    if (!userId) {
      throw new GraphQLError("userId is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    const isAdmin = args.input?.isAdmin;
    if (typeof isAdmin !== "boolean") {
      throw new GraphQLError("isAdmin must be true or false", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const targetUser = getUserById(userId);
    if (!targetUser) {
      throw new GraphQLError("User not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    if (context.currentUser?.id === userId && !isAdmin) {
      throw new GraphQLError("Cannot remove your own admin privileges", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    if (!isAdmin && targetUser.isAdmin) {
      const adminCount = getAdminUserCount();
      if (adminCount <= 1) {
        throw new GraphQLError("At least one admin account is required", {
          extensions: { code: "VALIDATION_FAILED" },
        });
      }
    }

    const updated = setUserAdminFlag(userId, isAdmin);
    if (!updated) {
      throw new GraphQLError("User not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    return { user: toAdminUserPayload(updated) };
  },
  updateVideoAccelerationPreference: async (
    args: { input?: { preferHardwareEncoding?: boolean | null } },
    context: GraphQLContext
  ) => {
    requireAdmin(context);
    const prefer = args.input?.preferHardwareEncoding;
    if (typeof prefer !== "boolean") {
      throw new GraphQLError("preferHardwareEncoding must be true or false", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    const status = await updateVideoAccelerationPreference(prefer);
    return { status };
  },
};
