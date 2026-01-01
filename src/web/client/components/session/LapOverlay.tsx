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
import { overlayStyles } from "./lapOverlayStyles.js";
import {
  buildLapPositionTimelines,
  clamp,
  formatDelta,
  positionForLapElapsed,
  resolveTone,
  trendFromDelta,
  type LapEvent,
} from "./lapOverlayUtils.js";

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
      lapEvents?: LapEvent[];
    }
  >;
  lastJumpRef: MutableRefObject<{ id: string | null; at: number }>;
  showLapDeltas?: boolean;
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

export function LapOverlay({
  enabled,
  getVideo,
  lapRanges,
  lapLookup,
  lastJumpRef,
  showLapDeltas = true,
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

  const lapMeta = lapId ? lapLookup.get(lapId) ?? null : null;
  const lapNumber = lapMeta?.lapNumber ?? null;
  const lapTime = lapMeta?.time ?? null;
  const lapIsFastest = Boolean(lapMeta?.isFastest);
  const positionTimelines = useMemo(
    () => buildLapPositionTimelines(lapRanges, lapLookup),
    [lapRanges, lapLookup]
  );
  const currentPosition = useMemo(() => {
    if (!lapId) return null;
    const timeline = positionTimelines.get(lapId) ?? null;
    return positionForLapElapsed(timeline, lapElapsed);
  }, [lapElapsed, lapId, positionTimelines]);

  const deltaToBest = useMemo(() => {
    if (fastestLapTime == null || lapTime == null || !Number.isFinite(lapTime)) return null;
    return lapTime - fastestLapTime;
  }, [fastestLapTime, lapTime]);

  const deltaToAverage = useMemo(() => {
    if (averageLapTime == null || lapTime == null || !Number.isFinite(lapTime)) return null;
    return lapTime - averageLapTime;
  }, [averageLapTime, lapTime]);

  const bestTrend = trendFromDelta(deltaToBest, lapIsFastest);
  const averageTrend = trendFromDelta(deltaToAverage, lapIsFastest);

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
        <span className="lap-label">
          Lap {lapNumber}
          {currentPosition != null ? (
            <span className="lap-position">P{currentPosition}</span>
          ) : null}
        </span>
        <span className="lap-time">{formatStopwatchTime(lapElapsed)}</span>
        {showLapDeltas ? (
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
        ) : null}
      </div>
      {previousLap ? (
        <div className="previous-lap" data-tone={previousLap.tone}>
          <span className="previous-label">Prev</span>
          <span className="previous-time">
            {formatStopwatchTime(previousLap.lapTime)}
            <span className="previous-delta">[{formatDelta(previousLap.deltaToPrior)}]</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
