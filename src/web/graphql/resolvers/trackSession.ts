import { GraphQLError } from "graphql";
import type { LapEventRecord } from "../../../db/lap_events.js";
import type { LapRecord } from "../../../db/laps.js";
import type { TrackRecordingRecord } from "../../../db/track_recordings.js";
import type {
  TrackSessionParticipantLapRecord,
  TrackSessionParticipantRecord,
} from "../../../db/track_session_participants.js";
import type { TrackRecord } from "../../../db/tracks.js";
import type {
  TrackSessionConditions,
  TrackSessionLapInput,
  TrackSessionParticipantInput,
  TrackSessionRecord,
} from "../../../db/track_sessions.js";
import type { GraphQLContext } from "../context.js";
import type { Repositories } from "../repositories.js";
import {
  computeSessionPerformance,
  type ExcludedLapReason,
  type SessionFormat,
  type SessionPerformanceResult,
} from "../../shared/sessionPerformance.js";
import {
  buildLapComparisons,
  buildRivalPaceInsights,
  buildRivalTrend,
  buildSessionInsights,
  computeBestNAvg,
} from "../../shared/rivalAnalysis.js";
import { fetchWeatherForPostcode } from "../../shared/weather.js";
import {
  getViewerDaytonaClubspeedCredentialsOrThrow,
  markViewerDaytonaClubspeedCredentialInvalid,
  markViewerDaytonaClubspeedCredentialsValidated,
} from "../../daytonaClubspeedCredentials/service.js";
import { toTrackPayload } from "./track.js";
import {
  rebuildMediaLibrarySessionProjection,
  removeMediaLibraryProjectionsForRecordings,
} from "../../recordings/mediaLibraryProjection.js";
import { importTrackSessionFromSource } from "../../sessionImport/service.js";
import {
  fetchDaytonaClubspeedSessions,
  importDaytonaClubspeedSession,
} from "../../sessionImport/service.js";
import { SessionImportError } from "../../sessionImport/types.js";

const DEBUG_UPLOAD_PROGRESS = process.env.DEBUG_UPLOAD_PROGRESS === "1";
const LAP_TIME_EPSILON_S = 1e-6;

export type LapEventInputArg = { offset?: number; event?: string; value?: string };
export type LapInputArg = { lapNumber?: number; time?: number; lapEvents?: LapEventInputArg[] | null };
export type ParticipantLapInputArg = { lapNumber?: number; time?: number };
export type ParticipantInputArg = {
  name?: string;
  classification?: number | null;
  kartNumber?: string | null;
  isSelf?: boolean;
  laps?: ParticipantLapInputArg[] | null;
};

export type CreateTrackSessionInputArgs = {
  input?: {
    date?: string;
    format?: string;
    classification?: number | null;
    conditions?: string;
    temperature?: string;
    trackId?: string;
    kartId?: string;
    kartNumber?: string;
    trackLayoutId?: string;
    notes?: string;
    laps?: LapInputArg[] | null;
    fastestLap?: number | null;
    participants?: ParticipantInputArg[] | null;
  };
};

export type UpdateTrackSessionInputArgs = {
  input?: {
    id?: string;
    date?: string | null;
    format?: string | null;
    classification?: number | null;
    conditions?: string | null;
    temperature?: string | null;
    trackId?: string | null;
    kartId?: string | null;
    kartNumber?: string | null;
    trackLayoutId?: string | null;
    notes?: string | null;
    fastestLap?: number | null;
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

export type FetchTrackSessionTemperatureArgs = {
  input?: {
    trackId?: string;
    date?: string;
  };
};

export type ImportTrackSessionFromUrlArgs = {
  input?: {
    source?: string;
  };
};

export type ImportDaytonaClubspeedSessionArgs = {
  input?: {
    heatNo?: string;
  };
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

export function parseFastestLap(
  fastestLap: number | string | null | undefined
): number | null {
  if (fastestLap === undefined) return null;
  if (fastestLap === null || fastestLap === "") return null;

  const parsed = typeof fastestLap === "string" ? Number(fastestLap) : fastestLap;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new GraphQLError("fastestLap must be a positive number of seconds", {
      extensions: { code: "VALIDATION_FAILED" },
    });
  }
  return parsed;
}

function getCachedTrack(
  trackId: string,
  repositories: Repositories,
  trackCache: Map<string, TrackRecord | null>
): TrackRecord | null {
  if (trackCache.has(trackId)) {
    return trackCache.get(trackId) ?? null;
  }
  const track = repositories.tracks.findById(trackId);
  trackCache.set(trackId, track);
  return track;
}

function resolveSessionConditions(
  session: TrackSessionRecord,
  repositories: Repositories,
  trackCache: Map<string, TrackRecord | null>
): TrackSessionConditions {
  const track = getCachedTrack(session.trackId, repositories, trackCache);
  return track?.isIndoors ? "Dry" : session.conditions;
}

function getSessionPersonalBestKey(
  session: TrackSessionRecord,
  conditions: TrackSessionConditions
) {
  const kartKey = session.kartId ?? "none";
  return `${session.trackId}::${session.trackLayoutId}::${kartKey}::${conditions}`;
}

function getFastestLapForSession(
  session: TrackSessionRecord,
  repositories: Repositories,
  fastestLapCache: Map<string, number | null>
): number | null {
  if (fastestLapCache.has(session.id)) {
    return fastestLapCache.get(session.id) ?? null;
  }

  if (session.fastestLap != null) {
    fastestLapCache.set(session.id, session.fastestLap);
    return session.fastestLap;
  }

  const laps = repositories.laps.findBySessionId(session.id);
  if (!laps.length) {
    fastestLapCache.set(session.id, null);
    return null;
  }
  const fastest = Math.min(...laps.map((lap) => lap.time));
  fastestLapCache.set(session.id, fastest);
  return fastest;
}

function buildPersonalBestIndexForUser(userId: string, repositories: Repositories) {
  const trackCache = new Map<string, TrackRecord | null>();
  const fastestLapCache = new Map<string, number | null>();
  const bestByKey = new Map<
    string,
    {
      bestLap: number;
      timestamp: number;
      sessionId: string;
    }
  >();

  const sessions = repositories.trackSessions.findByUserId(userId);
  sessions.forEach((session) => {
    const fastestLap = getFastestLapForSession(session, repositories, fastestLapCache);
    if (fastestLap == null) return;
    const conditions = resolveSessionConditions(session, repositories, trackCache);
    const key = getSessionPersonalBestKey(session, conditions);
    const timestampValue = new Date(session.date).getTime();
    const timestamp = Number.isNaN(timestampValue) ? 0 : timestampValue;
    const current = bestByKey.get(key);
    if (
      current == null ||
      fastestLap < current.bestLap ||
      (fastestLap === current.bestLap && timestamp < current.timestamp)
    ) {
      bestByKey.set(key, { bestLap: fastestLap, timestamp, sessionId: session.id });
    }
  });

  return bestByKey;
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
    if (offset - lapTime > LAP_TIME_EPSILON_S) {
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

function parseParticipantLaps(
  laps: ParticipantLapInputArg[] | null | undefined,
  participantName: string
) {
  if (!laps || laps.length === 0) {
    return [];
  }
  const seenLapNumbers = new Set<number>();
  const parsed = laps.map((lap, index) => {
    const lapNumber = Number(lap?.lapNumber);
    const time = Number(lap?.time);
    if (!Number.isInteger(lapNumber) || lapNumber < 1) {
      throw new GraphQLError(
        `Participant ${participantName} lap number must be >= 1 (row ${index + 1})`,
        { extensions: { code: "VALIDATION_FAILED" } }
      );
    }
    if (!Number.isFinite(time) || time <= 0) {
      throw new GraphQLError(
        `Participant ${participantName} lap time must be positive`,
        { extensions: { code: "VALIDATION_FAILED" } }
      );
    }
    if (seenLapNumbers.has(lapNumber)) {
      throw new GraphQLError(
        `Participant ${participantName} has duplicate lap ${lapNumber}`,
        { extensions: { code: "VALIDATION_FAILED" } }
      );
    }
    seenLapNumbers.add(lapNumber);
    return { lapNumber, time };
  });
  parsed.sort((a, b) => a.lapNumber - b.lapNumber);
  return parsed;
}

export function parseParticipantInputs(
  participants: ParticipantInputArg[] | null | undefined
): TrackSessionParticipantInput[] {
  if (!participants || participants.length === 0) {
    return [];
  }

  let selfCount = 0;
  const parsed = participants.map((participant, index) => {
    const name = participant?.name?.trim();
    if (!name) {
      throw new GraphQLError(`Participant name is required (row ${index + 1})`, {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    const classification =
      participant?.classification == null
        ? null
        : parseClassification(participant.classification);
    const kartNumber = participant?.kartNumber?.trim() ?? "";
    const isSelf = participant?.isSelf === true;
    if (isSelf) {
      selfCount += 1;
    }
    return {
      name,
      classification,
      kartNumber,
      isSelf,
      laps: parseParticipantLaps(participant?.laps, name),
    };
  });

  if (selfCount > 1) {
    throw new GraphQLError("Only one participant can be marked as self", {
      extensions: { code: "VALIDATION_FAILED" },
    });
  }

  return parsed;
}

function groupParticipantLapsById(
  laps: TrackSessionParticipantLapRecord[]
): Map<string, TrackSessionParticipantLapRecord[]> {
  const byId = new Map<string, TrackSessionParticipantLapRecord[]>();
  for (const lap of laps) {
    const existing = byId.get(lap.participantId) ?? [];
    existing.push(lap);
    byId.set(lap.participantId, existing);
  }
  for (const [participantId, participantLaps] of byId.entries()) {
    participantLaps.sort((a, b) => a.lapNumber - b.lapNumber);
    byId.set(participantId, participantLaps);
  }
  return byId;
}

function buildComparableTrendPoints(
  session: TrackSessionRecord,
  rivalName: string,
  repositories: Repositories
) {
  const comparableSessions = repositories.trackSessions
    .findByUserId(session.userId)
    .filter(
      (candidate) =>
        candidate.trackId === session.trackId && candidate.trackLayoutId === session.trackLayoutId
    );
  if (comparableSessions.length === 0) {
    return [];
  }

  const comparableSessionIds = comparableSessions.map((candidate) => candidate.id);
  const participants = repositories.trackSessionParticipants.findBySessionIds(comparableSessionIds);
  const participantsBySessionId = new Map<string, TrackSessionParticipantRecord[]>();
  for (const participant of participants) {
    const existing = participantsBySessionId.get(participant.sessionId) ?? [];
    existing.push(participant);
    participantsBySessionId.set(participant.sessionId, existing);
  }

  const participantIds = participants.map((participant) => participant.id);
  const participantLaps = repositories.trackSessionParticipants.findLapsByParticipantIds(participantIds);
  const lapsByParticipantId = groupParticipantLapsById(participantLaps);

  const points: Array<{ sessionId: string; date: string; delta: number }> = [];
  for (const comparableSession of comparableSessions) {
    const sessionParticipants = participantsBySessionId.get(comparableSession.id) ?? [];
    const selfParticipant = sessionParticipants.find((participant) => participant.isSelf);
    const rivalParticipant = sessionParticipants.find(
      (participant) => !participant.isSelf && participant.name === rivalName
    );
    if (!selfParticipant || !rivalParticipant) {
      continue;
    }

    const selfLaps =
      lapsByParticipantId
        .get(selfParticipant.id)
        ?.map((lap) => ({ lapNumber: lap.lapNumber, time: lap.time })) ?? [];
    const rivalLaps =
      lapsByParticipantId
        .get(rivalParticipant.id)
        ?.map((lap) => ({ lapNumber: lap.lapNumber, time: lap.time })) ?? [];
    const selfBest10 = computeBestNAvg(selfLaps, 10);
    const rivalBest10 = computeBestNAvg(rivalLaps, 10);
    if (selfBest10 == null || rivalBest10 == null) {
      continue;
    }

    points.push({
      sessionId: comparableSession.id,
      date: comparableSession.date,
      delta: selfBest10 - rivalBest10,
    });
  }

  return points;
}

function normalizeSessionFormat(format: string): SessionFormat {
  if (format === "Practice" || format === "Qualifying" || format === "Race") {
    return format;
  }
  return "Practice";
}

function buildFieldFastestLaps(
  sessionId: string,
  repositories: Repositories
): Array<{ driverName: string; classification: number | null; fastestLap: number | null }> {
  const participants = repositories.trackSessionParticipants.findBySessionId(sessionId);
  if (!participants.length) return [];

  const participantIds = participants.map((participant) => participant.id);
  const lapsByParticipantId = groupParticipantLapsById(
    repositories.trackSessionParticipants.findLapsByParticipantIds(participantIds)
  );

  return participants
    .filter((participant) => !participant.isSelf)
    .map((participant) => {
      const fastestLap = computeBestNAvg(
        (lapsByParticipantId.get(participant.id) ?? []).map((lap) => ({
          lapNumber: lap.lapNumber,
          time: lap.time,
        })),
        1
      );
      return {
        driverName: participant.name,
        classification: participant.classification,
        fastestLap,
      };
    })
    .filter((participant) => participant.fastestLap != null);
}

export function computeSessionPerformanceForSession(
  session: TrackSessionRecord,
  repositories: Repositories
): SessionPerformanceResult {
  const selfLaps = repositories.laps.findBySessionId(session.id).map((lap) => ({
    id: lap.id,
    lapNumber: lap.lapNumber,
    time: lap.time,
  }));
  return computeSessionPerformance({
    format: normalizeSessionFormat(session.format),
    selfLaps,
    fieldFastestLaps: buildFieldFastestLaps(session.id, repositories),
    sessionFastestLap: session.fastestLap,
  });
}

export function toTrackSessionPayload(session: TrackSessionRecord, repositories: Repositories) {
  const loadLaps = () => repositories.laps.findBySessionId(session.id);
  const loadParticipants = () => repositories.trackSessionParticipants.findBySessionId(session.id);
  const cachedTrack = repositories.tracks.findById(session.trackId);
  let cachedSessionPerformance: SessionPerformanceResult | null = null;
  let cachedParticipants: TrackSessionParticipantRecord[] | null = null;
  let cachedParticipantLapsById: Map<string, TrackSessionParticipantLapRecord[]> | null = null;
  let personalBestIndex:
    | ReturnType<typeof buildPersonalBestIndexForUser>
    | null = null;

  const getSessionPerformance = () => {
    if (cachedSessionPerformance) return cachedSessionPerformance;
    cachedSessionPerformance = computeSessionPerformanceForSession(session, repositories);
    return cachedSessionPerformance;
  };

  const getPersonalBestIndex = () => {
    if (!personalBestIndex) {
      personalBestIndex = buildPersonalBestIndexForUser(session.userId, repositories);
    }
    return personalBestIndex;
  };

  const getParticipants = () => {
    if (!cachedParticipants) {
      cachedParticipants = loadParticipants();
    }
    return cachedParticipants;
  };

  const getParticipantLapsById = () => {
    if (!cachedParticipantLapsById) {
      const participants = getParticipants();
      const participantIds = participants.map((participant) => participant.id);
      const laps = repositories.trackSessionParticipants.findLapsByParticipantIds(participantIds);
      cachedParticipantLapsById = groupParticipantLapsById(laps);
    }
    return cachedParticipantLapsById;
  };

  const toSessionPerformancePayload = () => {
    const performance = getSessionPerformance();
    const reasonMap: Record<ExcludedLapReason, "INVALID" | "OUT_LAP" | "OUTLIER"> = {
      invalid: "INVALID",
      "out-lap": "OUT_LAP",
      outlier: "OUTLIER",
    };
    return {
      format: performance.format,
      score: performance.score,
      label: performance.label,
      headline: performance.headline,
      cleanLapCount: performance.cleanLapCount,
      excludedLapCount: performance.excludedLapCount,
      cleanLapNumbers: performance.cleanLapNumbers,
      excludedLaps: performance.excludedLaps.map((lap) => ({
        lapNumber: lap.lapNumber,
        reason: reasonMap[lap.reason],
      })),
      scoreComponents: performance.scoreComponents,
      representativePace: performance.representativePace,
      thresholdLapTime: performance.thresholdLapTime,
      highlightLapNumbers: performance.highlightLapNumbers,
      qualifyingKpis:
        performance.format === "Qualifying"
          ? performance.kpis
          : null,
      practiceRaceKpis:
        performance.format === "Practice" || performance.format === "Race"
          ? performance.kpis
          : null,
    };
  };
  const normalizedConditions = cachedTrack?.isIndoors ? "Dry" : session.conditions;
  const personalBestKey = getSessionPersonalBestKey(session, normalizedConditions);

  return {
    id: session.id,
    date: session.date,
    format: session.format,
    classification: session.classification,
    fastestLap: session.fastestLap,
    isPersonalBest: () => {
      const bestEntry = getPersonalBestIndex().get(personalBestKey);
      return bestEntry?.sessionId === session.id;
    },
    conditions: normalizedConditions,
    temperature: session.temperature,
    kartNumber: session.kartNumber,
    track: () => {
      if (!cachedTrack) {
        throw new GraphQLError(`Track with ID ${session.trackId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return toTrackPayload(cachedTrack, repositories, session.userId);
    },
    trackLayout: () => {
      const layout = repositories.trackLayouts.findById(session.trackLayoutId);
      if (!layout) {
        throw new GraphQLError(`Track layout with ID ${session.trackLayoutId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      const track = cachedTrack ?? repositories.tracks.findById(layout.trackId);
      if (!track) {
        throw new GraphQLError(`Track with ID ${layout.trackId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return {
        id: layout.id,
        name: layout.name,
        track: toTrackPayload(track, repositories, session.userId),
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
    sessionPerformanceScore: () => getSessionPerformance().score,
    sessionPerformance: toSessionPerformancePayload,
    notes: session.notes,
    createdAt: new Date(session.createdAt).toISOString(),
    updatedAt: new Date(session.updatedAt).toISOString(),
    participants: () => {
      const lapsByParticipantId = getParticipantLapsById();
      return getParticipants().map((participant) => ({
        id: participant.id,
        name: participant.name,
        classification: participant.classification,
        kartNumber: participant.kartNumber || null,
        isSelf: participant.isSelf,
        laps:
          lapsByParticipantId.get(participant.id)?.map((lap) => ({
            lapNumber: lap.lapNumber,
            time: lap.time,
          })) ?? [],
      }));
    },
    rivalAnalysis: (args: { rivalName: string }) => {
      const rivalName = args?.rivalName?.trim();
      if (!rivalName) return null;

      const sessionParticipants = getParticipants();
      const selfParticipant = sessionParticipants.find((participant) => participant.isSelf);
      const rivalParticipant = sessionParticipants.find(
        (participant) => !participant.isSelf && participant.name === rivalName
      );
      if (!selfParticipant || !rivalParticipant) {
        return null;
      }

      const lapsByParticipantId = getParticipantLapsById();
      const selfLaps =
        lapsByParticipantId
          .get(selfParticipant.id)
          ?.map((lap) => ({ lapNumber: lap.lapNumber, time: lap.time })) ?? [];
      const rivalLaps =
        lapsByParticipantId
          .get(rivalParticipant.id)
          ?.map((lap) => ({ lapNumber: lap.lapNumber, time: lap.time })) ?? [];
      const lapComparisons = buildLapComparisons(selfLaps, rivalLaps);
      const sessionInsights = buildSessionInsights(lapComparisons);
      const trendPoints = buildComparableTrendPoints(session, rivalName, repositories);
      const trend = buildRivalTrend(trendPoints);
      const paceInsights = buildRivalPaceInsights(selfLaps, rivalLaps, rivalName);

      return {
        rivalName,
        lapComparisons,
        sessionInsights,
        trend,
        paceInsights,
      };
    },
    laps: (args: { first: number }) => {
      const laps = loadLaps();
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
    overlayBurned: recording.overlayBurned,
    isPrimary: recording.isPrimary,
    showInMediaLibrary: recording.showInMediaLibrary,
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
      if (DEBUG_UPLOAD_PROGRESS) {
        console.info("GraphQL upload progress", {
          recordingId: recording.id,
          uploadedBytes,
          totalBytes,
          targets: targets.map((target) => ({
            id: target.id,
            sizeBytes: target.sizeBytes ?? null,
            uploadedBytes: target.uploadedBytes ?? 0,
            status: target.status,
          })),
        });
      }
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
        uploadToken: target.uploadToken,
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
  createTrackSession: async (args: CreateTrackSessionInputArgs, context: GraphQLContext) => {
    const { repositories } = context;
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    const input = args.input;
    const trackId = input?.trackId;
    if (!input?.date || !input?.format || !trackId || !input?.kartId || !input?.trackLayoutId || input.classification == null) {
      throw new GraphQLError("Date, format, trackId, trackLayoutId, kartId, and classification are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const track = repositories.tracks.findById(trackId);
    if (!track) {
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
    const kartIsOnTrack = availableKarts.some((candidate) => candidate.id === kart.id);
    if (!kartIsOnTrack) {
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
    const conditions = track.isIndoors ? "Dry" : parseConditions(input.conditions);
    const fastestLap = parseFastestLap(input.fastestLap);
    const kartNumber = input.kartNumber?.trim() ?? "";
    const temperature = input.temperature?.trim() ?? "";
    const participants = parseParticipantInputs(input.participants);
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
      kartNumber,
      trackLayoutId: input.trackLayoutId,
      fastestLap,
      temperature,
      ...(participants.length ? { participants } : {}),
    });
    return { trackSession: toTrackSessionPayload(trackSession, repositories) };
  },
  updateTrackSession: async (args: UpdateTrackSessionInputArgs, context: GraphQLContext) => {
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

    const trackIdProvided = Object.prototype.hasOwnProperty.call(input, "trackId");
    let targetTrackId = existingSession.trackId;
    const nextTrackId = input.trackId;
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

    const targetTrack = repositories.tracks.findById(targetTrackId);
    if (!targetTrack) {
      throw new GraphQLError(`Track with ID ${targetTrackId} not found`, {
        extensions: { code: "NOT_FOUND" },
      });
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

    const kartIdProvided = Object.prototype.hasOwnProperty.call(input, "kartId");
    let targetKartId = existingSession.kartId;
    if (kartIdProvided) {
      if (!input.kartId) {
        throw new GraphQLError("kartId cannot be empty", {
          extensions: { code: "VALIDATION_FAILED" },
        });
      }
      const kart = repositories.karts.findById(input.kartId);
      if (!kart) {
        throw new GraphQLError(`Kart with ID ${input.kartId} not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      targetKartId = kart.id;
    }

    if (targetKartId) {
      const availableKarts = repositories.trackKarts.findKartsForTrack(targetTrackId) ?? [];
      const kartIsOnTrack = availableKarts.some((candidate) => candidate.id === targetKartId);
      if (!kartIsOnTrack) {
        throw new GraphQLError("Kart is not available at the selected track", {
          extensions: { code: "VALIDATION_FAILED" },
        });
      }
    }

    const kartNumberProvided = Object.prototype.hasOwnProperty.call(input, "kartNumber");
    const targetKartNumber = kartNumberProvided
      ? (input.kartNumber ?? "").trim()
      : existingSession.kartNumber;
    const temperatureProvided = Object.prototype.hasOwnProperty.call(input, "temperature");
    let targetTemperature = temperatureProvided
      ? (input.temperature ?? "").trim()
      : existingSession.temperature;

    const notesProvided = Object.prototype.hasOwnProperty.call(input, "notes");
    const classificationProvided = Object.prototype.hasOwnProperty.call(input, "classification");
    const conditionsProvided = Object.prototype.hasOwnProperty.call(input, "conditions");
    const fastestLapProvided = Object.prototype.hasOwnProperty.call(input, "fastestLap");

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
    const conditions = targetTrack.isIndoors
      ? "Dry"
      : conditionsProvided && input.conditions !== null && input.conditions !== undefined
        ? parseConditions(input.conditions)
        : undefined;
    const fastestLap =
      fastestLapProvided && input.fastestLap !== undefined
        ? parseFastestLap(input.fastestLap)
        : undefined;

    const updated = repositories.trackSessions.update({
      id: input.id,
      date: nextDate,
      format: nextFormat,
      classification,
      trackId: targetTrackId,
      conditions,
      notes,
      kartId: targetKartId,
      kartNumber: targetKartNumber,
      temperature: targetTemperature,
      trackLayoutId: targetTrackLayoutId,
      fastestLap,
    });

    if (!updated) {
      throw new GraphQLError(`Track session with ID ${input.id} not found`, {
        extensions: { code: "NOT_FOUND" },
      });
    }

    await rebuildMediaLibrarySessionProjection(updated.id).catch((err) => {
      console.warn("Failed to rebuild Media Library projection after session update", err);
    });

    return { trackSession: toTrackSessionPayload(updated, repositories) };
  },
  fetchTrackSessionTemperature: async (
    args: FetchTrackSessionTemperatureArgs,
    context: GraphQLContext
  ) => {
    const { repositories } = context;
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    const input = args.input;
    const trackId = input?.trackId?.trim();
    const date = input?.date?.trim();
    if (!trackId || !date) {
      throw new GraphQLError("trackId and date are required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const track = repositories.tracks.findById(trackId);
    if (!track) {
      throw new GraphQLError("Track not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    if (!track.postcode?.trim()) {
      return { temperature: null, conditions: track.isIndoors ? "Dry" : null };
    }

    const weather = await fetchWeatherForPostcode(track.postcode, date);
    return {
      temperature: weather?.temperature ?? null,
      conditions: track.isIndoors ? "Dry" : weather?.conditions ?? null,
    };
  },
  importTrackSessionFromUrl: async (
    args: ImportTrackSessionFromUrlArgs,
    context: GraphQLContext
  ) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    const source = args.input?.source?.trim();
    if (!source) {
      throw new GraphQLError("source is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    try {
      const imported = await importTrackSessionFromSource(source);
      return {
        provider: imported.provider,
        sessionFormat: imported.sessionFormat,
        sessionDate: imported.sessionDate,
        sessionTime: imported.sessionTime,
        classification: imported.classification,
        sessionFastestLapSeconds: imported.sessionFastestLapSeconds,
        kartNumber: imported.kartNumber,
        trackLayoutName: imported.trackLayoutName,
        selfDriverName: imported.selfDriverName,
        kartTypeName: imported.kartTypeName,
        laps: imported.laps,
        drivers: imported.drivers,
      };
    } catch (error) {
      if (error instanceof SessionImportError) {
        throw new GraphQLError(error.message, {
          extensions: { code: "VALIDATION_FAILED" },
        });
      }
      console.warn("Failed to import track session from URL", error);
      throw new GraphQLError("Unable to import session from URL", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },
  fetchDaytonaClubspeedSessions: async (_args: unknown, context: GraphQLContext) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    try {
      const credentials = getViewerDaytonaClubspeedCredentialsOrThrow(context.currentUser.id);
      const sessions = await fetchDaytonaClubspeedSessions(credentials);
      markViewerDaytonaClubspeedCredentialsValidated(context.currentUser.id);
      return { sessions };
    } catch (error) {
      if (error instanceof SessionImportError && error.code === "INVALID_CREDENTIALS") {
        markViewerDaytonaClubspeedCredentialInvalid(context.currentUser.id, error.message);
      }
      if (error instanceof SessionImportError) {
        throw new GraphQLError(error.message, {
          extensions: { code: "VALIDATION_FAILED" },
        });
      }
      console.warn("Failed to fetch Daytona Club Speed sessions", error);
      throw new GraphQLError("Unable to fetch Daytona Club Speed sessions", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  },
  importDaytonaClubspeedSession: async (
    args: ImportDaytonaClubspeedSessionArgs,
    context: GraphQLContext
  ) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    const heatNo = args.input?.heatNo?.trim();
    if (!heatNo) {
      throw new GraphQLError("heatNo is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    try {
      const credentials = getViewerDaytonaClubspeedCredentialsOrThrow(context.currentUser.id);
      const imported = await importDaytonaClubspeedSession(heatNo, credentials);
      markViewerDaytonaClubspeedCredentialsValidated(context.currentUser.id);
      return {
        provider: imported.provider,
        sessionFormat: imported.sessionFormat,
        sessionDate: imported.sessionDate,
        sessionTime: imported.sessionTime,
        classification: imported.classification,
        sessionFastestLapSeconds: imported.sessionFastestLapSeconds,
        kartNumber: imported.kartNumber,
        trackLayoutName: imported.trackLayoutName,
        selfDriverName: imported.selfDriverName,
        kartTypeName: imported.kartTypeName,
        laps: imported.laps,
        drivers: imported.drivers,
      };
    } catch (error) {
      if (error instanceof SessionImportError && error.code === "INVALID_CREDENTIALS") {
        markViewerDaytonaClubspeedCredentialInvalid(context.currentUser.id, error.message);
      }
      if (error instanceof SessionImportError) {
        throw new GraphQLError(error.message, {
          extensions: { code: "VALIDATION_FAILED" },
        });
      }
      console.warn("Failed to import Daytona Club Speed session", error);
      throw new GraphQLError("Unable to import Daytona Club Speed session", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
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
  deleteTrackSession: async (args: TrackSessionArgs, context: GraphQLContext) => {
    const { repositories } = context;
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    if (!args.id) {
      throw new GraphQLError("id is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const recordingIds =
      repositories.trackRecordings.findBySessionId?.(args.id)?.map((rec) => rec.id) ?? [];
    const success = await repositories.trackSessions.delete(args.id, context.currentUser.id);

    if (success && recordingIds.length > 0) {
      await removeMediaLibraryProjectionsForRecordings(recordingIds).catch((err) => {
        console.warn("Failed to remove Media Library projections for deleted session", err);
      });
    }

    return { success };
  },
};
