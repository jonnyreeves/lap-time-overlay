import { describe, expect, it, vi, beforeEach } from "vitest";
import { createMockGraphQLContext } from "../context.mock.js";
import { rootValue } from "../../../../src/web/graphql/schema.js";

const {
  listOrphanedMedia: listOrphanedMediaMock,
  deleteOrphanedMedia: deleteOrphanedMediaMock,
  collectTempDirStats: collectTempDirStatsMock,
  emptyTempDirectory: emptyTempDirectoryMock,
  getRecordingHealthOverview: getRecordingHealthOverviewMock,
  getUserMediaLibrarySizes: getUserMediaLibrarySizesMock,
  getTempCleanupSchedule: getTempCleanupScheduleMock,
} = vi.hoisted(() => ({
  listOrphanedMedia: vi.fn(),
  deleteOrphanedMedia: vi.fn(),
  collectTempDirStats: vi.fn(),
  emptyTempDirectory: vi.fn(),
  getRecordingHealthOverview: vi.fn(),
  getUserMediaLibrarySizes: vi.fn(),
  getTempCleanupSchedule: vi.fn(),
}));

vi.mock("../../../../src/web/recordings/admin.js", () => ({
  listOrphanedMedia: listOrphanedMediaMock,
  deleteOrphanedMedia: deleteOrphanedMediaMock,
  collectTempDirStats: collectTempDirStatsMock,
  emptyTempDirectory: emptyTempDirectoryMock,
  getRecordingHealthOverview: getRecordingHealthOverviewMock,
  getUserMediaLibrarySizes: getUserMediaLibrarySizesMock,
}));
vi.mock("../../../../src/web/recordings/tempCleanup.js", () => ({
  getTempCleanupSchedule: getTempCleanupScheduleMock,
}));

const { updateCleanupScheduleMock, runCleanupNowMock } = vi.hoisted(() => ({
  updateCleanupScheduleMock: vi.fn(),
  runCleanupNowMock: vi.fn(),
}));

vi.mock("../../../../src/web/recordings/tempCleanupScheduler.js", () => ({
  tempCleanupScheduler: {
    updateSchedule: updateCleanupScheduleMock,
    runNow: runCleanupNowMock,
    start: vi.fn(),
  },
}));

const { rebuildProjectionAllMock } = vi.hoisted(() => ({
  rebuildProjectionAllMock: vi.fn(),
}));

vi.mock("../../../../src/web/recordings/jellyfinProjection.js", async () => {
  const actual = await vi.importActual<
    typeof import("../../../../src/web/recordings/jellyfinProjection.js")
  >("../../../../src/web/recordings/jellyfinProjection.js");
  return {
    ...actual,
    rebuildJellyfinProjectionAll: rebuildProjectionAllMock,
  };
});

describe("admin resolvers", () => {
  const { context } = createMockGraphQLContext({
    currentUser: { id: "user-1", username: "sam", createdAt: 0 },
    sessionToken: "token",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("guards admin queries behind authentication", async () => {
    await expect(
      rootValue.adminOrphanedMedia({}, { ...context, currentUser: null })
    ).rejects.toThrow("Authentication required");
  });

  it("returns orphaned media from the service", async () => {
    const sample = [{ mediaId: "foo", sizeBytes: 4, modifiedAt: "2024-01-01T00:00:00.000Z" }];
    listOrphanedMediaMock.mockResolvedValue(sample);
    expect(await rootValue.adminOrphanedMedia({}, context)).toBe(sample);
  });

  it("exposes temp dir stats and recording health", async () => {
    collectTempDirStatsMock.mockResolvedValue([{ name: "UPLOADS", path: "/tmp", sizeBytes: 0, fileCount: 0 }]);
    getRecordingHealthOverviewMock.mockResolvedValue([{ status: "READY", count: 1 }]);
    expect(await rootValue.adminTempDirs({}, context)).toEqual([
      { name: "UPLOADS", path: "/tmp", sizeBytes: 0, fileCount: 0 },
    ]);
    expect(await rootValue.adminRecordingHealth({}, context)).toEqual([
      { status: "READY", count: 1 },
    ]);
  });

  it("exposes user media libraries", async () => {
    getUserMediaLibrarySizesMock.mockResolvedValue([
      { userId: "u1", username: "sam", sizeBytes: 1234, recordingCount: 3 },
      { userId: "u2", username: "jane", sizeBytes: 0, recordingCount: 0 },
    ]);

    expect(await rootValue.adminUserMediaLibraries({}, context)).toEqual([
      { userId: "u1", username: "sam", sizeBytes: 1234, recordingCount: 3 },
      { userId: "u2", username: "jane", sizeBytes: 0, recordingCount: 0 },
    ]);
  });

  it("exposes temp cleanup schedule", async () => {
    getTempCleanupScheduleMock.mockResolvedValue({
      hour: 3,
      days: [1, 3, 5],
      enabled: true,
      lastRunAt: 1000,
      nextRunAt: 2000,
    });

    expect(await rootValue.adminTempCleanupSchedule({}, context)).toEqual({
      hour: 3,
      days: [1, 3, 5],
      enabled: true,
      lastRunAt: new Date(1000).toISOString(),
      nextRunAt: new Date(2000).toISOString(),
    });
  });

  it("requires mediaIds for deleteOrphanedMedia", async () => {
    await expect(
      rootValue.deleteOrphanedMedia({ input: { mediaIds: [] } }, context)
    ).rejects.toThrow("mediaIds is required");
  });

  it("deletes orphaned media and returns deleted list", async () => {
    deleteOrphanedMediaMock.mockResolvedValue(["file.mp4"]);
    expect(
      await rootValue.deleteOrphanedMedia({ input: { mediaIds: ["file.mp4"] } }, context)
    ).toEqual({ deleted: ["file.mp4"] });
    expect(deleteOrphanedMediaMock).toHaveBeenCalledWith(["file.mp4"]);
  });

  it("empties a temp directory by name", async () => {
    expect(await rootValue.emptyTempDir({ input: { name: "UPLOADS" } }, context)).toEqual({
      name: "UPLOADS",
    });
    expect(emptyTempDirectoryMock).toHaveBeenCalledWith("UPLOADS");
  });

  it("rejects invalid temp directory names", async () => {
    await expect(rootValue.emptyTempDir({ input: { name: "INVALID" } }, context)).rejects.toThrow(
      "Invalid temp directory"
    );
  });

  it("rebuilds all projections", async () => {
    rebuildProjectionAllMock.mockResolvedValue({ rebuiltSessions: 3 });
    expect(await rootValue.rebuildJellyfinProjectionAll({}, context)).toEqual({
      rebuiltSessions: 3,
    });
    expect(rebuildProjectionAllMock).toHaveBeenCalled();
  });

  it("updates temp cleanup schedule", async () => {
    updateCleanupScheduleMock.mockResolvedValue({
      hour: 4,
      days: [2, 4],
      enabled: true,
      lastRunAt: null,
      nextRunAt: 123,
    });

    const response = await rootValue.updateTempCleanupSchedule(
      { input: { hour: 4, days: [2, 4] } },
      context
    );

    expect(updateCleanupScheduleMock).toHaveBeenCalledWith({ hour: 4, days: [2, 4] });
    expect(response.schedule).toEqual({
      hour: 4,
      days: [2, 4],
      enabled: true,
      lastRunAt: null,
      nextRunAt: new Date(123).toISOString(),
    });
  });

  it("runs temp cleanup immediately", async () => {
    runCleanupNowMock.mockResolvedValue({
      started: true,
      schedule: {
        hour: 1,
        days: [],
        enabled: false,
        lastRunAt: 456,
        nextRunAt: null,
      },
    });

    const response = await rootValue.runTempCleanup({}, context);
    expect(runCleanupNowMock).toHaveBeenCalled();
    expect(response.started).toBe(true);
    expect(response.schedule).toEqual({
      hour: 1,
      days: [],
      enabled: false,
      lastRunAt: new Date(456).toISOString(),
      nextRunAt: null,
    });
  });
});
