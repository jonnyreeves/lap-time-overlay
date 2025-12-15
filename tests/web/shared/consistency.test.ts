import { describe, it, expect } from "vitest";
import { computeConsistencyStats } from "../../../src/web/shared/consistency";

describe("computeConsistencyStats", () => {
  it("should not consider a fast lap as an outlier", () => {
    const laps = [
      { id: "1", lapNumber: 1, time: 100 }, // Out lap
      { id: "2", lapNumber: 2, time: 62 },
      { id: "3", lapNumber: 3, time: 62.1 },
      { id: "4", lapNumber: 4, time: 61.9 },
      { id: "5", lapNumber: 5, time: 62.2 },
      { id: "6", lapNumber: 6, time: 58 }, // Fast lap
    ];

    const stats = computeConsistencyStats(laps);

    const fastLap = laps.find((l) => l.id === "6");
    const isFastLapOutlier = stats.excluded.some(
      (ex) => ex.id === fastLap!.id && ex.reason === "outlier"
    );

    expect(isFastLapOutlier).toBe(false);
    expect(stats.usableLaps.some((l) => l.id === fastLap!.id)).toBe(true);
  });
});
