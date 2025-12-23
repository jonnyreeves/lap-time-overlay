import { GraphQLError } from "graphql";
import {
  endSession,
  listPublicUsers,
  loginUser,
  registerUser,
  type PublicUser,
} from "../../auth/service.js";
import type { GraphQLContext } from "../context.js";
import { toGraphQLError } from "./utils.js";

export function toUserPayload<T extends Record<string, unknown> | undefined = undefined>(
  user: PublicUser,
  extras?: T
): { id: string; username: string; createdAt: string } & (T extends Record<string, unknown> ? T : {}) {
  return {
    id: user.id,
    username: user.username,
    createdAt: new Date(user.createdAt).toISOString(),
    ...(extras ?? {}),
  } as { id: string; username: string; createdAt: string } & (T extends Record<string, unknown> ? T : {});
}

export const authResolvers = {
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
  users: (_args: unknown, _context: GraphQLContext) => {
    return listPublicUsers().map((user) => toUserPayload(user));
  },
};

export const authUtils = { toGraphQLError };
