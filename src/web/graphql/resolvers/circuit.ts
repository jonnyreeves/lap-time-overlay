import { GraphQLError } from "graphql";
import type { CircuitRecord } from "../../../db/circuits.js";
import type { GraphQLContext } from "../context.js";
import type { Repositories } from "../repositories.js";

export function getCircuitPersonalBest(circuitId: string, repositories: Repositories) {
  const sessions = repositories.trackSessions.findByCircuitId(circuitId);
  const lapTimes: number[] = [];
  for (const session of sessions) {
    const laps = repositories.laps.findBySessionId(session.id);
    lapTimes.push(...laps.map((lap) => lap.time));
  }
  if (lapTimes.length === 0) {
    return null;
  }
  return Math.min(...lapTimes);
}

export function toCircuitPayload(circuit: CircuitRecord, repositories: Repositories) {
  return {
    id: circuit.id,
    name: circuit.name,
    heroImage: circuit.heroImage,
    personalBest: () => getCircuitPersonalBest(circuit.id, repositories),
  };
}

export const circuitResolvers = {
  circuits: (_args: unknown, context: GraphQLContext) => {
    const { repositories } = context;
    return repositories.circuits.findAll().map((circuit) => toCircuitPayload(circuit, repositories));
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
    const newCircuit = context.repositories.circuits.create(
      input.name,
      context.currentUser.id,
      input.heroImage
    );
    return { circuit: newCircuit };
  },
};
