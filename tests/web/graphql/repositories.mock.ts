import { vi } from "vitest";
import type { Repositories } from "../../../src/web/graphql/repositories.js";
import type { TrackLayoutsRepository } from "../../../src/db/track_layouts.js";

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
      findBySessionId: vi.fn(() => []),
      findById: vi.fn(),
    },
    trackRecordingSources: {
      findByRecordingId: vi.fn(() => []),
      findById: vi.fn(),
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
  } satisfies Repositories;

  return repositories;
}
