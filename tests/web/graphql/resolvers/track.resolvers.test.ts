import { beforeEach, describe, expect, it, vi } from "vitest";
import { rootValue } from "../../../../src/web/graphql/schema.js";
import { createMockGraphQLContext } from "../context.mock.js";

const { context: baseContext, repositories } = createMockGraphQLContext();
const authenticatedContext = { ...baseContext, currentUser: { id: "user-1", username: "test", createdAt: 0 } };

describe("track resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns personal bests per kart, layout, and conditions for the current user", async () => {
    repositories.tracks.findAll.mockReturnValue([
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

    repositories.trackSessions.findByUserId.mockReturnValue([
      {
        id: "s1",
        date: "2024-01-01",
        format: "Race",
        classification: 2,
        conditions: "Dry",
        trackId: "c1",
        userId: "user-1",
        notes: null,
        createdAt: 0,
        updatedAt: 0,
        kartId: "k1",
        trackLayoutId: "l1",
      },
      {
        id: "s2",
        date: "2024-02-01",
        format: "Practice",
        classification: 5,
        conditions: "Wet",
        trackId: "c1",
        userId: "user-1",
        notes: null,
        createdAt: 0,
        updatedAt: 0,
        kartId: "k1",
        trackLayoutId: "l1",
      },
      {
        id: "s3",
        date: "2024-02-10",
        format: "Practice",
        classification: 3,
        conditions: "Dry",
        trackId: "c1",
        userId: "user-1",
        notes: null,
        createdAt: 0,
        updatedAt: 0,
        kartId: "k1",
        trackLayoutId: "l1",
      },
      {
        id: "s4",
        date: "2024-03-01",
        format: "Practice",
        classification: 4,
        conditions: "Dry",
        trackId: "c1",
        userId: "user-1",
        notes: null,
        createdAt: 0,
        updatedAt: 0,
        kartId: "k2",
        trackLayoutId: "l2",
      },
      {
        id: "s6",
        date: "2024-03-10",
        format: "Practice",
        classification: 3,
        conditions: "Dry",
        trackId: "c1",
        userId: "user-1",
        notes: null,
        createdAt: 0,
        updatedAt: 0,
        kartId: "k1",
        trackLayoutId: "l1",
      },
      {
        id: "s7",
        date: "2024-03-15",
        format: "Practice",
        classification: 3,
        conditions: "Dry",
        trackId: "c1",
        userId: "user-1",
        notes: null,
        createdAt: 0,
        updatedAt: 0,
        kartId: "k1",
        trackLayoutId: "l1",
      },
      {
        id: "s5",
        date: "2024-04-01",
        format: "Practice",
        classification: 2,
        conditions: "Dry",
        trackId: "c2",
        userId: "user-1",
        notes: null,
        createdAt: 0,
        updatedAt: 0,
        kartId: "k1",
        trackLayoutId: "l3",
      },
    ]);

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
      if (sessionId === "s3") {
        return [
          { id: "l5", sessionId: "s3", lapNumber: 1, time: 73.2, createdAt: 0, updatedAt: 0 },
          { id: "l6", sessionId: "s3", lapNumber: 2, time: 72.5, createdAt: 0, updatedAt: 0 },
        ];
      }
      if (sessionId === "s4") {
        return [
          { id: "l7", sessionId: "s4", lapNumber: 1, time: 70.1, createdAt: 0, updatedAt: 0 },
        ];
      }
      if (sessionId === "s6") {
        return [
          { id: "l9", sessionId: "s6", lapNumber: 1, time: 71.9, createdAt: 0, updatedAt: 0 },
          { id: "l10", sessionId: "s6", lapNumber: 2, time: 72.2, createdAt: 0, updatedAt: 0 },
        ];
      }
      if (sessionId === "s7") {
        return [
          { id: "l11", sessionId: "s7", lapNumber: 1, time: 75.5, createdAt: 0, updatedAt: 0 },
        ];
      }
      if (sessionId === "s5") {
        return [
          { id: "l8", sessionId: "s5", lapNumber: 1, time: 69.5, createdAt: 0, updatedAt: 0 },
        ];
      }
      return [];
    });

    repositories.karts.findById.mockImplementation((kartId: string) => {
      if (kartId === "k1") {
        return { id: "k1", name: "Rotax", createdAt: 0, updatedAt: 0 };
      }
      if (kartId === "k2") {
        return { id: "k2", name: "Sodi", createdAt: 0, updatedAt: 0 };
      }
      return null;
    });

    repositories.trackLayouts.findById.mockImplementation((layoutId: string) => {
      if (layoutId === "l1") {
        return { id: "l1", trackId: "c1", name: "GP", createdAt: 0, updatedAt: 0 };
      }
      if (layoutId === "l2") {
        return { id: "l2", trackId: "c1", name: "Indy", createdAt: 0, updatedAt: 0 };
      }
      if (layoutId === "l3") {
        return { id: "l3", trackId: "c2", name: "Full", createdAt: 0, updatedAt: 0 };
      }
      return null;
    });

    const tracks = rootValue.tracks({}, authenticatedContext as never);
    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toMatchObject({
      id: "c1",
      timesRaced: 6,
      lastVisit: new Date("2024-03-15").toISOString(),
    });
    expect(tracks[1]).toMatchObject({
      id: "c2",
      timesRaced: 1,
      lastVisit: new Date("2024-04-01").toISOString(),
    });

    const spaStats = await tracks[0]?.sessionStats();
    expect(spaStats).toEqual({
      totalSessions: 6,
      byKart: [
        { kart: expect.objectContaining({ id: "k1", name: "Rotax" }), count: 5 },
        { kart: expect.objectContaining({ id: "k2", name: "Sodi" }), count: 1 },
      ],
      byTrackLayout: [
        { trackLayout: expect.objectContaining({ id: "l1", name: "GP" }), count: 5 },
        { trackLayout: expect.objectContaining({ id: "l2", name: "Indy" }), count: 1 },
      ],
      byCondition: [
        { conditions: "Dry", count: 5 },
        { conditions: "Wet", count: 1 },
      ],
    });

    const spaBests = await tracks[0]?.personalBestEntries();
    expect(spaBests).toEqual([
      expect.objectContaining({
        conditions: "Dry",
        lapTime: 71.9,
        trackSessionId: "s6",
        kart: expect.objectContaining({ id: "k1", name: "Rotax" }),
        trackLayout: expect.objectContaining({ id: "l1", name: "GP" }),
      }),
      expect.objectContaining({
        conditions: "Dry",
        lapTime: 72.5,
        trackSessionId: "s3",
        kart: expect.objectContaining({ id: "k1", name: "Rotax" }),
        trackLayout: expect.objectContaining({ id: "l1", name: "GP" }),
      }),
      expect.objectContaining({
        conditions: "Dry",
        lapTime: 74.987,
        trackSessionId: "s1",
        kart: expect.objectContaining({ id: "k1", name: "Rotax" }),
        trackLayout: expect.objectContaining({ id: "l1", name: "GP" }),
      }),
      expect.objectContaining({
        conditions: "Wet",
        lapTime: 79.5,
        trackSessionId: "s2",
        kart: expect.objectContaining({ id: "k1", name: "Rotax" }),
        trackLayout: expect.objectContaining({ id: "l1", name: "GP" }),
      }),
      expect.objectContaining({
        conditions: "Dry",
        lapTime: 70.1,
        trackSessionId: "s4",
        kart: expect.objectContaining({ id: "k2", name: "Sodi" }),
        trackLayout: expect.objectContaining({ id: "l2", name: "Indy" }),
      }),
    ]);

    const monzaBests = await tracks[1]?.personalBestEntries();
    expect(monzaBests).toEqual([
      expect.objectContaining({
        conditions: "Dry",
        lapTime: 69.5,
        trackSessionId: "s5",
        kart: expect.objectContaining({ id: "k1", name: "Rotax" }),
        trackLayout: expect.objectContaining({ id: "l3", name: "Full" }),
      }),
    ]);
  });

  it("returns an empty list when no lap data exists", async () => {
    repositories.tracks.findAll.mockReturnValue([
      { id: "c1", name: "Spa", heroImage: null, createdAt: 0, updatedAt: 0 },
    ]);

    repositories.trackSessions.findByTrackId.mockReturnValue([]);

    const tracks = rootValue.tracks({}, baseContext as never);
    expect(tracks[0]).toMatchObject({ timesRaced: 0, lastVisit: null });
    expect(await tracks[0]?.personalBestEntries()).toEqual([]);
  });

  it("createTrack rejects unauthenticated requests", () => {
    expect(() =>
      rootValue.createTrack(
        { input: { name: "Spa", karts: [{ name: "Sodi" }], trackLayouts: [{ name: "GP" }] } },
        baseContext as never
      )
    ).toThrowError("Authentication required");
  });

  it("createTrack validates name and returns new track", async () => {
    repositories.tracks.create.mockReturnValue({
      id: "c1",
      name: "Spa",
      heroImage: "img",
      createdAt: 0,
      updatedAt: 0,
    });

    repositories.karts.create
      .mockReturnValueOnce({ id: "k1", name: "Rotax", createdAt: 0, updatedAt: 0 })
      .mockReturnValueOnce({ id: "k2", name: "Sodi", createdAt: 0, updatedAt: 0 });
    repositories.trackKarts.addKartToTrack.mockImplementation(() => {});
    repositories.trackKarts.findKartsForTrack.mockReturnValue([
      { id: "k1", name: "Rotax", createdAt: 0, updatedAt: 0 },
      { id: "k2", name: "Sodi", createdAt: 0, updatedAt: 0 },
    ]);
    repositories.trackLayouts.create
      .mockReturnValueOnce({ id: "l1", trackId: "c1", name: "GP", createdAt: 0, updatedAt: 0 })
      .mockReturnValueOnce({ id: "l2", trackId: "c1", name: "Indy", createdAt: 0, updatedAt: 0 });
    repositories.trackLayouts.findByTrackId.mockReturnValue([
      { id: "l1", trackId: "c1", name: "GP", createdAt: 0, updatedAt: 0 },
      { id: "l2", trackId: "c1", name: "Indy", createdAt: 0, updatedAt: 0 },
    ]);

    const result = rootValue.createTrack(
      {
        input: {
          name: "Spa",
          heroImage: "img",
          karts: [{ name: "Rotax" }, { name: "Sodi" }],
          trackLayouts: [{ name: "GP" }, { name: "Indy" }],
        },
      },
      authenticatedContext as never
    );

    expect(repositories.tracks.create).toHaveBeenCalledWith("Spa", "img");
    expect(repositories.karts.create).toHaveBeenCalledTimes(2);
    expect(repositories.trackKarts.addKartToTrack).toHaveBeenCalledWith("c1", "k1");
    expect(repositories.trackKarts.addKartToTrack).toHaveBeenCalledWith("c1", "k2");
    expect(repositories.trackLayouts.create).toHaveBeenCalledTimes(2);

    expect(result.track).toMatchObject({ id: "c1", name: "Spa", heroImage: "img" });
    expect(result.track.karts).toBeTypeOf("function");
    expect(await result.track.karts()).toHaveLength(2);
    expect(await result.track.trackLayouts()).toHaveLength(2);
  });

  it("createTrack requires at least one kart name", () => {
    expect(() =>
      rootValue.createTrack(
        { input: { name: "Spa", heroImage: "img", karts: [] } },
        authenticatedContext as never
      )
    ).toThrowError("At least one kart name is required");
    expect(() =>
      rootValue.createTrack(
        { input: { name: "Spa", heroImage: "img", karts: [{ name: "" }] } },
        authenticatedContext as never
      )
    ).toThrowError("At least one kart name is required");
  });

  it("createTrack requires at least one track layout name", () => {
    expect(() =>
      rootValue.createTrack(
        { input: { name: "Spa", heroImage: "img", karts: [{ name: "Sodi" }], trackLayouts: [] } },
        authenticatedContext as never
      )
    ).toThrowError("At least one track layout name is required");
    expect(() =>
      rootValue.createTrack(
        {
          input: {
            name: "Spa",
            heroImage: "img",
            karts: [{ name: "Sodi" }],
            trackLayouts: [{ name: "" }],
          },
        },
        authenticatedContext as never
      )
    ).toThrowError("At least one track layout name is required");
  });
});

describe("track resolver by id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a track by ID", async () => {
    repositories.tracks.findById.mockReturnValue({
      id: "c1",
      name: "Spa",
      heroImage: "spa.jpg",
      createdAt: 0,
      updatedAt: 0,
    });

    const track = rootValue.track({ id: "c1" }, baseContext);

    expect(track).toMatchObject({
      id: "c1",
      name: "Spa",
      heroImage: "spa.jpg",
    });
  });

  it("returns a GraphQLError if track is not found", () => {
    repositories.tracks.findById.mockReturnValue(null);

    expect(() =>
      rootValue.track({ id: "non-existent" }, baseContext),
    ).toThrowError("Track not found");
  });

  it("returns a GraphQLError if track ID is not provided", () => {
    expect(() => rootValue.track({}, baseContext)).toThrowError(
      "Track ID is required",
    );
  });
});

describe("kart resolvers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test Track.karts field resolver
  it("Track.karts returns karts for a track", async () => {
    const mockTrack = {
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
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.trackKarts.findKartsForTrack.mockReturnValue(mockKarts);

    const track = rootValue.track({ id: "c1" }, baseContext);
    const karts = await track.karts();

    expect(repositories.trackKarts.findKartsForTrack).toHaveBeenCalledWith("c1");
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

  // Test addKartToTrack mutation
  it("addKartToTrack rejects unauthenticated requests", () => {
    expect(() =>
      rootValue.addKartToTrack({ trackId: "c1", kartId: "k1" }, baseContext as never)
    ).toThrowError("Authentication required");
  });

  it("addKartToTrack validates missing trackId or kartId", () => {
    expect(() =>
      rootValue.addKartToTrack({ kartId: "k1" }, authenticatedContext as never)
    ).toThrowError("Track ID and Kart ID are required");
    expect(() =>
      rootValue.addKartToTrack({ trackId: "c1" }, authenticatedContext as never)
    ).toThrowError("Track ID and Kart ID are required");
  });

  it("addKartToTrack returns GraphQLError if track not found", () => {
    repositories.tracks.findById.mockReturnValue(null);

    expect(() =>
      rootValue.addKartToTrack({ trackId: "c99", kartId: "k1" }, authenticatedContext as never)
    ).toThrowError("Track not found");
  });

  it("addKartToTrack returns GraphQLError if kart not found", () => {
    repositories.tracks.findById.mockReturnValue({ id: "c1", name: "Spa", heroImage: null, createdAt: 0, updatedAt: 0 });
    repositories.karts.findById.mockReturnValue(null);

    expect(() =>
      rootValue.addKartToTrack({ trackId: "c1", kartId: "k99" }, authenticatedContext as never)
    ).toThrowError("Kart not found");
  });

  it("addKartToTrack adds kart to track and returns payload", async () => {
    const mockTrack = { id: "c1", name: "Spa", heroImage: null, createdAt: 0, updatedAt: 0 };
    const mockKart = { id: "k1", name: "Kart 1", createdAt: 0, updatedAt: 0 };
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.karts.findById.mockReturnValue(mockKart);
    repositories.trackKarts.addKartToTrack.mockImplementation(() => {});
    repositories.trackKarts.findKartsForTrack.mockReturnValueOnce([mockKart]); // for the track payload resolver

    const result = await rootValue.addKartToTrack(
      { trackId: "c1", kartId: "k1" },
      authenticatedContext as never
    );

    expect(repositories.trackKarts.addKartToTrack).toHaveBeenCalledWith("c1", "k1");
    expect(result.track).toMatchObject({ id: "c1" });
    expect(result.kart).toMatchObject({ id: "k1" });
  });

  // Test removeKartFromTrack mutation
  it("removeKartFromTrack rejects unauthenticated requests", () => {
    expect(() =>
      rootValue.removeKartFromTrack({ trackId: "c1", kartId: "k1" }, baseContext as never)
    ).toThrowError("Authentication required");
  });

  it("removeKartFromTrack validates missing trackId or kartId", () => {
    expect(() =>
      rootValue.removeKartFromTrack({ kartId: "k1" }, authenticatedContext as never)
    ).toThrowError("Track ID and Kart ID are required");
    expect(() =>
      rootValue.removeKartFromTrack({ trackId: "c1" }, authenticatedContext as never)
    ).toThrowError("Track ID and Kart ID are required");
  });

  it("removeKartFromTrack returns GraphQLError if track not found", () => {
    repositories.tracks.findById.mockReturnValue(null);

    expect(() =>
      rootValue.removeKartFromTrack({ trackId: "c99", kartId: "k1" }, authenticatedContext as never)
    ).toThrowError("Track not found");
  });

  it("removeKartFromTrack returns GraphQLError if kart not found", () => {
    repositories.tracks.findById.mockReturnValue({ id: "c1", name: "Spa", heroImage: null, createdAt: 0, updatedAt: 0 });
    repositories.karts.findById.mockReturnValue(null);

    expect(() =>
      rootValue.removeKartFromTrack({ trackId: "c1", kartId: "k99" }, authenticatedContext as never)
    ).toThrowError("Kart not found");
  });

  it("removeKartFromTrack removes kart from track and returns payload", async () => {
    const mockTrack = { id: "c1", name: "Spa", heroImage: null, createdAt: 0, updatedAt: 0 };
    const mockKart = { id: "k1", name: "Kart 1", createdAt: 0, updatedAt: 0 };
    repositories.tracks.findById.mockReturnValue(mockTrack);
    repositories.karts.findById.mockReturnValue(mockKart);
    repositories.trackKarts.removeKartFromTrack.mockImplementation(() => {});
    repositories.trackKarts.findKartsForTrack.mockReturnValueOnce([]); // for the track payload resolver

    const result = await rootValue.removeKartFromTrack(
      { trackId: "c1", kartId: "k1" },
      authenticatedContext as never
    );

    expect(repositories.trackKarts.removeKartFromTrack).toHaveBeenCalledWith("c1", "k1");
    expect(result.track).toMatchObject({ id: "c1" });
    expect(result.kart).toMatchObject({ id: "k1" });
  });
});

describe("track layout resolvers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("addTrackLayoutToTrack rejects unauthenticated requests", () => {
    expect(() =>
      rootValue.addTrackLayoutToTrack({ trackId: "c1", input: { name: "Outer" } }, baseContext as never)
    ).toThrowError("Authentication required");
  });

  it("addTrackLayoutToTrack validates missing trackId or name", () => {
    expect(() =>
      rootValue.addTrackLayoutToTrack({ input: { name: "Outer" } }, authenticatedContext as never)
    ).toThrowError("Track ID and track layout name are required");
    expect(() =>
      rootValue.addTrackLayoutToTrack({ trackId: "c1", input: { name: "" } }, authenticatedContext as never)
    ).toThrowError("Track ID and track layout name are required");
  });

  it("addTrackLayoutToTrack returns GraphQLError if track not found", () => {
    repositories.tracks.findById.mockReturnValue(null);

    expect(() =>
      rootValue.addTrackLayoutToTrack({ trackId: "c99", input: { name: "Outer" } }, authenticatedContext as never)
    ).toThrowError("Track not found");
  });

  it("addTrackLayoutToTrack creates layout and returns payload", () => {
    const track = { id: "c1", name: "Spa", heroImage: null, createdAt: 0, updatedAt: 0 };
    const layout = { id: "l1", trackId: "c1", name: "Outer", createdAt: 0, updatedAt: 0 };
    repositories.tracks.findById.mockReturnValue(track);
    repositories.trackLayouts.create.mockReturnValue(layout);
    repositories.trackLayouts.findByTrackId.mockReturnValue([layout]);
    repositories.trackKarts.findKartsForTrack.mockReturnValue([]);

    const result = rootValue.addTrackLayoutToTrack(
      { trackId: "c1", input: { name: "Outer" } },
      authenticatedContext as never
    );

    expect(repositories.trackLayouts.create).toHaveBeenCalledWith("c1", "Outer");
    expect(result.trackLayout).toMatchObject({ id: "l1", name: "Outer" });
    expect(result.track).toMatchObject({ id: "c1" });
  });

  it("updateTrackLayout rejects unauthenticated requests", () => {
    expect(() =>
      rootValue.updateTrackLayout({ input: { id: "l1", name: "Outer" } }, baseContext as never)
    ).toThrowError("Authentication required");
  });

  it("updateTrackLayout validates missing id or name", () => {
    expect(() =>
      rootValue.updateTrackLayout({ input: { name: "Outer" } }, authenticatedContext as never)
    ).toThrowError("Track layout ID and name are required");
    expect(() =>
      rootValue.updateTrackLayout({ input: { id: "l1" } }, authenticatedContext as never)
    ).toThrowError("Track layout ID and name are required");
  });

  it("updateTrackLayout returns GraphQLError if layout not found", () => {
    repositories.trackLayouts.findById.mockReturnValue(null);

    expect(() =>
      rootValue.updateTrackLayout({ input: { id: "missing", name: "Outer" } }, authenticatedContext as never)
    ).toThrowError("Track layout not found");
  });

  it("updateTrackLayout updates layout and returns payload", () => {
    const layout = { id: "l1", trackId: "c1", name: "Outer", createdAt: 0, updatedAt: 0 };
    const updatedLayout = { ...layout, name: "GP" };
    repositories.trackLayouts.findById.mockReturnValue(layout);
    repositories.trackLayouts.update.mockReturnValue(updatedLayout);
    repositories.tracks.findById.mockReturnValue({
      id: "c1",
      name: "Spa",
      heroImage: null,
      createdAt: 0,
      updatedAt: 0,
    });
    repositories.trackLayouts.findByTrackId.mockReturnValue([updatedLayout]);
    repositories.trackKarts.findKartsForTrack.mockReturnValue([]);

    const result = rootValue.updateTrackLayout(
      { input: { id: "l1", name: "GP" } },
      authenticatedContext as never
    );

    expect(repositories.trackLayouts.update).toHaveBeenCalledWith("l1", "GP");
    expect(result.trackLayout).toMatchObject({ id: "l1", name: "GP" });
  });

  it("removeTrackLayoutFromTrack rejects unauthenticated requests", () => {
    expect(() =>
      rootValue.removeTrackLayoutFromTrack({ trackId: "c1", trackLayoutId: "l1" }, baseContext as never)
    ).toThrowError("Authentication required");
  });

  it("removeTrackLayoutFromTrack validates missing trackId or trackLayoutId", () => {
    expect(() =>
      rootValue.removeTrackLayoutFromTrack({ trackLayoutId: "l1" }, authenticatedContext as never)
    ).toThrowError("Track ID and track layout ID are required");
    expect(() =>
      rootValue.removeTrackLayoutFromTrack({ trackId: "c1" }, authenticatedContext as never)
    ).toThrowError("Track ID and track layout ID are required");
  });

  it("removeTrackLayoutFromTrack returns GraphQLError if track not found", () => {
    repositories.tracks.findById.mockReturnValue(null);
    repositories.trackLayouts.findById.mockReturnValue({ id: "l1", trackId: "c1", name: "Outer", createdAt: 0, updatedAt: 0 });

    expect(() =>
      rootValue.removeTrackLayoutFromTrack({ trackId: "c1", trackLayoutId: "l1" }, authenticatedContext as never)
    ).toThrowError("Track not found");
  });

  it("removeTrackLayoutFromTrack returns GraphQLError if layout not found", () => {
    repositories.tracks.findById.mockReturnValue({ id: "c1", name: "Spa", heroImage: null, createdAt: 0, updatedAt: 0 });
    repositories.trackLayouts.findById.mockReturnValue(null);

    expect(() =>
      rootValue.removeTrackLayoutFromTrack({ trackId: "c1", trackLayoutId: "l1" }, authenticatedContext as never)
    ).toThrowError("Track layout not found");
  });

  it("removeTrackLayoutFromTrack returns GraphQLError if layout belongs to another track", () => {
    repositories.tracks.findById.mockReturnValue({ id: "c1", name: "Spa", heroImage: null, createdAt: 0, updatedAt: 0 });
    repositories.trackLayouts.findById.mockReturnValue({ id: "l1", trackId: "other", name: "Outer", createdAt: 0, updatedAt: 0 });

    expect(() =>
      rootValue.removeTrackLayoutFromTrack({ trackId: "c1", trackLayoutId: "l1" }, authenticatedContext as never)
    ).toThrowError("Track layout does not belong to this track");
  });

  it("removeTrackLayoutFromTrack deletes layout and returns payload", () => {
    const track = { id: "c1", name: "Spa", heroImage: null, createdAt: 0, updatedAt: 0 };
    const layout = { id: "l1", trackId: "c1", name: "Outer", createdAt: 0, updatedAt: 0 };
    repositories.tracks.findById.mockReturnValue(track);
    repositories.trackLayouts.findById.mockReturnValue(layout);
    repositories.trackLayouts.delete.mockReturnValue(true);
    repositories.trackLayouts.findByTrackId.mockReturnValue([]);
    repositories.trackKarts.findKartsForTrack.mockReturnValue([]);

    const result = rootValue.removeTrackLayoutFromTrack(
      { trackId: "c1", trackLayoutId: "l1" },
      authenticatedContext as never
    );

    expect(repositories.trackLayouts.delete).toHaveBeenCalledWith("l1");
    expect(result.track).toMatchObject({ id: "c1" });
    expect(result.trackLayout).toMatchObject({ id: "l1" });
  });
});
