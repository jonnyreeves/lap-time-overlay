export type RivalLapOutcome = "FASTER" | "SLOWER" | "TIE";

export type RivalLapComparison = {
  lapNumber: number;
  selfLap: number;
  rivalLap: number;
  delta: number;
  cumulativeDelta: number;
  outcome: RivalLapOutcome;
};

export type RivalInsightLabel =
  | "CONSISTENTLY_SLOWER"
  | "MIXED_WITH_FASTER_PHASES"
  | "MIXED_OR_NEUTRAL";

export type RivalSessionInsights = {
  fasterLapCount: number;
  slowerLapCount: number;
  tieCount: number;
  longestGainStreak: number;
  longestLossStreak: number;
  medianDelta: number | null;
  consistencyGap: number | null;
  insightLabel: RivalInsightLabel;
};

export type RivalTrendDirection = "CLOSING" | "WIDENING" | "FLAT" | "INSUFFICIENT";

export type RivalTrendPoint = {
  sessionId: string;
  date: string;
  delta: number;
};

export type RivalTrend = {
  direction: RivalTrendDirection;
  sampleCount: number;
  slope: number | null;
  firstDelta: number | null;
  latestDelta: number | null;
  points: RivalTrendPoint[];
};

export type SimpleLap = {
  lapNumber: number;
  time: number;
};

export const RIVAL_DELTA_TIE_EPSILON_SECONDS = 0.05;

function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function computeMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid] ?? null;
}

function computeStdDev(values: number[]): number | null {
  if (values.length === 0) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function classifyOutcome(delta: number): RivalLapOutcome {
  if (delta <= -RIVAL_DELTA_TIE_EPSILON_SECONDS) return "FASTER";
  if (delta >= RIVAL_DELTA_TIE_EPSILON_SECONDS) return "SLOWER";
  return "TIE";
}

function longestStreak(
  comparisons: RivalLapComparison[],
  outcome: RivalLapOutcome
): number {
  let best = 0;
  let current = 0;
  for (const comparison of comparisons) {
    if (comparison.outcome === outcome) {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }
  return best;
}

export function buildLapComparisons(
  selfLaps: SimpleLap[],
  rivalLaps: SimpleLap[]
): RivalLapComparison[] {
  const selfByLap = new Map<number, number>();
  const rivalByLap = new Map<number, number>();
  for (const lap of selfLaps) {
    if (!Number.isInteger(lap.lapNumber) || lap.lapNumber < 1 || !isFinitePositive(lap.time)) continue;
    selfByLap.set(lap.lapNumber, lap.time);
  }
  for (const lap of rivalLaps) {
    if (!Number.isInteger(lap.lapNumber) || lap.lapNumber < 1 || !isFinitePositive(lap.time)) continue;
    rivalByLap.set(lap.lapNumber, lap.time);
  }

  const lapNumbers = Array.from(selfByLap.keys())
    .filter((lapNumber) => rivalByLap.has(lapNumber))
    .sort((a, b) => a - b);

  let cumulativeDelta = 0;
  return lapNumbers.map((lapNumber) => {
    const selfLap = selfByLap.get(lapNumber) ?? 0;
    const rivalLap = rivalByLap.get(lapNumber) ?? 0;
    const delta = selfLap - rivalLap;
    cumulativeDelta += delta;
    return {
      lapNumber,
      selfLap,
      rivalLap,
      delta,
      cumulativeDelta,
      outcome: classifyOutcome(delta),
    };
  });
}

export function buildSessionInsights(
  comparisons: RivalLapComparison[]
): RivalSessionInsights {
  const fasterLapCount = comparisons.filter((comparison) => comparison.outcome === "FASTER").length;
  const slowerLapCount = comparisons.filter((comparison) => comparison.outcome === "SLOWER").length;
  const tieCount = comparisons.length - fasterLapCount - slowerLapCount;
  const medianDelta = computeMedian(comparisons.map((comparison) => comparison.delta));
  const selfStdDev = computeStdDev(comparisons.map((comparison) => comparison.selfLap));
  const rivalStdDev = computeStdDev(comparisons.map((comparison) => comparison.rivalLap));
  const consistencyGap =
    selfStdDev != null && rivalStdDev != null ? selfStdDev - rivalStdDev : null;
  const longestGainStreak = longestStreak(comparisons, "FASTER");
  const longestLossStreak = longestStreak(comparisons, "SLOWER");
  const comparableCount = comparisons.length;
  const slowerRatio = comparableCount > 0 ? slowerLapCount / comparableCount : 0;
  const fasterRatio = comparableCount > 0 ? fasterLapCount / comparableCount : 0;

  let insightLabel: RivalInsightLabel = "MIXED_OR_NEUTRAL";
  if (slowerRatio >= 0.65 && (medianDelta ?? 0) > 0.2) {
    insightLabel = "CONSISTENTLY_SLOWER";
  } else if (fasterRatio >= 0.25 || longestGainStreak >= 2) {
    insightLabel = "MIXED_WITH_FASTER_PHASES";
  }

  return {
    fasterLapCount,
    slowerLapCount,
    tieCount,
    longestGainStreak,
    longestLossStreak,
    medianDelta,
    consistencyGap,
    insightLabel,
  };
}

export function computeBestNAvg(laps: SimpleLap[], n = 10): number | null {
  const valid = laps
    .filter((lap) => isFinitePositive(lap.time))
    .map((lap) => lap.time)
    .sort((a, b) => a - b);
  if (valid.length === 0) return null;
  const sample = valid.slice(0, Math.min(valid.length, n));
  const total = sample.reduce((sum, time) => sum + time, 0);
  return total / sample.length;
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

export function buildRivalTrend(points: RivalTrendPoint[]): RivalTrend {
  const sorted = [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const deltas = sorted.map((point) => point.delta).filter((delta) => Number.isFinite(delta));
  if (sorted.length < 3 || deltas.length < 3) {
    return {
      direction: "INSUFFICIENT",
      sampleCount: sorted.length,
      slope: null,
      firstDelta: sorted[0]?.delta ?? null,
      latestDelta: sorted[sorted.length - 1]?.delta ?? null,
      points: sorted,
    };
  }

  const slope = computeSlope(deltas);
  const threshold = 0.02;
  let direction: RivalTrendDirection = "FLAT";
  if ((slope ?? 0) <= -threshold) {
    direction = "CLOSING";
  } else if ((slope ?? 0) >= threshold) {
    direction = "WIDENING";
  }

  return {
    direction,
    sampleCount: sorted.length,
    slope,
    firstDelta: sorted[0]?.delta ?? null,
    latestDelta: sorted[sorted.length - 1]?.delta ?? null,
    points: sorted,
  };
}
