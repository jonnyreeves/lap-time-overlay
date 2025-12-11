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
    classification?: number | null;
    conditions?: string;
    circuitId?: string;
    trackId?: string;
    kartId?: string;
    trackLayoutId?: string;
    notes?: string;
    laps?: LapInputArg[] | null;
  };
};

export type UpdateTrackSessionInputArgs = {
  input?: {
    id?: string;
    date?: string | null;
    format?: string | null;
    classification?: number | null;
    conditions?: string | null;
    circuitId?: string | null;
    trackId?: string | null;
    trackLayoutId?: string | null;
    notes?: string | null;
  };
};

export type UpdateTrackSessionLapsInputArgs = {
  input?: {
    id?: string;
    laps?: LapInputArg[] | null;
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

export function parseClassification(classification: number | string | null | undefined): number {
  if (classification === null || classification === undefined) {
    throw new GraphQLError("classification is required", {
      extensions: { code: "VALIDATION_FAILED" },
    });
  }

  const parsed =
    typeof classification === "string" ? Number.parseInt(classification, 10) : classification;
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new GraphQLError("classification must be an integer >= 1", {
      extensions: { code: "VALIDATION_FAILED" },
    });
  }

  return parsed;
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
    classification: session.classification,
    conditions: session.conditions,
    circuit: () => {
      const circuit = repositories.tracks.findById(session.trackId);
      if (!circuit) {
        throw new GraphQLError(`Track with ID ${session.trackId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return toCircuitPayload(circuit, repositories, session.userId);
    },
    trackLayout: () => {
      const layout = repositories.trackLayouts.findById(session.trackLayoutId);
      if (!layout) {
        throw new GraphQLError(`Track layout with ID ${session.trackLayoutId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      const circuit = repositories.tracks.findById(layout.trackId);
      if (!circuit) {
        throw new GraphQLError(`Track with ID ${layout.trackId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return {
        id: layout.id,
        name: layout.name,
        circuit: toCircuitPayload(circuit, repositories, session.userId),
        createdAt: new Date(layout.createdAt).toISOString(),
        updatedAt: new Date(layout.updatedAt).toISOString(),
      };
    },
    kart: session.kartId
      ? () => {
          const kart = repositories.karts.findById(session.kartId as string);
          if (!kart) {
            return null;
          }
          return {
            id: kart.id,
            name: kart.name,
            createdAt: new Date(kart.createdAt).toISOString(),
            updatedAt: new Date(kart.updatedAt).toISOString(),
          };
        }
      : null,
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
  const loadTargets = () => repositories.trackRecordingSources.findByRecordingId?.(recording.id) ?? [];

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
    isPrimary: recording.isPrimary,
    lapOneOffset: recording.lapOneOffset,
    description: recording.description,
    status: recording.status.toUpperCase(),
    error: recording.error,
    sizeBytes: recording.sizeBytes,
    durationMs: recording.durationMs,
    fps: recording.fps,
    combineProgress: recording.combineProgress,
    uploadProgress: () => {
      const targets = loadTargets();
      const uploadedBytes = targets.reduce((sum, target) => sum + (target.uploadedBytes ?? 0), 0);
      const totalBytes = targets.some((target) => target.sizeBytes == null)
        ? null
        : targets.reduce((sum, target) => sum + (target.sizeBytes ?? 0), 0);
      return { uploadedBytes, totalBytes };
    },
    uploadTargets: (args: { first?: number }) => {
      const limit = typeof args?.first === "number" ? args.first : 10;
      const targets = loadTargets();
      return targets.slice(0, limit).map((target) => ({
        id: target.id,
        fileName: target.fileName,
        sizeBytes: target.sizeBytes,
        uploadedBytes: target.uploadedBytes,
        status: target.status.toUpperCase(),
        ordinal: target.ordinal,
        uploadUrl:
          target.status === "uploaded"
            ? null
            : `/uploads/recordings/${target.id}?token=${encodeURIComponent(target.uploadToken)}`,
      }));
    },
    createdAt: new Date(recording.createdAt).toISOString(),
    updatedAt: new Date(recording.updatedAt).toISOString(),
  };
}

export function findTrackSessionsForUser(userId: string, repositories: Repositories): TrackSessionRecord[] {
  const sessions = repositories.trackSessions.findByUserId(userId);
  return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

    if (session.userId !== context.currentUser.id) {
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
    const trackId = input?.trackId ?? input?.circuitId;
    if (!input?.date || !input?.format || !trackId || !input?.kartId || !input?.trackLayoutId || input.classification == null) {
      throw new GraphQLError("Date, format, trackId (or circuitId), trackLayoutId, kartId, and classification are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const circuit = repositories.tracks.findById(trackId);
    if (!circuit) {
      throw new GraphQLError(`Track with ID ${trackId} not found`, {
        extensions: { code: "NOT_FOUND" },
      });
    }

    const kart = repositories.karts.findById(input.kartId);
    if (!kart) {
      throw new GraphQLError(`Kart with ID ${input.kartId} not found`, {
        extensions: { code: "NOT_FOUND" },
      });
    }

    const availableKarts = repositories.trackKarts.findKartsForTrack(trackId) ?? [];
    const kartIsOnCircuit = availableKarts.some((candidate) => candidate.id === kart.id);
    if (!kartIsOnCircuit) {
      throw new GraphQLError("Kart is not available at the selected track", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const trackLayout = repositories.trackLayouts.findById(input.trackLayoutId);
    if (!trackLayout) {
      throw new GraphQLError(`Track layout with ID ${input.trackLayoutId} not found`, {
        extensions: { code: "NOT_FOUND" },
      });
    }

    if (trackLayout.trackId !== trackId) {
      throw new GraphQLError("Track layout is not available at the selected track", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const laps = parseLapInputs(input.laps);
    const classification = parseClassification(input.classification);
    const conditions = parseConditions(input.conditions);
    const { trackSession } = repositories.trackSessions.createWithLaps({
      date: input.date,
      format: input.format,
      classification,
      trackId,
      userId: context.currentUser.id,
      conditions,
      notes: input.notes,
      laps,
      kartId: input.kartId,
      trackLayoutId: input.trackLayoutId,
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

    if (existingSession.userId !== context.currentUser.id) {
      throw new GraphQLError("You do not have access to this session", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    const trackIdProvided =
      Object.prototype.hasOwnProperty.call(input, "trackId") ||
      Object.prototype.hasOwnProperty.call(input, "circuitId");
    let targetTrackId = existingSession.trackId;
    const nextTrackId = input.trackId ?? input.circuitId;
    if (trackIdProvided && nextTrackId) {
      targetTrackId = nextTrackId;
    }

    if (trackIdProvided && nextTrackId === "") {
      throw new GraphQLError("trackId cannot be empty", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    if (trackIdProvided && nextTrackId) {
      const newTrack = repositories.tracks.findById(nextTrackId);
      if (!newTrack) {
        throw new GraphQLError(`Track with ID ${nextTrackId} not found`, {
          extensions: { code: "NOT_FOUND" },
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

    const trackLayoutIdProvided = Object.prototype.hasOwnProperty.call(input, "trackLayoutId");
    let targetTrackLayoutId = existingSession.trackLayoutId;
    if (trackLayoutIdProvided && input.trackLayoutId === "") {
      throw new GraphQLError("trackLayoutId cannot be empty", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const currentLayout = repositories.trackLayouts.findById(existingSession.trackLayoutId);
    if (
      trackIdProvided &&
      nextTrackId &&
      currentLayout &&
      currentLayout.trackId !== nextTrackId &&
      !trackLayoutIdProvided
    ) {
      throw new GraphQLError("trackLayoutId is required when changing track", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    if (trackLayoutIdProvided && input.trackLayoutId) {
      const layout = repositories.trackLayouts.findById(input.trackLayoutId);
      if (!layout) {
        throw new GraphQLError(`Track layout with ID ${input.trackLayoutId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      if (layout.trackId !== targetTrackId) {
        throw new GraphQLError("Track layout is not available at the selected track", {
          extensions: { code: "VALIDATION_FAILED" },
        });
      }
      targetTrackLayoutId = layout.id;
    }

    const notesProvided = Object.prototype.hasOwnProperty.call(input, "notes");
    const classificationProvided = Object.prototype.hasOwnProperty.call(input, "classification");
    const conditionsProvided = Object.prototype.hasOwnProperty.call(input, "conditions");

    if (classificationProvided && input.classification === null) {
      throw new GraphQLError("classification cannot be null", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const notes = notesProvided ? input.notes ?? null : undefined;
    const classification =
      classificationProvided && input.classification !== null && input.classification !== undefined
        ? parseClassification(input.classification)
        : undefined;
    const conditions =
      conditionsProvided && input.conditions !== null && input.conditions !== undefined
        ? parseConditions(input.conditions)
        : undefined;

    const updated = repositories.trackSessions.update({
      id: input.id,
      date: nextDate,
      format: nextFormat,
      classification,
      trackId: targetTrackId,
      conditions,
      notes,
      trackLayoutId: targetTrackLayoutId,
    });

    if (!updated) {
      throw new GraphQLError(`Track session with ID ${input.id} not found`, {
        extensions: { code: "NOT_FOUND" },
      });
    }

    return { trackSession: toTrackSessionPayload(updated, repositories) };
  },
  updateTrackSessionLaps: (args: UpdateTrackSessionLapsInputArgs, context: GraphQLContext) => {
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

    if (existingSession.userId !== context.currentUser.id) {
      throw new GraphQLError("You do not have access to this session", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    const laps = parseLapInputs(input.laps);
    const now = Date.now();
    repositories.trackSessions.replaceLapsForSession(existingSession.id, laps, now);
    const updatedSession =
      repositories.trackSessions.update({ id: existingSession.id, now }) ?? existingSession;

    return { trackSession: toTrackSessionPayload(updatedSession, repositories) };
  },
};
