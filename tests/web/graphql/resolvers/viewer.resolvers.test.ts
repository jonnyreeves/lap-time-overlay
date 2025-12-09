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
    circuitId: "c1",
    userId: user.id,
    notes: null,
    createdAt: 0,
    updatedAt: 0,
    kartId: null,
  },
  {
    id: "s2",
    date: "2024-02-01",
    format: "Race",
    classification: 2,
    conditions: "Wet" as const,
    circuitId: "c2",
    userId: user.id,
    notes: "fun",
    createdAt: 0,
    updatedAt: 0,
    kartId: null,
  },
  {
    id: "s3",
    date: "2024-02-10",
    format: "Practice",
    classification: 3,
    conditions: "Dry" as const,
    circuitId: "c1",
    userId: user.id,
    notes: null,
    createdAt: 0,
    updatedAt: 0,
    kartId: null,
  },
];

const circuits = {
  c1: { id: "c1", name: "Monza", heroImage: null, createdAt: 0, updatedAt: 0 },
  c2: { id: "c2", name: "Spa", heroImage: null, createdAt: 0, updatedAt: 0 },
};

describe("viewer resolver", () => {
  const { context, repositories } = createMockGraphQLContext({ currentUser: user });

  beforeEach(() => {
    vi.clearAllMocks();
    repositories.trackSessions.findByUserId.mockReturnValue(mockSessions);
    repositories.circuits.findById.mockImplementation((id: string) => circuits[id as keyof typeof circuits] ?? null);
    repositories.laps.findBySessionId.mockReturnValue([]);
  });

  it("returns null when not authenticated", () => {
    const unauthContext = createMockGraphQLContext().context;
    expect(rootValue.viewer({}, unauthContext as never)).toBeNull();
  });

  it("returns viewer payload with recent circuits and sessions", async () => {
    const viewer = rootValue.viewer({}, context as never);
    expect(viewer?.id).toBe("user-1");

    const recentCircuits = await viewer?.recentCircuits({ first: 2 });
    expect(recentCircuits?.edges.map((edge) => edge.node.id)).toEqual(["c1", "c2"]);
    expect(recentCircuits?.pageInfo).toMatchObject({ hasNextPage: false, hasPreviousPage: false });
    const circuitsAfter = await viewer?.recentCircuits({ first: 2, after: recentCircuits?.edges[1]?.cursor });
    expect(circuitsAfter?.edges.map((edge) => edge.node.id)).toEqual([]);

    const recentSessions = await viewer?.recentTrackSessions({ first: 2 });
    expect(recentSessions?.edges.map((edge) => edge.node.id)).toEqual(["s3", "s2"]);
    expect(await recentSessions?.edges[0]?.node.circuit()).toMatchObject({ id: "c1", name: "Monza" });
    expect(recentSessions?.pageInfo).toMatchObject({ hasNextPage: true, hasPreviousPage: false });

    const afterCursor = recentSessions?.edges[1]?.cursor;
    const pagedSessions = await viewer?.recentTrackSessions({ first: 2, after: afterCursor });
    expect(pagedSessions?.edges.map((edge) => edge.node.id)).toEqual(["s1"]);
    expect(pagedSessions?.pageInfo).toMatchObject({ hasNextPage: false, hasPreviousPage: true });
  });
});
