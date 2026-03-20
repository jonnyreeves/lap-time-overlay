import { describe, expect, it } from "vitest";
import { computeSessionPerformance } from "../../../src/web/shared/sessionPerformance.js";

describe("computeSessionPerformance", () => {
  it("builds qualifying KPIs around top push laps and field gap", () => {
    const result = computeSessionPerformance({
      format: "Qualifying",
      selfLaps: [
        { id: "l1", lapNumber: 1, time: 75 },
        { id: "l2", lapNumber: 2, time: 60.2 },
        { id: "l3", lapNumber: 3, time: 60.0 },
        { id: "l4", lapNumber: 4, time: 60.1 },
        { id: "l5", lapNumber: 5, time: 61.5 },
      ],
      fieldFastestLaps: [
        { driverName: "A", classification: 1, fastestLap: 59.8 },
        { driverName: "B", classification: 2, fastestLap: 60.05 },
        { driverName: "C", classification: 3, fastestLap: 60.15 },
      ],
      sessionFastestLap: 59.8,
    });

    if (result.format !== "Qualifying") {
      throw new Error("Expected qualifying performance");
    }

    expect(result.format).toBe("Qualifying");
    expect(result.kpis.bestLap).toBeCloseTo(60.0);
    expect(result.kpis.top3Average).toBeCloseTo(60.1);
    expect(result.kpis.top3Spread).toBeCloseTo(0.2);
    expect(result.kpis.secondLapDelta).toBeCloseTo(0.1);
    expect(result.kpis.gapToP1).toBeCloseTo(0.2);
    expect(result.kpis.gapToP3).toBeCloseTo(-0.15);
    expect(result.highlightLapNumbers).toEqual([3, 4, 2]);
    expect(result.score).not.toBeNull();
  });

  it("uses looser outlier trimming in practice than qualifying", () => {
    const qualifying = computeSessionPerformance({
      format: "Qualifying",
      selfLaps: [
        { id: "l1", lapNumber: 1, time: 80 },
        { id: "l2", lapNumber: 2, time: 60.0 },
        { id: "l3", lapNumber: 3, time: 60.1 },
        { id: "l4", lapNumber: 4, time: 60.2 },
        { id: "l5", lapNumber: 5, time: 60.3 },
        { id: "l6", lapNumber: 6, time: 64.0 },
      ],
      fieldFastestLaps: [],
      sessionFastestLap: null,
    });
    const practice = computeSessionPerformance({
      format: "Practice",
      selfLaps: [
        { id: "l1", lapNumber: 1, time: 80 },
        { id: "l2", lapNumber: 2, time: 60.0 },
        { id: "l3", lapNumber: 3, time: 60.1 },
        { id: "l4", lapNumber: 4, time: 60.2 },
        { id: "l5", lapNumber: 5, time: 60.3 },
        { id: "l6", lapNumber: 6, time: 64.0 },
      ],
      fieldFastestLaps: [],
      sessionFastestLap: null,
    });

    expect(qualifying.cleanLapNumbers).toEqual([2, 3, 4, 5]);
    expect(practice.cleanLapNumbers).toEqual([2, 3, 4, 5, 6]);
  });

  it("falls back to top-5 representative pace for short race samples", () => {
    const result = computeSessionPerformance({
      format: "Race",
      selfLaps: [
        { id: "l1", lapNumber: 1, time: 78 },
        { id: "l2", lapNumber: 2, time: 60.0 },
        { id: "l3", lapNumber: 3, time: 60.2 },
        { id: "l4", lapNumber: 4, time: 60.1 },
        { id: "l5", lapNumber: 5, time: 60.3 },
        { id: "l6", lapNumber: 6, time: 60.4 },
      ],
      fieldFastestLaps: [],
      sessionFastestLap: null,
    });

    if (result.format !== "Race") {
      throw new Error("Expected race performance");
    }

    expect(result.format).toBe("Race");
    expect(result.kpis.top10Average).toBeNull();
    expect(result.kpis.top5Average).toBeCloseTo(60.2);
    expect(result.representativePace).toBeCloseTo(60.2);
  });

  it("allows a recovered outlier inside the longest consistent stint", () => {
    const result = computeSessionPerformance({
      format: "Race",
      selfLaps: [
        { id: "l1", lapNumber: 1, time: 80 },
        { id: "l2", lapNumber: 2, time: 60.0 },
        { id: "l3", lapNumber: 3, time: 60.1 },
        { id: "l4", lapNumber: 4, time: 60.2 },
        { id: "l5", lapNumber: 5, time: 64.0 },
        { id: "l6", lapNumber: 6, time: 60.2 },
        { id: "l7", lapNumber: 7, time: 60.3 },
        { id: "l8", lapNumber: 8, time: 60.2 },
      ],
      fieldFastestLaps: [],
      sessionFastestLap: null,
    });

    if (result.format !== "Race") {
      throw new Error("Expected race performance");
    }

    expect(result.kpis.longestConsistentStintLaps).toBe(7);
    expect(result.kpis.longestConsistentStintStartLap).toBe(2);
    expect(result.kpis.longestConsistentStintEndLap).toBe(8);
  });

  it("re-normalizes score weights when field-relative metrics are missing", () => {
    const result = computeSessionPerformance({
      format: "Qualifying",
      selfLaps: [
        { id: "l1", lapNumber: 1, time: 74 },
        { id: "l2", lapNumber: 2, time: 60.0 },
        { id: "l3", lapNumber: 3, time: 60.1 },
        { id: "l4", lapNumber: 4, time: 60.2 },
      ],
      fieldFastestLaps: [],
      sessionFastestLap: null,
    });

    if (result.format !== "Qualifying") {
      throw new Error("Expected qualifying performance");
    }

    expect(result.kpis.gapToP3).toBeNull();
    expect(result.score).not.toBeNull();
    expect(result.scoreComponents.some((component) => component.contribution != null)).toBe(true);
  });
});
