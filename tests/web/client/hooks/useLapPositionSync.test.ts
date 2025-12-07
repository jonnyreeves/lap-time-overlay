import { describe, expect, it } from "vitest";
import { buildLapRanges, resolveLapAtTime } from "../../../../src/web/client/hooks/useLapPositionSync.js";

const sampleLaps = [
  { id: "lap-1", start: 0, time: 60 },
  { id: "lap-2", start: 60, time: 50 },
];

describe("useLapPositionSync helpers", () => {
  it("buildLapRanges offsets lap starts with lapOneOffset", () => {
    const ranges = buildLapRanges(sampleLaps, 10);
    expect(ranges).toEqual([
      { id: "lap-1", start: 10, end: 70 },
      { id: "lap-2", start: 70, end: 120 },
    ]);
  });

  it("buildLapRanges returns empty when lapOneOffset is not set", () => {
    expect(buildLapRanges(sampleLaps, 0)).toEqual([]);
  });

  it("resolveLapAtTime finds lap by time with epsilon tolerance", () => {
    const ranges = buildLapRanges(sampleLaps, 5);
    expect(resolveLapAtTime(ranges, 5)).toMatchObject({ id: "lap-1" });
    expect(resolveLapAtTime(ranges, 74.99)).toMatchObject({ id: "lap-2" });
    expect(resolveLapAtTime(ranges, 200)).toBeNull();
  });
});
