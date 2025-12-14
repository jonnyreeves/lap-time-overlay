import { describe, expect, it, vi, beforeEach } from "vitest";
import { createMockGraphQLContext } from "../context.mock.js";
import { computeConsistencyStats } from "../../../../src/web/shared/consistency.js";
import { rootValue } from "../../../../src/web/graphql/schema.js";

const { context, repositories } = createMockGraphQLContext({
  currentUser: { id: "user-1", username: "sam", createdAt: Date.now() },
  sessionToken: "token",
});

const mockSession = {
  id: "s1",
  date: "2024-02-01",
  format: "Race",
  classification: 1,
  fastestLap: null,
  conditions: "Dry" as const,
  trackId: "c1",
  userId: "user-1",
  notes: null,
  createdAt: 0,
  updatedAt: 0,
  kartId: "k1",
  trackLayoutId: "l1",
};

const mockTrack = {
  id: "c1",
  name: "Spa",
  heroImage: null,
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
    vi.resetAllMocks();
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
    expect(() => rootValue.createTrackSession({ input: {} }, context)).toThrowError(
      "Date, format, trackId, trackLayoutId, kartId, and classification are required"
    );
  });

  it("createTrackSession rejects when track is missing", async () => {
    repositories.tracks.findById.mockReturnValueOnce(null);
    expect(() =>
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
    ).toThrowError("Track with ID missing not found");
  });

  it("createTrackSession forwards parsed input", async () => {
    repositories.trackSessions.createWithLaps.mockReturnValue({ trackSession: mockSession, laps: [] });
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.karts.findById.mockReturnValue(mockKart);
    repositories.trackKarts.findKartsForTrack.mockReturnValue([mockKart]);
    repositories.trackLayouts.findById.mockReturnValue(mockLayout);

    const result = rootValue.createTrackSession(
      {
        input: {
          date: "2024-02-01",
          format: "Race",
          classification: 2,
          trackId: "c1",
          conditions: "Wet",
          notes: "fun",
          trackLayoutId: "l1",
          kartId: "k1",
          laps: [{ lapNumber: 1, time: 74.5 }],
        },
      },
      context
    );

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
      fastestLap: null,
    });
    expect(result.trackSession.id).toBe("s1");
    expect(result.trackSession.classification).toBe(1);
  });

  it("createTrackSession rejects when kart does not exist", async () => {
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.karts.findById.mockReturnValue(null);

    expect(() =>
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
    ).toThrowError("Kart with ID missing not found");
  });

  it("createTrackSession rejects when kart not on track", async () => {
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.karts.findById.mockReturnValue(mockKart);
    repositories.trackKarts.findKartsForTrack.mockReturnValue([]);
    repositories.trackLayouts.findById.mockReturnValue(mockLayout);

    expect(() =>
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
    ).toThrowError("Kart is not available at the selected track");
  });

  it("createTrackSession rejects when track layout does not exist", async () => {
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.karts.findById.mockReturnValue(mockKart);
    repositories.trackKarts.findKartsForTrack.mockReturnValue([mockKart]);
    repositories.trackLayouts.findById.mockReturnValue(null);

    expect(() =>
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
    ).toThrowError("Track layout with ID missing not found");
  });

  it("createTrackSession rejects when track layout not on track", async () => {
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.karts.findById.mockReturnValue(mockKart);
    repositories.trackKarts.findKartsForTrack.mockReturnValue([mockKart]);
    repositories.trackLayouts.findById.mockReturnValue({ ...mockLayout, trackId: "other" });

    expect(() =>
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
    ).toThrowError("Track layout is not available at the selected track");
  });

  it("updateTrackSession validates presence of id and auth", async () => {
    expect(() => rootValue.updateTrackSession({ input: {} }, context)).toThrowError("id is required");
    expect(() =>
      rootValue.updateTrackSession({ input: { id: "s1" } }, { ...context, currentUser: null })
    ).toThrowError("Authentication required");
  });

  it("updateTrackSession forwards fields to DB and returns payload", async () => {
    repositories.trackSessions.findById.mockReturnValue(mockSession);
    repositories.trackSessions.update.mockReturnValue({ ...mockSession, format: "Practice" });
    repositories.lapEvents.findByLapId.mockReturnValue([]);
    repositories.trackRecordings.findBySessionId.mockReturnValue([]);
    repositories.trackLayouts.findById.mockReturnValue(mockLayout);
    repositories.tracks.findById.mockReturnValue(mockTrack);

    const result = rootValue.updateTrackSession(
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
        conditions: undefined,
        trackLayoutId: "l1",
        notes: undefined,
      })
    );
    expect(result.trackSession.format).toBe("Practice");
    expect(result.trackSession.classification).toBe(1);
  });

  it("updateTrackSession requires trackLayoutId when track changes", () => {
    repositories.trackSessions.findById.mockReturnValue(mockSession);
    repositories.tracks.findById.mockReturnValue({ ...mockTrack, id: "new-track" });
    repositories.trackLayouts.findById.mockReturnValue({ ...mockLayout, trackId: "c1" });
    expect(() =>
      rootValue.updateTrackSession(
        { input: { id: "s1", trackId: "new-track" } },
        context
      )
    ).toThrowError("trackLayoutId is required when changing track");
  });

  it("updateTrackSession rejects when kart is not available for selected track", () => {
    repositories.trackSessions.findById.mockReturnValue(mockSession);
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.trackLayouts.findById.mockReturnValue(mockLayout);
    repositories.karts.findById.mockReturnValue(mockKart);
    repositories.trackKarts.findKartsForTrack.mockReturnValue([]);

    expect(() =>
      rootValue.updateTrackSession(
        { input: { id: "s1", kartId: "k1" } },
        context
      )
    ).toThrowError("Kart is not available at the selected track");
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
});
