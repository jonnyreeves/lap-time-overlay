import { circuitsRepository, type CircuitRepository } from "../../db/circuits.js";
import { lapEventsRepository, type LapEventRepository } from "../../db/lap_events.js";
import { lapsRepository, type LapRepository } from "../../db/laps.js";
import {
  trackRecordingsRepository,
  type TrackRecordingRepository,
} from "../../db/track_recordings.js";
import {
  trackRecordingSourcesRepository,
  type TrackRecordingSourceRepository,
} from "../../db/track_recording_sources.js";
import {
  trackSessionsRepository,
  type TrackSessionRepository,
} from "../../db/track_sessions.js";

export interface Repositories {
  circuits: CircuitRepository;
  trackSessions: TrackSessionRepository;
  laps: LapRepository;
  lapEvents: LapEventRepository;
  trackRecordings: TrackRecordingRepository;
  trackRecordingSources: TrackRecordingSourceRepository;
}

export function createRepositories(): Repositories {
  return {
    circuits: circuitsRepository,
    trackSessions: trackSessionsRepository,
    laps: lapsRepository,
    lapEvents: lapEventsRepository,
    trackRecordings: trackRecordingsRepository,
    trackRecordingSources: trackRecordingSourcesRepository,
  };
}
