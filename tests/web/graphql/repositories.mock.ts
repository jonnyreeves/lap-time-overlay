import { vi } from "vitest";
import type { Repositories } from "../../../src/web/graphql/repositories.js";

export function createMockRepositories() {
  const repositories = {
    circuits: {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
    },
    trackSessions: {
      findById: vi.fn(),
      findByCircuitId: vi.fn(),
      findByUserId: vi.fn(),
      createWithLaps: vi.fn(),
      update: vi.fn(),
      replaceLapsForSession: vi.fn(),
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
  } satisfies Repositories;

  return repositories;
}
