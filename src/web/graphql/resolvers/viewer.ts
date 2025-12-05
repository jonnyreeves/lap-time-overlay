import { toUserPayload } from "./auth.js";
import { toCircuitPayload } from "./circuit.js";
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

export const viewerResolvers = {
  viewer: (_args: unknown, context: GraphQLContext) => {
    if (!context.currentUser) return null;
    const user = context.currentUser;
    const { repositories } = context;
    return toUserPayload(user, {
      recentCircuits: (args: { first?: number; after?: string }) => {
        const sessions = findTrackSessionsForUser(user.id, repositories);
        const seen = new Set<string>();
        const uniqueCircuits: ReturnType<typeof toCircuitPayload>[] = [];
        for (const session of sessions) {
          if (seen.has(session.circuitId)) continue;
          const circuit = repositories.circuits.findById(session.circuitId);
          if (circuit) {
            seen.add(session.circuitId);
            uniqueCircuits.push(toCircuitPayload(circuit, repositories, user.id));
          }
        }

        const first = typeof args.first === "number" && args.first > 0 ? args.first : 10;
        const afterId = args.after ? decodeCursor(args.after) : null;
        const afterIndex = afterId
          ? uniqueCircuits.findIndex((circuit) => circuit.id === afterId)
          : -1;
        const startIndex = afterIndex >= 0 ? afterIndex + 1 : 0;

        const slice = uniqueCircuits.slice(startIndex, startIndex + first);
        const edges = slice.map((circuit) => ({
          cursor: encodeCursor(circuit.id),
          node: circuit,
        }));

        const endIndex = startIndex + slice.length;
        const hasNextPage = endIndex < uniqueCircuits.length;
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
      recentTrackSessions: (args: { first?: number; after?: string }) => {
        const sessions = findTrackSessionsForUser(user.id, repositories);
        const first = typeof args.first === "number" && args.first > 0 ? args.first : 10;
        const afterId = args.after ? decodeCursor(args.after) : null;
        const afterIndex = afterId ? sessions.findIndex((session) => session.id === afterId) : -1;
        const startIndex = afterIndex >= 0 ? afterIndex + 1 : 0;

        const slice = sessions.slice(startIndex, startIndex + first);
        const edges = slice.map((session) => ({
          cursor: encodeCursor(session.id),
          node: toTrackSessionPayload(session, repositories),
        }));

        const endIndex = startIndex + slice.length;
        const hasNextPage = endIndex < sessions.length;
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
