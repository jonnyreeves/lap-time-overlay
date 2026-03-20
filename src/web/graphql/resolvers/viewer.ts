import { GraphQLError } from "graphql";
import { buildRivalTrend, computeBestNAvg } from "../../shared/rivalAnalysis.js";
import { toUserPayload } from "./auth.js";
import { toTrackPayload } from "./track.js";
import {
  computeSessionPerformanceForSession,
  findTrackSessionsForUser,
  toTrackSessionPayload,
} from "./trackSession.js";
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
  | "FASTEST_LAP_DESC"
  | "PERFORMANCE_ASC"
  | "PERFORMANCE_DESC";

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
    sort === "FASTEST_LAP_DESC" ||
    sort === "PERFORMANCE_ASC" ||
    sort === "PERFORMANCE_DESC"
  ) {
    return sort;
  }
  throw new GraphQLError(
    "sort must be DATE_ASC, DATE_DESC, FASTEST_LAP_ASC, FASTEST_LAP_DESC, PERFORMANCE_ASC, or PERFORMANCE_DESC",
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

  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const fastestLapBySession = new Map<string, number | null>();
  const getFastestLap = (sessionId: string): number | null => {
    if (fastestLapBySession.has(sessionId)) {
      return fastestLapBySession.get(sessionId) ?? null;
    }
    const session = sessionById.get(sessionId);
    if (session?.fastestLap != null) {
      fastestLapBySession.set(sessionId, session.fastestLap);
      return session.fastestLap;
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

  const performanceScoreBySession = new Map<string, number | null>();
  const getPerformanceScore = (sessionId: string): number | null => {
    if (performanceScoreBySession.has(sessionId)) {
      return performanceScoreBySession.get(sessionId) ?? null;
    }
    const session = sessionById.get(sessionId);
    if (!session) return null;
    const score = computeSessionPerformanceForSession(session, repositories).score ?? null;
    performanceScoreBySession.set(sessionId, score);
    return score;
  };

  if (sort === "FASTEST_LAP_ASC" || sort === "FASTEST_LAP_DESC") {
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

  const isPerformanceAscending = sort === "PERFORMANCE_ASC";
  if (sort === "PERFORMANCE_ASC" || sort === "PERFORMANCE_DESC") {
    return [...sessions].sort((a, b) => {
      const aScore = getPerformanceScore(a.id);
      const bScore = getPerformanceScore(b.id);
      if (aScore == null && bScore == null) return 0;
      if (aScore == null) return 1;
      if (bScore == null) return -1;
      return isPerformanceAscending ? aScore - bScore : bScore - aScore;
    });
  }

  return sessions;
}

function getRivalSummaries(
  userId: string,
  repositories: GraphQLContext["repositories"],
  first: number
) {
  const sessions = findTrackSessionsForUser(userId, repositories);
  if (sessions.length === 0) return [];

  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const sessionIds = sessions.map((session) => session.id);
  const participants = repositories.trackSessionParticipants.findBySessionIds(sessionIds);
  if (participants.length === 0) return [];

  const participantsBySessionId = new Map<string, typeof participants>();
  for (const participant of participants) {
    const existing = participantsBySessionId.get(participant.sessionId) ?? [];
    existing.push(participant);
    participantsBySessionId.set(participant.sessionId, existing);
  }

  const participantIds = participants.map((participant) => participant.id);
  const participantLaps = repositories.trackSessionParticipants.findLapsByParticipantIds(participantIds);
  const lapsByParticipantId = new Map<string, typeof participantLaps>();
  for (const lap of participantLaps) {
    const existing = lapsByParticipantId.get(lap.participantId) ?? [];
    existing.push(lap);
    lapsByParticipantId.set(lap.participantId, existing);
  }

  const summaryByName = new Map<
    string,
    {
      name: string;
      sharedSessions: number;
      lastRacedAt: number | null;
      deltas: Array<{ sessionId: string; date: string; delta: number }>;
    }
  >();

  for (const [sessionId, sessionParticipants] of participantsBySessionId.entries()) {
    const session = sessionById.get(sessionId);
    if (!session) continue;

    const selfParticipant = sessionParticipants.find((participant) => participant.isSelf);
    if (!selfParticipant) continue;
    const selfLaps =
      lapsByParticipantId
        .get(selfParticipant.id)
        ?.map((lap) => ({ lapNumber: lap.lapNumber, time: lap.time })) ?? [];
    const selfBest10 = computeBestNAvg(selfLaps, 10);
    const sessionTimestampValue = new Date(session.date).getTime();
    const sessionTimestamp = Number.isNaN(sessionTimestampValue) ? null : sessionTimestampValue;

    for (const participant of sessionParticipants) {
      if (participant.isSelf) continue;
      const current = summaryByName.get(participant.name) ?? {
        name: participant.name,
        sharedSessions: 0,
        lastRacedAt: null,
        deltas: [],
      };
      current.sharedSessions += 1;
      if (sessionTimestamp != null) {
        current.lastRacedAt =
          current.lastRacedAt == null
            ? sessionTimestamp
            : Math.max(current.lastRacedAt, sessionTimestamp);
      }

      const rivalLaps =
        lapsByParticipantId
          .get(participant.id)
          ?.map((lap) => ({ lapNumber: lap.lapNumber, time: lap.time })) ?? [];
      const rivalBest10 = computeBestNAvg(rivalLaps, 10);
      if (selfBest10 != null && rivalBest10 != null) {
        current.deltas.push({
          sessionId,
          date: session.date,
          delta: selfBest10 - rivalBest10,
        });
      }

      summaryByName.set(participant.name, current);
    }
  }

  const summaries = Array.from(summaryByName.values())
    .map((summary) => {
      const avgBest10Delta =
        summary.deltas.length > 0
          ? summary.deltas.reduce((sum, point) => sum + point.delta, 0) / summary.deltas.length
          : null;
      const trend = buildRivalTrend(summary.deltas);
      return {
        name: summary.name,
        sharedSessions: summary.sharedSessions,
        lastRacedAt:
          summary.lastRacedAt == null ? null : new Date(summary.lastRacedAt).toISOString(),
        avgBest10Delta,
        trendDirection: trend.direction,
        sampleCount: trend.sampleCount,
      };
    })
    .sort((a, b) => {
      if (a.sharedSessions !== b.sharedSessions) {
        return b.sharedSessions - a.sharedSessions;
      }
      const aTime = a.lastRacedAt ? Date.parse(a.lastRacedAt) : 0;
      const bTime = b.lastRacedAt ? Date.parse(b.lastRacedAt) : 0;
      if (aTime !== bTime) {
        return bTime - aTime;
      }
      return a.name.localeCompare(b.name);
    });

  return summaries.slice(0, first);
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
      rivals: (args: { first?: number }) => {
        const first = typeof args.first === "number" && args.first > 0 ? args.first : 10;
        return getRivalSummaries(user.id, repositories, first);
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
          if (normalizedConditions) {
            const track = repositories.tracks.findById(session.trackId);
            const sessionConditions = track?.isIndoors ? "Dry" : session.conditions;
            if (sessionConditions !== normalizedConditions) return false;
          }
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
