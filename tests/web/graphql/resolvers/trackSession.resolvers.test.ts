import { describe, expect, it, vi, beforeEach } from "vitest";
import { createMockGraphQLContext } from "../context.mock.js";
import { rootValue } from "../../../../src/web/graphql/schema.js";

const { context, repositories } = createMockGraphQLContext({
  currentUser: { id: "user-1", username: "sam", createdAt: Date.now() },
  sessionToken: "token",
});

const mockSession = {
  id: "s1",
  date: "2024-02-01",
  format: "Race",
  conditions: "Dry" as const,
  circuitId: "c1",
  userId: "user-1",
  notes: null,
  createdAt: 0,
  updatedAt: 0,
};

const mockCircuit = {
  id: "c1",
  name: "Spa",
  heroImage: null,
  createdAt: 0,
  updatedAt: 0,
};

describe("trackSession resolvers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
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

  it("returns session payload with laps and circuit on happy path", async () => {
    repositories.trackSessions.findById.mockReturnValue(mockSession);
    repositories.circuits.findById.mockReturnValue(mockCircuit);
    repositories.laps.findBySessionId.mockReturnValue([
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

  it("createTrackSession rejects when circuit is missing", async () => {
    repositories.circuits.findById.mockReturnValueOnce(null);
    expect(() =>
      rootValue.createTrackSession(
        { input: { date: "2024-02-01", format: "Race", circuitId: "missing" } },
        context
      )
    ).toThrowError("Circuit with ID missing not found");
  });

  it("createTrackSession forwards parsed input", async () => {
    repositories.trackSessions.createWithLaps.mockReturnValue({ trackSession: mockSession, laps: [] });
    repositories.circuits.findById.mockReturnValue(mockCircuit);

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

    expect(repositories.trackSessions.createWithLaps).toHaveBeenCalledWith({
      date: "2024-02-01",
      format: "Race",
      circuitId: "c1",
      userId: "user-1",
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
    repositories.trackSessions.findById.mockReturnValue(mockSession);
    repositories.trackSessions.update.mockReturnValue({ ...mockSession, format: "Practice" });
    repositories.lapEvents.findByLapId.mockReturnValue([]);
    repositories.trackRecordings.findBySessionId.mockReturnValue([]);

    const result = rootValue.updateTrackSession(
      { input: { id: "s1", format: "Practice" } },
      context
    );

    expect(repositories.trackSessions.update).toHaveBeenCalledWith(
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
