import { beforeEach, describe, expect, it, vi } from "vitest";
import { rootValue } from "../../../../src/web/graphql/schema.js";
import { createMockGraphQLContext } from "../context.mock.js";

const { context: baseContext, repositories } = createMockGraphQLContext();

describe("circuit resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the fastest lap per circuit and per conditions or null when no laps", async () => {
    repositories.circuits.findAll.mockReturnValue([
      {
        id: "c1",
        name: "Spa",
        heroImage: null,
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "c2",
        name: "Monza",
        heroImage: null,
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
            classification: 2,
            conditions: "Dry",
            circuitId: "c1",
            userId: "user-1",
            notes: null,
            createdAt: 0,
            updatedAt: 0,
            kartId: null,
          },
          {
            id: "s2",
            date: "2024-02-01",
            format: "Practice",
            classification: 5,
            conditions: "Wet",
            circuitId: "c1",
            userId: "user-2",
            notes: null,
            createdAt: 0,
            updatedAt: 0,
            kartId: null,
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
      if (sessionId === "s2") {
        return [
          { id: "l3", sessionId: "s2", lapNumber: 1, time: 82.123, createdAt: 0, updatedAt: 0 },
          { id: "l4", sessionId: "s2", lapNumber: 2, time: 79.5, createdAt: 0, updatedAt: 0 },
        ];
      }
      return [];
    });

    const circuits = rootValue.circuits({}, baseContext as never);
    expect(circuits).toHaveLength(2);

    expect(await circuits[0]?.personalBest()).toBeCloseTo(74.987, 3);
    expect(await circuits[0]?.personalBestDry()).toBeCloseTo(74.987, 3);
    expect(await circuits[0]?.personalBestWet()).toBeCloseTo(79.5, 3);
    expect(await circuits[1]?.personalBest()).toBeNull();
    expect(await circuits[1]?.personalBestDry()).toBeNull();
    expect(await circuits[1]?.personalBestWet()).toBeNull();
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
      createdAt: 0,
      updatedAt: 0,
    });

    const result = rootValue.createCircuit(
      { input: { name: "Spa", heroImage: "img" } },
      { ...baseContext, currentUser: { id: "user-1" } } as never
    );

    expect(repositories.circuits.create).toHaveBeenCalledWith("Spa", "img");
    expect(result.circuit).toMatchObject({ id: "c1", name: "Spa", heroImage: "img" });
  });
});

describe("circuit resolver by id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a circuit by ID", async () => {
    repositories.circuits.findById.mockReturnValue({
      id: "c1",
      name: "Spa",
      heroImage: "spa.jpg",
      createdAt: 0,
      updatedAt: 0,
    });

    const circuit = rootValue.circuit({ id: "c1" }, baseContext);

    expect(circuit).toMatchObject({
      id: "c1",
      name: "Spa",
      heroImage: "spa.jpg",
    });
  });

  it("returns a GraphQLError if circuit is not found", () => {
    repositories.circuits.findById.mockReturnValue(null);

    expect(() =>
      rootValue.circuit({ id: "non-existent" }, baseContext),
    ).toThrowError("Circuit not found");
  });

  it("returns a GraphQLError if circuit ID is not provided", () => {
    expect(() => rootValue.circuit({}, baseContext)).toThrowError(
      "Circuit ID is required",
    );
  });
});
