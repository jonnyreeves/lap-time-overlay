import { toUserPayload } from "./auth.js";
import { toCircuitPayload } from "./circuit.js";
import { findTrackSessionsForUser, toTrackSessionPayload } from "./trackSession.js";
import type { GraphQLContext } from "../context.js";

export const viewerResolvers = {
  viewer: (_args: unknown, context: GraphQLContext) => {
    if (!context.currentUser) return null;
    const user = context.currentUser;
    const { repositories } = context;
    return toUserPayload(user, {
      recentCircuits: (args: { first: number }) => {
        const sessions = findTrackSessionsForUser(user.id, repositories);
        const seen = new Set<string>();
        const circuits: ReturnType<typeof toCircuitPayload>[] = [];
        for (const session of sessions) {
          if (seen.has(session.circuitId)) continue;
          const circuit = repositories.circuits.findById(session.circuitId);
          if (circuit) {
            seen.add(session.circuitId);
            circuits.push(toCircuitPayload(circuit, repositories, user.id));
          }
          if (circuits.length >= args.first) break;
        }
        return circuits;
      },
      recentTrackSessions: (args: { first: number }) => {
        const sessions = findTrackSessionsForUser(user.id, repositories);
        return sessions
          .slice(0, args.first)
          .map((session) => toTrackSessionPayload(session, repositories));
      },
    });
  },
};
