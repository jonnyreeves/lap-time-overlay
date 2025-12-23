import { GraphQLError } from "graphql";
import type { GraphQLContext } from "../context.js";
import {
  listOrphanedMedia,
  deleteOrphanedMedia,
  collectTempDirStats,
  emptyTempDirectory,
  getRecordingHealthOverview,
  type AdminTempDirName,
} from "../../recordings/admin.js";
import {
  rebuildJellyfinSessionProjection,
  rebuildJellyfinProjectionAll,
  JellyfinProjectionError,
} from "../../recordings/jellyfinProjection.js";

function requireAuthentication(context: GraphQLContext): void {
  if (!context.currentUser) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
}

const allowedTempDirs: AdminTempDirName[] = ["UPLOADS", "RENDERS", "PREVIEWS"];

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
  rebuildJellyfinProjection: async (
    args: { input?: { sessionId?: string | null } },
    context: GraphQLContext
  ) => {
    requireAuthentication(context);
    const sessionId = args.input?.sessionId?.trim();
    if (!sessionId) {
      throw new GraphQLError("sessionId is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    try {
      const view = await rebuildJellyfinSessionProjection(sessionId);
      return { view };
    } catch (err) {
      if (err instanceof JellyfinProjectionError) {
        throw new GraphQLError(err.message, {
          extensions: { code: err.code },
        });
      }
      console.error("Failed to rebuild Jellyfin projection", err);
      throw new GraphQLError("Failed to rebuild Jellyfin projection", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
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
};
