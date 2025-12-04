import { beforeEach, describe, expect, it, vi } from "vitest";
import { rootValue } from "../../../../src/web/graphql/schema.js";

const findAllCircuits = vi.hoisted(() => vi.fn());
const findTrackSessionsByCircuitId = vi.hoisted(() => vi.fn());
const findLapsBySessionId = vi.hoisted(() => vi.fn());
const createCircuit = vi.hoisted(() => vi.fn());

vi.mock("../../../../src/db/circuits.js", () => ({
  findAllCircuits,
  findCircuitById: vi.fn(),
  findCircuitsByUserId: vi.fn(),
  createCircuit,
}));

vi.mock("../../../../src/db/track_sessions.js", () => ({
  findTrackSessionById: vi.fn(),
  findTrackSessionsByCircuitId,
  createTrackSessionWithLaps: vi.fn(),
  updateTrackSession: vi.fn(),
}));

vi.mock("../../../../src/db/laps.js", () => ({
  findLapById: vi.fn(),
  findLapsBySessionId,
}));

vi.mock("../../../../src/db/lap_events.js", () => ({
  findLapEventsByLapId: vi.fn(),
}));

vi.mock("../../../../src/db/track_recordings.js", () => ({
  findTrackRecordingsBySessionId: vi.fn(),
}));

describe("circuit resolver", () => {
  beforeEach(() => {
    findAllCircuits.mockReset();
    findTrackSessionsByCircuitId.mockReset();
    findLapsBySessionId.mockReset();
    createCircuit.mockReset();
  });

  it("returns the fastest lap per circuit or null when no laps", async () => {
    findAllCircuits.mockReturnValue([
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

    findTrackSessionsByCircuitId.mockImplementation((circuitId: string) => {
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

    findLapsBySessionId.mockImplementation((sessionId: string) => {
      if (sessionId === "s1") {
        return [
          { id: "l1", sessionId: "s1", lapNumber: 1, time: 75.123, createdAt: 0, updatedAt: 0 },
          { id: "l2", sessionId: "s1", lapNumber: 2, time: 74.987, createdAt: 0, updatedAt: 0 },
        ];
      }
      return [];
    });

    const circuits = rootValue.circuits();
    expect(circuits).toHaveLength(2);

    expect(await circuits[0]?.personalBest()).toBeCloseTo(74.987, 3);
    expect(await circuits[1]?.personalBest()).toBeNull();
  });

  it("createCircuit rejects unauthenticated requests", () => {
    expect(() =>
      rootValue.createCircuit({ input: { name: "Spa" } }, { currentUser: null } as never)
    ).toThrowError("Authentication required");
  });

  it("createCircuit validates name and returns new circuit", () => {
    createCircuit.mockReturnValue({
      id: "c1",
      name: "Spa",
      heroImage: "img",
      userId: "user-1",
      createdAt: 0,
      updatedAt: 0,
    });

    const result = rootValue.createCircuit(
      { input: { name: "Spa", heroImage: "img" } },
      { currentUser: { id: "user-1" } } as never
    );

    expect(createCircuit).toHaveBeenCalledWith("Spa", "user-1", "img");
    expect(result.circuit).toMatchObject({ id: "c1", name: "Spa", heroImage: "img" });
  });
});
