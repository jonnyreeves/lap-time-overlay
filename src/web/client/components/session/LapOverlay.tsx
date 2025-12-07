import { css } from "@emotion/react";
import {
  useEffect,
  useMemo,
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
  lapLookup: Map<string, { lapNumber: number }>;
  lastJumpRef: MutableRefObject<{ id: string | null; at: number }>;
};

type OverlayState = {
  lapId: string | null;
  lapElapsed: number;
  isPastEnd: boolean;
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
`;

const initialState: OverlayState = {
  lapId: null,
  lapElapsed: 0,
  isPastEnd: false,
};

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

  const lapNumber = lapId ? lapLookup.get(lapId)?.lapNumber ?? null : null;

  if (!enabled || lapNumber == null || isPastEnd) {
    return null;
  }

  return (
    <div
      css={overlayStyles}
      style={{ "--lap-overlay-scale": scale } as CSSProperties}
      aria-label="Current lap overlay"
    >
      <span className="lap-label">Lap {lapNumber}</span>
      <span className="lap-time">{formatStopwatchTime(lapElapsed)}</span>
    </div>
  );
}
