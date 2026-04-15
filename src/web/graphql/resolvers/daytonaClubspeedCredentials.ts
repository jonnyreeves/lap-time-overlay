import { GraphQLError } from "graphql";
import {
  deleteViewerDaytonaClubspeedCredentials,
  getViewerDaytonaClubspeedCredentialStatus,
  getViewerDaytonaClubspeedCredentialsOrThrow,
  markViewerDaytonaClubspeedCredentialInvalid,
  markViewerDaytonaClubspeedCredentialsValidated,
  saveViewerDaytonaClubspeedCredentials,
} from "../../daytonaClubspeedCredentials/service.js";
import { fetchDaytonaClubspeedSessions } from "../../sessionImport/service.js";
import { SessionImportError } from "../../sessionImport/types.js";
import { UserSecretConfigError } from "../../shared/userSecretCrypto.js";
import type { GraphQLContext } from "../context.js";

function requireCurrentUser(context: GraphQLContext) {
  if (!context.currentUser) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  return context.currentUser;
}

function getStatusPayload(userId: string) {
  const status = getViewerDaytonaClubspeedCredentialStatus(userId);
  return {
    configured: status.configured,
    username: status.username,
    lastValidatedAt:
      status.lastValidatedAt == null ? null : new Date(status.lastValidatedAt).toISOString(),
    lastValidationError: status.lastValidationError,
  };
}

function mapError(error: unknown, fallbackMessage: string): GraphQLError {
  if (error instanceof SessionImportError) {
    return new GraphQLError(error.message, {
      extensions: { code: "VALIDATION_FAILED" },
    });
  }
  if (error instanceof UserSecretConfigError) {
    return new GraphQLError(error.message, {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
  console.warn(fallbackMessage, error);
  return new GraphQLError(fallbackMessage, {
    extensions: { code: "INTERNAL_SERVER_ERROR" },
  });
}

export const daytonaClubspeedCredentialResolvers = {
  saveViewerDaytonaClubspeedCredentials: (
    args: { input?: { username?: string; password?: string } },
    context: GraphQLContext
  ) => {
    const user = requireCurrentUser(context);
    const username = args.input?.username?.trim();
    const password = args.input?.password?.trim();
    if (!username || !password) {
      throw new GraphQLError("Daytona Club Speed username and password are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    return (async () => {
      try {
        await fetchDaytonaClubspeedSessions({ username, password });
        saveViewerDaytonaClubspeedCredentials(user.id, username, password);
        markViewerDaytonaClubspeedCredentialsValidated(user.id);
        return { status: getStatusPayload(user.id) };
      } catch (error) {
        throw mapError(error, "Unable to save Daytona Club Speed credentials");
      }
    })();
  },
  testViewerDaytonaClubspeedCredentials: async (_args: unknown, context: GraphQLContext) => {
    const user = requireCurrentUser(context);

    try {
      const credentials = getViewerDaytonaClubspeedCredentialsOrThrow(user.id);
      await fetchDaytonaClubspeedSessions(credentials);
      markViewerDaytonaClubspeedCredentialsValidated(user.id);
      return { status: getStatusPayload(user.id) };
    } catch (error) {
      if (error instanceof SessionImportError && error.code === "INVALID_CREDENTIALS") {
        markViewerDaytonaClubspeedCredentialInvalid(user.id, error.message);
      }
      throw mapError(error, "Unable to test Daytona Club Speed credentials");
    }
  },
  deleteViewerDaytonaClubspeedCredentials: (_args: unknown, context: GraphQLContext) => {
    const user = requireCurrentUser(context);

    try {
      const success = deleteViewerDaytonaClubspeedCredentials(user.id);
      return {
        success,
        status: getStatusPayload(user.id),
      };
    } catch (error) {
      throw mapError(error, "Unable to delete Daytona Club Speed credentials");
    }
  },
};
