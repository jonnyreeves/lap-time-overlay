import { describe, expect, it } from "vitest";
import { createCompressedLapTimeScale } from "../../../../../src/web/client/components/session/selfComparisonLapChartScale.js";

describe("createCompressedLapTimeScale", () => {
  it("keeps a linear scale when lap times stay in a tight range", () => {
    const scale = createCompressedLapTimeScale([47.8, 48.1, 48.4, 48.7, 49], 0, 100);

    expect(scale.hasCompressedOutliers).toBe(false);
    expect(scale.breakYs).toEqual([]);
    expect(scale.ticks).toHaveLength(5);
    expect(scale.project(47.8)).toBe(100);
    expect(scale.project(49)).toBe(0);
  });

  it("compresses slow outliers to preserve vertical space for the focus laps", () => {
    const scale = createCompressedLapTimeScale(
      [47.6, 47.9, 48.1, 48.4, 48.7, 49.2, 49.5, 50.1, 54.9, 90.042],
      0,
      100
    );

    expect(scale.hasCompressedOutliers).toBe(true);
    expect(scale.breakYs).toHaveLength(1);
    expect(scale.ticks[scale.ticks.length - 1]?.value).toBeCloseTo(90.042, 3);
    expect(scale.project(47.6)).toBeGreaterThan(scale.project(49.5));
    expect(scale.project(47.6) - scale.project(54.9)).toBeGreaterThan(
      scale.project(54.9) - scale.project(90.042)
    );
  });
});
