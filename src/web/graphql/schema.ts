import { GraphQLError, buildSchema, type GraphQLSchema } from "graphql";
import {
  AuthError,
  endSession,
  loginUser,
  registerUser,
  type PublicUser,
} from "../auth/service.js";
import type { GraphQLContext } from "./context.js";

export const schema: GraphQLSchema = buildSchema(`
  type Query {
    hello: String!
    viewer: User
  }

  type Mutation {
    register(input: AuthInput!): AuthPayload!
    login(input: AuthInput!): AuthPayload!
    logout: LogoutResult!
  }

  input AuthInput {
    username: String!
    password: String!
  }

  type User {
    id: ID!
    username: String!
    createdAt: String!
  }

  type AuthPayload {
    user: User!
    sessionExpiresAt: String!
  }

  type LogoutResult {
    success: Boolean!
  }
`);

export const rootValue = {
  hello: () => "Hello from Lap Time Overlap!",
  viewer: (_args: unknown, context: GraphQLContext) => {
    if (!context.currentUser) return null;
    return toUserPayload(context.currentUser);
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

function toUserPayload(user: PublicUser) {
  return {
    id: user.id,
    username: user.username,
    createdAt: new Date(user.createdAt).toISOString(),
  };
}

function toGraphQLError(err: unknown): GraphQLError {
  if (err instanceof GraphQLError) return err;
  if (err instanceof AuthError) {
    return new GraphQLError(err.message, {
      extensions: { code: err.code },
    });
  }
  console.error("Unexpected GraphQL auth error:", err);
  return new GraphQLError("Internal error", {
    extensions: { code: "INTERNAL_SERVER_ERROR" },
  });
}
