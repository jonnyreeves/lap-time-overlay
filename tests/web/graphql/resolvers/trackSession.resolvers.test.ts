import { describe, expect, it, vi, beforeEach } from "vitest";
import { rootValue } from "../../../../src/web/graphql/schema.js";

const findTrackSessionById = vi.hoisted(() => vi.fn());
const findTrackSessionsByCircuitId = vi.hoisted(() => vi.fn());
const updateTrackSession = vi.hoisted(() => vi.fn());
const createTrackSessionWithLaps = vi.hoisted(() => vi.fn());

const findCircuitById = vi.hoisted(() => vi.fn());
const findLapEventsByLapId = vi.hoisted(() => vi.fn());
const findTrackRecordingsBySessionId = vi.hoisted(() => vi.fn());
const findLapsBySessionId = vi.hoisted(() => vi.fn());

vi.mock("../../../../src/db/track_sessions.js", () => ({
  findTrackSessionById,
  findTrackSessionsByCircuitId,
  updateTrackSession,
  createTrackSessionWithLaps,
}));

vi.mock("../../../../src/db/circuits.js", () => ({
  findCircuitById,
  findAllCircuits: vi.fn(),
  findCircuitsByUserId: vi.fn(),
  createCircuit: vi.fn(),
}));

vi.mock("../../../../src/db/laps.js", () => ({
  findLapById: vi.fn(),
  findLapsBySessionId,
}));

vi.mock("../../../../src/db/lap_events.js", () => ({
  findLapEventsByLapId,
}));

vi.mock("../../../../src/db/track_recordings.js", () => ({
  findTrackRecordingsBySessionId,
}));

const context = {
  currentUser: { id: "user-1", username: "sam", createdAt: Date.now() },
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
  sessionToken: "token",
};

const mockSession = {
  id: "s1",
  date: "2024-02-01",
  format: "Race",
  conditions: "Dry" as const,
  circuitId: "c1",
  notes: null,
  createdAt: 0,
  updatedAt: 0,
};

const mockCircuit = {
  id: "c1",
  name: "Spa",
  heroImage: null,
  userId: "user-1",
  createdAt: 0,
  updatedAt: 0,
};

describe("trackSession resolvers", () => {
  beforeEach(() => {
    findTrackSessionById.mockReset();
    findTrackSessionsByCircuitId.mockReset();
    updateTrackSession.mockReset();
    createTrackSessionWithLaps.mockReset();
    findCircuitById.mockReset();
    findLapsBySessionId.mockReset();
    findLapEventsByLapId.mockReset();
    findTrackRecordingsBySessionId.mockReset();
  });

  it("rejects unauthenticated trackSession query", async () => {
    await expect(() => rootValue.trackSession({ id: "s1" }, { ...context, currentUser: null }))
      .toThrowError("Authentication required");
  });

  it("rejects trackSession query when circuit not owned by user", async () => {
    findTrackSessionById.mockReturnValue(mockSession);
    findCircuitById.mockReturnValue({ ...mockCircuit, userId: "other" });

    expect(() => rootValue.trackSession({ id: "s1" }, context)).toThrowError(
      "You do not have access to this session"
    );
  });

  it("returns session payload with laps and circuit on happy path", async () => {
    findTrackSessionById.mockReturnValue(mockSession);
    findCircuitById.mockReturnValue(mockCircuit);
    findLapsBySessionId.mockReturnValue([
      { id: "l1", sessionId: "s1", lapNumber: 1, time: 75.123, createdAt: 0, updatedAt: 0 },
    ]);

    const payload = rootValue.trackSession({ id: "s1" }, context);
    expect(payload.id).toBe("s1");
    expect(await payload.circuit()).toMatchObject({ id: "c1", name: "Spa" });
    expect((await payload.laps({ first: 10 })).length).toBe(1);
  });

  it("createTrackSession validates required fields", async () => {
    expect(() => rootValue.createTrackSession({ input: {} }, context)).toThrowError(
      "Date, format, and circuitId are required"
    );
  });

  it("createTrackSession forwards parsed input", async () => {
    createTrackSessionWithLaps.mockReturnValue({ trackSession: mockSession, laps: [] });
    findCircuitById.mockReturnValue(mockCircuit);

    const result = rootValue.createTrackSession(
      {
        input: {
          date: "2024-02-01",
          format: "Race",
          circuitId: "c1",
          conditions: "Wet",
          notes: "fun",
          laps: [{ lapNumber: 1, time: 74.5 }],
        },
      },
      context
    );

    expect(createTrackSessionWithLaps).toHaveBeenCalledWith({
      date: "2024-02-01",
      format: "Race",
      circuitId: "c1",
      conditions: "Wet",
      notes: "fun",
      laps: [{ lapNumber: 1, time: 74.5 }],
    });
    expect(result.trackSession.id).toBe("s1");
  });

  it("updateTrackSession validates presence of id and auth", async () => {
    expect(() => rootValue.updateTrackSession({ input: {} }, context)).toThrowError("id is required");
    expect(() =>
      rootValue.updateTrackSession({ input: { id: "s1" } }, { ...context, currentUser: null })
    ).toThrowError("Authentication required");
  });

  it("updateTrackSession forwards fields to DB and returns payload", async () => {
    findTrackSessionById.mockReturnValue(mockSession);
    updateTrackSession.mockReturnValue({ ...mockSession, format: "Practice" });
    findCircuitById.mockReturnValue(mockCircuit);
    findLapEventsByLapId.mockReturnValue([]);
    findTrackRecordingsBySessionId.mockReturnValue([]);

    const result = rootValue.updateTrackSession(
      { input: { id: "s1", format: "Practice" } },
      context
    );

    expect(updateTrackSession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "s1",
        date: undefined,
        format: "Practice",
        circuitId: "c1",
        conditions: undefined,
        notes: undefined,
      })
    );
    expect(result.trackSession.format).toBe("Practice");
  });
});
