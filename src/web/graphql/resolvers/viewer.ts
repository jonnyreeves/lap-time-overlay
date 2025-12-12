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
  format?: string | null;
};

type RecentTrackSessionsArgs = {
  first?: number;
  after?: string;
  filter?: TrackSessionFilterArgs | null;
  sort?: TrackSessionSort | null;
};

type TrackSessionSort =
  | "DATE_ASC"
  | "DATE_DESC"
  | "FASTEST_LAP_ASC"
  | "FASTEST_LAP_DESC";

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

function normalizeFormatFilter(format?: string | null): string | undefined {
  if (!format) return undefined;
  const normalized = format.trim();
  if (normalized === "Practice" || normalized === "Qualifying" || normalized === "Race") {
    return normalized;
  }
  throw new GraphQLError("format filter must be Practice, Qualifying, or Race", {
    extensions: { code: "VALIDATION_FAILED" },
  });
}

function normalizeSort(sort?: TrackSessionSort | null): TrackSessionSort {
  if (!sort) return "DATE_DESC";
  if (
    sort === "DATE_ASC" ||
    sort === "DATE_DESC" ||
    sort === "FASTEST_LAP_ASC" ||
    sort === "FASTEST_LAP_DESC"
  ) {
    return sort;
  }
  throw new GraphQLError(
    "sort must be DATE_ASC, DATE_DESC, FASTEST_LAP_ASC, or FASTEST_LAP_DESC",
    {
      extensions: { code: "VALIDATION_FAILED" },
    }
  );
}

function sortSessions(
  sessions: ReturnType<typeof findTrackSessionsForUser>,
  sort: TrackSessionSort,
  repositories: GraphQLContext["repositories"]
) {
  if (sort === "DATE_DESC" || sort === "DATE_ASC") {
    const multiplier = sort === "DATE_ASC" ? 1 : -1;
    return [...sessions].sort(
      (a, b) => multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime())
    );
  }

  const fastestLapBySession = new Map<string, number | null>();
  const getFastestLap = (sessionId: string): number | null => {
    if (fastestLapBySession.has(sessionId)) {
      return fastestLapBySession.get(sessionId) ?? null;
    }
    const laps = repositories.laps.findBySessionId(sessionId);
    if (!laps.length) {
      fastestLapBySession.set(sessionId, null);
      return null;
    }
    const fastest = Math.min(...laps.map((lap) => lap.time));
    fastestLapBySession.set(sessionId, fastest);
    return fastest;
  };

  const isAscending = sort === "FASTEST_LAP_ASC";
  return [...sessions].sort((a, b) => {
    const aLap = getFastestLap(a.id);
    const bLap = getFastestLap(b.id);
    if (aLap == null && bLap == null) return 0;
    if (aLap == null) return 1;
    if (bLap == null) return -1;
    return isAscending ? aLap - bLap : bLap - aLap;
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
        const normalizedFormat = normalizeFormatFilter(filter?.format);
        const normalizedSort = normalizeSort(args.sort);
        const trackIdFilter = filter?.trackId?.trim();
        const trackLayoutIdFilter = filter?.trackLayoutId?.trim();
        const kartIdFilter = filter?.kartId?.trim();

        const filtered = sessions.filter((session) => {
          if (trackIdFilter && session.trackId !== trackIdFilter) return false;
          if (trackLayoutIdFilter && session.trackLayoutId !== trackLayoutIdFilter) return false;
          if (kartIdFilter && session.kartId !== kartIdFilter) return false;
          if (normalizedConditions && session.conditions !== normalizedConditions) return false;
          if (normalizedFormat && session.format !== normalizedFormat) return false;
          return true;
        });

        const sorted = sortSessions(filtered, normalizedSort, repositories);

        const first = typeof args.first === "number" && args.first > 0 ? args.first : 10;
        const afterId = args.after ? decodeCursor(args.after) : null;
        const afterIndex = afterId ? sorted.findIndex((session) => session.id === afterId) : -1;
        const startIndex = afterIndex >= 0 ? afterIndex + 1 : 0;

        const slice = sorted.slice(startIndex, startIndex + first);
        const edges = slice.map((session) => ({
          cursor: encodeCursor(session.id),
          node: toTrackSessionPayload(session, repositories),
        }));

        const endIndex = startIndex + slice.length;
        const hasNextPage = endIndex < sorted.length;
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
