export type SessionFormat = "Practice" | "Qualifying" | "Race";

export type SessionPerformanceLapInput = {
  id: string;
  lapNumber: number;
  time: number | null | undefined;
};

export type FieldFastestLapInput = {
  driverName: string;
  classification: number | null;
  fastestLap: number | null | undefined;
};

export type ExcludedLapReason = "invalid" | "out-lap" | "outlier";

export type SessionPerformanceInput = {
  format: SessionFormat;
  selfLaps: SessionPerformanceLapInput[];
  fieldFastestLaps: FieldFastestLapInput[];
  sessionFastestLap?: number | null;
};

export type SessionPerformanceScoreComponent = {
  key: string;
  label: string;
  weight: number;
  value: number | null;
  contribution: number | null;
};

export type SessionPerformanceBase = {
  format: SessionFormat;
  score: number | null;
  label: string;
  headline: string;
  cleanLapCount: number;
  excludedLapCount: number;
  cleanLapNumbers: number[];
  excludedLaps: Array<{ lapNumber: number; reason: ExcludedLapReason }>;
  scoreComponents: SessionPerformanceScoreComponent[];
  representativePace: number | null;
  thresholdLapTime: number | null;
  highlightLapNumbers: number[];
};

export type QualifyingPerformance = SessionPerformanceBase & {
  format: "Qualifying";
  kpis: {
    bestLap: number | null;
    rankByBestLap: number | null;
    gapToP1: number | null;
    gapToP3: number | null;
    top3Average: number | null;
    top3Spread: number | null;
    secondLapDelta: number | null;
    pushRatePct: number | null;
    cleanLapRatioPct: number | null;
  };
};

export type PracticeRacePerformance = SessionPerformanceBase & {
  format: "Practice" | "Race";
  kpis: {
    bestLap: number | null;
    gapToP1: number | null;
    top5Average: number | null;
    top10Average: number | null;
    cleanLapStdDev: number | null;
    longestConsistentStintLaps: number | null;
    longestConsistentStintStartLap: number | null;
    longestConsistentStintEndLap: number | null;
    lapsWithinThresholdPct: number | null;
    cleanLapRatioPct: number | null;
  };
};

export type SessionPerformanceResult = QualifyingPerformance | PracticeRacePerformance;

type CleanLap = {
  id: string;
  lapNumber: number;
  time: number;
};

type ScoredComponentInput = {
  key: string;
  label: string;
  weight: number;
  value: number | null;
  subscore: number | null;
};

type ConsistentStint = {
  laps: number;
  startLapNumber: number;
  endLapNumber: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals = 3): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
  }
  return sorted[middle] ?? null;
}

function stdDev(values: number[]): number | null {
  if (!values.length) return null;
  const avg = mean(values);
  if (avg == null) return null;
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function normalizeCleanLaps(
  format: SessionFormat,
  laps: SessionPerformanceLapInput[]
): {
  validLaps: CleanLap[];
  candidateLaps: CleanLap[];
  cleanLaps: CleanLap[];
  excludedLaps: Array<{ lapNumber: number; reason: ExcludedLapReason }>;
} {
  const validLaps: CleanLap[] = [];
  const excludedLaps: Array<{ lapNumber: number; reason: ExcludedLapReason }> = [];

  laps.forEach((lap) => {
    const lapTime = Number.isFinite(lap.time) ? lap.time : null;
    if (lapTime != null && lapTime > 0) {
      validLaps.push({ id: lap.id, lapNumber: lap.lapNumber, time: lapTime });
      return;
    }
    excludedLaps.push({ lapNumber: lap.lapNumber, reason: "invalid" });
  });

  validLaps.sort((a, b) => a.lapNumber - b.lapNumber);

  const candidateLaps =
    validLaps.length > 1 ? validLaps.filter((lap) => lap.lapNumber !== 1) : [...validLaps];
  if (candidateLaps.length !== validLaps.length) {
    excludedLaps.push({ lapNumber: 1, reason: "out-lap" });
  }

  const med = median(candidateLaps.map((lap) => lap.time));
  if (med == null) {
    return { validLaps, candidateLaps, cleanLaps: candidateLaps, excludedLaps };
  }

  const windowPct =
    format === "Qualifying"
      ? candidateLaps.length >= 10
        ? 0.04
        : candidateLaps.length >= 5
          ? 0.05
          : 0.06
      : candidateLaps.length >= 10
        ? 0.06
        : candidateLaps.length >= 5
          ? 0.07
          : 0.08;
  const upperBound = med * (1 + windowPct);

  const cleanLaps = candidateLaps.filter((lap) => lap.time <= upperBound);
  candidateLaps
    .filter((lap) => lap.time > upperBound)
    .forEach((lap) => excludedLaps.push({ lapNumber: lap.lapNumber, reason: "outlier" }));

  excludedLaps.sort((left, right) => left.lapNumber - right.lapNumber);
  return { validLaps, candidateLaps, cleanLaps, excludedLaps };
}

function computeBestNAverage(laps: CleanLap[], count: number): number | null {
  if (laps.length < count) return null;
  const sample = [...laps].sort((a, b) => a.time - b.time).slice(0, count);
  return mean(sample.map((lap) => lap.time));
}

function computeTopNSpread(laps: CleanLap[], count: number): number | null {
  if (laps.length < count) return null;
  const sample = [...laps].sort((a, b) => a.time - b.time).slice(0, count);
  const fastest = sample[0]?.time ?? null;
  const slowest = sample[sample.length - 1]?.time ?? null;
  if (fastest == null || slowest == null) return null;
  return slowest - fastest;
}

function computeSecondBestDelta(laps: CleanLap[]): number | null {
  if (laps.length < 2) return null;
  const sample = [...laps].sort((a, b) => a.time - b.time).slice(0, 2);
  return (sample[1]?.time ?? 0) - (sample[0]?.time ?? 0);
}

function pickHighlightLapNumbers(laps: CleanLap[], count: number): number[] {
  return [...laps]
    .sort((a, b) => a.time - b.time)
    .slice(0, count)
    .map((lap) => lap.lapNumber);
}

function computePercentWithinThreshold(laps: CleanLap[], threshold: number | null): number | null {
  if (!laps.length || threshold == null) return null;
  const hits = laps.filter((lap) => lap.time <= threshold).length;
  return (hits / laps.length) * 100;
}

function computeCleanLapRatioPct(cleanLaps: CleanLap[], validLaps: CleanLap[]): number | null {
  if (!validLaps.length) return null;
  return (cleanLaps.length / validLaps.length) * 100;
}

function computeBestLap(laps: CleanLap[]): number | null {
  if (!laps.length) return null;
  return Math.min(...laps.map((lap) => lap.time));
}

function computeGapToP1(
  bestLap: number | null,
  fieldFastestLaps: FieldFastestLapInput[],
  sessionFastestLap: number | null | undefined
): number | null {
  if (bestLap == null) return null;
  const fieldFastest = fieldFastestLaps
    .map((entry) => (Number.isFinite(entry.fastestLap) && entry.fastestLap! > 0 ? entry.fastestLap! : null))
    .filter((time): time is number => time != null);
  const benchmark = [bestLap, sessionFastestLap ?? null, ...fieldFastest]
    .filter((time): time is number => time != null)
    .reduce<number | null>((fastest, value) => (fastest == null ? value : Math.min(fastest, value)), null);
  if (benchmark == null) return null;
  return bestLap - benchmark;
}

function computeGapToP3(bestLap: number | null, fieldFastestLaps: FieldFastestLapInput[]): number | null {
  if (bestLap == null) return null;
  const sorted = fieldFastestLaps
    .map((entry) => (Number.isFinite(entry.fastestLap) && entry.fastestLap! > 0 ? entry.fastestLap! : null))
    .filter((time): time is number => time != null)
    .sort((a, b) => a - b);
  const benchmark = sorted[2] ?? null;
  if (benchmark == null) return null;
  return bestLap - benchmark;
}

function computeRankByBestLap(bestLap: number | null, fieldFastestLaps: FieldFastestLapInput[]): number | null {
  if (bestLap == null) return null;
  const fieldFastest = fieldFastestLaps
    .map((entry) => (Number.isFinite(entry.fastestLap) && entry.fastestLap! > 0 ? entry.fastestLap! : null))
    .filter((time): time is number => time != null);
  const fasterCount = fieldFastest.filter((time) => time < bestLap - 1e-6).length;
  return fasterCount + 1;
}

function computeLongestConsistentStint(candidateLaps: CleanLap[], threshold: number | null): ConsistentStint | null {
  if (!candidateLaps.length || threshold == null) return null;

  let best: ConsistentStint | null = null;
  let index = 0;
  while (index < candidateLaps.length) {
    let endIndex = index;
    let recoveryUsed = false;
    while (endIndex < candidateLaps.length) {
      const current = candidateLaps[endIndex];
      if (current != null && current.time <= threshold) {
        endIndex += 1;
        continue;
      }

      const next = candidateLaps[endIndex + 1];
      if (!recoveryUsed && next && next.time <= threshold) {
        recoveryUsed = true;
        endIndex += 2;
        continue;
      }
      break;
    }

    const startLap = candidateLaps[index];
    const endLap = candidateLaps[Math.max(index, endIndex - 1)];
    if (startLap && endLap) {
      const laps = endIndex - index;
      const candidate: ConsistentStint = {
        laps,
        startLapNumber: startLap.lapNumber,
        endLapNumber: endLap.lapNumber,
      };
      if (
        !best ||
        candidate.laps > best.laps ||
        (candidate.laps === best.laps && candidate.startLapNumber < best.startLapNumber)
      ) {
        best = candidate;
      }
    }

    index += 1;
  }

  return best;
}

function scoreFromLowerBetter(value: number | null, excellent: number, poor: number): number | null {
  if (value == null) return null;
  if (value <= excellent) return 100;
  if (value >= poor) return 0;
  const ratio = (value - excellent) / (poor - excellent);
  return round((1 - ratio) * 100, 1);
}

function scoreFromHigherBetter(value: number | null, poor: number, excellent: number): number | null {
  if (value == null) return null;
  if (value <= poor) return 0;
  if (value >= excellent) return 100;
  const ratio = (value - poor) / (excellent - poor);
  return round(ratio * 100, 1);
}

function buildScore(
  format: SessionFormat,
  components: ScoredComponentInput[]
): { score: number | null; label: string; headline: string; scoreComponents: SessionPerformanceScoreComponent[] } {
  const usable = components.filter((component) => component.subscore != null);
  if (!usable.length) {
    return {
      score: null,
      label: "Need more clean laps",
      headline: "There is not enough clean lap data to score this session yet.",
      scoreComponents: components.map((component) => ({
        key: component.key,
        label: component.label,
        weight: component.weight,
        value: component.value,
        contribution: null,
      })),
    };
  }

  const totalWeight = usable.reduce((sum, component) => sum + component.weight, 0);
  const scoreComponents = components.map((component) => {
    if (component.subscore == null) {
      return {
        key: component.key,
        label: component.label,
        weight: component.weight,
        value: component.value,
        contribution: null,
      };
    }
    const contribution = round((component.subscore * component.weight) / totalWeight, 1);
    return {
      key: component.key,
      label: component.label,
      weight: component.weight,
      value: component.value,
      contribution,
    };
  });

  const score = Math.round(
    scoreComponents.reduce((sum, component) => sum + (component.contribution ?? 0), 0)
  );
  const label =
    score >= 90 ? "Excellent" : score >= 75 ? "Strong" : score >= 60 ? "Solid" : score >= 45 ? "Mixed" : "Off pace";
  const topComponent =
    scoreComponents
      .filter((component) => component.contribution != null)
      .sort((left, right) => (right.contribution ?? 0) - (left.contribution ?? 0))[0] ?? null;

  const headline =
    format === "Qualifying"
      ? topComponent?.key === "gapToP1"
        ? "Single-lap pace was the main story in this qualifying run."
        : "Your top push laps drove this qualifying score."
      : topComponent?.key === "longestConsistentStint"
        ? "Stint quality did the heavy lifting in this session score."
        : "Representative pace was the main driver of this session score.";

  return { score, label, headline, scoreComponents };
}

export function computeSessionPerformance(input: SessionPerformanceInput): SessionPerformanceResult {
  const { format, selfLaps, fieldFastestLaps, sessionFastestLap } = input;
  const { validLaps, candidateLaps, cleanLaps, excludedLaps } = normalizeCleanLaps(format, selfLaps);
  const cleanLapNumbers = cleanLaps.map((lap) => lap.lapNumber);
  const bestLap = computeBestLap(cleanLaps);
  const gapToP1 = computeGapToP1(bestLap, fieldFastestLaps, sessionFastestLap);
  const cleanLapRatioPct = computeCleanLapRatioPct(cleanLaps, validLaps);

  if (format === "Qualifying") {
    const top3Average = computeBestNAverage(cleanLaps, 3);
    const top3Spread = computeTopNSpread(cleanLaps, 3);
    const secondLapDelta = computeSecondBestDelta(cleanLaps);
    const pushRatePct = computePercentWithinThreshold(cleanLaps, bestLap != null ? bestLap * 1.015 : null);
    const components: ScoredComponentInput[] = [
      {
        key: "gapToP1",
        label: "Gap to P1",
        weight: 45,
        value: gapToP1,
        subscore: scoreFromLowerBetter(gapToP1, 0.05, 0.8),
      },
      {
        key: "top3Average",
        label: "Top 3 Average",
        weight: 25,
        value: top3Average,
        subscore: scoreFromLowerBetter(
          top3Average != null && bestLap != null ? top3Average - bestLap : null,
          0.08,
          0.45
        ),
      },
      {
        key: "top3Spread",
        label: "Top 3 Spread",
        weight: 10,
        value: top3Spread,
        subscore: scoreFromLowerBetter(top3Spread, 0.08, 0.35),
      },
      {
        key: "secondLapDelta",
        label: "Second Lap Delta",
        weight: 10,
        value: secondLapDelta,
        subscore: scoreFromLowerBetter(secondLapDelta, 0.05, 0.25),
      },
      {
        key: "pushRatePct",
        label: "Push Rate",
        weight: 10,
        value: pushRatePct,
        subscore: scoreFromHigherBetter(pushRatePct, 35, 90),
      },
    ];
    const score = buildScore(format, components);
    return {
      format,
      score: score.score,
      label: score.label,
      headline: score.headline,
      cleanLapCount: cleanLaps.length,
      excludedLapCount: excludedLaps.length,
      cleanLapNumbers,
      excludedLaps,
      scoreComponents: score.scoreComponents,
      representativePace: top3Average,
      thresholdLapTime: bestLap != null ? bestLap * 1.015 : null,
      highlightLapNumbers: pickHighlightLapNumbers(cleanLaps, 3),
      kpis: {
        bestLap,
        rankByBestLap: computeRankByBestLap(bestLap, fieldFastestLaps),
        gapToP1,
        gapToP3: computeGapToP3(bestLap, fieldFastestLaps),
        top3Average,
        top3Spread,
        secondLapDelta,
        pushRatePct,
        cleanLapRatioPct,
      },
    };
  }

  const top5Average = computeBestNAverage(cleanLaps, 5);
  const top10Average = computeBestNAverage(cleanLaps, 10);
  const representativePace = format === "Race" ? top10Average ?? top5Average : top5Average;
  const thresholdLapTime =
    top5Average != null ? top5Average * 1.01 : bestLap != null ? bestLap * 1.02 : null;
  const cleanLapStdDev = stdDev(cleanLaps.map((lap) => lap.time));
  const lapsWithinThresholdPct = computePercentWithinThreshold(cleanLaps, thresholdLapTime);
  const longestConsistentStint = computeLongestConsistentStint(candidateLaps, thresholdLapTime);

  const components: ScoredComponentInput[] =
    format === "Race"
      ? [
          {
            key: "top10Average",
            label: "Top 10 Average",
            weight: 25,
            value: top10Average,
            subscore: scoreFromLowerBetter(
              top10Average != null && bestLap != null ? top10Average - bestLap : null,
              0.2,
              1.1
            ),
          },
          {
            key: "top5Average",
            label: "Top 5 Average",
            weight: 10,
            value: top5Average,
            subscore: scoreFromLowerBetter(
              top5Average != null && bestLap != null ? top5Average - bestLap : null,
              0.12,
              0.8
            ),
          },
          {
            key: "longestConsistentStint",
            label: "Longest Consistent Stint",
            weight: 25,
            value: longestConsistentStint?.laps ?? null,
            subscore: scoreFromHigherBetter(
              longestConsistentStint != null && cleanLaps.length
                ? (longestConsistentStint.laps / cleanLaps.length) * 100
                : null,
              35,
              85
            ),
          },
          {
            key: "lapsWithinThresholdPct",
            label: "Laps Within Threshold",
            weight: 15,
            value: lapsWithinThresholdPct,
            subscore: scoreFromHigherBetter(lapsWithinThresholdPct, 45, 90),
          },
          {
            key: "gapToP1",
            label: "Best Lap Gap",
            weight: 15,
            value: gapToP1,
            subscore: scoreFromLowerBetter(gapToP1, 0.05, 0.8),
          },
          {
            key: "cleanLapRatioPct",
            label: "Clean Lap Ratio",
            weight: 10,
            value: cleanLapRatioPct,
            subscore: scoreFromHigherBetter(cleanLapRatioPct, 45, 95),
          },
        ]
      : [
          {
            key: "top5Average",
            label: "Top 5 Average",
            weight: 25,
            value: top5Average,
            subscore: scoreFromLowerBetter(
              top5Average != null && bestLap != null ? top5Average - bestLap : null,
              0.12,
              0.8
            ),
          },
          {
            key: "top10Average",
            label: "Top 10 Average",
            weight: 15,
            value: top10Average,
            subscore: scoreFromLowerBetter(
              top10Average != null && bestLap != null ? top10Average - bestLap : null,
              0.2,
              1.1
            ),
          },
          {
            key: "gapToP1",
            label: "Best Lap Gap",
            weight: 20,
            value: gapToP1,
            subscore: scoreFromLowerBetter(gapToP1, 0.05, 0.8),
          },
          {
            key: "cleanLapStdDev",
            label: "Clean Lap Std Dev",
            weight: 15,
            value: cleanLapStdDev,
            subscore: scoreFromLowerBetter(cleanLapStdDev, 0.1, 0.75),
          },
          {
            key: "longestConsistentStint",
            label: "Longest Consistent Stint",
            weight: 15,
            value: longestConsistentStint?.laps ?? null,
            subscore: scoreFromHigherBetter(
              longestConsistentStint != null && cleanLaps.length
                ? (longestConsistentStint.laps / cleanLaps.length) * 100
                : null,
              35,
              85
            ),
          },
          {
            key: "cleanLapRatioPct",
            label: "Clean Lap Ratio",
            weight: 10,
            value: cleanLapRatioPct,
            subscore: scoreFromHigherBetter(cleanLapRatioPct, 45, 95),
          },
        ];
  const score = buildScore(format, components);

  return {
    format,
    score: score.score,
    label: score.label,
    headline: score.headline,
    cleanLapCount: cleanLaps.length,
    excludedLapCount: excludedLaps.length,
    cleanLapNumbers,
    excludedLaps,
    scoreComponents: score.scoreComponents,
    representativePace,
    thresholdLapTime,
    highlightLapNumbers:
      longestConsistentStint == null
        ? []
        : Array.from(
            { length: longestConsistentStint.endLapNumber - longestConsistentStint.startLapNumber + 1 },
            (_, index) => longestConsistentStint.startLapNumber + index
          ),
    kpis: {
      bestLap,
      gapToP1,
      top5Average,
      top10Average,
      cleanLapStdDev: cleanLapStdDev != null ? round(cleanLapStdDev) : null,
      longestConsistentStintLaps: longestConsistentStint?.laps ?? null,
      longestConsistentStintStartLap: longestConsistentStint?.startLapNumber ?? null,
      longestConsistentStintEndLap: longestConsistentStint?.endLapNumber ?? null,
      lapsWithinThresholdPct,
      cleanLapRatioPct,
    },
  };
}
