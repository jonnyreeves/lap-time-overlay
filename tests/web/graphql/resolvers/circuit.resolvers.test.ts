import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockGraphQLContext } from "../context.mock.js";
import { rootValue } from "../../../../src/web/graphql/schema.js";

const { context: baseContext, repositories } = createMockGraphQLContext();

describe("circuit resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the fastest lap per circuit or null when no laps", async () => {
    repositories.circuits.findAll.mockReturnValue([
      {
        id: "c1",
        name: "Spa",
        heroImage: null,
        userId: "user-1",
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "c2",
        name: "Monza",
        heroImage: null,
        userId: "user-1",
        createdAt: 0,
        updatedAt: 0,
      },
    ]);

    repositories.trackSessions.findByCircuitId.mockImplementation((circuitId: string) => {
      if (circuitId === "c1") {
        return [
          {
            id: "s1",
            date: "2024-01-01",
            format: "Race",
            conditions: "Dry",
            circuitId: "c1",
            notes: null,
            createdAt: 0,
            updatedAt: 0,
          },
        ];
      }
      return [];
    });

    repositories.laps.findBySessionId.mockImplementation((sessionId: string) => {
      if (sessionId === "s1") {
        return [
          { id: "l1", sessionId: "s1", lapNumber: 1, time: 75.123, createdAt: 0, updatedAt: 0 },
          { id: "l2", sessionId: "s1", lapNumber: 2, time: 74.987, createdAt: 0, updatedAt: 0 },
        ];
      }
      return [];
    });

    const circuits = rootValue.circuits({}, baseContext as never);
    expect(circuits).toHaveLength(2);

    expect(await circuits[0]?.personalBest()).toBeCloseTo(74.987, 3);
    expect(await circuits[1]?.personalBest()).toBeNull();
  });

  it("createCircuit rejects unauthenticated requests", () => {
    expect(() =>
      rootValue.createCircuit({ input: { name: "Spa" } }, baseContext as never)
    ).toThrowError("Authentication required");
  });

  it("createCircuit validates name and returns new circuit", () => {
    repositories.circuits.create.mockReturnValue({
      id: "c1",
      name: "Spa",
      heroImage: "img",
      userId: "user-1",
      createdAt: 0,
      updatedAt: 0,
    });

    const result = rootValue.createCircuit(
      { input: { name: "Spa", heroImage: "img" } },
      { ...baseContext, currentUser: { id: "user-1" } } as never
    );

    expect(repositories.circuits.create).toHaveBeenCalledWith("Spa", "user-1", "img");
    expect(result.circuit).toMatchObject({ id: "c1", name: "Spa", heroImage: "img" });
  });
});
