import { describe, expect, it } from "vitest";
import {
  buildSelfComparisonCoachingSignals,
  buildSelfComparisonLapComparisons,
  buildSelfComparisonPaceInsights,
  buildSelfComparisonSessionInsights,
  buildSelfComparisonTrend,
  buildSelfComparisonTrendSnapshot,
} from "../../../src/web/shared/selfComparison.js";

describe("selfComparison", () => {
  it("builds lap comparisons with explicit current/comparison outcomes", () => {
    const comparisons = buildSelfComparisonLapComparisons(
      [
        { lapNumber: 1, time: 52.2 },
        { lapNumber: 2, time: 51.8 },
        { lapNumber: 3, time: 51.9 },
      ],
      [
        { lapNumber: 1, time: 52.1 },
        { lapNumber: 2, time: 52.0 },
        { lapNumber: 3, time: 51.95 },
      ]
    );

    expect(comparisons).toHaveLength(3);
    expect(comparisons[0]?.outcome).toBe("COMPARISON_FASTER");
    expect(comparisons[1]?.outcome).toBe("CURRENT_FASTER");
    expect(comparisons[2]?.cumulativeDelta).toBeCloseTo(-0.15, 3);
  });

  it("builds session insights for a current-session advantage", () => {
    const insights = buildSelfComparisonSessionInsights(
      buildSelfComparisonLapComparisons(
        [
          { lapNumber: 1, time: 51.7 },
          { lapNumber: 2, time: 51.8 },
          { lapNumber: 3, time: 51.9 },
          { lapNumber: 4, time: 51.8 },
        ],
        [
          { lapNumber: 1, time: 52.1 },
          { lapNumber: 2, time: 52.2 },
          { lapNumber: 3, time: 52.0 },
          { lapNumber: 4, time: 52.1 },
        ]
      )
    );

    expect(insights.insightLabel).toBe("CURRENT_ADVANTAGE");
    expect(insights.currentFasterLapCount).toBe(4);
    expect(insights.comparisonFasterLapCount).toBe(0);
  });

  it("computes pace insights and coaching signals", () => {
    const current = Array.from({ length: 10 }, (_, index) => ({
      lapNumber: index + 1,
      time: 52 + (index % 3) * 0.05,
      lapEvents:
        index === 2
          ? [{ offset: 12.4, event: "brake-lock", value: "T3" }]
          : [],
    }));
    const comparison = Array.from({ length: 10 }, (_, index) => ({
      lapNumber: index + 1,
      time: 52.4 + (index % 3) * 0.08,
      lapEvents:
        index === 4
          ? [{ offset: 18.2, event: "oversteer", value: "T6" }]
          : [],
    }));

    const paceInsights = buildSelfComparisonPaceInsights(current, comparison);
    const coachingSignals = buildSelfComparisonCoachingSignals(current, comparison);

    expect(paceInsights.deltas.fastest10Avg).toBeLessThan(0);
    expect(paceInsights.sustainedVerdict).toBe("CURRENT_ADVANTAGE");
    expect(coachingSignals.current.lapEventSummaries[0]?.event).toBe("brake-lock");
    expect(coachingSignals.deltas.lapsWithinPoint2OfBest).toBeGreaterThanOrEqual(0);
  });

  it("builds improving trends with fastest-10 averages when every session supports them", () => {
    const trend = buildSelfComparisonTrend([
      buildSelfComparisonTrendSnapshot(
        "s1",
        "2026-01-01",
        Array.from({ length: 10 }, (_, index) => ({ lapNumber: index + 1, time: 52.8 })),
        false
      ),
      buildSelfComparisonTrendSnapshot(
        "s2",
        "2026-01-08",
        Array.from({ length: 10 }, (_, index) => ({ lapNumber: index + 1, time: 52.5 })),
        false
      ),
      buildSelfComparisonTrendSnapshot(
        "s3",
        "2026-01-15",
        Array.from({ length: 10 }, (_, index) => ({ lapNumber: index + 1, time: 52.2 })),
        true
      ),
    ]);

    expect(trend.metric).toBe("FASTEST_10_AVG");
    expect(trend.direction).toBe("IMPROVING");
    expect(trend.sampleCount).toBe(3);
  });

  it("falls back to best lap when sessions do not all have rolling samples", () => {
    const trend = buildSelfComparisonTrend([
      buildSelfComparisonTrendSnapshot(
        "s1",
        "2026-01-01",
        [{ lapNumber: 1, time: 53.1 }, { lapNumber: 2, time: 52.9 }],
        false
      ),
      buildSelfComparisonTrendSnapshot(
        "s2",
        "2026-01-08",
        [{ lapNumber: 1, time: 52.8 }, { lapNumber: 2, time: 52.7 }],
        false
      ),
      buildSelfComparisonTrendSnapshot(
        "s3",
        "2026-01-15",
        [{ lapNumber: 1, time: 52.5 }, { lapNumber: 2, time: 52.4 }],
        true
      ),
    ]);

    expect(trend.metric).toBe("BEST_LAP");
    expect(trend.direction).toBe("IMPROVING");
  });
});
