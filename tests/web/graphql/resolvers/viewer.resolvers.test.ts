import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockGraphQLContext } from "../context.mock.js";
import { rootValue } from "../../../../src/web/graphql/schema.js";
import {
  computeSessionPerformance,
  type SessionFormat,
} from "../../../../src/web/shared/sessionPerformance.js";

const user = { id: "user-1", username: "sam", createdAt: 1700000000000, isAdmin: true };

const mockSessions = [
  {
    id: "s1",
    date: "2024-01-05",
    format: "Race",
    classification: 1,
    fastestLap: null,
    conditions: "Dry" as const,
    temperature: "",
    trackId: "c1",
    userId: user.id,
    notes: null,
    createdAt: 0,
    updatedAt: 0,
    kartId: "kart-a",
    kartNumber: "",
    trackLayoutId: "l1",
  },
  {
    id: "s2",
    date: "2024-02-01",
    format: "Race",
    classification: 2,
    fastestLap: null,
    conditions: "Wet" as const,
    temperature: "18",
    trackId: "c2",
    userId: user.id,
    notes: "fun",
    createdAt: 0,
    updatedAt: 0,
    kartId: "kart-b",
    kartNumber: "",
    trackLayoutId: "l2",
  },
  {
    id: "s3",
    date: "2024-02-10",
    format: "Practice",
    classification: 3,
    fastestLap: null,
    conditions: "Dry" as const,
    temperature: "",
    trackId: "c1",
    userId: user.id,
    notes: null,
    createdAt: 0,
    updatedAt: 0,
    kartId: "kart-a",
    kartNumber: "",
    trackLayoutId: "l1",
  },
];

const tracks = {
  c1: {
    id: "c1",
    name: "Monza",
    heroImage: null,
    postcode: null,
    isIndoors: false,
    createdAt: 0,
    updatedAt: 0,
  },
  c2: {
    id: "c2",
    name: "Spa",
    heroImage: null,
    postcode: null,
    isIndoors: false,
    createdAt: 0,
    updatedAt: 0,
  },
};

const lapsBySession: Record<string, Array<{ id: string; time: number }>> = {
  s1: [
    { id: "l1", time: 59 },
    { id: "l2", time: 60 },
    { id: "l3", time: 60.2 },
  ],
  s2: [
    { id: "l4", time: 61 },
    { id: "l5", time: 65 },
    { id: "l6", time: 62 },
  ],
  s3: [
    { id: "l7", time: 57 },
    { id: "l8", time: 57.2 },
    { id: "l9", time: 57.1 },
  ],
};

describe("viewer resolver", () => {
  const { context, repositories } = createMockGraphQLContext({ currentUser: user });

  beforeEach(() => {
    vi.clearAllMocks();
    repositories.trackSessions.findByUserId.mockReturnValue(mockSessions);
    repositories.tracks.findById.mockImplementation((id: string) => tracks[id as keyof typeof tracks] ?? null);
    repositories.trackLayouts.findById.mockImplementation((id: string) => {
      if (id === "l1") return { id, trackId: "c1", name: "GP", createdAt: 0, updatedAt: 0 };
      if (id === "l2") return { id, trackId: "c2", name: "Full", createdAt: 0, updatedAt: 0 };
      return null;
    });
    repositories.laps.findBySessionId.mockImplementation((sessionId: string) => {
      const laps = lapsBySession[sessionId] ?? [];
      return laps.map((lap, index) => ({
        id: lap.id,
        sessionId,
        lapNumber: index + 1,
        time: lap.time,
        createdAt: 0,
        updatedAt: 0,
      }));
    });
    repositories.trackSessionParticipants.findBySessionIds.mockReturnValue([]);
    repositories.trackSessionParticipants.findLapsByParticipantIds.mockReturnValue([]);
  });

  it("returns null when not authenticated", () => {
    const unauthContext = createMockGraphQLContext().context;
    expect(rootValue.viewer({}, unauthContext as never)).toBeNull();
  });

  it("returns viewer payload with recent tracks and sessions", async () => {
    const viewer = rootValue.viewer({}, context as never);
    expect(viewer?.id).toBe("user-1");

    const recentTracks = await viewer?.recentTracks({ first: 2 });
    expect(recentTracks?.edges.map((edge) => edge.node.id)).toEqual(["c1", "c2"]);
    expect(recentTracks?.pageInfo).toMatchObject({ hasNextPage: false, hasPreviousPage: false });
    const tracksAfter = await viewer?.recentTracks({ first: 2, after: recentTracks?.edges[1]?.cursor });
    expect(tracksAfter?.edges.map((edge) => edge.node.id)).toEqual([]);

    const recentSessions = await viewer?.recentTrackSessions({ first: 2 });
    expect(recentSessions?.edges.map((edge) => edge.node.id)).toEqual(["s3", "s2"]);
    expect(await recentSessions?.edges[0]?.node.track()).toMatchObject({ id: "c1", name: "Monza" });
    expect(recentSessions?.pageInfo).toMatchObject({ hasNextPage: true, hasPreviousPage: false });

    const afterCursor = recentSessions?.edges[1]?.cursor;
    const pagedSessions = await viewer?.recentTrackSessions({ first: 2, after: afterCursor });
    expect(pagedSessions?.edges.map((edge) => edge.node.id)).toEqual(["s1"]);
    expect(pagedSessions?.pageInfo).toMatchObject({ hasNextPage: false, hasPreviousPage: true });
  });

  it("filters recent track sessions by provided filters", async () => {
    const viewer = rootValue.viewer({}, context as never);
    const byTrack = viewer?.recentTrackSessions({ first: 5, filter: { trackId: "c1" } });
    expect(byTrack?.edges.map((edge) => edge.node.id)).toEqual(["s3", "s1"]);

    const byLayout = viewer?.recentTrackSessions({ first: 5, filter: { trackLayoutId: "l2" } });
    expect(byLayout?.edges.map((edge) => edge.node.id)).toEqual(["s2"]);

    const byKart = viewer?.recentTrackSessions({ first: 5, filter: { kartId: "kart-b" } });
    expect(byKart?.edges.map((edge) => edge.node.id)).toEqual(["s2"]);

    const byConditions = viewer?.recentTrackSessions({ first: 5, filter: { conditions: "Wet" } });
    expect(byConditions?.edges.map((edge) => edge.node.id)).toEqual(["s2"]);

    const byFormat = viewer?.recentTrackSessions({ first: 5, filter: { format: "Practice" } });
    expect(byFormat?.edges.map((edge) => edge.node.id)).toEqual(["s3"]);

    const bySessionIds = viewer?.recentTrackSessions({
      first: 5,
      filter: { sessionIds: ["s1", "s3"] },
    });
    expect(bySessionIds?.edges.map((edge) => edge.node.id)).toEqual(["s3", "s1"]);
  });

  it("sorts recent track sessions when sort provided", () => {
    const viewer = rootValue.viewer({}, context as never);
    const byDateAsc = viewer?.recentTrackSessions({ first: 5, sort: "DATE_ASC" });
    expect(byDateAsc?.edges.map((edge) => edge.node.id)).toEqual(["s1", "s2", "s3"]);

    const byFastestLapAsc = viewer?.recentTrackSessions({ first: 5, sort: "FASTEST_LAP_ASC" });
    expect(byFastestLapAsc?.edges.map((edge) => edge.node.id)).toEqual(["s3", "s1", "s2"]);

    const byFastestLapDesc = viewer?.recentTrackSessions({
      first: 5,
      sort: "FASTEST_LAP_DESC",
    });
    expect(byFastestLapDesc?.edges.map((edge) => edge.node.id)).toEqual(["s2", "s1", "s3"]);

    const expectedByPerformanceDesc = [...mockSessions]
      .sort((left, right) => {
        const leftScore =
          computeSessionPerformance({
            format: left.format as SessionFormat,
            selfLaps: (lapsBySession[left.id] ?? []).map((lap, index) => ({
              id: lap.id,
              lapNumber: index + 1,
              time: lap.time,
            })),
            fieldFastestLaps: [],
            sessionFastestLap: left.fastestLap,
          }).score ?? -1;
        const rightScore =
          computeSessionPerformance({
            format: right.format as SessionFormat,
            selfLaps: (lapsBySession[right.id] ?? []).map((lap, index) => ({
              id: lap.id,
              lapNumber: index + 1,
              time: lap.time,
            })),
            fieldFastestLaps: [],
            sessionFastestLap: right.fastestLap,
          }).score ?? -1;
        return rightScore - leftScore;
      })
      .map((session) => session.id);

    const expectedByPerformanceAsc = [...mockSessions]
      .sort((left, right) => {
        const leftScore =
          computeSessionPerformance({
            format: left.format as SessionFormat,
            selfLaps: (lapsBySession[left.id] ?? []).map((lap, index) => ({
              id: lap.id,
              lapNumber: index + 1,
              time: lap.time,
            })),
            fieldFastestLaps: [],
            sessionFastestLap: left.fastestLap,
          }).score ?? Number.POSITIVE_INFINITY;
        const rightScore =
          computeSessionPerformance({
            format: right.format as SessionFormat,
            selfLaps: (lapsBySession[right.id] ?? []).map((lap, index) => ({
              id: lap.id,
              lapNumber: index + 1,
              time: lap.time,
            })),
            fieldFastestLaps: [],
            sessionFastestLap: right.fastestLap,
          }).score ?? Number.POSITIVE_INFINITY;
        return leftScore - rightScore;
      })
      .map((session) => session.id);

    const byPerformanceDesc = viewer?.recentTrackSessions({
      first: 5,
      sort: "PERFORMANCE_DESC",
    });
    expect(byPerformanceDesc?.edges.map((edge) => edge.node.id)).toEqual(expectedByPerformanceDesc);

    const byPerformanceAsc = viewer?.recentTrackSessions({
      first: 5,
      sort: "PERFORMANCE_ASC",
    });
    expect(byPerformanceAsc?.edges.map((edge) => edge.node.id)).toEqual(expectedByPerformanceAsc);
  });

  it("returns session performance score and breakdown for recent sessions", () => {
    const viewer = rootValue.viewer({}, context as never);
    const sessions = viewer?.recentTrackSessions({ first: 1 });
    const node = sessions?.edges[0]?.node;
    const performance = computeSessionPerformance({
      format: "Practice",
      selfLaps: (lapsBySession.s3 ?? []).map((lap, index) => ({
        id: lap.id,
        lapNumber: index + 1,
        time: lap.time,
      })),
      fieldFastestLaps: [],
      sessionFastestLap: null,
    });

    const score =
      typeof node?.sessionPerformanceScore === "function"
        ? node.sessionPerformanceScore()
        : node?.sessionPerformanceScore;
    expect(score).toBe(performance.score);
    const sessionPerformance =
      typeof node?.sessionPerformance === "function"
        ? node.sessionPerformance()
        : node?.sessionPerformance;
    expect(sessionPerformance).toMatchObject({
      format: performance.format,
      score: performance.score,
      cleanLapNumbers: performance.cleanLapNumbers,
    });
  });

  it("rejects invalid conditions filter", () => {
    const viewer = rootValue.viewer({}, context as never);
    expect(() =>
      viewer?.recentTrackSessions({ first: 5, filter: { conditions: "Snow" } })
    ).toThrowError("conditions filter must be either Dry or Wet");
  });

  it("rejects invalid sort input", () => {
    const viewer = rootValue.viewer({}, context as never);
    expect(() =>
      viewer?.recentTrackSessions({ first: 5, sort: "FASTEST" as never })
    ).toThrowError(
      "sort must be DATE_ASC, DATE_DESC, FASTEST_LAP_ASC, FASTEST_LAP_DESC, PERFORMANCE_ASC, or PERFORMANCE_DESC"
    );
  });

  it("rejects invalid format filter", () => {
    const viewer = rootValue.viewer({}, context as never);
    expect(() =>
      viewer?.recentTrackSessions({ first: 5, filter: { format: "Time Attack" } })
    ).toThrowError("format filter must be Practice, Qualifying, or Race");
  });

  it("returns rival summaries for the user", () => {
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
      { id: "lap-1", participantId: "p-self-s1", lapNumber: 1, time: 52.1, createdAt: 0, updatedAt: 0 },
      { id: "lap-2", participantId: "p-rival-s1", lapNumber: 1, time: 51.8, createdAt: 0, updatedAt: 0 },
      { id: "lap-3", participantId: "p-self-s2", lapNumber: 1, time: 51.9, createdAt: 0, updatedAt: 0 },
      { id: "lap-4", participantId: "p-rival-s2", lapNumber: 1, time: 51.7, createdAt: 0, updatedAt: 0 },
      { id: "lap-5", participantId: "p-self-s3", lapNumber: 1, time: 51.7, createdAt: 0, updatedAt: 0 },
      { id: "lap-6", participantId: "p-rival-s3", lapNumber: 1, time: 51.6, createdAt: 0, updatedAt: 0 },
    ]);

    const viewer = rootValue.viewer({}, context as never);
    const rivals = viewer?.rivals({ first: 3 }) ?? [];
    expect(rivals).toHaveLength(1);
    expect(rivals[0]).toMatchObject({
      name: "Robert Seaman",
      sharedSessions: 3,
      trendDirection: "CLOSING",
    });
  });
});
