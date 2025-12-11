import { beforeEach, describe, expect, it, vi } from "vitest";
import { rootValue } from "../../../../src/web/graphql/schema.js";
import { createMockGraphQLContext } from "../context.mock.js";

const { context: baseContext, repositories } = createMockGraphQLContext();
const authenticatedContext = { ...baseContext, currentUser: { id: "user-1", username: "test", createdAt: 0 } };

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
      rootValue.createCircuit({ input: { name: "Spa", karts: [{ name: "Sodi" }] } }, baseContext as never)
    ).toThrowError("Authentication required");
  });

  it("createCircuit validates name and returns new circuit", async () => {
    repositories.circuits.create.mockReturnValue({
      id: "c1",
      name: "Spa",
      heroImage: "img",
      createdAt: 0,
      updatedAt: 0,
    });

    repositories.karts.create
      .mockReturnValueOnce({ id: "k1", name: "Rotax", createdAt: 0, updatedAt: 0 })
      .mockReturnValueOnce({ id: "k2", name: "Sodi", createdAt: 0, updatedAt: 0 });
    repositories.circuitKarts.addKartToCircuit.mockImplementation(() => {});
    repositories.circuitKarts.findKartsForCircuit.mockReturnValue([
      { id: "k1", name: "Rotax", createdAt: 0, updatedAt: 0 },
      { id: "k2", name: "Sodi", createdAt: 0, updatedAt: 0 },
    ]);

    const result = rootValue.createCircuit(
      {
        input: {
          name: "Spa",
          heroImage: "img",
          karts: [{ name: "Rotax" }, { name: "Sodi" }],
        },
      },
      authenticatedContext as never
    );

    expect(repositories.circuits.create).toHaveBeenCalledWith("Spa", "img");
    expect(repositories.karts.create).toHaveBeenCalledTimes(2);
    expect(repositories.circuitKarts.addKartToCircuit).toHaveBeenCalledWith("c1", "k1");
    expect(repositories.circuitKarts.addKartToCircuit).toHaveBeenCalledWith("c1", "k2");

    expect(result.circuit).toMatchObject({ id: "c1", name: "Spa", heroImage: "img" });
    expect(result.circuit.karts).toBeTypeOf("function");
    expect(await result.circuit.karts()).toHaveLength(2);
  });

  it("createCircuit requires at least one kart name", () => {
    expect(() =>
      rootValue.createCircuit(
        { input: { name: "Spa", heroImage: "img", karts: [] } },
        authenticatedContext as never
      )
    ).toThrowError("At least one kart name is required");
    expect(() =>
      rootValue.createCircuit(
        { input: { name: "Spa", heroImage: "img", karts: [{ name: "" }] } },
        authenticatedContext as never
      )
    ).toThrowError("At least one kart name is required");
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

describe("kart resolvers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test Circuit.karts field resolver
  it("Circuit.karts returns karts for a circuit", async () => {
    const mockCircuit = {
      id: "c1",
      name: "Spa",
      heroImage: null,
      createdAt: 0,
      updatedAt: 0,
    };
    const mockKarts = [
      { id: "k1", name: "Kart 1", createdAt: 0, updatedAt: 0 },
      { id: "k2", name: "Kart 2", createdAt: 0, updatedAt: 0 },
    ];
    repositories.circuits.findById.mockReturnValue(mockCircuit);
    repositories.circuitKarts.findKartsForCircuit.mockReturnValue(mockKarts);

    const circuit = rootValue.circuit({ id: "c1" }, baseContext);
    const karts = await circuit.karts();

    expect(repositories.circuitKarts.findKartsForCircuit).toHaveBeenCalledWith("c1");
    expect(karts).toEqual(mockKarts);
  });

  // Test createKart mutation
  it("createKart rejects unauthenticated requests", () => {
    expect(() =>
      rootValue.createKart({ input: { name: "New Kart" } }, baseContext as never)
    ).toThrowError("Authentication required");
  });

  it("createKart validates name and returns new kart", () => {
    repositories.karts.create.mockReturnValue({
      id: "k1",
      name: "New Kart",
      createdAt: 0,
      updatedAt: 0,
    });

    const result = rootValue.createKart(
      { input: { name: "New Kart" } },
      authenticatedContext as never
    );

    expect(repositories.karts.create).toHaveBeenCalledWith("New Kart");
    expect(result.kart).toMatchObject({ id: "k1", name: "New Kart" });
  });

  it("createKart validates missing name", () => {
    expect(() =>
      rootValue.createKart({ input: {} }, authenticatedContext as never)
    ).toThrowError("Kart name is required");
  });

  // Test updateKart mutation
  it("updateKart rejects unauthenticated requests", () => {
    expect(() =>
      rootValue.updateKart({ input: { id: "k1", name: "Updated Kart" } }, baseContext as never)
    ).toThrowError("Authentication required");
  });

  it("updateKart validates missing id or name", () => {
    expect(() =>
      rootValue.updateKart({ input: { name: "Updated Kart" } }, authenticatedContext as never)
    ).toThrowError("Kart ID and name are required");
    expect(() =>
      rootValue.updateKart({ input: { id: "k1" } }, authenticatedContext as never)
    ).toThrowError("Kart ID and name are required");
  });

  it("updateKart returns GraphQLError if kart not found", () => {
    repositories.karts.update.mockReturnValue(null);

    expect(() =>
      rootValue.updateKart({ input: { id: "k99", name: "Non Existent" } }, authenticatedContext as never)
    ).toThrowError("Kart not found");
  });

  it("updateKart updates kart and returns payload", () => {
    const updatedKart = { id: "k1", name: "Updated Kart", createdAt: 0, updatedAt: 100 };
    repositories.karts.update.mockReturnValue(updatedKart);

    const result = rootValue.updateKart(
      { input: { id: "k1", name: "Updated Kart" } },
      authenticatedContext as never
    );

    expect(repositories.karts.update).toHaveBeenCalledWith("k1", "Updated Kart");
    expect(result.kart).toEqual(updatedKart);
  });

  // Test deleteKart mutation
  it("deleteKart rejects unauthenticated requests", () => {
    expect(() =>
      rootValue.deleteKart({ id: "k1" }, baseContext as never)
    ).toThrowError("Authentication required");
  });

  it("deleteKart validates missing id", () => {
    expect(() =>
      rootValue.deleteKart({}, authenticatedContext as never)
    ).toThrowError("Kart ID is required");
  });

  it("deleteKart deletes kart and returns success", () => {
    repositories.karts.delete.mockReturnValue(true);

    const result = rootValue.deleteKart({ id: "k1" }, authenticatedContext as never);

    expect(repositories.karts.delete).toHaveBeenCalledWith("k1");
    expect(result.success).toBe(true);
  });

  // Test addKartToCircuit mutation
  it("addKartToCircuit rejects unauthenticated requests", () => {
    expect(() =>
      rootValue.addKartToCircuit({ circuitId: "c1", kartId: "k1" }, baseContext as never)
    ).toThrowError("Authentication required");
  });

  it("addKartToCircuit validates missing circuitId or kartId", () => {
    expect(() =>
      rootValue.addKartToCircuit({ kartId: "k1" }, authenticatedContext as never)
    ).toThrowError("Circuit ID and Kart ID are required");
    expect(() =>
      rootValue.addKartToCircuit({ circuitId: "c1" }, authenticatedContext as never)
    ).toThrowError("Circuit ID and Kart ID are required");
  });

  it("addKartToCircuit returns GraphQLError if circuit not found", () => {
    repositories.circuits.findById.mockReturnValue(null);

    expect(() =>
      rootValue.addKartToCircuit({ circuitId: "c99", kartId: "k1" }, authenticatedContext as never)
    ).toThrowError("Circuit not found");
  });

  it("addKartToCircuit returns GraphQLError if kart not found", () => {
    repositories.circuits.findById.mockReturnValue({ id: "c1", name: "Spa", heroImage: null, createdAt: 0, updatedAt: 0 });
    repositories.karts.findById.mockReturnValue(null);

    expect(() =>
      rootValue.addKartToCircuit({ circuitId: "c1", kartId: "k99" }, authenticatedContext as never)
    ).toThrowError("Kart not found");
  });

  it("addKartToCircuit adds kart to circuit and returns payload", async () => {
    const mockCircuit = { id: "c1", name: "Spa", heroImage: null, createdAt: 0, updatedAt: 0 };
    const mockKart = { id: "k1", name: "Kart 1", createdAt: 0, updatedAt: 0 };
    repositories.circuits.findById.mockReturnValue(mockCircuit);
    repositories.karts.findById.mockReturnValue(mockKart);
    repositories.circuitKarts.addKartToCircuit.mockImplementation(() => {});
    repositories.circuitKarts.findKartsForCircuit.mockReturnValueOnce([mockKart]); // for the circuit payload resolver

    const result = await rootValue.addKartToCircuit(
      { circuitId: "c1", kartId: "k1" },
      authenticatedContext as never
    );

    expect(repositories.circuitKarts.addKartToCircuit).toHaveBeenCalledWith("c1", "k1");
    expect(result.circuit).toMatchObject({ id: "c1" });
    expect(result.kart).toMatchObject({ id: "k1" });
  });

  // Test removeKartFromCircuit mutation
  it("removeKartFromCircuit rejects unauthenticated requests", () => {
    expect(() =>
      rootValue.removeKartFromCircuit({ circuitId: "c1", kartId: "k1" }, baseContext as never)
    ).toThrowError("Authentication required");
  });

  it("removeKartFromCircuit validates missing circuitId or kartId", () => {
    expect(() =>
      rootValue.removeKartFromCircuit({ kartId: "k1" }, authenticatedContext as never)
    ).toThrowError("Circuit ID and Kart ID are required");
    expect(() =>
      rootValue.removeKartFromCircuit({ circuitId: "c1" }, authenticatedContext as never)
    ).toThrowError("Circuit ID and Kart ID are required");
  });

  it("removeKartFromCircuit returns GraphQLError if circuit not found", () => {
    repositories.circuits.findById.mockReturnValue(null);

    expect(() =>
      rootValue.removeKartFromCircuit({ circuitId: "c99", kartId: "k1" }, authenticatedContext as never)
    ).toThrowError("Circuit not found");
  });

  it("removeKartFromCircuit returns GraphQLError if kart not found", () => {
    repositories.circuits.findById.mockReturnValue({ id: "c1", name: "Spa", heroImage: null, createdAt: 0, updatedAt: 0 });
    repositories.karts.findById.mockReturnValue(null);

    expect(() =>
      rootValue.removeKartFromCircuit({ circuitId: "c1", kartId: "k99" }, authenticatedContext as never)
    ).toThrowError("Kart not found");
  });

  it("removeKartFromCircuit removes kart from circuit and returns payload", async () => {
    const mockCircuit = { id: "c1", name: "Spa", heroImage: null, createdAt: 0, updatedAt: 0 };
    const mockKart = { id: "k1", name: "Kart 1", createdAt: 0, updatedAt: 0 };
    repositories.circuits.findById.mockReturnValue(mockCircuit);
    repositories.karts.findById.mockReturnValue(mockKart);
    repositories.circuitKarts.removeKartFromCircuit.mockImplementation(() => {});
    repositories.circuitKarts.findKartsForCircuit.mockReturnValueOnce([]); // for the circuit payload resolver

    const result = await rootValue.removeKartFromCircuit(
      { circuitId: "c1", kartId: "k1" },
      authenticatedContext as never
    );

    expect(repositories.circuitKarts.removeKartFromCircuit).toHaveBeenCalledWith("c1", "k1");
    expect(result.circuit).toMatchObject({ id: "c1" });
    expect(result.kart).toMatchObject({ id: "k1" });
  });
});
