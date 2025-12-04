import { GraphQLError } from "graphql";
import { createCircuit, findAllCircuits, type CircuitRecord } from "../../../db/circuits.js";
import { findLapsBySessionId } from "../../../db/laps.js";
import { findTrackSessionsByCircuitId } from "../../../db/track_sessions.js";
import type { GraphQLContext } from "../context.js";

export function getCircuitPersonalBest(circuitId: string) {
  const sessions = findTrackSessionsByCircuitId(circuitId);
  const lapTimes: number[] = [];
  for (const session of sessions) {
    const laps = findLapsBySessionId(session.id);
    lapTimes.push(...laps.map((lap) => lap.time));
  }
  if (lapTimes.length === 0) {
    return null;
  }
  return Math.min(...lapTimes);
}

export function toCircuitPayload(circuit: CircuitRecord) {
  return {
    id: circuit.id,
    name: circuit.name,
    heroImage: circuit.heroImage,
    personalBest: () => getCircuitPersonalBest(circuit.id),
  };
}

export const circuitResolvers = {
  circuits: () => {
    return findAllCircuits().map(toCircuitPayload);
  },
  createCircuit: (args: { input?: { name?: string; heroImage?: string } }, context: GraphQLContext) => {
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
    const newCircuit = createCircuit(input.name, context.currentUser.id, input.heroImage);
    return { circuit: newCircuit };
  },
};
