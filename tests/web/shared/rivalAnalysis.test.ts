import { describe, expect, it } from "vitest";
import {
  buildLapComparisons,
  buildRivalTrend,
  buildSessionInsights,
  computeBestNAvg,
} from "../../../src/web/shared/rivalAnalysis.js";

describe("rivalAnalysis", () => {
  it("builds lap-by-lap comparisons and cumulative deltas", () => {
    const comparisons = buildLapComparisons(
      [
        { lapNumber: 1, time: 52.2 },
        { lapNumber: 2, time: 51.9 },
        { lapNumber: 3, time: 52.4 },
      ],
      [
        { lapNumber: 1, time: 51.9 },
        { lapNumber: 2, time: 52.0 },
        { lapNumber: 3, time: 52.35 },
      ]
    );

    expect(comparisons).toHaveLength(3);
    expect(comparisons[0]).toMatchObject({
      lapNumber: 1,
      outcome: "SLOWER",
    });
    expect(comparisons[1]).toMatchObject({
      lapNumber: 2,
      outcome: "FASTER",
    });
    expect(comparisons[2]?.cumulativeDelta).toBeCloseTo(0.25, 3);
  });

  it("classifies consistently slower sessions", () => {
    const comparisons = buildLapComparisons(
      [
        { lapNumber: 1, time: 53.3 },
        { lapNumber: 2, time: 53.2 },
        { lapNumber: 3, time: 53.5 },
        { lapNumber: 4, time: 53.4 },
      ],
      [
        { lapNumber: 1, time: 52.8 },
        { lapNumber: 2, time: 52.7 },
        { lapNumber: 3, time: 52.9 },
        { lapNumber: 4, time: 52.8 },
      ]
    );

    const insights = buildSessionInsights(comparisons);
    expect(insights.insightLabel).toBe("CONSISTENTLY_SLOWER");
    expect(insights.slowerLapCount).toBe(4);
    expect(insights.fasterLapCount).toBe(0);
  });

  it("computes closing trend from best-10 deltas", () => {
    const trend = buildRivalTrend([
      { sessionId: "s1", date: "2026-01-01", delta: 0.6 },
      { sessionId: "s2", date: "2026-01-08", delta: 0.45 },
      { sessionId: "s3", date: "2026-01-15", delta: 0.35 },
      { sessionId: "s4", date: "2026-01-22", delta: 0.2 },
    ]);
    expect(trend.direction).toBe("CLOSING");
    expect(trend.sampleCount).toBe(4);
  });

  it("returns insufficient trend when sample size is too small", () => {
    const trend = buildRivalTrend([
      { sessionId: "s1", date: "2026-01-01", delta: 0.4 },
      { sessionId: "s2", date: "2026-01-08", delta: 0.3 },
    ]);
    expect(trend.direction).toBe("INSUFFICIENT");
    expect(trend.slope).toBeNull();
  });

  it("computes best-n average from fastest laps only", () => {
    const best10 = computeBestNAvg(
      [
        { lapNumber: 1, time: 55 },
        { lapNumber: 2, time: 54 },
        { lapNumber: 3, time: 53 },
        { lapNumber: 4, time: 52 },
      ],
      2
    );
    expect(best10).toBeCloseTo(52.5, 6);
  });
});
