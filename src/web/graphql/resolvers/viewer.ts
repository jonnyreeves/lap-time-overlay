import { GraphQLError } from "graphql";
import { toUserPayload } from "./auth.js";
import { toTrackPayload } from "./track.js";
import { findTrackSessionsForUser, toTrackSessionPayload } from "./trackSession.js";
import type { GraphQLContext } from "../context.js";

function encodeCursor(id: string): string {
  return Buffer.from(id, "utf8").toString("base64");
}

function decodeCursor(cursor: string): string | null {
  try {
    return Buffer.from(cursor, "base64").toString("utf8");
  } catch (err) {
    console.warn("Invalid cursor provided to recentTrackSessions", err);
    return null;
  }
}

type TrackSessionFilterArgs = {
  trackId?: string | null;
  trackLayoutId?: string | null;
  kartId?: string | null;
  conditions?: string | null;
};

type RecentTrackSessionsArgs = {
  first?: number;
  after?: string;
  filter?: TrackSessionFilterArgs | null;
};

function normalizeConditionsFilter(conditions?: string | null): string | undefined {
  if (!conditions) return undefined;
  const normalized = conditions.trim();
  if (normalized === "Dry" || normalized === "Wet") {
    return normalized;
  }
  throw new GraphQLError("conditions filter must be either Dry or Wet", {
    extensions: { code: "VALIDATION_FAILED" },
  });
}

export const viewerResolvers = {
  viewer: (_args: unknown, context: GraphQLContext) => {
    if (!context.currentUser) return null;
    const user = context.currentUser;
    const { repositories } = context;
    return toUserPayload(user, {
      recentTracks: (args: { first?: number; after?: string }) => {
        const sessions = findTrackSessionsForUser(user.id, repositories);
        const seen = new Set<string>();
        const uniqueTracks: ReturnType<typeof toTrackPayload>[] = [];
        for (const session of sessions) {
          if (seen.has(session.trackId)) continue;
          const track = repositories.tracks.findById(session.trackId);
          if (track) {
            seen.add(session.trackId);
            uniqueTracks.push(toTrackPayload(track, repositories, user.id));
          }
        }

        const first = typeof args.first === "number" && args.first > 0 ? args.first : 10;
        const afterId = args.after ? decodeCursor(args.after) : null;
        const afterIndex = afterId
          ? uniqueTracks.findIndex((track) => track.id === afterId)
          : -1;
        const startIndex = afterIndex >= 0 ? afterIndex + 1 : 0;

        const slice = uniqueTracks.slice(startIndex, startIndex + first);
        const edges = slice.map((track) => ({
          cursor: encodeCursor(track.id),
          node: track,
        }));

        const endIndex = startIndex + slice.length;
        const hasNextPage = endIndex < uniqueTracks.length;
        const hasPreviousPage = startIndex > 0;

        return {
          edges,
          pageInfo: {
            hasNextPage,
            hasPreviousPage,
            startCursor: edges[0]?.cursor ?? null,
            endCursor: edges[edges.length - 1]?.cursor ?? null,
          },
        };
      },
      recentTrackSessions: (args: RecentTrackSessionsArgs) => {
        const sessions = findTrackSessionsForUser(user.id, repositories);
        const filter = args.filter;
        const normalizedConditions = normalizeConditionsFilter(filter?.conditions);
        const trackIdFilter = filter?.trackId?.trim();
        const trackLayoutIdFilter = filter?.trackLayoutId?.trim();
        const kartIdFilter = filter?.kartId?.trim();

        const filtered = sessions.filter((session) => {
          if (trackIdFilter && session.trackId !== trackIdFilter) return false;
          if (trackLayoutIdFilter && session.trackLayoutId !== trackLayoutIdFilter) return false;
          if (kartIdFilter && session.kartId !== kartIdFilter) return false;
          if (normalizedConditions && session.conditions !== normalizedConditions) return false;
          return true;
        });

        const first = typeof args.first === "number" && args.first > 0 ? args.first : 10;
        const afterId = args.after ? decodeCursor(args.after) : null;
        const afterIndex = afterId ? filtered.findIndex((session) => session.id === afterId) : -1;
        const startIndex = afterIndex >= 0 ? afterIndex + 1 : 0;

        const slice = filtered.slice(startIndex, startIndex + first);
        const edges = slice.map((session) => ({
          cursor: encodeCursor(session.id),
          node: toTrackSessionPayload(session, repositories),
        }));

        const endIndex = startIndex + slice.length;
        const hasNextPage = endIndex < filtered.length;
        const hasPreviousPage = startIndex > 0;

        return {
          edges,
          pageInfo: {
            hasNextPage,
            hasPreviousPage,
            startCursor: edges[0]?.cursor ?? null,
            endCursor: edges[edges.length - 1]?.cursor ?? null,
          },
        };
      },
    });
  },
};
