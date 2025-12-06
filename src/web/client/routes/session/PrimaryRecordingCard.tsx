import { css } from "@emotion/react";
import { useMemo, useState, type MutableRefObject } from "react";
import { graphql, useMutation } from "react-relay";
import type { PrimaryRecordingCardUpdateRecordingMutation } from "../../__generated__/PrimaryRecordingCardUpdateRecordingMutation.graphql.js";
import { Card } from "../../components/Card.js";

type Recording = {
  id: string;
  description: string | null;
  status: string;
  lapOneOffset: number;
  fps: number | null;
  createdAt: string;
};

type Props = {
  recording: Recording | null;
  onRefresh: () => void;
  videoRefs: MutableRefObject<Record<string, HTMLVideoElement | null>>;
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

export function PrimaryRecordingCard({ recording, onRefresh, videoRefs }: Props) {
  const [updateLapOffset, isUpdateLapOffsetInFlight] =
    useMutation<PrimaryRecordingCardUpdateRecordingMutation>(UpdateRecordingMutation);
  const [lapOffsetError, setLapOffsetError] = useState<string | null>(null);
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
    <Card title="Primary Video">
      <div css={cardBodyStyles}>
        {statusContent}
        {recording && recording.status === "READY" && (
          <>
            <div>
              <strong>{recording.description || "Primary recording"}</strong>
              <div>{new Date(recording.createdAt).toLocaleString()}</div>
            </div>
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
                <div className="row">
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
                    onClick={() => nudgeFrame(1)}
                    disabled={!frameStep || isUpdateLapOffsetInFlight}
                  >
                    +1 frame
                  </button>
                  <button
                    css={buttonStyles}
                    type="button"
                    onClick={markLapOneStart}
                    disabled={isUpdateLapOffsetInFlight}
                  >
                    {isUpdateLapOffsetInFlight ? "Saving..." : "Mark start from here"}
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
    </Card>
  );
}
