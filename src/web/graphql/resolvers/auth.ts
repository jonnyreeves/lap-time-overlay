import { GraphQLError } from "graphql";
import { endSession, loginUser, registerUser, type PublicUser } from "../../auth/service.js";
import { toCircuitPayload } from "./circuit.js";
import {
  findTrackSessionsForUser,
  toTrackSessionPayload,
} from "./trackSession.js";
import type { GraphQLContext } from "../context.js";
import { toGraphQLError } from "./utils.js";

export function toUserPayload(user: PublicUser, extras?: Record<string, unknown>) {
  return {
    id: user.id,
    username: user.username,
    createdAt: new Date(user.createdAt).toISOString(),
    ...extras,
  };
}

export const authResolvers = {
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
  register: (
    args: { input?: { username?: string; password?: string } },
    context: GraphQLContext
  ) => {
    const input = args.input;
    if (!input?.username || !input?.password) {
      throw new GraphQLError("username and password are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    try {
      const result = registerUser(input.username, input.password);
      context.setSessionCookie(result.token, result.expiresAt);
      return {
        user: toUserPayload(result.user),
        sessionExpiresAt: new Date(result.expiresAt).toISOString(),
      };
    } catch (err) {
      throw toGraphQLError(err);
    }
  },
  login: (
    args: { input?: { username?: string; password?: string } },
    context: GraphQLContext
  ) => {
    const input = args.input;
    if (!input?.username || !input?.password) {
      throw new GraphQLError("username and password are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    try {
      const result = loginUser(input.username, input.password);
      context.setSessionCookie(result.token, result.expiresAt);
      return {
        user: toUserPayload(result.user),
        sessionExpiresAt: new Date(result.expiresAt).toISOString(),
      };
    } catch (err) {
      throw toGraphQLError(err);
    }
  },
  logout: (_args: unknown, context: GraphQLContext) => {
    if (context.sessionToken) {
      endSession(context.sessionToken);
    }
    context.clearSessionCookie();
    return { success: true };
  },
};

export const authUtils = { toGraphQLError };
