import { css } from "@emotion/react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { graphql, useMutation } from "react-relay";
import type { PrimaryRecordingCardUpdateRecordingMutation } from "../../__generated__/PrimaryRecordingCardUpdateRecordingMutation.graphql.js";
import { Card } from "../../components/Card.js";
import { formatLapTimeSeconds } from "../../utils/lapTime.js";

type Recording = {
  id: string;
  description: string | null;
  status: string;
  lapOneOffset: number;
  fps: number | null;
  createdAt: string;
};

type LapWithStart = {
  id: string;
  lapNumber: number;
  time: number;
  start: number;
};

type Props = {
  recording: Recording | null;
  onRefresh: () => void;
  videoRefs: MutableRefObject<Record<string, HTMLVideoElement | null>>;
  laps?: LapWithStart[];
};

const cardBodyStyles = css`
  display: grid;
  gap: 12px;
`;

const previewStyles = css`
  width: 100%;
  max-width: 520px;
  border-radius: 12px;
  border: 1px solid #e2e8f4;
  overflow: hidden;
  background: #0b1021;

  video {
    width: 100%;
    display: block;
    max-height: 320px;
    object-fit: cover;
    background: #0f172a;
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
  background: linear-gradient(135deg, #0b1021, #0f172a);
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.4);

  video {
    width: 100%;
    height: min(78vh, 80vw);
    display: block;
    object-fit: contain;
    background: #0f172a;
  }
`;

const expandedLayoutStyles = css`
  display: grid;
  grid-template-columns: minmax(0, 4fr) minmax(220px, 1fr);
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

export function PrimaryRecordingCard({ recording, onRefresh, videoRefs, laps }: Props) {
  const [updateLapOffset, isUpdateLapOffsetInFlight] =
    useMutation<PrimaryRecordingCardUpdateRecordingMutation>(UpdateRecordingMutation);
  const [lapOffsetError, setLapOffsetError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedStartTime, setExpandedStartTime] = useState(0);
  const expandedVideoRef = useRef<HTMLVideoElement | null>(null);
  const frameStep = useMemo(() => {
    if (!recording?.fps || recording.fps <= 0) return null;
    return 1 / recording.fps;
  }, [recording?.fps]);

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

  function jumpToLapStart(lapStart: number) {
    if (!recording || recording.status !== "READY" || recording.lapOneOffset <= 0) return;
    const target = Math.max(0, recording.lapOneOffset + lapStart);
    const videos: Array<HTMLVideoElement | null> = [
      expandedVideoRef.current,
      videoRefs.current[recording.id],
    ];

    videos.forEach((video) => {
      if (!video) return;
      const seek = () => {
        video.pause();
        video.currentTime = target;
      };
      if (video.readyState >= 1) {
        seek();
      } else {
        video.addEventListener("loadedmetadata", seek, { once: true });
      }
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

  const canJumpToLaps = lapJumpMessage == null;

  const statusContent = (() => {
    if (!recording) {
      return <p>No primary recording yet. Upload a video and mark it as primary.</p>;
    }
    if (recording.status !== "READY") {
      return <p>Primary recording is {recording.status.toLowerCase()}… Player will appear once ready.</p>;
    }
    return null;
  })();

  return (
    <Card
      title="Primary Video"
      rightComponent={
        recording?.status === "READY" ? (
          <button css={[buttonStyles, expandButtonStyles]} type="button" onClick={openExpanded}>
            Expand
          </button>
        ) : null
      }
    >
      <div css={cardBodyStyles}>
        {statusContent}
        {recording && recording.status === "READY" && (
          <>
            <div css={previewStyles}>
              <video
                src={`/recordings/${recording.id}`}
                preload="metadata"
                muted
                playsInline
                controls
                ref={(node) => {
                  videoRefs.current[recording.id] = node;
                }}
                aria-label="Primary recording preview"
              />
            </div>
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
              <div css={expandedVideoStyles}>
                <video
                  src={`/recordings/${recording.id}`}
                  preload="metadata"
                  muted
                  playsInline
                  controls
                  ref={expandedVideoRef}
                  aria-label="Expanded primary recording"
                />
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
                        return (
                          <div key={lap.id} css={lapRowStyles}>
                            <div className="lap-meta">
                              <span className="lap-number">Lap {lap.lapNumber}</span>
                              <span className="lap-time">{formatLapTimeSeconds(lapTime)}s</span>
                            </div>
                            <button
                              css={lapJumpButtonStyles}
                              type="button"
                              disabled={!canJumpToLaps}
                              onClick={() => jumpToLapStart(lap.start)}
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
