export type ConsistencyLapInput = {
  id: string;
  lapNumber: number;
  time: number | null | undefined;
};

export type ExcludedReason = "invalid" | "out-lap" | "outlier";

export type ConsistencyLap = {
  id: string;
  lapNumber: number;
  time: number;
};

export type ConsistencyStats = {
  score: number | null;
  label: string;
  mean: number | null;
  stdDev: number | null;
  cvPct: number | null;
  median: number | null;
  windowPct: number | null;
  usableLaps: ConsistencyLap[];
  excluded: (ConsistencyLap & { reason: ExcludedReason })[];
  totalValid: number;
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdDev(values: number[], avg: number | null): number | null {
  if (values.length === 0 || avg == null) return null;
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function classifyLabel(cvPct: number | null, stdDevValue: number | null): string {
  if (cvPct == null || stdDevValue == null) return "Need more clean laps";
  if (stdDevValue <= 0.12 && cvPct <= 2) return "Elite consistency";
  if (stdDevValue <= 0.2 && cvPct <= 3) return "Very consistent";
  if (stdDevValue <= 0.35 && cvPct <= 5) return "Consistent";
  if (stdDevValue <= 0.8 && cvPct <= 8) return "Variable";
  return "Inconsistent";
}

function clampScore(score: number | null): number | null {
  if (score == null || Number.isNaN(score)) return null;
  return Math.min(100, Math.max(30, Math.round(score)));
}

export function computeConsistencyStats(laps: ConsistencyLapInput[]): ConsistencyStats {
  const valid: ConsistencyLap[] = [];
  const excluded: (ConsistencyLap & { reason: ExcludedReason })[] = [];

  laps.forEach((lap) => {
    const lapTime = Number.isFinite(lap.time) ? lap.time : null;
    if (lapTime && lapTime > 0) {
      valid.push({ id: lap.id, lapNumber: lap.lapNumber, time: lapTime });
    } else {
      excluded.push({
        id: lap.id,
        lapNumber: lap.lapNumber,
        time: Number.isFinite(lap.time) ? (lap.time as number) : 0,
        reason: "invalid",
      });
    }
  });

  if (valid.length === 0) {
    return {
      score: null,
      label: "Add lap times to see consistency",
      mean: null,
      stdDev: null,
      cvPct: null,
      median: null,
      windowPct: null,
      usableLaps: [],
      excluded,
      totalValid: 0,
    };
  }

  const sorted = [...valid].sort((a, b) => a.lapNumber - b.lapNumber);
  const outLap = sorted.filter((lap) => lap.lapNumber === 1);
  const candidates =
    sorted.length > outLap.length ? sorted.filter((lap) => lap.lapNumber !== 1) : sorted;

  outLap.forEach((lap) => excluded.push({ ...lap, reason: "out-lap" }));

  const med = median(candidates.map((lap) => lap.time));
  if (med == null) {
    return {
      score: null,
      label: "Need more clean laps",
      mean: null,
      stdDev: null,
      cvPct: null,
      median: null,
      windowPct: null,
      usableLaps: [],
      excluded,
      totalValid: candidates.length,
    };
  }

  const baseWindow = candidates.length >= 10 ? 0.05 : 0.06;
  const windowPct = candidates.length < 5 ? 0.08 : baseWindow;
  const lowerBound = med * (1 - windowPct);
  const upperBound = med * (1 + windowPct);

  const usable = candidates.filter((lap) => lap.time <= upperBound);
  const outliers = candidates.filter((lap) => lap.time > upperBound);
  outliers.forEach((lap) => excluded.push({ ...lap, reason: "outlier" }));

  const usableTimes = usable.map((lap) => lap.time);
  const canScore = usable.length >= 2;
  const avg = mean(usableTimes);
  const sigma = canScore ? stdDev(usableTimes, avg) : null;
  const cv = canScore && avg && sigma != null ? sigma / avg : null;
  const cvPct = cv != null ? cv * 100 : null;
  const maxCvForScale = 0.07; // slightly relaxed scaling for elite consistency
  const maxStdForScale = 0.8;
  const normalizedCv = cv != null ? Math.min(cv / maxCvForScale, 1) : null;
  const normalizedStd = sigma != null ? Math.min(sigma / maxStdForScale, 1) : null;
  const normalized =
    normalizedCv != null && normalizedStd != null
      ? Math.max(normalizedCv, normalizedStd)
      : normalizedCv ?? normalizedStd;
  const score =
    normalized != null ? clampScore(100 - normalized * 70) : null;

  const label = canScore ? classifyLabel(cvPct, sigma) : "Need more clean laps";

  return {
    score: canScore ? score : null,
    label,
    mean: avg,
    stdDev: sigma,
    cvPct,
    median: med,
    windowPct,
    usableLaps: usable,
    excluded,
    totalValid: candidates.length,
  };
}
