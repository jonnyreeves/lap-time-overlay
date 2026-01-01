import { css } from "@emotion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { graphql, useMutation } from "react-relay";
import type { PrimaryRecordingCardUpdateRecordingMutation } from "../../__generated__/PrimaryRecordingCardUpdateRecordingMutation.graphql.js";
import { Card } from "../Card.js";
import { IconButton } from "../IconButton.js";
import { primaryButtonStyles } from "./sessionOverviewStyles.ts";
import { inlineActionButtonStyles } from "../inlineActionButtons.ts";
import { formatLapTimeSeconds } from "../../utils/lapTime.js";
import { buildLapRanges, resolveLapAtTime } from "../../hooks/useLapPositionSync.js";
import { LapOverlay } from "./LapOverlay.js";
import type { LapEvent } from "./lapOverlayUtils.js";
import { UPLOAD_RECORDING_MODAL_EVENT } from "./uploadRecordingEvent.ts";

type Recording = {
  id: string;
  description: string | null;
  status: string;
  lapOneOffset: number;
  fps: number | null;
  createdAt: string;
  overlayBurned: boolean;
};

type LapWithStart = {
  id: string;
  lapNumber: number;
  time: number;
  start: number;
  isFastest: boolean;
  deltaToFastest: number | null;
  lapEvents: LapEvent[];
};

type Props = {
  recording: Recording | null;
  onRefresh: () => void;
  videoRefs: MutableRefObject<Record<string, HTMLVideoElement | null>>;
  laps?: LapWithStart[];
};

function useFullscreenToggle(targetRef: MutableRefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(document.fullscreenElement === targetRef.current);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [targetRef]);

  const toggleFullscreen = useCallback(() => {
    const node = targetRef.current;
    if (!node) return;
    if (document.fullscreenElement === node) {
      void document.exitFullscreen();
      return;
    }
    if (node.requestFullscreen) {
      void node.requestFullscreen();
    }
  }, [targetRef]);

  return { isFullscreen, toggleFullscreen };
}

function useAutohideControls(delayMs = 2500) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const bump = useCallback(() => {
    setVisible(true);
    clearTimer();
    timerRef.current = window.setTimeout(() => setVisible(false), delayMs);
  }, [clearTimer, delayMs]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return { visible, bump };
}

const cardBodyStyles = css`
  display: grid;
  gap: 12px;
`;

const emptyStateStyles = css`
  display: flex;
  justify-content: center;
  padding: 36px 0;
`;

const emptyStateButtonStyles = css`
  padding: 12px 32px;
  border-radius: 12px;
  box-shadow: 0 15px 25px rgba(15, 23, 42, 0.25);
  font-size: 1rem;
  font-weight: 600;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
`;

const previewStyles = css`
  width: 100%;
  max-width: 520px;
  border-radius: 12px;
  border: 1px solid #e2e8f4;
  overflow: hidden;
  background: #0b1021;
  position: relative;
  isolation: isolate;

  video {
    width: 100%;
    display: block;
    max-height: 320px;
    object-fit: cover;
    background: #0f172a;
  }

  &:fullscreen,
  &:-webkit-full-screen {
    background: #000;
    border: 0;
    box-shadow: none;
    display: flex;
    align-items: center;
    justify-content: center;

    video {
      max-height: 100vh;
      max-width: 100vw;
      object-fit: contain;
    }
  }
`;

const lapOffsetControlsStyles = css`
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e2e8f4;
  border-radius: 12px;
  background: #f8fafc;

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
  }

  .hint {
    color: #475569;
    font-size: 0.95rem;
  }
`;

const buttonStyles = css`
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #d7deed;
  background: #fff;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: #eef2ff;
    border-color: #cbd5e1;
  }

  &:disabled {
    background: #e2e8f4;
    color: #94a3b8;
    cursor: not-allowed;
  }
`;

const lapNavigatorStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 10px 0 4px;

  .current {
    font-weight: 700;
    color: #0f172a;
    min-width: 80px;
    text-align: center;
  }
`;

const lapNavigatorButtonStyles = css`
  ${buttonStyles};
  min-width: 110px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

const expandButtonStyles = css`
  font-weight: 700;
  padding: 8px 14px;
`;

const modalOverlayStyles = css`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  z-index: 1200;
`;

const modalContentStyles = css`
  width: min(1400px, 98vw);
  max-height: 92vh;
  background: #0b1021;
  border-radius: 16px;
  border: 1px solid #1f2937;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.55);
  padding: 16px;
  display: grid;
  gap: 14px;
  overflow: auto;
`;

const modalHeaderStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #e2e8f0;

  p {
    margin: 0;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
`;

const modalCloseButtonStyles = css`
  ${buttonStyles}
  background: #0f172a;
  color: #e2e8f0;
  border-color: #1f2937;

  &:hover {
    background: #111827;
    border-color: #334155;
  }
`;

const expandedVideoStyles = css`
  border-radius: 12px;
  border: 1px solid #1f2937;
  overflow: hidden;
  background: #000;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.4);
  position: relative;
  isolation: isolate;

  video {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    max-height: 70vh;
    display: block;
    object-fit: contain;
    background: #000;
  }

  &:fullscreen,
  &:-webkit-full-screen {
    background: #000;
    border: 0;
    box-shadow: none;
    display: flex;
    align-items: center;
    justify-content: center;

    video {
      max-height: 100vh;
      max-width: 100vw;
      object-fit: contain;
      background: #000;
    }
  }
`;

const expandedLayoutStyles = css`
  display: grid;
  grid-template-columns: minmax(0, 4fr) minmax(280px, 1fr);
  gap: 14px;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const lapsPanelStyles = css`
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 10px;
  color: #e2e8f0;
  min-width: 280px;

  @media (max-width: 1100px) {
    max-height: 60vh;
    overflow: auto;
  }
`;

const lapsHeaderStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  p {
    margin: 0;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .pill {
    padding: 4px 8px;
    border-radius: 999px;
    background: #111827;
    border: 1px solid #1f2937;
    font-size: 0.85rem;
  }
`;

const lapsListStyles = css`
  display: grid;
  gap: 8px;
  max-height: 60vh;
  overflow: auto;
  padding-right: 4px;
`;

const lapRowStyles = css`
  border: 1px solid #1f2937;
  border-radius: 10px;
  padding: 10px;
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.08), rgba(30, 41, 59, 0.6));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .lap-meta {
    display: grid;
    gap: 4px;
  }

  .lap-number {
    font-weight: 700;
    color: #e2e8f0;
  }

  .lap-time {
    color: #cbd5e1;
    font-size: 0.95rem;
  }
`;

const activeLapRowStyles = css`
  border-color: #22d3ee;
  box-shadow: 0 10px 30px rgba(34, 211, 238, 0.2);
`;

const fastestLapPillStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 4px 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, #22d3ee, #0ea5e9);
  color: #0b1021;
  font-weight: 700;
  font-size: 0.85rem;
  box-shadow: 0 10px 30px rgba(14, 165, 233, 0.3);
`;

const fastestLapDotStyles = css`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #0b1021;
  opacity: 0.7;
`;

const lapTimeRowStyles = css`
  display: flex;
  align-items: baseline;
  gap: 8px;

  .lap-delta {
    color: #94a3b8;
    font-size: 0.9rem;
  }
`;

const lapTitleRowStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const lapJumpButtonStyles = css`
  ${buttonStyles}
  background: #111827;
  color: #e2e8f0;
  border-color: #1f2937;

  &:hover {
    background: #1f2937;
    border-color: #334155;
  }

  &:disabled {
    background: #0f172a;
    color: #64748b;
    border-color: #1f2937;
  }
`;

const lapHintStyles = css`
  margin: 0;
  color: #94a3b8;
  font-size: 0.95rem;
`;

const fullscreenButtonStyles = css`
  ${buttonStyles};
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 3;
  background: rgba(15, 23, 42, 0.75);
  color: #e2e8f0;
  border-color: #1f2937;
  padding: 6px 10px;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  opacity: 0.95;
  transition: opacity 0.25s ease;

  &:hover {
    background: rgba(15, 23, 42, 0.9);
    opacity: 1;
  }

  &[data-visible="false"] {
    opacity: 0;
    pointer-events: none;
  }

  &:focus-visible {
    opacity: 1;
  }
`;

const fullscreenNavStyles = css`
  position: absolute;
  top: 52px;
  left: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  z-index: 3;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.25s ease;

  &[data-visible="false"] {
    opacity: 0;
    pointer-events: none;
  }

  button {
    pointer-events: auto;
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid #1f2937;
    background: rgba(15, 23, 42, 0.78);
    color: #e2e8f0;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    transition: background-color 0.2s ease, border-color 0.2s ease;

    &:hover:enabled {
      background: rgba(15, 23, 42, 0.95);
      border-color: #334155;
    }

    &:disabled {
      color: #94a3b8;
      border-color: #334155;
      background: rgba(15, 23, 42, 0.5);
      cursor: not-allowed;
    }
  }
`;
const UpdateRecordingMutation = graphql`
  mutation PrimaryRecordingCardUpdateRecordingMutation($input: UpdateTrackRecordingInput!) {
    updateTrackRecording(input: $input) {
      recording {
        id
        lapOneOffset
        fps
        updatedAt
      }
    }
  }
`;

function formatSeconds(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "0.000";
  return value.toFixed(3);
}

const LAP_EPSILON = 0.05;


export function PrimaryRecordingCard({ recording, onRefresh, videoRefs, laps }: Props) {
  const [updateLapOffset, isUpdateLapOffsetInFlight] =
    useMutation<PrimaryRecordingCardUpdateRecordingMutation>(UpdateRecordingMutation);
  const [lapOffsetError, setLapOffsetError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedStartTime, setExpandedStartTime] = useState(0);
  const [activeLapId, setActiveLapId] = useState<string | null>(null);
  const [activeIsPastEnd, setActiveIsPastEnd] = useState(false);
  const [previewLapId, setPreviewLapId] = useState<string | null>(null);
  const [previewIsPastEnd, setPreviewIsPastEnd] = useState(false);
  const lastJumpRef = useRef<{ id: string | null; at: number }>({ id: null, at: 0 });
  const expandedVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const expandedContainerRef = useRef<HTMLDivElement | null>(null);
  const frameStep = useMemo(() => {
    if (!recording?.fps || recording.fps <= 0) return null;
    return 1 / recording.fps;
  }, [recording?.fps]);
  const { isFullscreen: isPreviewFullscreen, toggleFullscreen: togglePreviewFullscreen } =
    useFullscreenToggle(previewContainerRef);
  const { isFullscreen: isExpandedFullscreen, toggleFullscreen: toggleExpandedFullscreen } =
    useFullscreenToggle(expandedContainerRef);
  const {
    visible: previewControlsVisible,
    bump: bumpPreviewControls,
  } = useAutohideControls();
  const {
    visible: expandedControlsVisible,
    bump: bumpExpandedControls,
  } = useAutohideControls();

  function nudgeFrame(direction: -1 | 1) {
    if (!recording || !frameStep) return;
    const video = videoRefs.current[recording.id];
    if (!video) return;
    const duration = Number.isFinite(video.duration) ? video.duration : null;
    const current = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const nextTime = Math.max(0, current + direction * frameStep);
    const clamped = duration != null ? Math.min(duration, nextTime) : nextTime;
    video.currentTime = clamped;
  }

  function markLapOneStart() {
    if (!recording || isUpdateLapOffsetInFlight) return;
    const video = videoRefs.current[recording.id];
    if (!video) {
      setLapOffsetError("Load the video before marking the Lap 1 start.");
      return;
    }
    const offset = Math.max(0, Number.isFinite(video.currentTime) ? video.currentTime : 0);
    setLapOffsetError(null);
    updateLapOffset({
      variables: { input: { id: recording.id, lapOneOffset: offset } },
      onCompleted: () => {
        setLapOffsetError(null);
        onRefresh();
      },
      onError: (err) => {
        setLapOffsetError(err.message);
      },
    });
  }

  function openExpanded() {
    if (!recording || recording.status !== "READY") return;
    const preview = videoRefs.current[recording.id];
    const startTime =
      preview && Number.isFinite(preview.currentTime) ? preview.currentTime : 0;
    setExpandedStartTime(startTime);
    setIsExpanded(true);
    bumpExpandedControls();
  }

  function closeExpanded() {
    if (recording) {
      const preview = videoRefs.current[recording.id];
      const expanded = expandedVideoRef.current;
      if (
        preview &&
        expanded &&
        Number.isFinite(expanded.currentTime) &&
        expanded.currentTime >= 0
      ) {
        preview.currentTime = expanded.currentTime;
      }
      expanded?.pause();
      preview?.pause();
    }
    setIsExpanded(false);
  }

function jumpToLapStart(lapStart: number, lapId?: string) {
  if (!recording || recording.status !== "READY" || recording.lapOneOffset <= 0) return;
  if (lapId) {
    lastJumpRef.current = { id: lapId, at: performance.now() };
    setPreviewLapId(lapId);
    setActiveLapId((current) => current ?? lapId);
  } else {
    lastJumpRef.current = { id: null, at: performance.now() };
  }
  const target = Math.max(0, recording.lapOneOffset + lapStart);
  const videos: Array<HTMLVideoElement | null> = [
    expandedVideoRef.current,
    videoRefs.current[recording.id],
  ];

  const seekVideo = (video: HTMLVideoElement) => {
    const performSeek = () => {
      video.pause();
      video.currentTime = target;
    };
    if (video.readyState >= 1) {
      performSeek();
      return;
    }
    const handler = () => {
      performSeek();
      video.removeEventListener("loadedmetadata", handler);
      video.removeEventListener("loadeddata", handler);
    };
    video.addEventListener("loadedmetadata", handler);
    video.addEventListener("loadeddata", handler);
    video.load();
  };

  videos.forEach((video) => {
    if (!video) return;
    seekVideo(video);
  });
}

  useEffect(() => {
    if (!isExpanded) return;
    const video = expandedVideoRef.current;
    if (!video) return;

    const applyStartTime = () => {
      const clampedStart = Number.isFinite(expandedStartTime) ? expandedStartTime : 0;
      video.currentTime = clampedStart;
    };

    if (video.readyState >= 1) {
      applyStartTime();
      return;
    }

    video.addEventListener("loadedmetadata", applyStartTime);
    return () => {
      video.removeEventListener("loadedmetadata", applyStartTime);
    };
  }, [expandedStartTime, isExpanded]);

  const lapJumpMessage = (() => {
    if (!recording) return "Add a primary recording to sync lap jumps.";
    if (recording.status !== "READY") return "Primary recording must finish processing to enable lap jumps.";
    if (recording.lapOneOffset <= 0) return "Set the Lap 1 start time on the primary recording to enable jumping.";
    return null;
  })();

  const lapRanges = useMemo(
    () => buildLapRanges(laps ?? [], recording?.lapOneOffset ?? 0),
    [laps, recording?.lapOneOffset]
  );

  const lapLookup = useMemo(() => {
    return new Map((laps ?? []).map((lap) => [lap.id, lap]));
  }, [laps]);
  const orderedLapRanges = useMemo(
    () => [...lapRanges].sort((a, b) => a.start - b.start),
    [lapRanges]
  );
  const buildNavState = useCallback(
    (lapId: string | null, isPastEnd: boolean) => {
      const lastIndex = orderedLapRanges.length - 1;
      if (lastIndex < 0) {
        return { hasPrev: false, hasNext: false, prevIndex: 0, nextIndex: 0 };
      }
      const index = orderedLapRanges.findIndex((lap) => lap.id === lapId);
      const fallbackIndex = isPastEnd ? lastIndex : 0;
      const effectiveIndex = index >= 0 ? index : fallbackIndex;
      const prevIndex = Math.max(0, effectiveIndex - 1);
      const nextIndex = Math.min(lastIndex, effectiveIndex + 1);
      const hasPrev = effectiveIndex > 0;
      const hasNext = !isPastEnd && effectiveIndex < lastIndex;
      return { hasPrev, hasNext, prevIndex, nextIndex };
    },
    [orderedLapRanges]
  );
  const previewNav = useMemo(
    () => buildNavState(previewLapId, previewIsPastEnd),
    [buildNavState, previewLapId, previewIsPastEnd]
  );
  const expandedNav = useMemo(
    () => buildNavState(activeLapId, activeIsPastEnd),
    [buildNavState, activeLapId, activeIsPastEnd]
  );

  const lapOverlayEnabled = Boolean(
    recording?.status === "READY" &&
      (recording?.lapOneOffset ?? 0) > 0 &&
      orderedLapRanges.length > 0
  );
  const lapOverlayVisible = lapOverlayEnabled && !recording?.overlayBurned;
  const getPreviewVideo = useCallback(
    () => (recording ? videoRefs.current[recording.id] ?? null : null),
    [recording, videoRefs]
  );
  const getExpandedVideo = useCallback(() => expandedVideoRef.current, [expandedVideoRef]);
  const getActiveVideo = useCallback(() => {
    const expanded = isExpanded ? getExpandedVideo() : null;
    if (expanded) return expanded;
    return getPreviewVideo();
  }, [getExpandedVideo, getPreviewVideo, isExpanded]);
  const overlayFullscreenLabel = (isFullscreen: boolean) =>
    isFullscreen ? "Exit fullscreen" : "Fullscreen";
  const previewButtonVisible = previewControlsVisible;
  const expandedButtonVisible = expandedControlsVisible;
  const showPreviewFullscreenNav =
    isPreviewFullscreen && lapOverlayEnabled && orderedLapRanges.length > 0;
  const showExpandedFullscreenNav =
    isExpanded &&
    isExpandedFullscreen &&
    lapOverlayEnabled &&
    orderedLapRanges.length > 0;

  useEffect(() => {
    if (isPreviewFullscreen) bumpPreviewControls();
  }, [bumpPreviewControls, isPreviewFullscreen]);

  useEffect(() => {
    if (isExpandedFullscreen) bumpExpandedControls();
  }, [bumpExpandedControls, isExpandedFullscreen]);

  useEffect(() => {
    if (recording?.status === "READY") {
      bumpPreviewControls();
    }
  }, [bumpPreviewControls, recording?.status]);

  useEffect(() => {
    const handleSpaceToggle = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.key !== " ") return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        const isFormField =
          tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
        if (isFormField) return;
      }
      const activeElement = document.activeElement as HTMLElement | null;
      if (activeElement && activeElement.tagName.toLowerCase() !== "video") {
        activeElement.blur();
      }
      const video = getActiveVideo();
      if (!video) return;
      event.preventDefault();
      event.stopPropagation();
      if (video.paused) {
        void video.play();
      } else {
        video.pause();
      }
    };

    window.addEventListener("keydown", handleSpaceToggle, { capture: true });
    return () => window.removeEventListener("keydown", handleSpaceToggle, { capture: true });
  }, [getActiveVideo]);

  useEffect(() => {
    const handleArrowStep = (event: KeyboardEvent) => {
      if (event.code !== "ArrowLeft" && event.code !== "ArrowRight") return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        const isFormField =
          tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
        if (isFormField) return;
      }

      const allowFrameStep = isExpanded || isPreviewFullscreen || isExpandedFullscreen;
      if (!allowFrameStep || !frameStep) return;

      const video = getActiveVideo();
      if (!video || !video.paused) return;

      event.preventDefault();
      event.stopPropagation();

      const direction = event.code === "ArrowRight" ? 1 : -1;
      const duration = Number.isFinite(video.duration) ? video.duration : null;
      const current = Number.isFinite(video.currentTime) ? video.currentTime : 0;
      const nextTime = current + direction * frameStep;
      const clamped = duration != null ? Math.min(Math.max(0, nextTime), duration) : Math.max(0, nextTime);
      video.currentTime = clamped;
    };

    window.addEventListener("keydown", handleArrowStep, { capture: true });
    return () => window.removeEventListener("keydown", handleArrowStep, { capture: true });
  }, [frameStep, getActiveVideo, isExpanded, isExpandedFullscreen, isPreviewFullscreen]);

  const canJumpToLaps = lapJumpMessage == null;

  useEffect(() => {
    if (!isExpanded) {
      setActiveLapId(null);
      setActiveIsPastEnd(false);
      return;
    }
    const video = expandedVideoRef.current;
    if (!video || lapRanges.length === 0) {
      setActiveLapId(null);
      setActiveIsPastEnd(false);
      return;
    }

    const updateActiveLap = () => {
      const current = Number.isFinite(video.currentTime) ? video.currentTime : 0;
      const now = performance.now();
      const recentJump = lastJumpRef.current.id && now - lastJumpRef.current.at < 600;
      if (recentJump && lapLookup.has(lastJumpRef.current.id!)) {
        setActiveLapId(lastJumpRef.current.id);
        setActiveIsPastEnd(false);
        return;
      }
      const match = resolveLapAtTime(lapRanges, current);
      const lastEnd =
        orderedLapRanges.length > 0 ? orderedLapRanges[orderedLapRanges.length - 1].end : null;
      const isPastEnd = lastEnd != null && current > lastEnd + LAP_EPSILON;
      setActiveLapId(match?.id ?? null);
      setActiveIsPastEnd(isPastEnd);
    };

    updateActiveLap();
    video.addEventListener("timeupdate", updateActiveLap);
    return () => {
      video.removeEventListener("timeupdate", updateActiveLap);
    };
  }, [isExpanded, lapRanges, orderedLapRanges, lapLookup]);

  useEffect(() => {
    if (!recording || recording.status !== "READY" || recording.lapOneOffset <= 0) {
      setPreviewLapId(null);
      setPreviewIsPastEnd(false);
      return;
    }
    const video = videoRefs.current[recording.id];
    if (!video || orderedLapRanges.length === 0) {
      setPreviewLapId(null);
      setPreviewIsPastEnd(false);
      return;
    }

    const updateActiveLap = () => {
      const current = Number.isFinite(video.currentTime) ? video.currentTime : 0;
      const now = performance.now();
      const recentJump = lastJumpRef.current.id && now - lastJumpRef.current.at < 600;
      if (recentJump && lapLookup.has(lastJumpRef.current.id!)) {
        setPreviewLapId(lastJumpRef.current.id);
        setPreviewIsPastEnd(false);
        return;
      }
      const match = resolveLapAtTime(orderedLapRanges, current);
      const lastEnd =
        orderedLapRanges.length > 0 ? orderedLapRanges[orderedLapRanges.length - 1].end : null;
      const isPastEnd = lastEnd != null && current > lastEnd + LAP_EPSILON;
      setPreviewLapId(match?.id ?? null);
      setPreviewIsPastEnd(isPastEnd);
    };

    updateActiveLap();
    video.addEventListener("timeupdate", updateActiveLap);
    return () => {
      video.removeEventListener("timeupdate", updateActiveLap);
    };
  }, [orderedLapRanges, recording, videoRefs, lapLookup]);

  const handleUploadCallToAction = useCallback(() => {
    if (typeof document === "undefined") {
      return;
    }
    const card = document.querySelector(".recordings-card");
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    document.dispatchEvent(new CustomEvent(UPLOAD_RECORDING_MODAL_EVENT));
  }, []);

  const statusContent = (() => {
        if (!recording) {
          return (
            <div css={emptyStateStyles}>
              <button
                css={[primaryButtonStyles, emptyStateButtonStyles]}
                type="button"
                onClick={handleUploadCallToAction}
              >
                Upload a recording
              </button>
            </div>
          );
        }
    if (recording.status !== "READY") {
      return <p>Primary recording is {recording.status.toLowerCase()}… Player will appear once ready.</p>;
    }
    return null;
  })();

  const currentLapIndex = orderedLapRanges.findIndex((lap) => lap.id === previewLapId);
  const currentLap =
    currentLapIndex >= 0 ? lapLookup.get(orderedLapRanges[currentLapIndex].id) : null;
  const hasPrevLap = currentLapIndex > 0;
  const hasNextLap =
    orderedLapRanges.length > 0 &&
    (currentLapIndex === -1 || currentLapIndex < orderedLapRanges.length - 1);
  const isPastLastLap = previewIsPastEnd;

  function jumpToLapByIndex(targetIndex: number) {
    const targetRange = orderedLapRanges[targetIndex];
    const targetLap = targetRange ? lapLookup.get(targetRange.id) : null;
    if (!targetLap) return;
    setPreviewLapId(targetLap.id);
    jumpToLapStart(targetLap.start, targetLap.id);
  }

  return (
    <Card
      title="Primary Video"
      rightHeaderContent={
        recording?.status === "READY" ? (
          <IconButton
            css={inlineActionButtonStyles}
            type="button"
            onClick={openExpanded}
            icon="↔️"
          >
            Expand
          </IconButton>
        ) : null
      }
    >
      <div css={cardBodyStyles}>
        {statusContent}
        {recording && recording.status === "READY" && (
          <>
            <div
              css={previewStyles}
              ref={previewContainerRef}
              onMouseMove={bumpPreviewControls}
              onFocus={bumpPreviewControls}
            >
              <button
                type="button"
                css={fullscreenButtonStyles}
                onClick={togglePreviewFullscreen}
                aria-label="Toggle fullscreen for primary preview"
                data-visible={previewButtonVisible}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M4 10h2V6h4V4H4v6zm0 10h6v-2H6v-4H4v6zm16-6h-2v4h-4v2h6v-6zm-6-8v2h4v4h2V6h-6z"
                    fill="currentColor"
                  />
                </svg>
                {overlayFullscreenLabel(isPreviewFullscreen)}
              </button>
              <LapOverlay
                enabled={lapOverlayVisible}
                getVideo={getPreviewVideo}
                lapRanges={orderedLapRanges}
                lapLookup={lapLookup}
                lastJumpRef={lastJumpRef}
              />
              <video
                src={`/recordings/${recording.id}`}
                preload="metadata"
                muted
                playsInline
                controls
                controlsList="nofullscreen"
                ref={(node) => {
                  videoRefs.current[recording.id] = node;
                }}
                aria-label="Primary recording preview"
              />
              {showPreviewFullscreenNav ? (
                <div
                  css={fullscreenNavStyles}
                  data-visible={previewControlsVisible}
                  aria-label="Fullscreen lap navigation"
                >
                  <button
                    type="button"
                    onClick={() => jumpToLapByIndex(previewNav.prevIndex)}
                    disabled={!previewNav.hasPrev}
                  >
                    ← Prev lap
                  </button>
                  <button
                    type="button"
                    onClick={() => jumpToLapByIndex(previewNav.nextIndex)}
                    disabled={!previewNav.hasNext}
                  >
                    Next lap →
                  </button>
                </div>
              ) : null}
            </div>
            {recording.lapOneOffset > 0 && laps?.length ? (
              <div css={lapNavigatorStyles}>
                <button
                  type="button"
                  css={lapNavigatorButtonStyles}
                  onClick={() => jumpToLapByIndex(Math.max(0, currentLapIndex - 1))}
                  disabled={!hasPrevLap}
                >
                  ← Prev lap
                </button>
                <span className="current">
                  {isPastLastLap
                    ? "Session end"
                    : currentLap
                      ? `Lap ${currentLap.lapNumber}`
                      : "Session start"}
                </span>
                <button
                  type="button"
                  css={lapNavigatorButtonStyles}
                  onClick={() => jumpToLapByIndex(Math.min(orderedLapRanges.length - 1, currentLapIndex + 1))}
                  disabled={!hasNextLap}
                >
                  Next lap →
                </button>
              </div>
            ) : null}
            <div css={lapOffsetControlsStyles}>
              <div className="row">
                <div>
                  <strong>Lap 1 start</strong>
                  <div className="hint">
                    Offset: {formatSeconds(recording.lapOneOffset)}s
                    {recording.fps ? ` • ${Math.round(recording.fps)} fps` : ""}
                  </div>
                </div>
                <div className="controls">
                  <button
                    css={buttonStyles}
                    type="button"
                    onClick={() => nudgeFrame(-1)}
                    disabled={!frameStep || isUpdateLapOffsetInFlight}
                  >
                    -1 frame
                  </button>
                  <button
                    css={buttonStyles}
                    type="button"
                    onClick={markLapOneStart}
                    disabled={isUpdateLapOffsetInFlight}
                  >
                    {isUpdateLapOffsetInFlight ? "Saving..." : "Mark start from here"}
                  </button>
                  <button
                    css={buttonStyles}
                    type="button"
                    onClick={() => nudgeFrame(1)}
                    disabled={!frameStep || isUpdateLapOffsetInFlight}
                  >
                    +1 frame
                  </button>
                </div>
              </div>
              {lapOffsetError && <div css={css`color: #b91c1c;`}>{lapOffsetError}</div>}
              {!frameStep && (
                <div className="hint">
                  Frame stepping uses the video FPS. Scrub the video, then mark the start.
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {isExpanded && recording?.status === "READY" && (
        <div
          css={modalOverlayStyles}
          onClick={closeExpanded}
          role="dialog"
          aria-modal="true"
          aria-label="Expanded primary video"
        >
          <div css={modalContentStyles} onClick={(event) => event.stopPropagation()}>
            <div css={modalHeaderStyles}>
              <p>Primary recording</p>
              <button css={modalCloseButtonStyles} type="button" onClick={closeExpanded}>
                Close
              </button>
            </div>
            <div css={expandedLayoutStyles}>
              <div
                css={expandedVideoStyles}
                ref={expandedContainerRef}
                onMouseMove={bumpExpandedControls}
                onFocus={bumpExpandedControls}
              >
                <button
                  type="button"
                  css={fullscreenButtonStyles}
                  onClick={toggleExpandedFullscreen}
                  aria-label="Toggle fullscreen for expanded primary video"
                  data-visible={expandedButtonVisible}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 10h2V6h4V4H4v6zm0 10h6v-2H6v-4H4v6zm16-6h-2v4h-4v2h6v-6zm-6-8v2h4v4h2V6h-6z"
                      fill="currentColor"
                    />
                  </svg>
                  {overlayFullscreenLabel(isExpandedFullscreen)}
                </button>
                <LapOverlay
                  enabled={lapOverlayVisible && isExpanded}
                  getVideo={getExpandedVideo}
                  lapRanges={orderedLapRanges}
                  lapLookup={lapLookup}
                  lastJumpRef={lastJumpRef}
                />
                <video
                  src={`/recordings/${recording.id}`}
                  preload="metadata"
                  muted
                  playsInline
                  controls
                  controlsList="nofullscreen"
                  ref={expandedVideoRef}
                  aria-label="Expanded primary recording"
                />
                {showExpandedFullscreenNav ? (
                  <div
                    css={fullscreenNavStyles}
                    data-visible={expandedControlsVisible}
                    aria-label="Fullscreen lap navigation"
                  >
                    <button
                      type="button"
                      onClick={() => jumpToLapByIndex(expandedNav.prevIndex)}
                      disabled={!expandedNav.hasPrev}
                    >
                      ← Prev lap
                    </button>
                    <button
                      type="button"
                      onClick={() => jumpToLapByIndex(expandedNav.nextIndex)}
                      disabled={!expandedNav.hasNext}
                    >
                      Next lap →
                    </button>
                  </div>
                ) : null}
              </div>
              <div css={lapsPanelStyles}>
                <div css={lapsHeaderStyles}>
                  <p>Laps</p>
                  {laps?.length ? <span className="pill">{laps.length} total</span> : null}
                </div>
                {!laps?.length ? (
                  <p css={lapHintStyles}>No laps recorded for this session.</p>
                ) : (
                  <>
                    <div css={lapsListStyles}>
                      {laps.map((lap) => {
                        const lapTime = Number.isFinite(lap.time) ? lap.time : 0;
                        const isFastest = Boolean(lap.isFastest);
                        const isActive = lap.id === activeLapId;
                        const deltaToFastest =
                          typeof lap.deltaToFastest === "number" ? lap.deltaToFastest : null;
                        return (
                          <div key={lap.id} css={[lapRowStyles, isActive && activeLapRowStyles]}>
                            <div className="lap-meta">
                              <div css={lapTitleRowStyles}>
                                <span className="lap-number">Lap {lap.lapNumber}</span>
                                {isFastest ? (
                                  <span css={fastestLapPillStyles}>
                                    <span css={fastestLapDotStyles} aria-hidden />
                                    Fastest
                                  </span>
                                ) : null}
                              </div>
                              <div css={lapTimeRowStyles}>
                                <span className="lap-time">{formatLapTimeSeconds(lapTime)}s</span>
                                {deltaToFastest != null ? (
                                  <span className="lap-delta">[+{deltaToFastest.toFixed(3)}s]</span>
                                ) : null}
                              </div>
                            </div>
                            <button
                              css={lapJumpButtonStyles}
                              type="button"
                              disabled={!canJumpToLaps}
                              onClick={() => jumpToLapStart(lap.start, lap.id)}
                            >
                              Jump
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {lapJumpMessage && <p css={lapHintStyles}>{lapJumpMessage}</p>}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
