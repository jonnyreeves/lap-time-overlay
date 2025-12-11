import { GraphQLError } from "graphql";
import type { TrackRecord } from "../../../db/tracks.js";
import type { TrackSessionConditions } from "../../../db/track_sessions.js";
import type { GraphQLContext } from "../context.js";
import type { Repositories } from "../repositories.js";

export function getCircuitPersonalBest(
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

export function toCircuitPayload(
  track: TrackRecord,
  repositories: Repositories,
  userId?: string
) {
  return {
    id: track.id,
    name: track.name,
    heroImage: track.heroImage,
    personalBest: () => getCircuitPersonalBest(track.id, repositories, userId),
    personalBestDry: () => getCircuitPersonalBest(track.id, repositories, userId, "Dry"),
    personalBestWet: () => getCircuitPersonalBest(track.id, repositories, userId, "Wet"),
    karts: () => repositories.trackKarts.findKartsForTrack(track.id),
    trackLayouts: () =>
      repositories.trackLayouts.findByTrackId(track.id).map((layout) => ({
        id: layout.id,
        name: layout.name,
        circuit: () => toCircuitPayload(track, repositories, userId),
        createdAt: new Date(layout.createdAt).toISOString(),
        updatedAt: new Date(layout.updatedAt).toISOString(),
      })),
  };
}

export const circuitResolvers = {
  circuit: (
    args: { id?: string },
    context: GraphQLContext,
  ) => {
    const { repositories } = context;
    const userId = context.currentUser?.id;
    const circuitId = args.id;
    if (!circuitId) {
      throw new GraphQLError("Circuit ID is required", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }
    const circuit = repositories.tracks.findById(circuitId);
    if (!circuit) {
      throw new GraphQLError("Circuit not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    return toCircuitPayload(circuit, repositories, userId);
  },
  circuits: (_args: unknown, context: GraphQLContext) => {
    const { repositories } = context;
    const userId = context.currentUser?.id;
    return repositories.tracks
      .findAll()
      .map((circuit) => toCircuitPayload(circuit, repositories, userId));
  },
  createCircuit: (
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
      throw new GraphQLError("Circuit name is required", {
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

    const newCircuit = context.repositories.tracks.create(input.name, input.heroImage ?? null);
    const createdKarts = uniqueKartNames.map((name) => context.repositories.karts.create(name));
    createdKarts.forEach((kart) => context.repositories.trackKarts.addKartToTrack(newCircuit.id, kart.id));

    uniqueLayoutNames.forEach((name) => context.repositories.trackLayouts.create(newCircuit.id, name));

    return { circuit: toCircuitPayload(newCircuit, context.repositories, context.currentUser.id) };
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

  addKartToCircuit: (
    args: { circuitId?: string; kartId?: string },
    context: GraphQLContext
  ) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    const { circuitId, kartId } = args;
    if (!circuitId || !kartId) {
      throw new GraphQLError("Circuit ID and Kart ID are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    const circuit = context.repositories.tracks.findById(circuitId);
    if (!circuit) {
      throw new GraphQLError("Circuit not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    const kart = context.repositories.karts.findById(kartId);
    if (!kart) {
      throw new GraphQLError("Kart not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    context.repositories.trackKarts.addKartToTrack(circuitId, kartId);
    return { circuit: toCircuitPayload(circuit, context.repositories, context.currentUser.id), kart };
  },

  removeKartFromCircuit: (
    args: { circuitId?: string; kartId?: string },
    context: GraphQLContext
  ) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    const { circuitId, kartId } = args;
    if (!circuitId || !kartId) {
      throw new GraphQLError("Circuit ID and Kart ID are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    const circuit = context.repositories.tracks.findById(circuitId);
    if (!circuit) {
      throw new GraphQLError("Circuit not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    const kart = context.repositories.karts.findById(kartId);
    if (!kart) {
      throw new GraphQLError("Kart not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    context.repositories.trackKarts.removeKartFromTrack(circuitId, kartId);
    return { circuit: toCircuitPayload(circuit, context.repositories, context.currentUser.id), kart };
  },
};
