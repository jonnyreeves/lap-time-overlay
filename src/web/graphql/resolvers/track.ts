import { GraphQLError } from "graphql";
import type { TrackSessionConditions, TrackSessionRecord } from "../../../db/track_sessions.js";
import type { TrackRecord } from "../../../db/tracks.js";
import type { KartRecord } from "../../../db/karts.js";
import type { TrackLayoutRecord } from "../../../db/track_layouts.js";
import type { GraphQLContext } from "../context.js";
import type { Repositories } from "../repositories.js";

type TrackPersonalBestEntry = {
  kart: KartRecord;
  trackLayout: TrackLayoutRecord;
  conditions: TrackSessionConditions;
  lapTime: number;
  trackSessionId: string;
};

function toKartPayload(kart: KartRecord) {
  return {
    id: kart.id,
    name: kart.name,
    createdAt: new Date(kart.createdAt).toISOString(),
    updatedAt: new Date(kart.updatedAt).toISOString(),
  };
}

function getTrackSessionsForTrack(
  track: TrackRecord,
  repositories: Repositories,
  userId?: string
): TrackSessionRecord[] {
  const sessions = userId
    ? repositories.trackSessions.findByUserId(userId) ?? []
    : repositories.trackSessions.findByTrackId(track.id) ?? [];

  return userId ? sessions.filter((session) => session.trackId === track.id) : sessions;
}

export function getTrackPersonalBestEntries(
  track: TrackRecord,
  repositories: Repositories,
  userId?: string,
  sessionsOverride?: TrackSessionRecord[]
) {
  const sessions = sessionsOverride ?? getTrackSessionsForTrack(track, repositories, userId);

  const bestBySetup = new Map<string, TrackPersonalBestEntry[]>();

  for (const session of sessions) {
    if (!session.kartId) {
      continue;
    }
    const laps = repositories.laps.findBySessionId(session.id);
    if (laps.length === 0) {
      continue;
    }

    const kart = repositories.karts.findById(session.kartId);
    if (!kart) {
      throw new GraphQLError(`Kart with ID ${session.kartId} not found`, {
        extensions: { code: "NOT_FOUND" },
      });
    }

    const trackLayout = repositories.trackLayouts.findById(session.trackLayoutId);
    if (!trackLayout) {
      throw new GraphQLError(`Track layout with ID ${session.trackLayoutId} not found`, {
        extensions: { code: "NOT_FOUND" },
      });
    }

    if (trackLayout.trackId !== track.id) {
      continue;
    }

    const bestLapTime = Math.min(...laps.map((lap) => lap.time));
    const key = `${trackLayout.id}:${kart.id}:${session.conditions}`;
    const entriesForSetup = bestBySetup.get(key) ?? [];

    entriesForSetup.push({
      kart,
      trackLayout,
      conditions: session.conditions,
      lapTime: bestLapTime,
      trackSessionId: session.id,
    });

    bestBySetup.set(key, entriesForSetup);
  }

  const entries = Array.from(bestBySetup.values()).flatMap((setupEntries) =>
    setupEntries.sort((a, b) => a.lapTime - b.lapTime).slice(0, 3)
  );

  entries.sort((a, b) => {
    if (a.trackLayout.name !== b.trackLayout.name) {
      return a.trackLayout.name.localeCompare(b.trackLayout.name);
    }
    if (a.kart.name !== b.kart.name) {
      return a.kart.name.localeCompare(b.kart.name);
    }
    if (a.conditions !== b.conditions) {
      return a.conditions.localeCompare(b.conditions);
    }
    return a.lapTime - b.lapTime;
  });

  return entries.map((entry) => ({
    kart: toKartPayload(entry.kart),
    trackLayout: toTrackLayoutPayload(entry.trackLayout, repositories, userId, track),
    trackSessionId: entry.trackSessionId,
    conditions: entry.conditions,
    lapTime: entry.lapTime,
  }));
}

function getTrackStatsFromSessions(sessions: TrackSessionRecord[]) {
  const lastVisitTimestamp = sessions.reduce<number | null>((latest, session) => {
    const timestamp = Date.parse(session.date);
    if (Number.isNaN(timestamp)) {
      return latest;
    }
    if (latest === null || timestamp > latest) {
      return timestamp;
    }
    return latest;
  }, null);

  return {
    timesRaced: sessions.length,
    lastVisit: lastVisitTimestamp ? new Date(lastVisitTimestamp).toISOString() : null,
  };
}

function getTrackSessionStats(
  track: TrackRecord,
  repositories: Repositories,
  userId?: string,
  sessionsOverride?: TrackSessionRecord[]
) {
  const sessions = sessionsOverride ?? getTrackSessionsForTrack(track, repositories, userId);
  const kartCounts = new Map<string | null, { kart: KartRecord | null; count: number }>();
  const layoutCounts = new Map<string, { trackLayout: TrackLayoutRecord; count: number }>();
  const conditionCounts = new Map<TrackSessionConditions, number>();

  for (const session of sessions) {
    conditionCounts.set(session.conditions, (conditionCounts.get(session.conditions) ?? 0) + 1);

    if (session.kartId) {
      const kart = repositories.karts.findById(session.kartId);
      if (!kart) {
        throw new GraphQLError(`Kart with ID ${session.kartId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      const kartStat = kartCounts.get(session.kartId) ?? { kart, count: 0 };
      kartStat.kart = kart;
      kartStat.count += 1;
      kartCounts.set(session.kartId, kartStat);
    } else {
      const kartStat = kartCounts.get(null) ?? { kart: null, count: 0 };
      kartStat.count += 1;
      kartCounts.set(null, kartStat);
    }

    const trackLayout = repositories.trackLayouts.findById(session.trackLayoutId);
    if (!trackLayout) {
      throw new GraphQLError(`Track layout with ID ${session.trackLayoutId} not found`, {
        extensions: { code: "NOT_FOUND" },
      });
    }
    if (trackLayout.trackId !== track.id) {
      continue;
    }
    const layoutStat = layoutCounts.get(trackLayout.id) ?? { trackLayout, count: 0 };
    layoutStat.trackLayout = trackLayout;
    layoutStat.count += 1;
    layoutCounts.set(trackLayout.id, layoutStat);
  }

  const byKart = Array.from(kartCounts.values())
    .sort((a, b) => {
      if (a.kart && b.kart) {
        return a.kart.name.localeCompare(b.kart.name);
      }
      if (a.kart && !b.kart) return -1;
      if (!a.kart && b.kart) return 1;
      return 0;
    })
    .map(({ kart, count }) => ({
      kart: kart ? toKartPayload(kart) : null,
      count,
    }));

  const byTrackLayout = Array.from(layoutCounts.values())
    .sort((a, b) => a.trackLayout.name.localeCompare(b.trackLayout.name))
    .map(({ trackLayout, count }) => ({
      trackLayout: toTrackLayoutPayload(trackLayout, repositories, userId, track),
      count,
    }));

  const byCondition = Array.from(conditionCounts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([conditions, count]) => ({
      conditions,
      count,
    }));

  return {
    totalSessions: sessions.length,
    byKart,
    byTrackLayout,
    byCondition,
  };
}

export function toTrackPayload(
  track: TrackRecord,
  repositories: Repositories,
  userId?: string
) {
  const sessions = getTrackSessionsForTrack(track, repositories, userId);
  const { timesRaced, lastVisit } = getTrackStatsFromSessions(sessions);

  return {
    id: track.id,
    name: track.name,
    heroImage: track.heroImage,
    timesRaced,
    lastVisit,
    sessionStats: () => getTrackSessionStats(track, repositories, userId, sessions),
    personalBestEntries: () => getTrackPersonalBestEntries(track, repositories, userId, sessions),
    karts: () => repositories.trackKarts.findKartsForTrack(track.id),
    trackLayouts: () =>
      repositories.trackLayouts.findByTrackId(track.id).map((layout) =>
        toTrackLayoutPayload(layout, repositories, userId, track)
      ),
  };
}

export function toTrackLayoutPayload(
  layout: { id: string; trackId: string; name: string; createdAt: number; updatedAt: number },
  repositories: Repositories,
  userId?: string,
  track?: TrackRecord | null
) {
  const trackRecord = track ?? repositories.tracks.findById(layout.trackId);
  if (!trackRecord) {
    throw new GraphQLError("Track not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  return {
    id: layout.id,
    name: layout.name,
    track: () => toTrackPayload(trackRecord, repositories, userId),
    createdAt: new Date(layout.createdAt).toISOString(),
    updatedAt: new Date(layout.updatedAt).toISOString(),
  };
}

export const trackResolvers = {
  track: (
    args: { id?: string },
    context: GraphQLContext,
  ) => {
    const { repositories } = context;
    const userId = context.currentUser?.id;
    const trackId = args.id;
    if (!trackId) {
      throw new GraphQLError("Track ID is required", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }
    const track = repositories.tracks.findById(trackId);
    if (!track) {
      throw new GraphQLError("Track not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    return toTrackPayload(track, repositories, userId);
  },
  tracks: (_args: unknown, context: GraphQLContext) => {
    const { repositories } = context;
    const userId = context.currentUser?.id;
    return repositories.tracks
      .findAll()
      .map((track) => toTrackPayload(track, repositories, userId));
  },
  createTrack: (
    args: { input?: { name?: string; heroImage?: string | null; karts?: { name?: string }[]; trackLayouts?: { name?: string }[] } },
    context: GraphQLContext
  ) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    const input = args.input;
    if (!input?.name) {
      throw new GraphQLError("Track name is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    const kartInputs = input.karts ?? [];
    const layoutInputs = input.trackLayouts ?? [];
    const kartNames = kartInputs
      .map((kart) => kart?.name?.trim())
      .filter((name): name is string => Boolean(name));
    const layoutNames = layoutInputs
      .map((layout) => layout?.name?.trim())
      .filter((name): name is string => Boolean(name));

    if (!kartInputs.length || kartNames.length !== kartInputs.length) {
      throw new GraphQLError("At least one kart name is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    if (!layoutInputs.length || layoutNames.length !== layoutInputs.length) {
      throw new GraphQLError("At least one track layout name is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const uniqueKartNames = Array.from(new Set(kartNames));
    const uniqueLayoutNames = Array.from(new Set(layoutNames));

    const newTrack = context.repositories.tracks.create(input.name, input.heroImage ?? null);
    const createdKarts = uniqueKartNames.map((name) => context.repositories.karts.create(name));
    createdKarts.forEach((kart) => context.repositories.trackKarts.addKartToTrack(newTrack.id, kart.id));

    uniqueLayoutNames.forEach((name) => context.repositories.trackLayouts.create(newTrack.id, name));

    return { track: toTrackPayload(newTrack, context.repositories, context.currentUser.id) };
  },

  createKart: (args: { input?: { name?: string } }, context: GraphQLContext) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    const input = args.input;
    if (!input?.name) {
      throw new GraphQLError("Kart name is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    const newKart = context.repositories.karts.create(input.name);
    return { kart: newKart };
  },

  updateKart: (args: { input?: { id?: string; name?: string } }, context: GraphQLContext) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    const input = args.input;
    if (!input?.id || !input?.name) {
      throw new GraphQLError("Kart ID and name are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    const updatedKart = context.repositories.karts.update(input.id, input.name);
    if (!updatedKart) {
      throw new GraphQLError("Kart not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    return { kart: updatedKart };
  },

  deleteKart: (args: { id?: string }, context: GraphQLContext) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    const kartId = args.id;
    if (!kartId) {
      throw new GraphQLError("Kart ID is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    const success = context.repositories.karts.delete(kartId);
    return { success };
  },

  addKartToTrack: (
    args: { trackId?: string; kartId?: string },
    context: GraphQLContext
  ) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    const { trackId, kartId } = args;
    if (!trackId || !kartId) {
      throw new GraphQLError("Track ID and Kart ID are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    const track = context.repositories.tracks.findById(trackId);
    if (!track) {
      throw new GraphQLError("Track not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    const kart = context.repositories.karts.findById(kartId);
    if (!kart) {
      throw new GraphQLError("Kart not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    context.repositories.trackKarts.addKartToTrack(trackId, kartId);
    return { track: toTrackPayload(track, context.repositories, context.currentUser.id), kart };
  },

  removeKartFromTrack: (
    args: { trackId?: string; kartId?: string },
    context: GraphQLContext
  ) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    const { trackId, kartId } = args;
    if (!trackId || !kartId) {
      throw new GraphQLError("Track ID and Kart ID are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    const track = context.repositories.tracks.findById(trackId);
    if (!track) {
      throw new GraphQLError("Track not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    const kart = context.repositories.karts.findById(kartId);
    if (!kart) {
      throw new GraphQLError("Kart not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    context.repositories.trackKarts.removeKartFromTrack(trackId, kartId);
    return { track: toTrackPayload(track, context.repositories, context.currentUser.id), kart };
  },

  addTrackLayoutToTrack: (
    args: { trackId?: string; input?: { name?: string } },
    context: GraphQLContext
  ) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    const trackId = args.trackId;
    const name = args.input?.name?.trim();

    if (!trackId || !name) {
      throw new GraphQLError("Track ID and track layout name are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const track = context.repositories.tracks.findById(trackId);
    if (!track) {
      throw new GraphQLError("Track not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    const newLayout = context.repositories.trackLayouts.create(trackId, name);

    return {
      track: toTrackPayload(track, context.repositories, context.currentUser.id),
      trackLayout: toTrackLayoutPayload(newLayout, context.repositories, context.currentUser.id, track),
    };
  },

  updateTrackLayout: (
    args: { input?: { id?: string; name?: string } },
    context: GraphQLContext
  ) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    const layoutId = args.input?.id;
    const layoutName = args.input?.name?.trim();

    if (!layoutId || !layoutName) {
      throw new GraphQLError("Track layout ID and name are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const existingLayout = context.repositories.trackLayouts.findById(layoutId);
    if (!existingLayout) {
      throw new GraphQLError("Track layout not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    const track = context.repositories.tracks.findById(existingLayout.trackId);
    if (!track) {
      throw new GraphQLError("Track not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    const updatedLayout = context.repositories.trackLayouts.update(layoutId, layoutName);
    if (!updatedLayout) {
      throw new GraphQLError("Track layout not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    return {
      trackLayout: toTrackLayoutPayload(updatedLayout, context.repositories, context.currentUser.id, track),
    };
  },

  removeTrackLayoutFromTrack: (
    args: { trackId?: string; trackLayoutId?: string },
    context: GraphQLContext
  ) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    const { trackId, trackLayoutId } = args;
    if (!trackId || !trackLayoutId) {
      throw new GraphQLError("Track ID and track layout ID are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const track = context.repositories.tracks.findById(trackId);
    if (!track) {
      throw new GraphQLError("Track not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    const layout = context.repositories.trackLayouts.findById(trackLayoutId);
    if (!layout) {
      throw new GraphQLError("Track layout not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    if (layout.trackId !== trackId) {
      throw new GraphQLError("Track layout does not belong to this track", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    context.repositories.trackLayouts.delete(trackLayoutId);

    return {
      track: toTrackPayload(track, context.repositories, context.currentUser.id),
      trackLayout: toTrackLayoutPayload(layout, context.repositories, context.currentUser.id, track),
    };
  },
};
