import { readFileSync } from "fs";
import { GraphQLError, buildSchema, type GraphQLSchema } from "graphql";
import { resolve as pathResolve } from "path";
import { createCircuit, findAllCircuits, findCircuitById, findCircuitsByUserId } from "../../db/circuits.js";
import { findLapEventsByLapId, type LapEventRecord } from "../../db/lap_events.js";
import { findLapById, findLapsBySessionId, type LapRecord } from "../../db/laps.js";
import { findTrackRecordingsBySessionId, type TrackRecordingRecord } from "../../db/track_recordings.js";
import { createTrackSession as createTrackSessionDb, findTrackSessionById, findTrackSessionsByCircuitId, type TrackSessionRecord } from "../../db/track_sessions.js";
import {
  AuthError,
  endSession,
  loginUser,
  registerUser,
  type PublicUser,
} from "../auth/service.js";
import type { GraphQLContext } from "./context.js";

const schemaFileContents = readFileSync(
  pathResolve(process.cwd(), "schema.graphql"),
  { encoding: "utf8" },
);

export const schema: GraphQLSchema = buildSchema(schemaFileContents);

export const rootValue = {
  hello: () => "Hello world!",
  viewer: (_args: unknown, context: GraphQLContext) => {
    if (!context.currentUser) return null;
    return toUserPayload(context.currentUser);
  },
  circuits: () => {
    return findAllCircuits();
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
  createCircuit: (
    args: { input?: { name?: string; heroImage?: string } },
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
    const newCircuit = createCircuit(input.name, context.currentUser.id, input.heroImage);
    return { circuit: newCircuit };
  },
  createTrackSession: (
    args: { input?: { date?: string; format?: string; circuitId?: string; notes?: string } },
    context: GraphQLContext
  ) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    const input = args.input;
    if (!input?.date || !input?.format || !input?.circuitId) {
      throw new GraphQLError("Date, format, and circuitId are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    const newTrackSession = createTrackSessionDb(
      input.date,
      input.format,
      input.circuitId,
      input.notes,
    );
    return { trackSession: toTrackSessionPayload(newTrackSession) };
  },
};

function toUserPayload(user: PublicUser) {
  return {
    id: user.id,
    username: user.username,
    createdAt: new Date(user.createdAt).toISOString(),
    recentCircuits: (args: { first: number }) => {
      const circuits = findCircuitsByUserId(user.id);
      return circuits.slice(0, args.first);
    },
    recentTrackSessions: (args: { first: number }) => {
      const sessions = findTrackSessionsForUser(user.id);
      return sessions.slice(0, args.first).map(toTrackSessionPayload);
    },
  };
}

function toTrackSessionPayload(session: TrackSessionRecord) {
  return {
    id: session.id,
    date: session.date,
    format: session.format,
    circuit: () => {
      const circuit = findCircuitById(session.circuitId);
      if (!circuit) {
        throw new GraphQLError(`Circuit with ID ${session.circuitId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return circuit;
    },
    notes: session.notes,
    createdAt: new Date(session.createdAt).toISOString(),
    updatedAt: new Date(session.updatedAt).toISOString(),
    laps: (args: { first: number }) => {
      const laps = findLapsBySessionId(session.id);
      return laps.slice(0, args.first).map(toLapPayload);
    },
    trackRecordings: (args: { first: number }) => {
      const recordings = findTrackRecordingsBySessionId(session.id);
      return recordings.slice(0, args.first).map(toTrackRecordingPayload);
    },
  };
}

function toLapPayload(lap: LapRecord) {
  return {
    id: lap.id,
    session: () => {
      const session = findTrackSessionById(lap.sessionId);
      if (!session) {
        throw new GraphQLError(`Track session with ID ${lap.sessionId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return toTrackSessionPayload(session);
    },
    lapNumber: lap.lapNumber,
    time: lap.time,
    createdAt: new Date(lap.createdAt).toISOString(),
    updatedAt: new Date(lap.updatedAt).toISOString(),
    lapEvents: (args: { first: number }) => {
      const events = findLapEventsByLapId(lap.id);
      return events.slice(0, args.first).map(toLapEventPayload);
    },
    personalBest: () => {
      // Find all laps for the session and return the minimum time
      const lapsInSession = findLapsBySessionId(lap.sessionId);
      if (lapsInSession.length === 0) {
        return null;
      }
      return Math.min(...lapsInSession.map((l) => l.time));
    },
  };
}

function toLapEventPayload(lapEvent: LapEventRecord) {
  return {
    id: lapEvent.id,
    lap: () => {
      const lap = findLapById(lapEvent.lapId);
      if (!lap) {
        throw new GraphQLError(`Lap with ID ${lapEvent.lapId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return toLapPayload(lap);
    },
    offset: lapEvent.offset,
    event: lapEvent.event,
    createdAt: new Date(lapEvent.createdAt).toISOString(),
    updatedAt: new Date(lapEvent.updatedAt).toISOString(),
  };
}

function toTrackRecordingPayload(recording: TrackRecordingRecord) {
  return {
    id: recording.id,
    session: () => {
      const session = findTrackSessionById(recording.sessionId);
      if (!session) {
        throw new GraphQLError(`Track session with ID ${recording.sessionId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return toTrackSessionPayload(session);
    },
    mediaId: recording.mediaId,
    lapOneOffset: recording.lapOneOffset,
    description: recording.description,
    createdAt: new Date(recording.createdAt).toISOString(),
    updatedAt: new Date(recording.updatedAt).toISOString(),
  };
}

function toGraphQLError(err: unknown): GraphQLError {
  if (err instanceof GraphQLError) return err;
  if (err instanceof AuthError) {
    return new GraphQLError(err.message, {
      extensions: { code: "VALIDATION_FAILED" },
    });
  }
  console.error("Unexpected GraphQL auth error:", err);
  return new GraphQLError("Internal error", {
    extensions: { code: "INTERNAL_SERVER_ERROR" },
  });
}

function findTrackSessionsForUser(userId: string): TrackSessionRecord[] {
  const circuits = findCircuitsByUserId(userId);
  let allTrackSessions: TrackSessionRecord[] = [];
  for (const circuit of circuits) {
    const sessions = findTrackSessionsByCircuitId(circuit.id);
    allTrackSessions = allTrackSessions.concat(sessions);
  }
  // Sort by date in descending order
  return allTrackSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}


