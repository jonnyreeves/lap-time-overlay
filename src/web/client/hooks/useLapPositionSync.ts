import { useCallback, useEffect, useState, type MutableRefObject } from "react";

export type LapForSync = {
  id: string;
  start: number;
  time: number;
};

export type LapRange = { id: string; start: number; end: number };

export const LAP_EPSILON = 0.05;
const JUMP_PERSIST_MS = 600;

export function buildLapRanges(laps: LapForSync[], lapOneOffset: number): LapRange[] {
  if (!Array.isArray(laps) || laps.length === 0) return [];
  if (!Number.isFinite(lapOneOffset) || lapOneOffset <= 0) return [];
  const baseOffset = Math.max(0, lapOneOffset);
  return laps.map((lap) => {
    const lapTime = Number.isFinite(lap.time) && lap.time > 0 ? lap.time : 0;
    const start = Math.max(0, baseOffset + lap.start);
    const end = lapTime > 0 ? start + lapTime : start + 0.001;
    return { id: lap.id, start, end };
  });
}

export function resolveLapAtTime(ranges: LapRange[], current: number): LapRange | null {
  if (ranges.length === 0) return null;
  for (let idx = ranges.length - 1; idx >= 0; idx -= 1) {
    const lap = ranges[idx];
    if (current + LAP_EPSILON >= lap.start && current <= lap.end + LAP_EPSILON) {
      return lap;
    }
  }
  if (current < ranges[0].start - LAP_EPSILON) return null;
  const lastEnd = ranges[ranges.length - 1]?.end;
  if (lastEnd != null && current > lastEnd + LAP_EPSILON) {
    return null;
  }
  for (let idx = ranges.length - 1; idx >= 0; idx -= 1) {
    if (current + LAP_EPSILON >= ranges[idx]?.start) {
      return ranges[idx];
    }
  }
  return null;
}

export function computeLapPosition(
  ranges: LapRange[],
  current: number,
  lastJump: { id: string | null; at: number }
) {
  const now = performance.now();
  const recentJump = lastJump.id && now - lastJump.at < JUMP_PERSIST_MS;
  if (recentJump) {
    return { lapId: lastJump.id, isPastEnd: false };
  }
  const match = resolveLapAtTime(ranges, current);
  const lastEnd = ranges.length > 0 ? ranges[ranges.length - 1].end : null;
  const isPastEnd = lastEnd != null && current > lastEnd + LAP_EPSILON;
  return { lapId: match?.id ?? null, isPastEnd };
}

type LapPositionSyncArgs = {
  enabled: boolean;
  getVideo: () => HTMLVideoElement | null;
  lapRanges: LapRange[];
  lastJumpRef: MutableRefObject<{ id: string | null; at: number }>;
};

export function useLapPositionSync({
  enabled,
  getVideo,
  lapRanges,
  lastJumpRef,
}: LapPositionSyncArgs) {
  const [lapId, setLapId] = useState<string | null>(null);
  const [isPastEnd, setIsPastEnd] = useState(false);

  const forceLap = useCallback(
    (id: string | null) => {
      lastJumpRef.current = { id, at: performance.now() };
      setLapId(id);
      setIsPastEnd(false);
    },
    [lastJumpRef]
  );

  useEffect(() => {
    if (!enabled) {
      setLapId(null);
      setIsPastEnd(false);
      return;
    }

    const video = getVideo();
    if (!video || lapRanges.length === 0) {
      setLapId(null);
      setIsPastEnd(false);
      return;
    }

    const updateActiveLap = () => {
      const current = Number.isFinite(video.currentTime) ? video.currentTime : 0;
      const { lapId: nextLapId, isPastEnd: pastEnd } = computeLapPosition(
        lapRanges,
        current,
        lastJumpRef.current
      );
      setLapId(nextLapId ?? null);
      setIsPastEnd(pastEnd);
    };

    updateActiveLap();
    video.addEventListener("timeupdate", updateActiveLap);
    return () => {
      video.removeEventListener("timeupdate", updateActiveLap);
    };
  }, [enabled, getVideo, lapRanges, lastJumpRef]);

  return { lapId, isPastEnd, forceLap };
}
