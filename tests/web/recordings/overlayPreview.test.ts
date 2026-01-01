import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LapEventRecord } from "../../../src/db/lap_events.js";
import type { LapRecord } from "../../../src/db/laps.js";
import { buildOverlayLaps } from "../../../src/web/recordings/overlayPreview.js";

const lapEventsByLapId: Record<string, LapEventRecord[]> = {};

vi.mock("../../../src/db/lap_events.js", () => ({
  findLapEventsByLapId: (lapId: string) => lapEventsByLapId[lapId] ?? [],
}));

describe("buildOverlayLaps", () => {
  beforeEach(() => {
    for (const key of Object.keys(lapEventsByLapId)) {
      delete lapEventsByLapId[key];
    }
  });

  it("derives position segments from lap events", () => {
    lapEventsByLapId["lap-a"] = [
      {
        id: "event-1",
        lapId: "lap-a",
        offset: 5,
        event: "position",
        value: "P2",
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "event-2",
        lapId: "lap-a",
        offset: 15,
        event: "position",
        value: "P1",
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    lapEventsByLapId["lap-b"] = [
      {
        id: "event-3",
        lapId: "lap-b",
        offset: 0,
        event: "position",
        value: "P3",
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "event-4",
        lapId: "lap-b",
        offset: 70,
        event: "position",
        value: "P1",
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "event-5",
        lapId: "lap-b",
        offset: 30,
        event: "pit",
        value: "stop",
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "event-6",
        lapId: "lap-b",
        offset: 40,
        event: "position",
        value: "P",
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const laps: LapRecord[] = [
      {
        id: "lap-b",
        sessionId: "session",
        lapNumber: 2,
        time: 62,
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "lap-a",
        sessionId: "session",
        lapNumber: 1,
        time: 60,
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const overlayLaps = buildOverlayLaps(laps);
    expect(overlayLaps.map((lap) => lap.number)).toEqual([1, 2]);

    const firstLap = overlayLaps[0];
    expect(firstLap.position).toBe(2);
    expect(firstLap.positionChanges).toEqual([
      { atS: 5, position: 2 },
      { atS: 15, position: 1 },
    ]);

    const secondLap = overlayLaps[1];
    expect(secondLap.position).toBe(3);
    expect(secondLap.positionChanges).toEqual([
      { atS: 0, position: 3 },
      { atS: 62, position: 1 },
    ]);
  });

  it("carries end-of-lap position into the next lap", () => {
    lapEventsByLapId["lap-1"] = [
      {
        id: "event-1",
        lapId: "lap-1",
        offset: 50,
        event: "position",
        value: "4",
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    lapEventsByLapId["lap-2"] = [
      {
        id: "event-2",
        lapId: "lap-2",
        offset: 55,
        event: "position",
        value: "2",
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const laps: LapRecord[] = [
      {
        id: "lap-1",
        sessionId: "session",
        lapNumber: 1,
        time: 50,
        createdAt: 0,
        updatedAt: 0,
      },
      {
        id: "lap-2",
        sessionId: "session",
        lapNumber: 2,
        time: 55,
        createdAt: 0,
        updatedAt: 0,
      },
    ];

    const overlayLaps = buildOverlayLaps(laps);

    expect(overlayLaps[0]).toMatchObject({
      number: 1,
      position: 4,
      positionChanges: [{ atS: 50, position: 4 }],
    });

    expect(overlayLaps[1]).toMatchObject({
      number: 2,
      position: 4,
      positionChanges: [{ atS: 55, position: 2 }],
    });
  });
});
