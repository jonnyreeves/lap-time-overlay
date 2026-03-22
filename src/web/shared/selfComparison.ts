export type SelfComparisonConfidence = "HIGH" | "MEDIUM";

export type SelfComparisonLapEvent = {
  offset: number;
  event: string;
  value: string;
};

export type SelfComparisonSourceLap = {
  lapNumber: number;
  time: number;
  lapEvents?: SelfComparisonLapEvent[];
};

export type SelfComparisonLapOutcome = "CURRENT_FASTER" | "COMPARISON_FASTER" | "TIE";

export type SelfComparisonLapComparison = {
  lapNumber: number;
  currentLap: number;
  comparisonLap: number;
  delta: number;
  cumulativeDelta: number;
  outcome: SelfComparisonLapOutcome;
};

export type SelfComparisonInsightLabel =
  | "CURRENT_ADVANTAGE"
  | "COMPARISON_ADVANTAGE"
  | "MIXED_OR_NEUTRAL";

export type SelfComparisonSessionInsights = {
  currentFasterLapCount: number;
  comparisonFasterLapCount: number;
  tieCount: number;
  longestCurrentAdvantageStreak: number;
  longestComparisonAdvantageStreak: number;
  medianDelta: number | null;
  consistencyGap: number | null;
  insightLabel: SelfComparisonInsightLabel;
};

export type SelfComparisonTrendDirection =
  | "IMPROVING"
  | "REGRESSING"
  | "FLAT"
  | "INSUFFICIENT";

export type SelfComparisonTrendMetric = "FASTEST_10_AVG" | "FASTEST_5_AVG" | "BEST_LAP";

export type SelfComparisonTrendPoint = {
  sessionId: string;
  date: string;
  value: number;
  metric: SelfComparisonTrendMetric;
  isCurrent: boolean;
};

export type SelfComparisonTrend = {
  direction: SelfComparisonTrendDirection;
  sampleCount: number;
  slope: number | null;
  firstValue: number | null;
  latestValue: number | null;
  metric: SelfComparisonTrendMetric | null;
  points: SelfComparisonTrendPoint[];
};

export type SelfComparisonRollingWindow = {
  average: number;
  startLapNumber: number;
  endLapNumber: number;
};

export type SelfComparisonDriverPace = {
  validLapCount: number;
  bestLap: number | null;
  fastest5Avg: number | null;
  fastest10Avg: number | null;
  bestRolling5: SelfComparisonRollingWindow | null;
  bestRolling10: SelfComparisonRollingWindow | null;
  overallMean: number | null;
  overallMedian: number | null;
  slowLapSpread: number | null;
  quickWindowCount: number;
};

export type SelfComparisonPaceDeltas = {
  bestLap: number | null;
  fastest5Avg: number | null;
  fastest10Avg: number | null;
  bestRolling5Avg: number | null;
  bestRolling10Avg: number | null;
  overallMean: number | null;
  overallMedian: number | null;
  slowLapSpread: number | null;
};

export type SelfComparisonPaceVerdict =
  | "CURRENT_ADVANTAGE"
  | "COMPARISON_ADVANTAGE"
  | "NEUTRAL"
  | "INSUFFICIENT";

export type SelfComparisonRobustnessVerdict =
  | "CURRENT_MORE_ROBUST"
  | "COMPARISON_MORE_ROBUST"
  | "SIMILAR"
  | "INSUFFICIENT";

export type SelfComparisonPaceInsights = {
  current: SelfComparisonDriverPace;
  comparison: SelfComparisonDriverPace;
  deltas: SelfComparisonPaceDeltas;
  quickWindowCutoff: number | null;
  quickWindowCurrentCount: number;
  quickWindowComparisonCount: number;
  ceilingVerdict: SelfComparisonPaceVerdict;
  sustainedVerdict: SelfComparisonPaceVerdict;
  robustnessVerdict: SelfComparisonRobustnessVerdict;
  headline: string;
};

export type SelfComparisonLapEventSummary = {
  event: string;
  count: number;
  averageOffset: number | null;
  averageLapNumber: number | null;
};

export type SelfComparisonCoachingSnapshot = {
  firstLapWithin103Pct: number | null;
  finalRolling5Avg: number | null;
  stintFade: number | null;
  lapsWithinPoint2OfBest: number;
  lapsWithinPoint5OfBest: number;
  averageRecoveryAfterSlowLap: number | null;
  lapEventCount: number;
  lapEventSummaries: SelfComparisonLapEventSummary[];
};

export type SelfComparisonCoachingDeltas = {
  firstLapWithin103Pct: number | null;
  finalRolling5Avg: number | null;
  stintFade: number | null;
  lapsWithinPoint2OfBest: number;
  lapsWithinPoint5OfBest: number;
  averageRecoveryAfterSlowLap: number | null;
  lapEventCount: number;
};

export type SelfComparisonCoachingSignals = {
  current: SelfComparisonCoachingSnapshot;
  comparison: SelfComparisonCoachingSnapshot;
  deltas: SelfComparisonCoachingDeltas;
};

export type SelfComparisonTrendSnapshot = {
  sessionId: string;
  date: string;
  isCurrent: boolean;
  bestLap: number | null;
  fastest5Avg: number | null;
  fastest10Avg: number | null;
};

export const SELF_COMPARISON_DELTA_TIE_EPSILON_SECONDS = 0.05;
const CEILING_ADVANTAGE_DELTA_SECONDS = 0.15;
const SUSTAINED_ADVANTAGE_DELTA_SECONDS = 0.2;
const ROBUSTNESS_ADVANTAGE_DELTA_SECONDS = 0.08;

function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function computeMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
  }
  return sorted[middle] ?? null;
}

function computeMean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computeStdDev(values: number[]): number | null {
  if (values.length === 0) return null;
  const mean = computeMean(values);
  if (mean == null) return null;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function computePercentile(values: number[], percentile: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const boundedPercentile = Math.min(Math.max(percentile, 0), 1);
  const index = (sorted.length - 1) * boundedPercentile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const lowerValue = sorted[lower] ?? null;
  const upperValue = sorted[upper] ?? null;
  if (lowerValue == null) return null;
  if (upperValue == null || lower === upper) return lowerValue;
  const weight = index - lower;
  return lowerValue + (upperValue - lowerValue) * weight;
}

function normalizeValidLaps(laps: SelfComparisonSourceLap[]): SelfComparisonSourceLap[] {
  return laps
    .filter((lap) => Number.isInteger(lap.lapNumber) && lap.lapNumber >= 1 && isFinitePositive(lap.time))
    .sort((a, b) => a.lapNumber - b.lapNumber);
}

function computeFastestNAvgStrict(laps: SelfComparisonSourceLap[], n: number): number | null {
  const times = normalizeValidLaps(laps)
    .map((lap) => lap.time)
    .sort((a, b) => a - b);
  if (times.length < n) return null;
  return computeMean(times.slice(0, n));
}

function computeBestRollingWindow(
  laps: SelfComparisonSourceLap[],
  n: number
): SelfComparisonRollingWindow | null {
  const valid = normalizeValidLaps(laps);
  if (valid.length < n) return null;

  let best: SelfComparisonRollingWindow | null = null;
  for (let index = 0; index <= valid.length - n; index += 1) {
    const window = valid.slice(index, index + n);
    const average = computeMean(window.map((lap) => lap.time));
    if (average == null) continue;
    const candidate = {
      average,
      startLapNumber: window[0]?.lapNumber ?? 0,
      endLapNumber: window[window.length - 1]?.lapNumber ?? 0,
    };
    if (!best || candidate.average < best.average) {
      best = candidate;
    }
  }

  return best;
}

function computeFinalRollingWindow(
  laps: SelfComparisonSourceLap[],
  n: number
): SelfComparisonRollingWindow | null {
  const valid = normalizeValidLaps(laps);
  if (valid.length < n) return null;
  const window = valid.slice(-n);
  const average = computeMean(window.map((lap) => lap.time));
  if (average == null) return null;
  return {
    average,
    startLapNumber: window[0]?.lapNumber ?? 0,
    endLapNumber: window[window.length - 1]?.lapNumber ?? 0,
  };
}

function computeDelta(currentValue: number | null, comparisonValue: number | null): number | null {
  if (currentValue == null || comparisonValue == null) return null;
  return currentValue - comparisonValue;
}

function classifyPaceVerdict(
  delta: number | null,
  threshold: number
): SelfComparisonPaceVerdict {
  if (delta == null) return "INSUFFICIENT";
  if (delta <= -threshold) return "CURRENT_ADVANTAGE";
  if (delta >= threshold) return "COMPARISON_ADVANTAGE";
  return "NEUTRAL";
}

function classifyRobustnessVerdict(
  currentSpread: number | null,
  comparisonSpread: number | null
): SelfComparisonRobustnessVerdict {
  if (currentSpread == null || comparisonSpread == null) return "INSUFFICIENT";
  if (currentSpread <= comparisonSpread - ROBUSTNESS_ADVANTAGE_DELTA_SECONDS) {
    return "CURRENT_MORE_ROBUST";
  }
  if (comparisonSpread <= currentSpread - ROBUSTNESS_ADVANTAGE_DELTA_SECONDS) {
    return "COMPARISON_MORE_ROBUST";
  }
  return "SIMILAR";
}

function buildDriverPaceSnapshot(
  laps: SelfComparisonSourceLap[],
  quickWindowCutoff: number | null
): SelfComparisonDriverPace {
  const valid = normalizeValidLaps(laps);
  const times = valid.map((lap) => lap.time);
  const bestLap = times.length ? Math.min(...times) : null;
  const overallMean = computeMean(times);
  const overallMedian = computeMedian(times);
  return {
    validLapCount: valid.length,
    bestLap,
    fastest5Avg: computeFastestNAvgStrict(valid, 5),
    fastest10Avg: computeFastestNAvgStrict(valid, 10),
    bestRolling5: computeBestRollingWindow(valid, 5),
    bestRolling10: computeBestRollingWindow(valid, 10),
    overallMean,
    overallMedian,
    slowLapSpread:
      overallMean != null && overallMedian != null ? overallMean - overallMedian : null,
    quickWindowCount:
      quickWindowCutoff == null ? 0 : valid.filter((lap) => lap.time <= quickWindowCutoff).length,
  };
}

function formatDeltaMagnitude(delta: number | null): string {
  if (delta == null || Number.isNaN(delta)) return "0.000";
  return Math.abs(delta).toFixed(3);
}

function buildPaceHeadline(
  sustainedVerdict: SelfComparisonPaceVerdict,
  ceilingVerdict: SelfComparisonPaceVerdict,
  robustnessVerdict: SelfComparisonRobustnessVerdict,
  bestRolling10AvgDelta: number | null,
  fastest10AvgDelta: number | null
): string {
  let base = "Current and comparison sessions show similar pace ceilings and sustained pace.";
  if (sustainedVerdict === "CURRENT_ADVANTAGE") {
    base = `Current session shows stronger sustained pace (~${formatDeltaMagnitude(bestRolling10AvgDelta)}s/lap over the best 10-lap block).`;
  } else if (sustainedVerdict === "COMPARISON_ADVANTAGE") {
    base = `Comparison session shows stronger sustained pace (~${formatDeltaMagnitude(bestRolling10AvgDelta)}s/lap over the best 10-lap block).`;
  } else if (ceilingVerdict === "CURRENT_ADVANTAGE") {
    base = `Current session shows the stronger peak pace ceiling (~${formatDeltaMagnitude(fastest10AvgDelta)}s/lap on fastest-10 average).`;
  } else if (ceilingVerdict === "COMPARISON_ADVANTAGE") {
    base = `Comparison session shows the stronger peak pace ceiling (~${formatDeltaMagnitude(fastest10AvgDelta)}s/lap on fastest-10 average).`;
  }

  if (robustnessVerdict === "CURRENT_MORE_ROBUST") {
    return `${base} Current session was less affected by slow or disrupted laps.`;
  }
  if (robustnessVerdict === "COMPARISON_MORE_ROBUST") {
    return `${base} Comparison session was less affected by slow or disrupted laps.`;
  }
  return base;
}

function classifyOutcome(delta: number): SelfComparisonLapOutcome {
  if (delta <= -SELF_COMPARISON_DELTA_TIE_EPSILON_SECONDS) return "CURRENT_FASTER";
  if (delta >= SELF_COMPARISON_DELTA_TIE_EPSILON_SECONDS) return "COMPARISON_FASTER";
  return "TIE";
}

function longestStreak(
  comparisons: SelfComparisonLapComparison[],
  outcome: SelfComparisonLapOutcome
): number {
  let best = 0;
  let current = 0;
  for (const comparison of comparisons) {
    if (comparison.outcome === outcome) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

function computeFirstLapWithinPct(laps: SelfComparisonSourceLap[], pct: number): number | null {
  const valid = normalizeValidLaps(laps);
  const bestLap = valid.length ? Math.min(...valid.map((lap) => lap.time)) : null;
  if (bestLap == null) return null;
  const threshold = bestLap * pct;
  return valid.find((lap) => lap.time <= threshold)?.lapNumber ?? null;
}

function computeRepeatabilityCount(laps: SelfComparisonSourceLap[], threshold: number): number {
  const valid = normalizeValidLaps(laps);
  const bestLap = valid.length ? Math.min(...valid.map((lap) => lap.time)) : null;
  if (bestLap == null) return 0;
  return valid.filter((lap) => lap.time - bestLap <= threshold).length;
}

function computeAverageRecoveryAfterSlowLap(laps: SelfComparisonSourceLap[]): number | null {
  const valid = normalizeValidLaps(laps);
  const median = computeMedian(valid.map((lap) => lap.time));
  if (median == null) return null;
  const threshold = median * 1.03;
  const recoveries: number[] = [];
  for (let index = 0; index < valid.length - 1; index += 1) {
    const lap = valid[index];
    const nextLap = valid[index + 1];
    if (!nextLap || lap.time <= threshold) continue;
    recoveries.push(lap.time - nextLap.time);
  }
  return computeMean(recoveries);
}

function computeLapEventSummaries(
  laps: SelfComparisonSourceLap[]
): SelfComparisonLapEventSummary[] {
  const grouped = new Map<string, Array<{ offset: number; lapNumber: number }>>();
  laps.forEach((lap) => {
    (lap.lapEvents ?? []).forEach((lapEvent) => {
      const existing = grouped.get(lapEvent.event) ?? [];
      existing.push({ offset: lapEvent.offset, lapNumber: lap.lapNumber });
      grouped.set(lapEvent.event, existing);
    });
  });

  return Array.from(grouped.entries())
    .map(([event, entries]) => ({
      event,
      count: entries.length,
      averageOffset: computeMean(entries.map((entry) => entry.offset)),
      averageLapNumber: computeMean(entries.map((entry) => entry.lapNumber)),
    }))
    .sort((left, right) => {
      if (left.count !== right.count) return right.count - left.count;
      return left.event.localeCompare(right.event);
    });
}

function buildCoachingSnapshot(
  laps: SelfComparisonSourceLap[]
): SelfComparisonCoachingSnapshot {
  const valid = normalizeValidLaps(laps);
  const bestRolling5 = computeBestRollingWindow(valid, 5);
  const finalRolling5 = computeFinalRollingWindow(valid, 5);
  const eventCount = laps.reduce((sum, lap) => sum + (lap.lapEvents?.length ?? 0), 0);

  return {
    firstLapWithin103Pct: computeFirstLapWithinPct(valid, 1.03),
    finalRolling5Avg: finalRolling5?.average ?? null,
    stintFade:
      bestRolling5?.average != null && finalRolling5?.average != null
        ? finalRolling5.average - bestRolling5.average
        : null,
    lapsWithinPoint2OfBest: computeRepeatabilityCount(valid, 0.2),
    lapsWithinPoint5OfBest: computeRepeatabilityCount(valid, 0.5),
    averageRecoveryAfterSlowLap: computeAverageRecoveryAfterSlowLap(valid),
    lapEventCount: eventCount,
    lapEventSummaries: computeLapEventSummaries(laps),
  };
}

export function buildSelfComparisonLapComparisons(
  currentLaps: SelfComparisonSourceLap[],
  comparisonLaps: SelfComparisonSourceLap[]
): SelfComparisonLapComparison[] {
  const currentByLap = new Map<number, number>();
  const comparisonByLap = new Map<number, number>();
  normalizeValidLaps(currentLaps).forEach((lap) => currentByLap.set(lap.lapNumber, lap.time));
  normalizeValidLaps(comparisonLaps).forEach((lap) =>
    comparisonByLap.set(lap.lapNumber, lap.time)
  );

  const lapNumbers = Array.from(currentByLap.keys())
    .filter((lapNumber) => comparisonByLap.has(lapNumber))
    .sort((a, b) => a - b);

  let cumulativeDelta = 0;
  return lapNumbers.map((lapNumber) => {
    const currentLap = currentByLap.get(lapNumber) ?? 0;
    const comparisonLap = comparisonByLap.get(lapNumber) ?? 0;
    const delta = currentLap - comparisonLap;
    cumulativeDelta += delta;
    return {
      lapNumber,
      currentLap,
      comparisonLap,
      delta,
      cumulativeDelta,
      outcome: classifyOutcome(delta),
    };
  });
}

export function buildSelfComparisonSessionInsights(
  comparisons: SelfComparisonLapComparison[]
): SelfComparisonSessionInsights {
  const currentFasterLapCount = comparisons.filter(
    (comparison) => comparison.outcome === "CURRENT_FASTER"
  ).length;
  const comparisonFasterLapCount = comparisons.filter(
    (comparison) => comparison.outcome === "COMPARISON_FASTER"
  ).length;
  const tieCount = comparisons.length - currentFasterLapCount - comparisonFasterLapCount;
  const medianDelta = computeMedian(comparisons.map((comparison) => comparison.delta));
  const currentStdDev = computeStdDev(comparisons.map((comparison) => comparison.currentLap));
  const comparisonStdDev = computeStdDev(comparisons.map((comparison) => comparison.comparisonLap));
  const consistencyGap =
    currentStdDev != null && comparisonStdDev != null ? currentStdDev - comparisonStdDev : null;

  let insightLabel: SelfComparisonInsightLabel = "MIXED_OR_NEUTRAL";
  if (currentFasterLapCount >= comparisonFasterLapCount + 2 && (medianDelta ?? 0) < -0.15) {
    insightLabel = "CURRENT_ADVANTAGE";
  } else if (
    comparisonFasterLapCount >= currentFasterLapCount + 2 &&
    (medianDelta ?? 0) > 0.15
  ) {
    insightLabel = "COMPARISON_ADVANTAGE";
  }

  return {
    currentFasterLapCount,
    comparisonFasterLapCount,
    tieCount,
    longestCurrentAdvantageStreak: longestStreak(comparisons, "CURRENT_FASTER"),
    longestComparisonAdvantageStreak: longestStreak(comparisons, "COMPARISON_FASTER"),
    medianDelta,
    consistencyGap,
    insightLabel,
  };
}

export function buildSelfComparisonPaceInsights(
  currentLaps: SelfComparisonSourceLap[],
  comparisonLaps: SelfComparisonSourceLap[]
): SelfComparisonPaceInsights {
  const currentValid = normalizeValidLaps(currentLaps);
  const comparisonValid = normalizeValidLaps(comparisonLaps);
  const combinedTimes = [...currentValid, ...comparisonValid].map((lap) => lap.time);
  const quickWindowCutoff = computePercentile(combinedTimes, 0.25);
  const current = buildDriverPaceSnapshot(currentValid, quickWindowCutoff);
  const comparison = buildDriverPaceSnapshot(comparisonValid, quickWindowCutoff);

  const deltas: SelfComparisonPaceDeltas = {
    bestLap: computeDelta(current.bestLap, comparison.bestLap),
    fastest5Avg: computeDelta(current.fastest5Avg, comparison.fastest5Avg),
    fastest10Avg: computeDelta(current.fastest10Avg, comparison.fastest10Avg),
    bestRolling5Avg: computeDelta(
      current.bestRolling5?.average ?? null,
      comparison.bestRolling5?.average ?? null
    ),
    bestRolling10Avg: computeDelta(
      current.bestRolling10?.average ?? null,
      comparison.bestRolling10?.average ?? null
    ),
    overallMean: computeDelta(current.overallMean, comparison.overallMean),
    overallMedian: computeDelta(current.overallMedian, comparison.overallMedian),
    slowLapSpread: computeDelta(current.slowLapSpread, comparison.slowLapSpread),
  };

  const ceilingVerdict = classifyPaceVerdict(deltas.fastest10Avg, CEILING_ADVANTAGE_DELTA_SECONDS);
  const sustainedVerdict = classifyPaceVerdict(
    deltas.bestRolling10Avg,
    SUSTAINED_ADVANTAGE_DELTA_SECONDS
  );
  const robustnessVerdict = classifyRobustnessVerdict(
    current.slowLapSpread,
    comparison.slowLapSpread
  );

  return {
    current,
    comparison,
    deltas,
    quickWindowCutoff,
    quickWindowCurrentCount: current.quickWindowCount,
    quickWindowComparisonCount: comparison.quickWindowCount,
    ceilingVerdict,
    sustainedVerdict,
    robustnessVerdict,
    headline: buildPaceHeadline(
      sustainedVerdict,
      ceilingVerdict,
      robustnessVerdict,
      deltas.bestRolling10Avg,
      deltas.fastest10Avg
    ),
  };
}

export function buildSelfComparisonCoachingSignals(
  currentLaps: SelfComparisonSourceLap[],
  comparisonLaps: SelfComparisonSourceLap[]
): SelfComparisonCoachingSignals {
  const current = buildCoachingSnapshot(currentLaps);
  const comparison = buildCoachingSnapshot(comparisonLaps);
  return {
    current,
    comparison,
    deltas: {
      firstLapWithin103Pct: computeDelta(
        current.firstLapWithin103Pct,
        comparison.firstLapWithin103Pct
      ),
      finalRolling5Avg: computeDelta(current.finalRolling5Avg, comparison.finalRolling5Avg),
      stintFade: computeDelta(current.stintFade, comparison.stintFade),
      lapsWithinPoint2OfBest: current.lapsWithinPoint2OfBest - comparison.lapsWithinPoint2OfBest,
      lapsWithinPoint5OfBest: current.lapsWithinPoint5OfBest - comparison.lapsWithinPoint5OfBest,
      averageRecoveryAfterSlowLap: computeDelta(
        current.averageRecoveryAfterSlowLap,
        comparison.averageRecoveryAfterSlowLap
      ),
      lapEventCount: current.lapEventCount - comparison.lapEventCount,
    },
  };
}

function computeSlope(points: number[]): number | null {
  if (points.length < 2) return null;
  const n = points.length;
  const meanX = (n - 1) / 2;
  const meanY = points.reduce((sum, value) => sum + value, 0) / n;
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < n; index += 1) {
    const x = index - meanX;
    const y = points[index] - meanY;
    numerator += x * y;
    denominator += x * x;
  }
  if (denominator <= 0) return null;
  return numerator / denominator;
}

export function buildSelfComparisonTrendSnapshot(
  sessionId: string,
  date: string,
  laps: SelfComparisonSourceLap[],
  isCurrent: boolean
): SelfComparisonTrendSnapshot {
  const valid = normalizeValidLaps(laps);
  const times = valid.map((lap) => lap.time);
  return {
    sessionId,
    date,
    isCurrent,
    bestLap: times.length ? Math.min(...times) : null,
    fastest5Avg: computeFastestNAvgStrict(valid, 5),
    fastest10Avg: computeFastestNAvgStrict(valid, 10),
  };
}

export function buildSelfComparisonTrend(
  snapshots: SelfComparisonTrendSnapshot[]
): SelfComparisonTrend {
  const sorted = [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const metric: SelfComparisonTrendMetric | null = sorted.every(
    (snapshot) => snapshot.fastest10Avg != null
  )
    ? "FASTEST_10_AVG"
    : sorted.every((snapshot) => snapshot.fastest5Avg != null)
      ? "FASTEST_5_AVG"
      : sorted.some((snapshot) => snapshot.bestLap != null)
        ? "BEST_LAP"
        : null;

  const points = sorted
    .map((snapshot) => {
      const value =
        metric === "FASTEST_10_AVG"
          ? snapshot.fastest10Avg
          : metric === "FASTEST_5_AVG"
            ? snapshot.fastest5Avg
            : snapshot.bestLap;
      if (metric == null || value == null) return null;
      return {
        sessionId: snapshot.sessionId,
        date: snapshot.date,
        value,
        metric,
        isCurrent: snapshot.isCurrent,
      };
    })
    .filter((point): point is SelfComparisonTrendPoint => point != null);

  if (points.length < 3) {
    return {
      direction: "INSUFFICIENT",
      sampleCount: points.length,
      slope: null,
      firstValue: points[0]?.value ?? null,
      latestValue: points[points.length - 1]?.value ?? null,
      metric,
      points,
    };
  }

  const slope = computeSlope(points.map((point) => point.value));
  let direction: SelfComparisonTrendDirection = "FLAT";
  if ((slope ?? 0) <= -0.02) {
    direction = "IMPROVING";
  } else if ((slope ?? 0) >= 0.02) {
    direction = "REGRESSING";
  }

  return {
    direction,
    sampleCount: points.length,
    slope,
    firstValue: points[0]?.value ?? null,
    latestValue: points[points.length - 1]?.value ?? null,
    metric,
    points,
  };
}
