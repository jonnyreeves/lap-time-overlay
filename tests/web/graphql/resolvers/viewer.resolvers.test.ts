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
    kartId: null,
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
    kartId: null,
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
    kartId: null,
    trackLayoutId: "l1",
  },
];

const tracks = {
  c1: { id: "c1", name: "Monza", heroImage: null, createdAt: 0, updatedAt: 0 },
  c2: { id: "c2", name: "Spa", heroImage: null, createdAt: 0, updatedAt: 0 },
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
    repositories.laps.findBySessionId.mockReturnValue([]);
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
});
