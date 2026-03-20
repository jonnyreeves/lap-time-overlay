import { describe, expect, it, vi, beforeEach } from "vitest";

const { rebuildProjectionMock, removeProjectionMock } = vi.hoisted(() => ({
  rebuildProjectionMock: vi.fn().mockResolvedValue({ folderName: "", recordings: [] }),
  removeProjectionMock: vi.fn().mockResolvedValue(undefined),
}));

const { fetchWeatherMock } = vi.hoisted(() => ({
  fetchWeatherMock: vi.fn(),
}));

const {
  fetchDaytonaClubspeedSessionsMock,
  importDaytonaClubspeedSessionMock,
  importTrackSessionFromSourceMock,
} = vi.hoisted(() => ({
  fetchDaytonaClubspeedSessionsMock: vi.fn(),
  importDaytonaClubspeedSessionMock: vi.fn(),
  importTrackSessionFromSourceMock: vi.fn(),
}));

vi.mock("../../../../src/web/recordings/mediaLibraryProjection.js", () => ({
  rebuildMediaLibrarySessionProjection: rebuildProjectionMock,
  removeMediaLibraryProjectionsForRecordings: removeProjectionMock,
}));

vi.mock("../../../../src/web/shared/weather.js", () => ({
  fetchWeatherForPostcode: fetchWeatherMock,
}));

vi.mock("../../../../src/web/sessionImport/service.js", () => ({
  fetchDaytonaClubspeedSessions: fetchDaytonaClubspeedSessionsMock,
  importDaytonaClubspeedSession: importDaytonaClubspeedSessionMock,
  importTrackSessionFromSource: importTrackSessionFromSourceMock,
}));

import { createMockGraphQLContext } from "../context.mock.js";
import { computeSessionPerformance } from "../../../../src/web/shared/sessionPerformance.js";
import { rootValue } from "../../../../src/web/graphql/schema.js";
import { SessionImportError } from "../../../../src/web/sessionImport/types.js";
import type { TrackRecordingRecord } from "../../../../src/db/track_recordings.js";
import type { TrackRecordingSourceRecord } from "../../../../src/db/track_recording_sources.js";
import type { TrackSessionRecord } from "../../../../src/db/track_sessions.js";

const { context, repositories } = createMockGraphQLContext({
  currentUser: { id: "user-1", username: "sam", createdAt: Date.now(), isAdmin: true },
  sessionToken: "token",
});

const mockSession = {
  id: "s1",
  date: "2024-02-01",
  format: "Race",
  classification: 1,
  fastestLap: null,
  conditions: "Dry" as const,
  temperature: "",
  trackId: "c1",
  userId: "user-1",
  notes: null,
  createdAt: 0,
  updatedAt: 0,
  kartId: "k1",
  kartNumber: "",
  trackLayoutId: "l1",
};

const mockTrack = {
  id: "c1",
  name: "Spa",
  heroImage: null,
  postcode: null,
  isIndoors: false,
  createdAt: 0,
  updatedAt: 0,
};

const mockKart = {
  id: "k1",
  name: "Sodi",
  createdAt: 0,
  updatedAt: 0,
};

const mockLayout = {
  id: "l1",
  name: "GP",
  trackId: "c1",
  createdAt: 0,
  updatedAt: 0,
};

describe("trackSession resolvers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchWeatherMock.mockResolvedValue({ temperature: null, conditions: null });
    importTrackSessionFromSourceMock.mockResolvedValue({
      provider: "alphatiming",
      sessionFormat: "Practice",
      sessionDate: "2026-03-14",
      sessionTime: "18:23",
      classification: null,
      sessionFastestLapSeconds: 51.179,
      kartNumber: null,
      trackLayoutName: null,
      selfDriverName: null,
      kartTypeName: null,
      laps: [],
      drivers: [
        {
          name: "John Reeves",
          classification: 2,
          kartNumber: "16",
          laps: [{ lapNumber: 1, timeSeconds: 52.111, displayTime: "52.111" }],
        },
      ],
    });
    fetchDaytonaClubspeedSessionsMock.mockResolvedValue([
      {
        heatNo: "81389|2026-03-11|19%3A30|149|3|49.411",
        activityType: "DMAX Practice 20mins - Kart 149",
        sessionDate: "2026-03-11",
        sessionTime: "19:30",
        kartNumber: "149",
        classification: 3,
      },
    ]);
    importDaytonaClubspeedSessionMock.mockResolvedValue({
      provider: "daytona",
      sessionFormat: "Practice",
      sessionDate: "2026-03-11",
      sessionTime: "19:30",
      classification: 3,
      sessionFastestLapSeconds: 46.952,
      kartNumber: "149",
      trackLayoutName: null,
      selfDriverName: "L - Jonny R",
      kartTypeName: "DMAX",
      laps: [{ lapNumber: 1, timeSeconds: 64.37, displayTime: "1:04.370" }],
      drivers: [
        {
          name: "L - Jonny R",
          classification: 3,
          kartNumber: null,
          laps: [{ lapNumber: 1, timeSeconds: 64.37, displayTime: "1:04.370" }],
        },
      ],
    });
    repositories.trackKarts.findKartsForTrack.mockReturnValue([mockKart]);
    repositories.trackSessionParticipants.findBySessionId.mockReturnValue([]);
    repositories.trackSessionParticipants.findBySessionIds.mockReturnValue([]);
    repositories.trackSessionParticipants.findLapsByParticipantIds.mockReturnValue([]);
  });

  it("rejects unauthenticated trackSession query", async () => {
    await expect(() => rootValue.trackSession({ id: "s1" }, { ...context, currentUser: null }))
      .toThrowError("Authentication required");
  });

  it("rejects trackSession query when session not owned by user", async () => {
    repositories.trackSessions.findById.mockReturnValue({ ...mockSession, userId: "another-user" });

    expect(() => rootValue.trackSession({ id: "s1" }, context)).toThrowError(
      "You do not have access to this session"
    );
  });

  it("returns session payload with laps and track on happy path", async () => {
    repositories.trackSessions.findById.mockReturnValue(mockSession);
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.trackLayouts.findById.mockReturnValue(mockLayout);
    repositories.laps.findBySessionId.mockReturnValue([
      { id: "l1", sessionId: "s1", lapNumber: 1, time: 75.123, createdAt: 0, updatedAt: 0 },
    ]);

    const payload = rootValue.trackSession({ id: "s1" }, context);
    expect(payload.id).toBe("s1");
    expect(await payload.track()).toMatchObject({ id: "c1", name: "Spa" });
    expect((await payload.laps({ first: 10 })).length).toBe(1);
  });

  it("returns participants and rival analysis for a session", async () => {
    repositories.trackSessions.findById.mockReturnValue(mockSession);
    repositories.trackSessions.findByUserId.mockReturnValue([
      mockSession,
      { ...mockSession, id: "s2", date: "2024-02-08" },
      { ...mockSession, id: "s3", date: "2024-02-15" },
    ]);
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.trackLayouts.findById.mockReturnValue(mockLayout);
    repositories.trackSessionParticipants.findBySessionId.mockReturnValue([
      {
        id: "p-self-s1",
        sessionId: "s1",
        name: "John Reeves",
        classification: 2,
        kartNumber: "16",
        isSelf: true,
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "p-rival-s1",
        sessionId: "s1",
        name: "Robert Seaman",
        classification: 1,
        kartNumber: "7",
        isSelf: false,
        createdAt: 0,
        updatedAt: 0,
      },
    ]);
    repositories.trackSessionParticipants.findBySessionIds.mockReturnValue([
      {
        id: "p-self-s1",
        sessionId: "s1",
        name: "John Reeves",
        classification: 2,
        kartNumber: "16",
        isSelf: true,
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "p-rival-s1",
        sessionId: "s1",
        name: "Robert Seaman",
        classification: 1,
        kartNumber: "7",
        isSelf: false,
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "p-self-s2",
        sessionId: "s2",
        name: "John Reeves",
        classification: 2,
        kartNumber: "16",
        isSelf: true,
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "p-rival-s2",
        sessionId: "s2",
        name: "Robert Seaman",
        classification: 1,
        kartNumber: "7",
        isSelf: false,
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "p-self-s3",
        sessionId: "s3",
        name: "John Reeves",
        classification: 2,
        kartNumber: "16",
        isSelf: true,
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "p-rival-s3",
        sessionId: "s3",
        name: "Robert Seaman",
        classification: 1,
        kartNumber: "7",
        isSelf: false,
        createdAt: 0,
        updatedAt: 0,
      },
    ]);
    repositories.trackSessionParticipants.findLapsByParticipantIds.mockReturnValue([
      { id: "l1", participantId: "p-self-s1", lapNumber: 1, time: 52.1, createdAt: 0, updatedAt: 0 },
      { id: "l2", participantId: "p-rival-s1", lapNumber: 1, time: 51.8, createdAt: 0, updatedAt: 0 },
      { id: "l3", participantId: "p-self-s2", lapNumber: 1, time: 51.9, createdAt: 0, updatedAt: 0 },
      { id: "l4", participantId: "p-rival-s2", lapNumber: 1, time: 51.7, createdAt: 0, updatedAt: 0 },
      { id: "l5", participantId: "p-self-s3", lapNumber: 1, time: 51.7, createdAt: 0, updatedAt: 0 },
      { id: "l6", participantId: "p-rival-s3", lapNumber: 1, time: 51.6, createdAt: 0, updatedAt: 0 },
    ]);

    const payload = rootValue.trackSession({ id: "s1" }, context);
    expect(payload.participants()).toHaveLength(2);

    const analysis = payload.rivalAnalysis({ rivalName: "Robert Seaman" });
    expect(analysis?.lapComparisons).toHaveLength(1);
    expect(analysis?.sessionInsights.slowerLapCount).toBe(1);
    expect(analysis?.trend.sampleCount).toBe(3);
    expect(analysis?.paceInsights).toBeTruthy();
    expect(analysis?.paceInsights.quickWindowCutoff).not.toBeNull();
    expect(analysis?.paceInsights.headline.length).toBeGreaterThan(0);
  });

  it("surfaces upload progress for track recordings", async () => {
    repositories.trackSessions.findById.mockReturnValue(mockSession);
    const recording: TrackRecordingRecord = {
      id: "rec-1",
      sessionId: mockSession.id,
      userId: mockSession.userId,
      mediaId: "s1/rec-1.mp4",
      overlayBurned: false,
      isPrimary: true,
      lapOneOffset: 0,
      description: null,
      status: "uploading",
      error: null,
      sizeBytes: null,
      durationMs: null,
      fps: null,
      combineProgress: 0,
      showInMediaLibrary: true,
      createdAt: 0,
      updatedAt: 0,
    };
    const sources: TrackRecordingSourceRecord[] = [
      {
        id: "src-1",
        recordingId: recording.id,
        fileName: "source-1.mp4",
        ordinal: 1,
        sizeBytes: 10,
        trimStartMs: null,
        trimEndMs: null,
        uploadedBytes: 4,
        storagePath: "/tmp/source-1.mp4",
        uploadToken: "token-1",
        status: "uploading",
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "src-2",
        recordingId: recording.id,
        fileName: "source-2.mp4",
        ordinal: 2,
        sizeBytes: 12,
        trimStartMs: null,
        trimEndMs: null,
        uploadedBytes: 6,
        storagePath: "/tmp/source-2.mp4",
        uploadToken: "token-2",
        status: "uploading",
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    repositories.trackRecordings.findBySessionId.mockReturnValue([recording]);
    repositories.trackRecordingSources.findByRecordingId.mockReturnValue(sources);

    const payload = rootValue.trackSession({ id: mockSession.id }, context);
    const recordings = payload.trackRecordings({ first: 10 });
    const progress = recordings[0]?.uploadProgress();

    expect(progress).toEqual({ uploadedBytes: 10, totalBytes: 22 });
  });

  it("flags all-time personal best per track, layout, kart, and conditions", async () => {
    const baseSession: TrackSessionRecord = {
      ...mockSession,
      id: "s1",
      fastestLap: 47.004,
      date: "2024-01-10",
    };
    const slowerSession: TrackSessionRecord = {
      ...mockSession,
      id: "s2",
      fastestLap: 48.5,
      date: "2024-01-11",
    };
    const wetSession: TrackSessionRecord = {
      ...mockSession,
      id: "s3",
      fastestLap: 46.5,
      conditions: "Wet" as const,
      date: "2024-01-12",
    };
    const otherKartSession: TrackSessionRecord = {
      ...mockSession,
      id: "s4",
      fastestLap: 46.1,
      kartId: "k2",
      date: "2024-01-09",
    };

    const sessionsById = new Map([
      ["s1", baseSession],
      ["s2", slowerSession],
      ["s3", wetSession],
      ["s4", otherKartSession],
    ]);

    repositories.trackSessions.findById.mockImplementation((id: string) => sessionsById.get(id) ?? null);
    repositories.trackSessions.findByUserId.mockReturnValue([
      slowerSession,
      baseSession,
      wetSession,
      otherKartSession,
    ]);
    repositories.tracks.findById.mockReturnValue(mockTrack);

    const bestPayload = rootValue.trackSession({ id: "s1" }, context);
    expect(await bestPayload.isPersonalBest()).toBe(true);

    const slowerPayload = rootValue.trackSession({ id: "s2" }, context);
    expect(await slowerPayload.isPersonalBest()).toBe(false);
  });

  it("exposes session performance score and breakdown derived from laps", async () => {
    repositories.trackSessions.findById.mockReturnValue(mockSession);
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.trackLayouts.findById.mockReturnValue(mockLayout);
    repositories.laps.findBySessionId.mockReturnValue([
      { id: "l1", sessionId: "s1", lapNumber: 1, time: 75, createdAt: 0, updatedAt: 0 },
      { id: "l2", sessionId: "s1", lapNumber: 2, time: 70, createdAt: 0, updatedAt: 0 },
      { id: "l3", sessionId: "s1", lapNumber: 3, time: 90, createdAt: 0, updatedAt: 0 },
    ]);

    const expected = computeSessionPerformance({
      format: "Race",
      selfLaps: [
        { id: "l1", lapNumber: 1, time: 75 },
        { id: "l2", lapNumber: 2, time: 70 },
        { id: "l3", lapNumber: 3, time: 90 },
      ],
      fieldFastestLaps: [],
      sessionFastestLap: null,
    });

    const payload = rootValue.trackSession({ id: "s1" }, context);
    expect(payload.sessionPerformanceScore()).toBe(expected.score);
    expect(payload.sessionPerformance()).toMatchObject({
      format: expected.format,
      score: expected.score,
      cleanLapNumbers: expected.cleanLapNumbers,
      excludedLaps: expected.excludedLaps.map((lap) => ({ lapNumber: lap.lapNumber })),
    });
  });

  it("createTrackSession validates required fields", async () => {
    await expect(rootValue.createTrackSession({ input: {} }, context)).rejects.toThrowError(
      "Date, format, trackId, trackLayoutId, kartId, and classification are required"
    );
  });

  it("createTrackSession rejects when track is missing", async () => {
    repositories.tracks.findById.mockReturnValueOnce(null);
    await expect(
      rootValue.createTrackSession(
        {
          input: {
            date: "2024-02-01",
            format: "Race",
            classification: 5,
            trackId: "missing",
            kartId: "k1",
            trackLayoutId: "l1",
          },
        },
        context
      )
    ).rejects.toThrowError("Track with ID missing not found");
  });

  it("createTrackSession forwards parsed input", async () => {
    repositories.trackSessions.createWithLaps.mockReturnValue({ trackSession: mockSession, laps: [] });
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.karts.findById.mockReturnValue(mockKart);
    repositories.trackKarts.findKartsForTrack.mockReturnValue([mockKart]);
    repositories.trackLayouts.findById.mockReturnValue(mockLayout);

    const result = await rootValue.createTrackSession(
      {
        input: {
          date: "2024-02-01",
          format: "Race",
          classification: 2,
          trackId: "c1",
          conditions: "Wet",
          temperature: "21",
          notes: "fun",
          trackLayoutId: "l1",
          kartId: "k1",
          kartNumber: "42",
          laps: [{ lapNumber: 1, time: 74.5 }],
          participants: [
            {
              name: "John Reeves",
              classification: 2,
              kartNumber: "16",
              isSelf: true,
              laps: [{ lapNumber: 1, time: 52.111 }],
            },
            {
              name: "Robert Seaman",
              classification: 1,
              kartNumber: "7",
              isSelf: false,
              laps: [{ lapNumber: 1, time: 51.62 }],
            },
          ],
        },
      },
      context
    );

    expect(fetchWeatherMock).not.toHaveBeenCalled();
    expect(repositories.trackSessions.createWithLaps).toHaveBeenCalledWith({
      date: "2024-02-01",
      format: "Race",
      classification: 2,
      trackId: "c1",
      userId: "user-1",
      conditions: "Wet",
      notes: "fun",
      laps: [{ lapNumber: 1, time: 74.5 }],
      trackLayoutId: "l1",
      kartId: "k1",
      kartNumber: "42",
      temperature: "21",
      fastestLap: null,
      participants: [
        {
          name: "John Reeves",
          classification: 2,
          kartNumber: "16",
          isSelf: true,
          laps: [{ lapNumber: 1, time: 52.111 }],
        },
        {
          name: "Robert Seaman",
          classification: 1,
          kartNumber: "7",
          isSelf: false,
          laps: [{ lapNumber: 1, time: 51.62 }],
        },
      ],
    });
    expect(result.trackSession.id).toBe("s1");
    expect(result.trackSession.classification).toBe(1);
  });

  it("createTrackSession tolerates lap event offsets that match lap times within float jitter", async () => {
    repositories.trackSessions.createWithLaps.mockReturnValue({ trackSession: mockSession, laps: [] });
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.karts.findById.mockReturnValue(mockKart);
    repositories.trackKarts.findKartsForTrack.mockReturnValue([mockKart]);
    repositories.trackLayouts.findById.mockReturnValue(mockLayout);

    await rootValue.createTrackSession(
      {
        input: {
          date: "2024-02-01",
          format: "Race",
          classification: 2,
          trackId: "c1",
          trackLayoutId: "l1",
          kartId: "k1",
          laps: [
            {
              lapNumber: 14,
              time: 61.153999999999996,
              lapEvents: [{ offset: 61.154, event: "position", value: "2" }],
            },
          ],
        },
      },
      context
    );

    expect(repositories.trackSessions.createWithLaps).toHaveBeenCalledWith(
      expect.objectContaining({
        laps: [
          {
            lapNumber: 14,
            time: 61.153999999999996,
            lapEvents: [{ offset: 61.154, event: "position", value: "2" }],
          },
        ],
      })
    );
  });

  it("createTrackSession forces Dry conditions for indoor tracks", async () => {
    repositories.trackSessions.createWithLaps.mockReturnValue({ trackSession: mockSession, laps: [] });
    repositories.tracks.findById.mockReturnValue({ ...mockTrack, isIndoors: true });
    repositories.karts.findById.mockReturnValue(mockKart);
    repositories.trackKarts.findKartsForTrack.mockReturnValue([mockKart]);
    repositories.trackLayouts.findById.mockReturnValue(mockLayout);

    await rootValue.createTrackSession(
      {
        input: {
          date: "2024-02-01",
          format: "Race",
          classification: 2,
          trackId: "c1",
          conditions: "Wet",
          trackLayoutId: "l1",
          kartId: "k1",
        },
      },
      context
    );

    expect(repositories.trackSessions.createWithLaps).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: "Dry",
      })
    );
  });

  it("createTrackSession does not auto-fetch temperature", async () => {
    repositories.trackSessions.createWithLaps.mockReturnValue({ trackSession: mockSession, laps: [] });
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.karts.findById.mockReturnValue(mockKart);
    repositories.trackKarts.findKartsForTrack.mockReturnValue([mockKart]);
    repositories.trackLayouts.findById.mockReturnValue(mockLayout);

    await rootValue.createTrackSession(
      {
        input: {
          date: "2024-02-01",
          format: "Race",
          classification: 2,
          trackId: "c1",
          trackLayoutId: "l1",
          kartId: "k1",
        },
      },
      context
    );

    expect(fetchWeatherMock).not.toHaveBeenCalled();
    expect(repositories.trackSessions.createWithLaps).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: "",
      })
    );
  });

  it("fetchTrackSessionTemperature requires authentication", async () => {
    await expect(
      rootValue.fetchTrackSessionTemperature(
        { input: { trackId: "c1", date: "2024-02-01T12:00" } },
        { ...context, currentUser: null }
      )
    ).rejects.toThrowError("Authentication required");
  });

  it("fetchTrackSessionTemperature returns temperature for track/date", async () => {
    repositories.tracks.findById.mockReturnValue({ ...mockTrack, postcode: "KT14 6GB" });
    fetchWeatherMock.mockResolvedValue({ temperature: "18", conditions: "Sunny" });

    const result = await rootValue.fetchTrackSessionTemperature(
      { input: { trackId: "c1", date: "2024-02-01T12:30" } },
      context
    );

    expect(fetchWeatherMock).toHaveBeenCalledWith("KT14 6GB", "2024-02-01T12:30");
    expect(result).toEqual({ temperature: "18", conditions: "Sunny" });
  });

  it("fetchTrackSessionTemperature returns null when track has no postcode", async () => {
    repositories.tracks.findById.mockReturnValue({ ...mockTrack, postcode: null });

    const result = await rootValue.fetchTrackSessionTemperature(
      { input: { trackId: "c1", date: "2024-02-01T12:30" } },
      context
    );

    expect(fetchWeatherMock).not.toHaveBeenCalled();
    expect(result).toEqual({ temperature: null, conditions: null });
  });

  it("importTrackSessionFromUrl requires authentication", async () => {
    await expect(
      rootValue.importTrackSessionFromUrl(
        { input: { source: "https://results.alphatiming.co.uk/buckmore/e/1/s/2" } },
        { ...context, currentUser: null }
      )
    ).rejects.toThrowError("Authentication required");
  });

  it("importTrackSessionFromUrl delegates to import service", async () => {
    const source = "https://results.alphatiming.co.uk/buckmore/e/1/s/2";
    const result = await rootValue.importTrackSessionFromUrl({ input: { source } }, context);

    expect(importTrackSessionFromSourceMock).toHaveBeenCalledWith(source);
    expect(result).toMatchObject({
      provider: "alphatiming",
      sessionFormat: "Practice",
      sessionDate: "2026-03-14",
      sessionTime: "18:23",
    });
  });

  it("importTrackSessionFromUrl surfaces import errors as validation failures", async () => {
    importTrackSessionFromSourceMock.mockRejectedValueOnce(
      new SessionImportError("Unsupported import source URL", "UNSUPPORTED_SOURCE")
    );

    await expect(
      rootValue.importTrackSessionFromUrl(
        { input: { source: "https://example.com/not-supported" } },
        context
      )
    ).rejects.toThrowError("Unsupported import source URL");
  });

  it("fetchDaytonaClubspeedSessions requires authentication", async () => {
    await expect(
      rootValue.fetchDaytonaClubspeedSessions({}, { ...context, currentUser: null })
    ).rejects.toThrowError("Authentication required");
  });

  it("fetchDaytonaClubspeedSessions delegates to import service", async () => {
    fetchDaytonaClubspeedSessionsMock.mockResolvedValueOnce([
      {
        heatNo: "81389|2026-03-11|19%3A30|149|3|49.411",
        activityType: "DMAX Practice 20mins - Kart 149",
        sessionDate: "2026-03-11",
        sessionTime: "19:30",
        kartNumber: "149",
        classification: 3,
      },
    ]);

    const result = await rootValue.fetchDaytonaClubspeedSessions({}, context);

    expect(fetchDaytonaClubspeedSessionsMock).toHaveBeenCalledWith();
    expect(result).toEqual({
      sessions: [
        {
          heatNo: "81389|2026-03-11|19%3A30|149|3|49.411",
          activityType: "DMAX Practice 20mins - Kart 149",
          sessionDate: "2026-03-11",
          sessionTime: "19:30",
          kartNumber: "149",
          classification: 3,
        },
      ],
    });
  });

  it("importDaytonaClubspeedSession requires authentication", async () => {
    await expect(
      rootValue.importDaytonaClubspeedSession(
        { input: { heatNo: "81389|2026-03-11|19%3A30|149|3|49.411" } },
        { ...context, currentUser: null }
      )
    ).rejects.toThrowError("Authentication required");
  });

  it("importDaytonaClubspeedSession delegates to import service", async () => {
    const heatNo = "81389|2026-03-11|19%3A30|149|3|49.411";

    const result = await rootValue.importDaytonaClubspeedSession({ input: { heatNo } }, context);

    expect(importDaytonaClubspeedSessionMock).toHaveBeenCalledWith(heatNo);
    expect(result).toMatchObject({
      provider: "daytona",
      sessionFormat: "Practice",
      sessionDate: "2026-03-11",
      sessionTime: "19:30",
      selfDriverName: "L - Jonny R",
      kartTypeName: "DMAX",
    });
  });

  it("importDaytonaClubspeedSession surfaces import errors as validation failures", async () => {
    importDaytonaClubspeedSessionMock.mockRejectedValueOnce(
      new SessionImportError("No Daytona Club Speed sessions were found", "PARSE_FAILED")
    );

    await expect(
      rootValue.importDaytonaClubspeedSession(
        { input: { heatNo: "missing" } },
        context
      )
    ).rejects.toThrowError("No Daytona Club Speed sessions were found");
  });

  it("createTrackSession rejects when kart does not exist", async () => {
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.karts.findById.mockReturnValue(null);

    await expect(
      rootValue.createTrackSession(
        {
          input: {
            date: "2024-02-01",
            format: "Race",
            classification: 2,
            trackId: "c1",
            kartId: "missing",
            trackLayoutId: "l1",
          },
        },
        context
      )
    ).rejects.toThrowError("Kart with ID missing not found");
  });

  it("createTrackSession rejects when kart not on track", async () => {
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.karts.findById.mockReturnValue(mockKart);
    repositories.trackKarts.findKartsForTrack.mockReturnValue([]);
    repositories.trackLayouts.findById.mockReturnValue(mockLayout);

    await expect(
      rootValue.createTrackSession(
        {
          input: {
            date: "2024-02-01",
            format: "Race",
            classification: 2,
            trackId: "c1",
            trackLayoutId: "l1",
            kartId: "k1",
          },
        },
        context
      )
    ).rejects.toThrowError("Kart is not available at the selected track");
  });

  it("createTrackSession rejects when track layout does not exist", async () => {
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.karts.findById.mockReturnValue(mockKart);
    repositories.trackKarts.findKartsForTrack.mockReturnValue([mockKart]);
    repositories.trackLayouts.findById.mockReturnValue(null);

    await expect(
      rootValue.createTrackSession(
        {
          input: {
            date: "2024-02-01",
            format: "Race",
            classification: 2,
            trackId: "c1",
            trackLayoutId: "missing",
            kartId: "k1",
          },
        },
        context
      )
    ).rejects.toThrowError("Track layout with ID missing not found");
  });

  it("createTrackSession rejects when track layout not on track", async () => {
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.karts.findById.mockReturnValue(mockKart);
    repositories.trackKarts.findKartsForTrack.mockReturnValue([mockKart]);
    repositories.trackLayouts.findById.mockReturnValue({ ...mockLayout, trackId: "other" });

    await expect(
      rootValue.createTrackSession(
        {
          input: {
            date: "2024-02-01",
            format: "Race",
            classification: 2,
            trackId: "c1",
            trackLayoutId: "l1",
            kartId: "k1",
          },
        },
        context
      )
    ).rejects.toThrowError("Track layout is not available at the selected track");
  });

  it("updateTrackSession validates presence of id and auth", async () => {
    await expect(rootValue.updateTrackSession({ input: {} }, context)).rejects.toThrowError(
      "id is required"
    );
    await expect(
      rootValue.updateTrackSession({ input: { id: "s1" } }, { ...context, currentUser: null })
    ).rejects.toThrowError("Authentication required");
  });

  it("updateTrackSession forwards fields to DB and returns payload", async () => {
    repositories.trackSessions.findById.mockReturnValue(mockSession);
    repositories.trackSessions.update.mockReturnValue({ ...mockSession, format: "Practice" });
    repositories.lapEvents.findByLapId.mockReturnValue([]);
    repositories.trackRecordings.findBySessionId.mockReturnValue([]);
    repositories.trackLayouts.findById.mockReturnValue(mockLayout);
    repositories.tracks.findById.mockReturnValue(mockTrack);

    const result = await rootValue.updateTrackSession(
      { input: { id: "s1", format: "Practice" } },
      context
    );

    expect(repositories.trackSessions.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "s1",
        date: undefined,
        format: "Practice",
        classification: undefined,
        trackId: "c1",
        kartId: "k1",
        kartNumber: "",
        temperature: "",
        conditions: undefined,
        trackLayoutId: "l1",
        notes: undefined,
      })
    );
    expect(result.trackSession.format).toBe("Practice");
    expect(result.trackSession.classification).toBe(1);
  });

  it("updateTrackSession forces Dry conditions for indoor tracks", async () => {
    repositories.trackSessions.findById.mockReturnValue({ ...mockSession, conditions: "Wet" });
    repositories.trackSessions.update.mockReturnValue({ ...mockSession, conditions: "Dry" });
    repositories.lapEvents.findByLapId.mockReturnValue([]);
    repositories.trackRecordings.findBySessionId.mockReturnValue([]);
    repositories.trackLayouts.findById.mockReturnValue(mockLayout);
    repositories.tracks.findById.mockReturnValue({ ...mockTrack, isIndoors: true });

    await rootValue.updateTrackSession(
      { input: { id: "s1", conditions: "Wet" } },
      context
    );

    expect(repositories.trackSessions.update).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: "Dry",
      })
    );
  });


  it("updateTrackSession requires trackLayoutId when track changes", async () => {
    repositories.trackSessions.findById.mockReturnValue(mockSession);
    repositories.tracks.findById.mockReturnValue({ ...mockTrack, id: "new-track" });
    repositories.trackLayouts.findById.mockReturnValue({ ...mockLayout, trackId: "c1" });
    await expect(
      rootValue.updateTrackSession(
        { input: { id: "s1", trackId: "new-track" } },
        context
      )
    ).rejects.toThrowError("trackLayoutId is required when changing track");
  });

  it("updateTrackSession rejects when kart is not available for selected track", async () => {
    repositories.trackSessions.findById.mockReturnValue(mockSession);
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.trackLayouts.findById.mockReturnValue(mockLayout);
    repositories.karts.findById.mockReturnValue(mockKart);
    repositories.trackKarts.findKartsForTrack.mockReturnValue([]);

    await expect(
      rootValue.updateTrackSession(
        { input: { id: "s1", kartId: "k1" } },
        context
      )
    ).rejects.toThrowError("Kart is not available at the selected track");
  });

  it("updateTrackSessionLaps validates auth and id", () => {
    expect(() => rootValue.updateTrackSessionLaps({ input: {} }, context)).toThrowError(
      "id is required"
    );
    expect(() =>
      rootValue.updateTrackSessionLaps(
        { input: { id: "s1", laps: [] } },
        { ...context, currentUser: null }
      )
    ).toThrowError("Authentication required");
  });

  it("updateTrackSessionLaps replaces laps and bumps updatedAt", () => {
    repositories.trackSessions.findById.mockReturnValue(mockSession);
    repositories.trackSessions.replaceLapsForSession.mockReturnValue([
      { id: "lap-1", sessionId: "s1", lapNumber: 1, time: 70, createdAt: 0, updatedAt: 0 },
    ]);
    repositories.trackSessions.update.mockReturnValue({ ...mockSession, updatedAt: 123 });
    repositories.laps.findBySessionId.mockReturnValue([
      { id: "lap-1", sessionId: "s1", lapNumber: 1, time: 70, createdAt: 0, updatedAt: 0 },
    ]);
    repositories.lapEvents.findByLapId.mockReturnValue([]);
    repositories.trackRecordings.findBySessionId.mockReturnValue([]);
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.trackLayouts.findById.mockReturnValue(mockLayout);

    const result = rootValue.updateTrackSessionLaps(
      { input: { id: "s1", laps: [{ lapNumber: 1, time: 70.5 }] } },
      context
    );

    expect(repositories.trackSessions.replaceLapsForSession).toHaveBeenCalledWith(
      "s1",
      [{ lapNumber: 1, time: 70.5 }],
      expect.any(Number)
    );
    expect(repositories.trackSessions.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: "s1", now: expect.any(Number) })
    );
    expect(result.trackSession.laps({ first: 10 })).toHaveLength(1);
  });

  describe("deleteTrackSession", () => {
    it("deletes a session", async () => {
      repositories.trackSessions.delete.mockResolvedValue(true);

      const result = await rootValue.deleteTrackSession({ id: "s1" }, context);

      expect(result).toEqual({ success: true });
      expect(repositories.trackSessions.delete).toHaveBeenCalledWith(
        "s1",
        "user-1"
      );
    });

    it("rejects when session not owned by user", async () => {
      repositories.trackSessions.findById.mockReturnValue({ ...mockSession, userId: "another-user" });
      repositories.trackSessions.delete.mockResolvedValue(false);

      const result = await rootValue.deleteTrackSession({ id: "s1" }, context);

      expect(result).toEqual({ success: false });
    });

    it("rejects unauthenticated requests", async () => {
      await expect(
        rootValue.deleteTrackSession({ id: "s1" }, { ...context, currentUser: null })
      ).rejects.toThrowError("Authentication required");
    });
  });
});
