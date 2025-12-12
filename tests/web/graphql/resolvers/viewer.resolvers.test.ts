import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockGraphQLContext } from "../context.mock.js";
import { rootValue } from "../../../../src/web/graphql/schema.js";

const user = { id: "user-1", username: "sam", createdAt: 1700000000000 };

const mockSessions = [
  {
    id: "s1",
    date: "2024-01-05",
    format: "Race",
    classification: 1,
    conditions: "Dry" as const,
    trackId: "c1",
    userId: user.id,
    notes: null,
    createdAt: 0,
    updatedAt: 0,
    kartId: "kart-a",
    trackLayoutId: "l1",
  },
  {
    id: "s2",
    date: "2024-02-01",
    format: "Race",
    classification: 2,
    conditions: "Wet" as const,
    trackId: "c2",
    userId: user.id,
    notes: "fun",
    createdAt: 0,
    updatedAt: 0,
    kartId: "kart-b",
    trackLayoutId: "l2",
  },
  {
    id: "s3",
    date: "2024-02-10",
    format: "Practice",
    classification: 3,
    conditions: "Dry" as const,
    trackId: "c1",
    userId: user.id,
    notes: null,
    createdAt: 0,
    updatedAt: 0,
    kartId: "kart-a",
    trackLayoutId: "l1",
  },
];

const tracks = {
  c1: { id: "c1", name: "Monza", heroImage: null, createdAt: 0, updatedAt: 0 },
  c2: { id: "c2", name: "Spa", heroImage: null, createdAt: 0, updatedAt: 0 },
};

const lapsBySession: Record<string, Array<{ id: string; time: number }>> = {
  s1: [
    { id: "l1", time: 59 },
    { id: "l2", time: 60 },
  ],
  s2: [
    { id: "l3", time: 61 },
    { id: "l4", time: 62 },
  ],
  s3: [
    { id: "l5", time: 57 },
    { id: "l6", time: 58 },
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
    ).toThrowError("sort must be DATE_ASC, DATE_DESC, FASTEST_LAP_ASC, or FASTEST_LAP_DESC");
  });

  it("rejects invalid format filter", () => {
    const viewer = rootValue.viewer({}, context as never);
    expect(() =>
      viewer?.recentTrackSessions({ first: 5, filter: { format: "Time Attack" } })
    ).toThrowError("format filter must be Practice, Qualifying, or Race");
  });
});
