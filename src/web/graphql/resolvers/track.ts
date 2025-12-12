import { GraphQLError } from "graphql";
import type { TrackSessionConditions } from "../../../db/track_sessions.js";
import type { TrackRecord } from "../../../db/tracks.js";
import type { GraphQLContext } from "../context.js";
import type { Repositories } from "../repositories.js";

export function getTrackPersonalBest(
  trackId: string,
  repositories: Repositories,
  userId?: string,
  conditions?: TrackSessionConditions
) {
  const sessions = userId
    ? repositories.trackSessions.findByUserId(userId).filter((session) => session.trackId === trackId)
    : repositories.trackSessions.findByTrackId(trackId);
  const filteredSessions = conditions
    ? sessions.filter((session) => session.conditions === conditions)
    : sessions;
  const lapTimes: number[] = [];
  for (const session of filteredSessions) {
    const laps = repositories.laps.findBySessionId(session.id);
    lapTimes.push(...laps.map((lap) => lap.time));
  }
  if (lapTimes.length === 0) {
    return null;
  }
  return Math.min(...lapTimes);
}

export function toTrackPayload(
  track: TrackRecord,
  repositories: Repositories,
  userId?: string
) {
  return {
    id: track.id,
    name: track.name,
    heroImage: track.heroImage,
    personalBest: () => getTrackPersonalBest(track.id, repositories, userId),
    personalBestDry: () => getTrackPersonalBest(track.id, repositories, userId, "Dry"),
    personalBestWet: () => getTrackPersonalBest(track.id, repositories, userId, "Wet"),
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
