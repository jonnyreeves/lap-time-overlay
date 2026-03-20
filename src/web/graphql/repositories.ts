import { tracksRepository, type TrackRepository } from "../../db/tracks.js";
import { kartsRepository, type KartsRepository } from "../../db/karts.js";
import { trackKartsRepository, type TrackKartsRepository } from "../../db/track_karts.js";
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
import {
  trackLayoutsRepository,
  type TrackLayoutsRepository,
} from "../../db/track_layouts.js";
import {
  trackSessionParticipantsRepository,
  type TrackSessionParticipantsRepository,
} from "../../db/track_session_participants.js";
import {
  userDaytonaClubspeedCredentialsRepository,
  type UserDaytonaClubspeedCredentialsRepository,
} from "../../db/user_daytona_clubspeed_credentials.js";

export interface Repositories {
  tracks: TrackRepository;
  trackSessions: TrackSessionRepository;
  laps: LapRepository;
  lapEvents: LapEventRepository;
  trackRecordings: TrackRecordingRepository;
  trackRecordingSources: TrackRecordingSourceRepository;
  karts: KartsRepository;
  trackKarts: TrackKartsRepository;
  trackLayouts: TrackLayoutsRepository;
  trackSessionParticipants: TrackSessionParticipantsRepository;
  userDaytonaClubspeedCredentials: UserDaytonaClubspeedCredentialsRepository;
}

export function createRepositories(): Repositories {
  return {
    tracks: tracksRepository,
    trackSessions: trackSessionsRepository,
    laps: lapsRepository,
    lapEvents: lapEventsRepository,
    trackRecordings: trackRecordingsRepository,
    trackRecordingSources: trackRecordingSourcesRepository,
    karts: kartsRepository,
    trackKarts: trackKartsRepository,
    trackLayouts: trackLayoutsRepository,
    trackSessionParticipants: trackSessionParticipantsRepository,
    userDaytonaClubspeedCredentials: userDaytonaClubspeedCredentialsRepository,
  };
}
