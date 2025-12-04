import { GraphQLError } from "graphql";
import type { LapEventRecord } from "../../../db/lap_events.js";
import type { LapRecord } from "../../../db/laps.js";
import type { TrackRecordingRecord } from "../../../db/track_recordings.js";
import type {
  TrackSessionConditions,
  TrackSessionLapInput,
  TrackSessionRecord,
} from "../../../db/track_sessions.js";
import type { GraphQLContext } from "../context.js";
import type { Repositories } from "../repositories.js";
import { toCircuitPayload } from "./circuit.js";

export type LapEventInputArg = { offset?: number; event?: string; value?: string };
export type LapInputArg = { lapNumber?: number; time?: number; lapEvents?: LapEventInputArg[] | null };

export type CreateTrackSessionInputArgs = {
  input?: {
    date?: string;
    format?: string;
    conditions?: string;
    circuitId?: string;
    notes?: string;
    laps?: LapInputArg[] | null;
  };
};

export type UpdateTrackSessionInputArgs = {
  input?: {
    id?: string;
    date?: string | null;
    format?: string | null;
    conditions?: string | null;
    circuitId?: string | null;
    notes?: string | null;
  };
};

export type TrackSessionArgs = {
  id?: string;
};

export function parseConditions(conditions: string | undefined): TrackSessionConditions {
  if (!conditions) {
    return "Dry";
  }

  const normalized = conditions.trim();
  if (normalized === "Dry" || normalized === "Wet") {
    return normalized;
  }

  throw new GraphQLError("conditions must be either Dry or Wet", {
    extensions: { code: "VALIDATION_FAILED" },
  });
}

function parseLapEventInputs(
  lapEvents: LapEventInputArg[] | null | undefined,
  lapNumber: number,
  lapTime: number
) {
  if (!lapEvents || lapEvents.length === 0) {
    return [];
  }

  const parsed = lapEvents.map((lapEvent, idx) => {
    const offset = Number(lapEvent?.offset);
    if (!Number.isFinite(offset) || offset < 0) {
      throw new GraphQLError(`Lap ${lapNumber} event offset must be >= 0 (row ${idx + 1})`, {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    if (offset > lapTime) {
      throw new GraphQLError(
        `Lap ${lapNumber} event offset cannot exceed lap time (${lapTime}s)`,
        { extensions: { code: "VALIDATION_FAILED" } },
      );
    }

    const eventName = lapEvent?.event?.trim();
    if (!eventName) {
      throw new GraphQLError(`Lap ${lapNumber} event type is required (row ${idx + 1})`, {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const value = lapEvent?.value?.trim();
    if (!value) {
      throw new GraphQLError(`Lap ${lapNumber} event value is required (row ${idx + 1})`, {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    return { offset, event: eventName, value };
  });

  parsed.sort((a, b) => a.offset - b.offset);
  return parsed;
}

export function parseLapInputs(laps: LapInputArg[] | null | undefined): TrackSessionLapInput[] {
  if (!laps || laps.length === 0) {
    return [];
  }

  const seenLapNumbers = new Set<number>();
  const parsed = laps.map((lap, idx) => {
    const lapNumber = Number(lap?.lapNumber);
    const time = Number(lap?.time);

    if (!Number.isFinite(lapNumber) || lapNumber < 1) {
      throw new GraphQLError(`Lap number must be >= 1 (row ${idx + 1})`, {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    if (!Number.isFinite(time) || time <= 0) {
      throw new GraphQLError(`Lap time must be positive for lap ${lapNumber}`, {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    if (seenLapNumbers.has(lapNumber)) {
      throw new GraphQLError(`Lap ${lapNumber} is duplicated`, {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    seenLapNumbers.add(lapNumber);
    const lapEvents = parseLapEventInputs(lap.lapEvents, lapNumber, time);
    return lapEvents.length > 0
      ? { lapNumber: Math.round(lapNumber), time, lapEvents }
      : { lapNumber: Math.round(lapNumber), time };
  });

  parsed.sort((a, b) => a.lapNumber - b.lapNumber);
  return parsed;
}

export function toTrackSessionPayload(session: TrackSessionRecord, repositories: Repositories) {
  return {
    id: session.id,
    date: session.date,
    format: session.format,
    conditions: session.conditions,
    circuit: () => {
      const circuit = repositories.circuits.findById(session.circuitId);
      if (!circuit) {
        throw new GraphQLError(`Circuit with ID ${session.circuitId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return toCircuitPayload(circuit, repositories);
    },
    notes: session.notes,
    createdAt: new Date(session.createdAt).toISOString(),
    updatedAt: new Date(session.updatedAt).toISOString(),
    laps: (args: { first: number }) => {
      const laps = repositories.laps.findBySessionId(session.id);
      return laps.slice(0, args.first).map((lap) => toLapPayload(lap, repositories));
    },
    trackRecordings: (args: { first: number }) => {
      const recordings = repositories.trackRecordings.findBySessionId(session.id);
      return recordings
        .slice(0, args.first)
        .map((recording) => toTrackRecordingPayload(recording, repositories));
    },
  };
}

export function toLapPayload(lap: LapRecord, repositories: Repositories) {
  return {
    id: lap.id,
    session: () => {
      const session = repositories.trackSessions.findById(lap.sessionId);
      if (!session) {
        throw new GraphQLError(`Track session with ID ${lap.sessionId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return toTrackSessionPayload(session, repositories);
    },
    lapNumber: lap.lapNumber,
    time: lap.time,
    createdAt: new Date(lap.createdAt).toISOString(),
    updatedAt: new Date(lap.updatedAt).toISOString(),
    lapEvents: (args: { first: number }) => {
      const events = repositories.lapEvents.findByLapId(lap.id);
      return events.slice(0, args.first).map((event) => toLapEventPayload(event, repositories));
    },
    personalBest: () => {
      const lapsInSession = repositories.laps.findBySessionId(lap.sessionId);
      if (lapsInSession.length === 0) {
        return null;
      }
      return Math.min(...lapsInSession.map((l) => l.time));
    },
  };
}

export function toLapEventPayload(lapEvent: LapEventRecord, repositories: Repositories) {
  return {
    id: lapEvent.id,
    lap: () => {
      const lap = repositories.laps.findById(lapEvent.lapId);
      if (!lap) {
        throw new GraphQLError(`Lap with ID ${lapEvent.lapId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return toLapPayload(lap, repositories);
    },
    offset: lapEvent.offset,
    event: lapEvent.event,
    value: lapEvent.value,
    createdAt: new Date(lapEvent.createdAt).toISOString(),
    updatedAt: new Date(lapEvent.updatedAt).toISOString(),
  };
}

export function toTrackRecordingPayload(recording: TrackRecordingRecord, repositories: Repositories) {
  return {
    id: recording.id,
    session: () => {
      const session = repositories.trackSessions.findById(recording.sessionId);
      if (!session) {
        throw new GraphQLError(`Track session with ID ${recording.sessionId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return toTrackSessionPayload(session, repositories);
    },
    mediaId: recording.mediaId,
    lapOneOffset: recording.lapOneOffset,
    description: recording.description,
    createdAt: new Date(recording.createdAt).toISOString(),
    updatedAt: new Date(recording.updatedAt).toISOString(),
  };
}

export function findTrackSessionsForUser(userId: string, repositories: Repositories): TrackSessionRecord[] {
  const circuitsForUser = repositories.circuits.findByUserId(userId);
  let allTrackSessions: TrackSessionRecord[] = [];
  for (const circuit of circuitsForUser) {
    const sessions = repositories.trackSessions.findByCircuitId(circuit.id);
    allTrackSessions = allTrackSessions.concat(sessions);
  }
  return allTrackSessions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export const trackSessionResolvers = {
  trackSession: (args: TrackSessionArgs, context: GraphQLContext) => {
    const { repositories } = context;
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    if (!args.id) {
      throw new GraphQLError("trackSession id is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const session = repositories.trackSessions.findById(args.id);
    if (!session) {
      throw new GraphQLError(`Track session with ID ${args.id} not found`, {
        extensions: { code: "NOT_FOUND" },
      });
    }

    const circuit = repositories.circuits.findById(session.circuitId);
    if (!circuit || circuit.userId !== context.currentUser.id) {
      throw new GraphQLError("You do not have access to this session", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    return toTrackSessionPayload(session, repositories);
  },
  createTrackSession: (args: CreateTrackSessionInputArgs, context: GraphQLContext) => {
    const { repositories } = context;
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
    const laps = parseLapInputs(input.laps);
    const conditions = parseConditions(input.conditions);
    const { trackSession } = repositories.trackSessions.createWithLaps({
      date: input.date,
      format: input.format,
      circuitId: input.circuitId,
      conditions,
      notes: input.notes,
      laps,
    });
    return { trackSession: toTrackSessionPayload(trackSession, repositories) };
  },
  updateTrackSession: (args: UpdateTrackSessionInputArgs, context: GraphQLContext) => {
    const { repositories } = context;
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    const input = args.input;
    if (!input?.id) {
      throw new GraphQLError("id is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const existingSession = repositories.trackSessions.findById(input.id);
    if (!existingSession) {
      throw new GraphQLError(`Track session with ID ${input.id} not found`, {
        extensions: { code: "NOT_FOUND" },
      });
    }

    const currentCircuit = repositories.circuits.findById(existingSession.circuitId);
    if (!currentCircuit || currentCircuit.userId !== context.currentUser.id) {
      throw new GraphQLError("You do not have access to this session", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    const circuitIdProvided = Object.prototype.hasOwnProperty.call(input, "circuitId");
    let targetCircuitId = existingSession.circuitId;
    if (circuitIdProvided && input.circuitId) {
      targetCircuitId = input.circuitId;
    }

    if (circuitIdProvided && input.circuitId === "") {
      throw new GraphQLError("circuitId cannot be empty", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    if (circuitIdProvided && input.circuitId) {
      const newCircuit = repositories.circuits.findById(input.circuitId);
      if (!newCircuit) {
        throw new GraphQLError(`Circuit with ID ${input.circuitId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      if (newCircuit.userId !== context.currentUser.id) {
        throw new GraphQLError("You do not have access to this circuit", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
    }

    const dateProvided = Object.prototype.hasOwnProperty.call(input, "date");
    const nextDate =
      dateProvided && input.date !== null && input.date !== undefined
        ? input.date
        : undefined;
    if (nextDate !== undefined && nextDate.trim() === "") {
      throw new GraphQLError("date cannot be empty", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const formatProvided = Object.prototype.hasOwnProperty.call(input, "format");
    const nextFormat =
      formatProvided && input.format !== null && input.format !== undefined
        ? input.format
        : undefined;
    if (nextFormat !== undefined && nextFormat.trim() === "") {
      throw new GraphQLError("format cannot be empty", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const notesProvided = Object.prototype.hasOwnProperty.call(input, "notes");
    const conditionsProvided = Object.prototype.hasOwnProperty.call(input, "conditions");

    const notes = notesProvided ? input.notes ?? null : undefined;
    const conditions =
      conditionsProvided && input.conditions !== null && input.conditions !== undefined
        ? parseConditions(input.conditions)
        : undefined;

    const updated = repositories.trackSessions.update({
      id: input.id,
      date: nextDate,
      format: nextFormat,
      circuitId: targetCircuitId,
      conditions,
      notes,
    });

    if (!updated) {
      throw new GraphQLError(`Track session with ID ${input.id} not found`, {
        extensions: { code: "NOT_FOUND" },
      });
    }

    return { trackSession: toTrackSessionPayload(updated, repositories) };
  },
};
