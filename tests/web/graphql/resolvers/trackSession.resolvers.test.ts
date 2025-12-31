import { describe, expect, it, vi, beforeEach } from "vitest";

const { rebuildProjectionMock, removeProjectionMock } = vi.hoisted(() => ({
  rebuildProjectionMock: vi.fn().mockResolvedValue({ folderName: "", recordings: [] }),
  removeProjectionMock: vi.fn().mockResolvedValue(undefined),
}));

const { fetchTemperatureMock } = vi.hoisted(() => ({
  fetchTemperatureMock: vi.fn(),
}));

vi.mock("../../../../src/web/recordings/mediaLibraryProjection.js", () => ({
  rebuildMediaLibrarySessionProjection: rebuildProjectionMock,
  removeMediaLibraryProjectionsForRecordings: removeProjectionMock,
}));

vi.mock("../../../../src/web/shared/weather.js", () => ({
  fetchTemperatureForPostcode: fetchTemperatureMock,
}));

import { createMockGraphQLContext } from "../context.mock.js";
import { computeConsistencyStats } from "../../../../src/web/shared/consistency.js";
import { rootValue } from "../../../../src/web/graphql/schema.js";

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
    fetchTemperatureMock.mockResolvedValue(null);
    repositories.trackKarts.findKartsForTrack.mockReturnValue([mockKart]);
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

  it("exposes consistency score and breakdown derived from laps", async () => {
    repositories.trackSessions.findById.mockReturnValue(mockSession);
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.trackLayouts.findById.mockReturnValue(mockLayout);
    repositories.laps.findBySessionId.mockReturnValue([
      { id: "l1", sessionId: "s1", lapNumber: 1, time: 75, createdAt: 0, updatedAt: 0 },
      { id: "l2", sessionId: "s1", lapNumber: 2, time: 70, createdAt: 0, updatedAt: 0 },
      { id: "l3", sessionId: "s1", lapNumber: 3, time: 90, createdAt: 0, updatedAt: 0 },
    ]);

    const expected = computeConsistencyStats([
      { id: "l1", lapNumber: 1, time: 75 },
      { id: "l2", lapNumber: 2, time: 70 },
      { id: "l3", lapNumber: 3, time: 90 },
    ]);

    const payload = rootValue.trackSession({ id: "s1" }, context);
    expect(payload.consistencyScore()).toBe(expected.score);
    expect(payload.consistency()).toMatchObject({
      score: expected.score,
      usableLapNumbers: expected.usableLaps.map((lap) => lap.lapNumber),
      excludedLaps: expected.excluded.map((lap) => ({ lapNumber: lap.lapNumber })),
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
        },
      },
      context
    );

    expect(fetchTemperatureMock).not.toHaveBeenCalled();
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
    });
    expect(result.trackSession.id).toBe("s1");
    expect(result.trackSession.classification).toBe(1);
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

    expect(fetchTemperatureMock).not.toHaveBeenCalled();
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
    fetchTemperatureMock.mockResolvedValue("18");

    const result = await rootValue.fetchTrackSessionTemperature(
      { input: { trackId: "c1", date: "2024-02-01T12:30" } },
      context
    );

    expect(fetchTemperatureMock).toHaveBeenCalledWith("KT14 6GB", "2024-02-01T12:30");
    expect(result).toEqual({ temperature: "18" });
  });

  it("fetchTrackSessionTemperature returns null when track has no postcode", async () => {
    repositories.tracks.findById.mockReturnValue({ ...mockTrack, postcode: null });

    const result = await rootValue.fetchTrackSessionTemperature(
      { input: { trackId: "c1", date: "2024-02-01T12:30" } },
      context
    );

    expect(fetchTemperatureMock).not.toHaveBeenCalled();
    expect(result).toEqual({ temperature: null });
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
