import { vi } from "vitest";
import type { Repositories } from "../../../src/web/graphql/repositories.js";
import type { TrackRecordingRecord } from "../../../src/db/track_recordings.js";
import type { TrackRecordingSourceRecord } from "../../../src/db/track_recording_sources.js";
import type { TrackLayoutsRepository } from "../../../src/db/track_layouts.js";
import type {
  TrackSessionParticipantLapRecord,
  TrackSessionParticipantRecord,
} from "../../../src/db/track_session_participants.js";
import type {
  UserDaytonaClubspeedCredentialRecord,
  UserDaytonaClubspeedCredentialsRepository,
} from "../../../src/db/user_daytona_clubspeed_credentials.js";

export function createMockRepositories() {
  const repositories = {
    tracks: {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    trackSessions: {
      findById: vi.fn(),
      findByTrackId: vi.fn(),
      findByUserId: vi.fn(),
      createWithLaps: vi.fn(),
      update: vi.fn(),
      replaceLapsForSession: vi.fn(),
      delete: vi.fn(),
    },
    laps: {
      findById: vi.fn(),
      findBySessionId: vi.fn(),
    },
    lapEvents: {
      findByLapId: vi.fn(),
    },
    trackRecordings: {
      findBySessionId: vi.fn<[string], TrackRecordingRecord[]>(() => []),
      findById: vi.fn<[string], TrackRecordingRecord | null>(),
    },
    trackRecordingSources: {
      findByRecordingId: vi.fn<[string], TrackRecordingSourceRecord[]>(() => []),
      findById: vi.fn<[string], TrackRecordingSourceRecord | null>(),
      findByUploadToken: vi.fn<[string], TrackRecordingSourceRecord | null>(),
    },
    karts: {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    trackKarts: {
      addKartToTrack: vi.fn(),
      removeKartFromTrack: vi.fn(),
      findKartsForTrack: vi.fn(),
    },
    trackLayouts: {
      findById: vi.fn<[string], ReturnType<TrackLayoutsRepository["findById"]>>(),
      findByTrackId: vi.fn<[string], ReturnType<TrackLayoutsRepository["findByTrackId"]>>(() => []),
      create: vi.fn<[string, string], ReturnType<TrackLayoutsRepository["create"]>>(),
      update: vi.fn<[string, string], ReturnType<TrackLayoutsRepository["update"]>>(),
      delete: vi.fn<[string], ReturnType<TrackLayoutsRepository["delete"]>>(),
    },
    trackSessionParticipants: {
      findBySessionId: vi.fn<[string], TrackSessionParticipantRecord[]>(() => []),
      findBySessionIds: vi.fn<[string[]], TrackSessionParticipantRecord[]>(() => []),
      findLapsByParticipantId: vi.fn<[string], TrackSessionParticipantLapRecord[]>(() => []),
      findLapsByParticipantIds: vi.fn<[string[]], TrackSessionParticipantLapRecord[]>(() => []),
    },
    userDaytonaClubspeedCredentials: {
      findByUserId: vi.fn<[string], UserDaytonaClubspeedCredentialRecord | null>(() => null),
      upsert: vi.fn<
        Parameters<UserDaytonaClubspeedCredentialsRepository["upsert"]>,
        ReturnType<UserDaytonaClubspeedCredentialsRepository["upsert"]>
      >(),
      updateValidation: vi.fn<
        Parameters<UserDaytonaClubspeedCredentialsRepository["updateValidation"]>,
        ReturnType<UserDaytonaClubspeedCredentialsRepository["updateValidation"]>
      >(),
      delete: vi.fn<
        Parameters<UserDaytonaClubspeedCredentialsRepository["delete"]>,
        ReturnType<UserDaytonaClubspeedCredentialsRepository["delete"]>
      >(),
    },
  } satisfies Repositories;

  return repositories;
}
