import { describe, expect, it } from "vitest";
import { computeConsistencyStats } from "../../../../../src/web/shared/consistency.js";
import type { LapWithEvents } from "../../../../../src/web/client/components/session/LapsCard.js";

function buildLap(lapNumber: number, time: number): LapWithEvents {
  return {
    id: `lap-${lapNumber}`,
    lapNumber,
    time,
    start: 0,
    isFastest: false,
    deltaToFastest: null,
    lapEvents: [],
  };
}

describe("computeConsistencyStats", () => {
  it("drops out lap and trims outliers based on median window", () => {
    const laps: LapWithEvents[] = [
      buildLap(1, 70), // out lap (excluded)
      buildLap(2, 60),
      buildLap(3, 61),
      buildLap(4, 100), // outlier
    ];

    const result = computeConsistencyStats(laps);

    expect(result.usableLaps.map((lap) => lap.lapNumber)).toEqual([2, 3]);
    expect(result.excluded).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ lapNumber: 1, reason: "out-lap" }),
        expect.objectContaining({ lapNumber: 4, reason: "outlier" }),
      ])
    );
    expect(result.score).toBe(56);
    expect(result.label).toBe("Variable");
    expect(result.windowPct).toBeCloseTo(0.08); // widened for <5 laps
  });

  it("returns null score when fewer than two usable laps remain", () => {
    const laps: LapWithEvents[] = [buildLap(1, 65), buildLap(2, 0)]; // lap 2 invalid

    const result = computeConsistencyStats(laps);

    expect(result.score).toBeNull();
    expect(result.label).toBe("Need more clean laps");
    expect(result.usableLaps.length).toBe(1);
    expect(result.excluded.map((lap) => lap.reason)).toContain("invalid");
  });

  it("uses tighter 5% window for long stints (>=10 usable candidates)", () => {
    // 11 laps; lap 1 is out lap, lap 6 is outlier (+6.6%), rest clustered
    const laps: LapWithEvents[] = [
      buildLap(1, 80),
      buildLap(2, 60),
      buildLap(3, 60.2),
      buildLap(4, 59.9),
      buildLap(5, 60.1),
      buildLap(6, 64), // outlier beyond 5%
      buildLap(7, 60),
      buildLap(8, 60.3),
      buildLap(9, 59.8),
      buildLap(10, 60.4),
      buildLap(11, 59.9),
    ];

    const result = computeConsistencyStats(laps);

    expect(result.windowPct).toBeCloseTo(0.05);
    expect(result.excluded).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ lapNumber: 1, reason: "out-lap" }),
        expect.objectContaining({ lapNumber: 6, reason: "outlier" }),
      ])
    );
    expect(result.usableLaps.length).toBe(9); // all except out lap + outlier
  });
});
