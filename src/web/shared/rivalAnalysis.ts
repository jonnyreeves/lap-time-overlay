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

export type RivalRollingWindow = {
  average: number;
  startLapNumber: number;
  endLapNumber: number;
};

export type RivalDriverPace = {
  validLapCount: number;
  bestLap: number | null;
  fastest5Avg: number | null;
  fastest10Avg: number | null;
  bestRolling5: RivalRollingWindow | null;
  bestRolling10: RivalRollingWindow | null;
  overallMean: number | null;
  overallMedian: number | null;
  slowLapSpread: number | null;
  quickWindowCount: number;
};

export type RivalPaceDeltas = {
  bestLap: number | null;
  fastest5Avg: number | null;
  fastest10Avg: number | null;
  bestRolling5Avg: number | null;
  bestRolling10Avg: number | null;
  overallMean: number | null;
  overallMedian: number | null;
  slowLapSpread: number | null;
};

export type RivalPaceVerdict = "RIVAL_ADVANTAGE" | "SELF_ADVANTAGE" | "NEUTRAL" | "INSUFFICIENT";

export type RivalRobustnessVerdict =
  | "SELF_MORE_ROBUST"
  | "RIVAL_MORE_ROBUST"
  | "SIMILAR"
  | "INSUFFICIENT";

export type RivalPaceInsights = {
  self: RivalDriverPace;
  rival: RivalDriverPace;
  deltas: RivalPaceDeltas;
  quickWindowCutoff: number | null;
  quickWindowSelfCount: number;
  quickWindowRivalCount: number;
  ceilingVerdict: RivalPaceVerdict;
  sustainedVerdict: RivalPaceVerdict;
  robustnessVerdict: RivalRobustnessVerdict;
  headline: string;
};

export type SimpleLap = {
  lapNumber: number;
  time: number;
};

export const RIVAL_DELTA_TIE_EPSILON_SECONDS = 0.05;
const CEILING_ADVANTAGE_DELTA_SECONDS = 0.15;
const SUSTAINED_ADVANTAGE_DELTA_SECONDS = 0.2;
const ROBUSTNESS_ADVANTAGE_DELTA_SECONDS = 0.08;
const EXCLUDED_RIVAL_NAMES = new Set(["anonymous"]);

export function isNamedRivalDriver(name: string | null | undefined): boolean {
  const normalized = name?.trim().toLocaleLowerCase();
  return Boolean(normalized && !EXCLUDED_RIVAL_NAMES.has(normalized));
}

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

function normalizeValidLaps(laps: SimpleLap[]): SimpleLap[] {
  return laps
    .filter((lap) => Number.isInteger(lap.lapNumber) && lap.lapNumber >= 1 && isFinitePositive(lap.time))
    .sort((a, b) => a.lapNumber - b.lapNumber);
}

function computeFastestNAvgStrict(laps: SimpleLap[], n: number): number | null {
  const valid = normalizeValidLaps(laps)
    .map((lap) => lap.time)
    .sort((a, b) => a - b);
  if (valid.length < n) return null;
  const sample = valid.slice(0, n);
  const total = sample.reduce((sum, time) => sum + time, 0);
  return total / sample.length;
}

function computeBestRollingWindow(laps: SimpleLap[], n: number): RivalRollingWindow | null {
  const valid = normalizeValidLaps(laps);
  if (valid.length < n) return null;

  let best: RivalRollingWindow | null = null;
  for (let startIndex = 0; startIndex <= valid.length - n; startIndex += 1) {
    const window = valid.slice(startIndex, startIndex + n);
    const total = window.reduce((sum, lap) => sum + lap.time, 0);
    const average = total / n;
    const candidate: RivalRollingWindow = {
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

function computeDelta(selfValue: number | null, rivalValue: number | null): number | null {
  if (selfValue == null || rivalValue == null) return null;
  return selfValue - rivalValue;
}

function classifyPaceVerdict(
  delta: number | null,
  threshold: number
): RivalPaceVerdict {
  if (delta == null) return "INSUFFICIENT";
  if (delta >= threshold) return "RIVAL_ADVANTAGE";
  if (delta <= -threshold) return "SELF_ADVANTAGE";
  return "NEUTRAL";
}

function classifyRobustnessVerdict(
  selfSpread: number | null,
  rivalSpread: number | null
): RivalRobustnessVerdict {
  if (selfSpread == null || rivalSpread == null) return "INSUFFICIENT";
  if (selfSpread <= rivalSpread - ROBUSTNESS_ADVANTAGE_DELTA_SECONDS) {
    return "SELF_MORE_ROBUST";
  }
  if (rivalSpread <= selfSpread - ROBUSTNESS_ADVANTAGE_DELTA_SECONDS) {
    return "RIVAL_MORE_ROBUST";
  }
  return "SIMILAR";
}

function buildDriverPaceSnapshot(laps: SimpleLap[], quickWindowCutoff: number | null): RivalDriverPace {
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
  rivalName: string,
  sustainedVerdict: RivalPaceVerdict,
  ceilingVerdict: RivalPaceVerdict,
  robustnessVerdict: RivalRobustnessVerdict,
  bestRolling10AvgDelta: number | null,
  fastest10AvgDelta: number | null
): string {
  let base = "Peak and sustained pace were closely matched in this session.";
  if (sustainedVerdict === "RIVAL_ADVANTAGE") {
    base = `${rivalName} shows stronger clean-air sustained pace (~${formatDeltaMagnitude(bestRolling10AvgDelta)}s/lap over the best 10-lap block).`;
  } else if (sustainedVerdict === "SELF_ADVANTAGE") {
    base = `You show stronger clean-air sustained pace (~${formatDeltaMagnitude(bestRolling10AvgDelta)}s/lap over the best 10-lap block).`;
  } else if (ceilingVerdict === "RIVAL_ADVANTAGE") {
    base = `${rivalName} has the stronger peak pace ceiling (~${formatDeltaMagnitude(fastest10AvgDelta)}s/lap on fastest-10 average).`;
  } else if (ceilingVerdict === "SELF_ADVANTAGE") {
    base = `You have the stronger peak pace ceiling (~${formatDeltaMagnitude(fastest10AvgDelta)}s/lap on fastest-10 average).`;
  }

  if (robustnessVerdict === "SELF_MORE_ROBUST") {
    return `${base} You were less affected by slow/disrupted laps.`;
  }
  if (robustnessVerdict === "RIVAL_MORE_ROBUST") {
    return `${base} ${rivalName} was less affected by slow/disrupted laps.`;
  }
  return base;
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

export function buildRivalPaceInsights(
  selfLaps: SimpleLap[],
  rivalLaps: SimpleLap[],
  rivalName: string
): RivalPaceInsights {
  const selfValid = normalizeValidLaps(selfLaps);
  const rivalValid = normalizeValidLaps(rivalLaps);
  const combinedTimes = [...selfValid, ...rivalValid].map((lap) => lap.time);
  const quickWindowCutoff = computePercentile(combinedTimes, 0.25);
  const self = buildDriverPaceSnapshot(selfValid, quickWindowCutoff);
  const rival = buildDriverPaceSnapshot(rivalValid, quickWindowCutoff);

  const deltas: RivalPaceDeltas = {
    bestLap: computeDelta(self.bestLap, rival.bestLap),
    fastest5Avg: computeDelta(self.fastest5Avg, rival.fastest5Avg),
    fastest10Avg: computeDelta(self.fastest10Avg, rival.fastest10Avg),
    bestRolling5Avg: computeDelta(self.bestRolling5?.average ?? null, rival.bestRolling5?.average ?? null),
    bestRolling10Avg: computeDelta(self.bestRolling10?.average ?? null, rival.bestRolling10?.average ?? null),
    overallMean: computeDelta(self.overallMean, rival.overallMean),
    overallMedian: computeDelta(self.overallMedian, rival.overallMedian),
    slowLapSpread: computeDelta(self.slowLapSpread, rival.slowLapSpread),
  };

  const ceilingVerdict = classifyPaceVerdict(deltas.fastest10Avg, CEILING_ADVANTAGE_DELTA_SECONDS);
  const sustainedVerdict = classifyPaceVerdict(
    deltas.bestRolling10Avg,
    SUSTAINED_ADVANTAGE_DELTA_SECONDS
  );
  const robustnessVerdict = classifyRobustnessVerdict(self.slowLapSpread, rival.slowLapSpread);
  const headline = buildPaceHeadline(
    rivalName,
    sustainedVerdict,
    ceilingVerdict,
    robustnessVerdict,
    deltas.bestRolling10Avg,
    deltas.fastest10Avg
  );

  return {
    self,
    rival,
    deltas,
    quickWindowCutoff,
    quickWindowSelfCount: self.quickWindowCount,
    quickWindowRivalCount: rival.quickWindowCount,
    ceilingVerdict,
    sustainedVerdict,
    robustnessVerdict,
    headline,
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
