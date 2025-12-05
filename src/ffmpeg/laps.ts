import type {
  Lap,
  LapInput,
  PositionChange,
  PositionChangeInput,
} from "./lapTypes.js";


export function totalSessionDuration(laps: Lap[]): number {
  if (!laps.length) return 0;
  const last = laps[laps.length - 1];
  return last.startS + last.durationS;
}

export function lapForSessionTime(
  laps: Lap[],
  t: number
): { lap: Lap; lapElapsed: number } | null {
  if (t < 0) return null;
  if (!laps.length) return null;

  const sessionTotal = totalSessionDuration(laps);
  if (t > sessionTotal) return null;

  let current: Lap | null = null;

  for (const lap of laps) {
    const start = lap.startS;
    const end = lap.startS + lap.durationS;
    if (t >= start && t < end) {
      current = lap;
      break;
    }
  }

  if (!current && Math.abs(t - sessionTotal) < 1e-3) {
    current = laps[laps.length - 1];
  }

  if (!current) return null;

  let lapElapsed = t - current.startS;
  if (lapElapsed > current.durationS) {
    lapElapsed = current.durationS;
  }

  return { lap: current, lapElapsed };
}

function normalizePositionChanges(
  changes: PositionChangeInput[] | null | undefined,
  durationS: number,
  fallbackPosition: number
): PositionChange[] {
  if (!Number.isFinite(durationS) || durationS <= 0) {
    return [];
  }

  const parsed = (changes || []).map((change, idx) => {
    const rawTime = change?.atS;
    const atS =
      rawTime == null || Number.isNaN(Number(rawTime))
        ? Number.NaN
        : Number(rawTime);
    const position = Math.max(
      0,
      Math.round(Number(change?.position ?? fallbackPosition ?? 0))
    );
    return { atS, position, idx };
  });

  const filtered = parsed
    .filter(({ atS }) => Number.isFinite(atS) && atS >= 0)
    .map(({ atS, position, idx }) => ({
      atS: Math.min(durationS, atS as number),
      position,
      idx,
    }))
    .sort((a, b) => {
      if (a.atS === b.atS) return a.idx - b.idx;
      return a.atS - b.atS;
    });

  const needsZero =
    filtered.length > 0 && (filtered[0]?.atS as number) > 0
      ? [{ atS: 0, position: 0, idx: -1 }]
      : [];
  const hasFallback =
    filtered.length === 0 &&
    Number.isFinite(fallbackPosition) &&
    Number(fallbackPosition) > 0;
  const withDefaults =
    filtered.length === 0
      ? hasFallback
        ? [{ atS: 0, position: Math.max(0, Math.round(fallbackPosition)), idx: -1 }]
        : []
      : filtered;

  const normalized: PositionChange[] = [];
  for (const change of [...needsZero, ...withDefaults]) {
    const prev = normalized[normalized.length - 1];
    if (
      !prev ||
      Math.abs(prev.atS - change.atS) > 1e-9 ||
      prev.position !== change.position
    ) {
      normalized.push({ atS: change.atS, position: change.position });
    }
  }

  return normalized;
}

export function normalizeLapInputs(inputs: LapInput[] | null | undefined): Lap[] {
  if (!inputs) return [];
  const withIndex = inputs.map((lap, idx) => ({ lap, idx }));
  const normalized = withIndex.map(({ lap, idx }) => {
    const lapNumber = Number(lap?.number);
    const durationMsRaw = lap?.durationMs;
    const durationSRaw = lap?.durationS;
    const durationMs = durationMsRaw == null ? Number.NaN : Number(durationMsRaw);
    const durationS = durationSRaw == null ? Number.NaN : Number(durationSRaw);
    const durationSeconds = Number.isFinite(durationMs)
      ? durationMs / 1000
      : durationS;
    if (!Number.isFinite(lapNumber) || lapNumber < 1) {
      throw new Error(`Lap number must be >= 1 (row ${idx + 1})`);
    }
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      throw new Error(`Lap ${lapNumber} needs a positive duration`);
    }
    const rawPosition = lap?.position == null ? 0 : Number(lap.position);
    const positionChanges = normalizePositionChanges(
      lap?.positionChanges,
      durationSeconds,
      Number.isFinite(rawPosition) ? rawPosition : 0
    );
    const firstPosition =
      positionChanges.find((change) => change.position > 0)?.position ??
      positionChanges[0]?.position ??
      0;
    return {
      number: Math.round(lapNumber),
      durationS: durationSeconds as number,
      position: Math.max(0, Math.round(firstPosition)),
      positionChanges,
      startS: 0,
      idx,
    };
  });

  normalized.sort((a, b) => {
    if (a.number === b.number) return a.idx - b.idx;
    return a.number - b.number;
  });

  let cumulative = 0;
  normalized.forEach((lap) => {
    lap.startS = cumulative;
    cumulative += lap.durationS;
  });

  return normalized.map(({ idx, ...lap }) => lap);
}

export type { Lap } from "./lapTypes.js";
