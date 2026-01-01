import type { LapRange } from "../../hooks/useLapPositionSync.js";

export type LapEvent = {
  offset: number;
  event: string;
  value: string;
};

type PositionChange = { atS: number; position: number };
type PositionSegment = { start: number; end: number; position: number };

export type LapPositionTimeline = {
  segments: PositionSegment[];
  lapDuration: number;
};

const POSITION_EVENT_TYPE = "position";

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function formatDelta(delta: number | null): string {
  if (delta == null || Number.isNaN(delta)) return "N/A";
  const sign = delta < 0 ? "-" : "+";
  return `${sign}${Math.abs(delta).toFixed(3)}`;
}

export function resolveTone(delta: number | null, isFastest: boolean | null | undefined) {
  if (isFastest) return "fastest";
  if (delta == null || Math.abs(delta) < 0.0005) return "neutral";
  return delta < 0 ? "faster" : "slower";
}

export function trendFromDelta(
  delta: number | null,
  isFastest?: boolean | null
): "ahead" | "behind" | "even" | "none" | "fastest" {
  if (isFastest) return "fastest";
  if (delta == null || Number.isNaN(delta)) return "none";
  if (Math.abs(delta) < 0.0005) return "even";
  return delta < 0 ? "ahead" : "behind";
}

function parseLapEventPositionValue(value: string): number | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/\d+/);
  if (!match) return null;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function deriveLapPositionChanges(
  lapEvents: LapEvent[],
  lapDurationS: number
): { positionChanges: PositionChange[]; firstPosition: number | null; lastPosition: number | null } {
  const parsed = lapEvents
    .filter((event) => event.event === POSITION_EVENT_TYPE)
    .map((event, idx) => {
      const offset = Number(event.offset);
      const position = parseLapEventPositionValue(event.value);
      return { offset, position, idx };
    })
    .filter(
      ({ offset, position }) =>
        Number.isFinite(offset) &&
        offset >= 0 &&
        Number.isFinite(position) &&
        (position as number) > 0
    )
    .map(({ offset, position, idx }) => ({
      atS: Math.min(lapDurationS, Math.max(0, offset)),
      position: Math.max(0, Math.round(position as number)),
      idx,
    }))
    .sort((a, b) => {
      if (a.atS === b.atS) return a.idx - b.idx;
      return a.atS - b.atS;
    });

  const positionChanges: PositionChange[] = [];
  for (const change of parsed) {
    const prev = positionChanges[positionChanges.length - 1];
    if (
      !prev ||
      Math.abs(prev.atS - change.atS) > 1e-9 ||
      prev.position !== change.position
    ) {
      positionChanges.push({ atS: change.atS, position: change.position });
    }
  }

  const firstPosition = positionChanges[0]?.position ?? null;
  const lastPosition = positionChanges[positionChanges.length - 1]?.position ?? null;
  return { positionChanges, firstPosition, lastPosition };
}

function buildPositionSegments(options: {
  positionChanges: PositionChange[];
  lapDurationS: number;
  carryPosition: number;
  startPosition: number;
}): PositionSegment[] {
  const { positionChanges, lapDurationS, carryPosition, startPosition } = options;
  let withFallback = positionChanges;

  if (withFallback.length === 0 && startPosition > 0) {
    withFallback = [{ atS: 0, position: startPosition }];
  }

  if (withFallback.length > 0 && withFallback[0]!.atS > 0) {
    const initialPosition =
      carryPosition > 0
        ? carryPosition
        : Math.max(0, Math.round(withFallback[0]?.position ?? startPosition));
    withFallback = [{ atS: 0, position: initialPosition }, ...withFallback];
  }

  const segments: PositionSegment[] = [];
  for (let i = 0; i < withFallback.length; i += 1) {
    const current = withFallback[i];
    const next = withFallback[i + 1];
    const segStart = current.atS;
    const segEndWithinLap =
      next != null
        ? Math.max(current.atS, Math.min(next.atS, lapDurationS))
        : lapDurationS;
    const segEnd = Math.min(lapDurationS, segEndWithinLap);
    if (segEnd > segStart) {
      segments.push({
        start: segStart,
        end: segEnd,
        position: current.position,
      });
    }
  }

  return segments;
}

export function buildLapPositionTimelines(
  lapRanges: LapRange[],
  lapLookup: Map<string, { time?: number | null; lapEvents?: LapEvent[] }>
): Map<string, LapPositionTimeline> {
  const timelines = new Map<string, LapPositionTimeline>();
  let carryPosition = 0;

  for (const range of lapRanges) {
    const lapMeta = lapLookup.get(range.id);
    if (!lapMeta) continue;

    const lapDuration = Number(lapMeta.time);
    if (!Number.isFinite(lapDuration) || lapDuration <= 0) {
      timelines.set(range.id, { segments: [], lapDuration: 0 });
      continue;
    }

    const { positionChanges, firstPosition, lastPosition } = deriveLapPositionChanges(
      lapMeta.lapEvents ?? [],
      lapDuration
    );
    const startPositionChange = positionChanges.find((change) => change.atS === 0);
    const startPosition =
      startPositionChange?.position ??
      (carryPosition > 0 ? carryPosition : firstPosition ?? 0);

    const segments = buildPositionSegments({
      positionChanges,
      lapDurationS: lapDuration,
      carryPosition,
      startPosition,
    });
    timelines.set(range.id, { segments, lapDuration });

    const nextCarry =
      Number.isFinite(lastPosition) && (lastPosition as number) > 0
        ? (lastPosition as number)
        : startPosition;
    carryPosition = Math.max(0, Math.round(nextCarry));
  }

  return timelines;
}

export function positionForLapElapsed(
  timeline: LapPositionTimeline | null | undefined,
  lapElapsed: number
): number | null {
  if (!timeline || timeline.segments.length === 0) return null;
  const t = clamp(lapElapsed, 0, timeline.lapDuration);
  const segments = timeline.segments;

  for (const segment of segments) {
    if (t >= segment.start && t < segment.end) {
      return segment.position > 0 ? segment.position : null;
    }
  }

  const last = segments[segments.length - 1];
  if (last && t >= last.end - 1e-6) {
    return last.position > 0 ? last.position : null;
  }

  return null;
}
