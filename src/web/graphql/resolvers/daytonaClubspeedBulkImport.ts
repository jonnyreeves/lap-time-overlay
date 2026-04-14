import { randomUUID } from "node:crypto";
import { GraphQLError } from "graphql";
import type { TrackRecord } from "../../../db/tracks.js";
import type { TrackLayoutRecord } from "../../../db/track_layouts.js";
import type { KartRecord } from "../../../db/karts.js";
import type {
  TrackSessionConditions,
  TrackSessionLapInput,
  TrackSessionParticipantInput,
  TrackSessionRecord,
} from "../../../db/track_sessions.js";
import type { GraphQLContext } from "../context.js";
import type { Repositories } from "../repositories.js";
import {
  getViewerDaytonaClubspeedCredentialsOrThrow,
  markViewerDaytonaClubspeedCredentialInvalid,
  markViewerDaytonaClubspeedCredentialsValidated,
} from "../../daytonaClubspeedCredentials/service.js";
import { importDaytonaClubspeedSessions } from "../../sessionImport/service.js";
import {
  type DaytonaClubspeedCredentials,
  type ImportedSessionData,
  SessionImportError,
} from "../../sessionImport/types.js";
import { fetchWeatherForPostcode } from "../../shared/weather.js";
import { toTrackSessionPayload } from "./trackSession.js";

type JobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
type ResultStatus = "CREATED" | "SKIPPED" | "FAILED";

type BulkImportSessionInput = {
  heatNo: string;
  trackId: string;
  trackLayoutId: string;
  kartId: string;
};

type StartBulkImportArgs = {
  input?: {
    sessions?: BulkImportSessionInput[] | null;
  } | null;
};

type JobResult = {
  heatNo: string;
  status: ResultStatus;
  trackSession: TrackSessionRecord | null;
  errorMessage: string | null;
};

type BulkImportJob = {
  id: string;
  userId: string;
  status: JobStatus;
  totalCount: number;
  processedCount: number;
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  errorMessage: string | null;
  startedAt: number;
  finishedAt: number | null;
  results: JobResult[];
};

type ValidatedBulkImportSession = {
  heatNo: string;
  track: TrackRecord;
  trackLayout: TrackLayoutRecord;
  kart: KartRecord;
};

const COMPLETED_JOB_TTL_MS = 60 * 60 * 1000;
const MAX_RETAINED_COMPLETED_JOBS = 50;
const jobs = new Map<string, BulkImportJob>();

function toGraphQLError(error: unknown, fallbackMessage: string) {
  if (error instanceof GraphQLError) {
    return error;
  }
  if (error instanceof SessionImportError) {
    return new GraphQLError(error.message, {
      extensions: { code: "VALIDATION_FAILED" },
    });
  }
  console.warn(fallbackMessage, error);
  return new GraphQLError(fallbackMessage, {
    extensions: { code: "INTERNAL_SERVER_ERROR" },
  });
}

function trimRequired(value: string | null | undefined, label: string): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw new GraphQLError(`${label} is required`, {
      extensions: { code: "VALIDATION_FAILED" },
    });
  }
  return trimmed;
}

function findImportedHeatNos(userId: string, repositories: Repositories): Set<string> {
  return new Set(
    repositories.trackSessions
      .findByUserId(userId)
      .filter((session) => session.importSourceProvider === "daytona_clubspeed")
      .map((session) => session.importSourceId)
      .filter((importSourceId): importSourceId is string => Boolean(importSourceId))
  );
}

function validateStartInput(
  args: StartBulkImportArgs,
  context: GraphQLContext
): ValidatedBulkImportSession[] {
  const sessions = args.input?.sessions ?? [];
  if (!sessions.length) {
    throw new GraphQLError("At least one Daytona Club Speed session is required", {
      extensions: { code: "VALIDATION_FAILED" },
    });
  }

  const seenHeatNos = new Set<string>();
  return sessions.map((session, index) => {
    const heatNo = trimRequired(session?.heatNo, `Session ${index + 1} heatNo`);
    if (seenHeatNos.has(heatNo)) {
      throw new GraphQLError("Duplicate Daytona Club Speed sessions cannot be imported together", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    seenHeatNos.add(heatNo);

    const trackId = trimRequired(session?.trackId, `Session ${index + 1} trackId`);
    const track = context.repositories.tracks.findById(trackId);
    if (!track) {
      throw new GraphQLError(`Track with ID ${trackId} not found`, {
        extensions: { code: "NOT_FOUND" },
      });
    }

    const trackLayoutId = trimRequired(session?.trackLayoutId, `Session ${index + 1} trackLayoutId`);
    const trackLayout = context.repositories.trackLayouts.findById(trackLayoutId);
    if (!trackLayout) {
      throw new GraphQLError(`Track layout with ID ${trackLayoutId} not found`, {
        extensions: { code: "NOT_FOUND" },
      });
    }
    if (trackLayout.trackId !== track.id) {
      throw new GraphQLError("Track layout is not available at the selected track", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    const kartId = trimRequired(session?.kartId, `Session ${index + 1} kartId`);
    const kart = context.repositories.karts.findById(kartId);
    if (!kart) {
      throw new GraphQLError(`Kart with ID ${kartId} not found`, {
        extensions: { code: "NOT_FOUND" },
      });
    }
    const availableKarts = context.repositories.trackKarts.findKartsForTrack(track.id) ?? [];
    if (!availableKarts.some((availableKart) => availableKart.id === kart.id)) {
      throw new GraphQLError("Kart is not available at the selected track", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }

    return { heatNo, track, trackLayout, kart };
  });
}

function parseImportedDate(imported: ImportedSessionData): string {
  if (!imported.sessionDate) {
    throw new Error("Imported Daytona session is missing a date");
  }
  return imported.sessionTime ? `${imported.sessionDate}T${imported.sessionTime}` : imported.sessionDate;
}

function parseImportedFormat(imported: ImportedSessionData): string {
  if (imported.sessionFormat === "Practice" || imported.sessionFormat === "Qualifying" || imported.sessionFormat === "Race") {
    return imported.sessionFormat;
  }
  throw new Error("Imported Daytona session is missing a session format");
}

function parseImportedClassification(imported: ImportedSessionData): number {
  if (Number.isInteger(imported.classification) && imported.classification != null && imported.classification >= 1) {
    return imported.classification;
  }
  throw new Error("Imported Daytona session is missing a classification");
}

function mapImportedLaps(imported: ImportedSessionData): TrackSessionLapInput[] {
  const laps = imported.laps.map((lap) => ({
    lapNumber: lap.lapNumber,
    time: lap.timeSeconds,
    lapEvents: lap.lapEvents ?? [],
  }));
  if (!laps.length) {
    throw new Error("Imported Daytona session has no laps for the selected driver");
  }
  return laps;
}

function mapImportedParticipants(imported: ImportedSessionData): TrackSessionParticipantInput[] {
  const selfDriverName = imported.selfDriverName ?? imported.drivers[0]?.name ?? null;
  return imported.drivers.map((driver) => ({
    name: driver.name,
    classification: driver.classification ?? null,
    kartNumber: driver.kartNumber ?? null,
    isSelf: selfDriverName != null && driver.name === selfDriverName,
    laps: driver.laps.map((lap) => ({
      lapNumber: lap.lapNumber,
      time: lap.timeSeconds,
    })),
  }));
}

async function getWeatherDefaults(
  track: TrackRecord,
  date: string,
  weatherCache: Map<string, { temperature: string; conditions: TrackSessionConditions }>
) {
  if (track.isIndoors) {
    return { temperature: "", conditions: "Dry" as const };
  }

  const cacheKey = `${track.id}:${date}`;
  const cached = weatherCache.get(cacheKey);
  if (cached) return cached;

  let weather: { temperature: string | null; conditions: TrackSessionConditions | null } | null = null;
  if (track.postcode?.trim()) {
    weather = await fetchWeatherForPostcode(track.postcode, date).catch(() => null);
  }
  const resolved = {
    temperature: weather?.temperature ?? "",
    conditions: weather?.conditions ?? "Dry",
  };
  weatherCache.set(cacheKey, resolved);
  return resolved;
}

function pruneJobs() {
  const now = Date.now();
  for (const [jobId, job] of jobs.entries()) {
    if (job.finishedAt != null && now - job.finishedAt > COMPLETED_JOB_TTL_MS) {
      jobs.delete(jobId);
    }
  }

  const completed = Array.from(jobs.values())
    .filter((job) => job.finishedAt != null)
    .sort((left, right) => (left.finishedAt ?? 0) - (right.finishedAt ?? 0));
  while (completed.length > MAX_RETAINED_COMPLETED_JOBS) {
    const job = completed.shift();
    if (job) jobs.delete(job.id);
  }
}

async function runJob(
  job: BulkImportJob,
  sessions: ValidatedBulkImportSession[],
  credentials: DaytonaClubspeedCredentials,
  repositories: Repositories
) {
  job.status = "RUNNING";
  const byHeatNo = new Map(sessions.map((session) => [session.heatNo, session]));
  const weatherCache = new Map<string, { temperature: string; conditions: TrackSessionConditions }>();

  try {
    const alreadyImportedHeatNos = findImportedHeatNos(job.userId, repositories);
    const heatNosToImport: string[] = [];
    for (const session of sessions) {
      if (alreadyImportedHeatNos.has(session.heatNo)) {
        job.results.push({
          heatNo: session.heatNo,
          status: "SKIPPED",
          trackSession: null,
          errorMessage: "Already imported",
        });
        job.skippedCount += 1;
        job.processedCount += 1;
      } else {
        heatNosToImport.push(session.heatNo);
      }
    }

    if (heatNosToImport.length === 0) {
      job.status = "COMPLETED";
      job.finishedAt = Date.now();
      return;
    }

    const importedResults = await importDaytonaClubspeedSessions(heatNosToImport, credentials);
    markViewerDaytonaClubspeedCredentialsValidated(job.userId);

    for (const result of importedResults) {
      const selected = byHeatNo.get(result.heatNo);
      if (!selected) continue;

      if (!result.importedSession) {
        job.results.push({
          heatNo: result.heatNo,
          status: "FAILED",
          trackSession: null,
          errorMessage: result.errorMessage ?? "Unable to import Daytona session",
        });
        job.failedCount += 1;
        job.processedCount += 1;
        continue;
      }

      try {
        const imported = result.importedSession;
        const date = parseImportedDate(imported);
        const { temperature, conditions } = await getWeatherDefaults(
          selected.track,
          date,
          weatherCache
        );
        const created = repositories.trackSessions.createWithLaps({
          date,
          format: parseImportedFormat(imported),
          classification: parseImportedClassification(imported),
          trackId: selected.track.id,
          userId: job.userId,
          conditions,
          laps: mapImportedLaps(imported),
          kartId: selected.kart.id,
          kartNumber: imported.kartNumber ?? "",
          trackLayoutId: selected.trackLayout.id,
          fastestLap: imported.sessionFastestLapSeconds,
          temperature,
          importSourceProvider: "daytona_clubspeed",
          importSourceId: result.heatNo,
          participants: mapImportedParticipants(imported),
        }).trackSession;
        job.results.push({
          heatNo: result.heatNo,
          status: "CREATED",
          trackSession: created,
          errorMessage: null,
        });
        job.createdCount += 1;
      } catch (error) {
        job.results.push({
          heatNo: result.heatNo,
          status: "FAILED",
          trackSession: null,
          errorMessage: error instanceof Error ? error.message : "Unable to create session",
        });
        job.failedCount += 1;
      } finally {
        job.processedCount += 1;
      }
    }

    job.status = "COMPLETED";
    job.finishedAt = Date.now();
  } catch (error) {
    if (error instanceof SessionImportError && error.code === "INVALID_CREDENTIALS") {
      markViewerDaytonaClubspeedCredentialInvalid(job.userId, error.message);
    }
    job.status = "FAILED";
    job.errorMessage = error instanceof Error ? error.message : "Unable to import Daytona sessions";
    job.finishedAt = Date.now();
  } finally {
    pruneJobs();
  }
}

function toJobPayload(job: BulkImportJob, repositories: Repositories) {
  return {
    id: job.id,
    status: job.status,
    totalCount: job.totalCount,
    processedCount: job.processedCount,
    createdCount: job.createdCount,
    skippedCount: job.skippedCount,
    failedCount: job.failedCount,
    errorMessage: job.errorMessage,
    startedAt: new Date(job.startedAt).toISOString(),
    finishedAt: job.finishedAt == null ? null : new Date(job.finishedAt).toISOString(),
    results: job.results.map((result) => ({
      heatNo: result.heatNo,
      status: result.status,
      trackSession:
        result.trackSession == null ? null : toTrackSessionPayload(result.trackSession, repositories),
      errorMessage: result.errorMessage,
    })),
  };
}

export const daytonaClubspeedBulkImportResolvers = {
  daytonaClubspeedBulkImportJob: (
    args: { id?: string },
    context: GraphQLContext
  ) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    const id = args.id?.trim();
    if (!id) {
      throw new GraphQLError("id is required", {
        extensions: { code: "VALIDATION_FAILED" },
      });
    }
    const job = jobs.get(id);
    if (!job || job.userId !== context.currentUser.id) {
      return null;
    }
    return toJobPayload(job, context.repositories);
  },
  startDaytonaClubspeedBulkImport: async (
    args: StartBulkImportArgs,
    context: GraphQLContext
  ) => {
    if (!context.currentUser) {
      throw new GraphQLError("Authentication required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    try {
      const sessions = validateStartInput(args, context);
      const credentials = getViewerDaytonaClubspeedCredentialsOrThrow(context.currentUser.id);
      const job: BulkImportJob = {
        id: randomUUID(),
        userId: context.currentUser.id,
        status: "QUEUED",
        totalCount: sessions.length,
        processedCount: 0,
        createdCount: 0,
        skippedCount: 0,
        failedCount: 0,
        errorMessage: null,
        startedAt: Date.now(),
        finishedAt: null,
        results: [],
      };
      jobs.set(job.id, job);
      void runJob(job, sessions, credentials, context.repositories);
      return { job: toJobPayload(job, context.repositories) };
    } catch (error) {
      throw toGraphQLError(error, "Unable to start Daytona Club Speed bulk import");
    }
  },
};

export function clearDaytonaClubspeedBulkImportJobsForTests() {
  jobs.clear();
}
