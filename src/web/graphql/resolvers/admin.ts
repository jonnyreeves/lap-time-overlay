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
import { rebuildJellyfinProjectionAll } from "../../recordings/jellyfinProjection.js";
import { getTempCleanupSchedule } from "../../recordings/tempCleanup.js";
import { tempCleanupScheduler } from "../../recordings/tempCleanupScheduler.js";
import type { TempCleanupSchedule } from "../../recordings/tempCleanup.js";

function requireAuthentication(context: GraphQLContext): void {
  if (!context.currentUser) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: "UNAUTHENTICATED" },
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

export const adminResolvers = {
  adminOrphanedMedia: async (_args: unknown, context: GraphQLContext) => {
    requireAuthentication(context);
    return listOrphanedMedia();
  },
  adminTempDirs: async (_args: unknown, context: GraphQLContext) => {
    requireAuthentication(context);
    return collectTempDirStats();
  },
  adminRecordingHealth: async (_args: unknown, context: GraphQLContext) => {
    requireAuthentication(context);
    return getRecordingHealthOverview();
  },
  adminUserMediaLibraries: async (_args: unknown, context: GraphQLContext) => {
    requireAuthentication(context);
    return getUserMediaLibrarySizes();
  },
  adminTempCleanupSchedule: async (_args: unknown, context: GraphQLContext) => {
    requireAuthentication(context);
    const schedule = await getTempCleanupSchedule();
    return toGraphQLSchedule(schedule);
  },
  rebuildJellyfinProjectionAll: async (_args: unknown, context: GraphQLContext) => {
    requireAuthentication(context);
    const result = await rebuildJellyfinProjectionAll();
    return { rebuiltSessions: result.rebuiltSessions };
  },
  deleteOrphanedMedia: async (
    args: { input?: { mediaIds?: (string | null)[] | null } },
    context: GraphQLContext
  ) => {
    requireAuthentication(context);
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
    requireAuthentication(context);
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
    requireAuthentication(context);
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
    requireAuthentication(context);
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
};
