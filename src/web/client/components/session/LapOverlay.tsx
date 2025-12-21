import { css } from "@emotion/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
} from "react";
import { computeLapPosition, type LapRange } from "../../hooks/useLapPositionSync.js";
import { formatStopwatchTime } from "../../utils/lapTime.js";

type LapOverlayProps = {
  enabled: boolean;
  getVideo: () => HTMLVideoElement | null;
  lapRanges: LapRange[];
  lapLookup: Map<
    string,
    {
      lapNumber: number;
      time?: number | null;
      isFastest?: boolean | null;
    }
  >;
  lastJumpRef: MutableRefObject<{ id: string | null; at: number }>;
};

type OverlayState = {
  lapId: string | null;
  lapElapsed: number;
  isPastEnd: boolean;
};

type PreviousLapState = {
  lapNumber: number;
  lapTime: number;
  deltaToPrior: number | null;
  tone: "fastest" | "faster" | "slower" | "neutral";
};

const overlayStyles = css`
  position: absolute;
  top: calc(10px * var(--lap-overlay-scale, 1));
  right: calc(10px * var(--lap-overlay-scale, 1));
  color: #ffd500;
  pointer-events: none;
  display: grid;
  gap: calc(4px * var(--lap-overlay-scale, 1));
  z-index: 2;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);
  justify-items: end;
  background: rgba(0, 0, 0, 0.6);
  padding: calc(8px * var(--lap-overlay-scale, 1)) calc(10px * var(--lap-overlay-scale, 1));
  border-radius: calc(8px * var(--lap-overlay-scale, 1));
  transform-origin: top right;

  .lap-label {
    font-size: calc(15px * var(--lap-overlay-scale, 1));
    letter-spacing: 0.01em;
    line-height: 1.2;
  }

  .lap-time {
    font-size: calc(20px * var(--lap-overlay-scale, 1));
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.01em;
  }

  .current-lap {
    display: grid;
    gap: calc(2px * var(--lap-overlay-scale, 1));
    justify-items: end;
  }

  .previous-lap {
    display: grid;
    gap: calc(2px * var(--lap-overlay-scale, 1));
    justify-items: end;
    padding-top: calc(6px * var(--lap-overlay-scale, 1));
    margin-top: calc(2px * var(--lap-overlay-scale, 1));
    border-top: 1px solid rgba(255, 255, 255, 0.18);
    color: var(--previous-lap-color, #e2e8f0);
  }

  .previous-lap[data-tone="faster"] {
    --previous-lap-color: #22c55e;
  }

  .previous-lap[data-tone="slower"] {
    --previous-lap-color: #ef4444;
  }

  .previous-lap[data-tone="fastest"] {
    --previous-lap-color: #a855f7;
  }

  .previous-label {
    font-size: calc(12px * var(--lap-overlay-scale, 1));
    letter-spacing: 0.01em;
  }

  .previous-time {
    font-size: calc(16px * var(--lap-overlay-scale, 1));
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.01em;
  }

  .previous-delta {
    margin-left: calc(6px * var(--lap-overlay-scale, 1));
    font-size: calc(14px * var(--lap-overlay-scale, 1));
  }

  .delta-stack {
    display: grid;
    gap: calc(4px * var(--lap-overlay-scale, 1));
    justify-items: end;
    margin-top: calc(4px * var(--lap-overlay-scale, 1));
  }

  .delta-row {
    display: inline-flex;
    align-items: baseline;
    gap: calc(8px * var(--lap-overlay-scale, 1));
  }

  .delta-label {
    font-size: calc(12px * var(--lap-overlay-scale, 1));
    letter-spacing: 0.01em;
    color: #cbd5e1;
  }

  .delta-value {
    font-size: calc(16px * var(--lap-overlay-scale, 1));
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.01em;
    color: #e2e8f0;
  }

  .delta-value[data-trend="ahead"] {
    color: #22c55e;
  }

  .delta-value[data-trend="behind"] {
    color: #ef4444;
  }

  .delta-value[data-trend="even"] {
    color: #e2e8f0;
  }
`;

const initialState: OverlayState = {
  lapId: null,
  lapElapsed: 0,
  isPastEnd: false,
};

const PREVIOUS_LAP_DISPLAY_MS = 10_000;

function useLapOverlayState({
  enabled,
  getVideo,
  lapRanges,
  lastJumpRef,
}: Omit<LapOverlayProps, "lapLookup">): OverlayState {
  const [state, setState] = useState<OverlayState>(initialState);
  const rangeById = useMemo(() => new Map(lapRanges.map((lap) => [lap.id, lap])), [lapRanges]);

  useEffect(() => {
    if (!enabled || lapRanges.length === 0) {
      setState(initialState);
      return;
    }

    let frameId: number | null = null;

    const tick = () => {
      const video = getVideo();
      if (!video) {
        frameId = window.requestAnimationFrame(tick);
        return;
      }

      const current = Number.isFinite(video.currentTime) ? video.currentTime : 0;
      const { lapId, isPastEnd } = computeLapPosition(lapRanges, current, lastJumpRef.current);
      const lapRange = lapId ? rangeById.get(lapId) ?? null : null;
      const lapElapsed = lapRange ? Math.max(0, current - lapRange.start) : 0;

      setState((prev) => {
        if (
          prev.lapId === lapId &&
          prev.isPastEnd === isPastEnd &&
          Math.abs(prev.lapElapsed - lapElapsed) < 0.0005
        ) {
          return prev;
        }
        return { lapId: lapId ?? null, lapElapsed, isPastEnd };
      });

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => {
      if (frameId != null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [enabled, getVideo, lapRanges, lastJumpRef, rangeById]);

  return state;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatDelta(delta: number | null): string {
  if (delta == null || Number.isNaN(delta)) return "N/A";
  const sign = delta < 0 ? "-" : "+";
  return `${sign}${Math.abs(delta).toFixed(3)}`;
}

function resolveTone(delta: number | null, isFastest: boolean | null | undefined) {
  if (isFastest) return "fastest";
  if (delta == null || Math.abs(delta) < 0.0005) return "neutral";
  return delta < 0 ? "faster" : "slower";
}

function trendFromDelta(delta: number | null): "ahead" | "behind" | "even" | "none" {
  if (delta == null || Number.isNaN(delta)) return "none";
  if (Math.abs(delta) < 0.0005) return "even";
  return delta < 0 ? "ahead" : "behind";
}

export function LapOverlay({
  enabled,
  getVideo,
  lapRanges,
  lapLookup,
  lastJumpRef,
}: LapOverlayProps) {
  const { lapId, lapElapsed, isPastEnd } = useLapOverlayState({
    enabled,
    getVideo,
    lapRanges,
    lastJumpRef,
  });
  const [scale, setScale] = useState(1);
  const [previousLap, setPreviousLap] = useState<PreviousLapState | null>(null);
  const lastLapIdRef = useRef<string | null>(null);
  const hidePreviousTimerRef = useRef<number | null>(null);

  const lapIndexById = useMemo(() => {
    const byId = new Map<string, number>();
    lapRanges.forEach((lap, index) => {
      byId.set(lap.id, index);
    });
    return byId;
  }, [lapRanges]);

  const lapTimes = useMemo(() => {
    const times: number[] = [];
    lapLookup.forEach((lap) => {
      const value = typeof lap.time === "number" ? lap.time : null;
      if (value != null && Number.isFinite(value) && value > 0) {
        times.push(value);
      }
    });
    return times;
  }, [lapLookup]);

  const fastestLapTime = useMemo(() => {
    if (lapTimes.length === 0) return null;
    return lapTimes.reduce((best, value) => Math.min(best, value), Number.POSITIVE_INFINITY);
  }, [lapTimes]);

  const averageLapTime = useMemo(() => {
    if (lapTimes.length === 0) return null;
    const sum = lapTimes.reduce((acc, value) => acc + value, 0);
    return sum / lapTimes.length;
  }, [lapTimes]);

  const clearHideTimer = useCallback(() => {
    if (hidePreviousTimerRef.current != null) {
      window.clearTimeout(hidePreviousTimerRef.current);
      hidePreviousTimerRef.current = null;
    }
  }, []);

  const startHideTimer = useCallback(() => {
    clearHideTimer();
    hidePreviousTimerRef.current = window.setTimeout(() => setPreviousLap(null), PREVIOUS_LAP_DISPLAY_MS);
  }, [clearHideTimer]);

  useEffect(() => {
    if (!enabled) return;

    const baseWidth = 640;
    const minScale = 0.65;
    const maxScale = 1.4;
    let frameId: number | null = null;
    let observer: ResizeObserver | null = null;

    const updateScale = (rect: DOMRectReadOnly | DOMRect) => {
      const shortest = Math.max(1, Math.min(rect.width, rect.height || rect.width));
      const nextScale = clamp(shortest / baseWidth, minScale, maxScale);
      setScale((prev) => (Math.abs(prev - nextScale) < 0.02 ? prev : nextScale));
    };

    const attach = () => {
      const video = getVideo();
      if (!video) {
        frameId = window.requestAnimationFrame(attach);
        return;
      }

      updateScale(video.getBoundingClientRect());

      if (typeof ResizeObserver === "undefined") return;
      observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        updateScale(entry.contentRect);
      });
      observer.observe(video);
    };

    attach();
    return () => {
      if (frameId != null) {
        window.cancelAnimationFrame(frameId);
      }
      observer?.disconnect();
    };
  }, [enabled, getVideo]);

  useEffect(() => {
    return () => clearHideTimer();
  }, [clearHideTimer]);

  useEffect(() => {
    if (!enabled || isPastEnd) {
      setPreviousLap(null);
      clearHideTimer();
      lastLapIdRef.current = lapId;
      return;
    }

    const jumpIsRecent =
      Boolean(lastJumpRef.current.id) &&
      lapId === lastJumpRef.current.id &&
      performance.now() - lastJumpRef.current.at < 800;

    if (jumpIsRecent) {
      setPreviousLap(null);
      clearHideTimer();
      lastLapIdRef.current = lapId;
      return;
    }

    const lastLapId = lastLapIdRef.current;
    if (lapId && lapId !== lastLapId && lastLapId) {
      const previousLapMeta = lapLookup.get(lastLapId);
      const lapTime =
        previousLapMeta && typeof previousLapMeta.time === "number" && Number.isFinite(previousLapMeta.time)
          ? previousLapMeta.time
          : null;

      if (previousLapMeta && lapTime != null && lapTime > 0) {
        const previousIndex = lapIndexById.get(lastLapId) ?? -1;
        const priorLapId = previousIndex > 0 ? lapRanges[previousIndex - 1]?.id ?? null : null;
        const priorLapMeta = priorLapId ? lapLookup.get(priorLapId) : null;
        const priorLapTime =
          priorLapMeta && typeof priorLapMeta.time === "number" && Number.isFinite(priorLapMeta.time)
            ? priorLapMeta.time
            : null;
        const deltaToPrior =
          priorLapTime != null && priorLapTime > 0 ? lapTime - priorLapTime : null;
        const tone = resolveTone(deltaToPrior, previousLapMeta.isFastest);

        setPreviousLap({
          lapNumber: previousLapMeta.lapNumber,
          lapTime,
          deltaToPrior,
          tone,
        });
        startHideTimer();
      } else {
        setPreviousLap(null);
        clearHideTimer();
      }
    } else if (!lapId) {
      setPreviousLap(null);
      clearHideTimer();
    }

    lastLapIdRef.current = lapId;
  }, [clearHideTimer, enabled, isPastEnd, lapId, lapIndexById, lapLookup, lapRanges, lastJumpRef, startHideTimer]);

  const lapNumber = lapId ? lapLookup.get(lapId)?.lapNumber ?? null : null;
  const lapTime = lapId ? lapLookup.get(lapId)?.time ?? null : null;

  const deltaToBest = useMemo(() => {
    if (fastestLapTime == null || lapTime == null || !Number.isFinite(lapTime)) return null;
    return lapTime - fastestLapTime;
  }, [fastestLapTime, lapTime]);

  const deltaToAverage = useMemo(() => {
    if (averageLapTime == null || lapTime == null || !Number.isFinite(lapTime)) return null;
    return lapTime - averageLapTime;
  }, [averageLapTime, lapTime]);

  const bestTrend = trendFromDelta(deltaToBest);
  const averageTrend = trendFromDelta(deltaToAverage);

  if (!enabled || lapNumber == null || isPastEnd) {
    return null;
  }

  return (
    <div
      css={overlayStyles}
      style={{ "--lap-overlay-scale": scale } as CSSProperties}
      aria-label="Current lap overlay"
    >
      <div className="current-lap">
        <span className="lap-label">Lap {lapNumber}</span>
        <span className="lap-time">{formatStopwatchTime(lapElapsed)}</span>
        <div className="delta-stack" aria-label="Lap-relative deltas">
          {deltaToBest != null ? (
            <div className="delta-row">
              <span className="delta-label">Δ vs Best Lap</span>
              <span className="delta-value" data-trend={bestTrend}>
                {formatDelta(deltaToBest)}
              </span>
            </div>
          ) : null}
          {deltaToAverage != null ? (
            <div className="delta-row">
              <span className="delta-label">Δ vs Session Avg</span>
              <span className="delta-value" data-trend={averageTrend}>
                {formatDelta(deltaToAverage)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
      {previousLap ? (
        <div className="previous-lap" data-tone={previousLap.tone}>
          <span className="previous-label">Prev lap {previousLap.lapNumber}</span>
          <span className="previous-time">
            {formatStopwatchTime(previousLap.lapTime)}
            <span className="previous-delta">[{formatDelta(previousLap.deltaToPrior)}]</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
