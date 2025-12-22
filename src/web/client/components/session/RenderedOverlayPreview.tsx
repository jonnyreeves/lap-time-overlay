import { css } from "@emotion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { graphql, useMutation } from "react-relay";
import type { RenderedOverlayPreviewGenerateMutation } from "../../__generated__/RenderedOverlayPreviewGenerateMutation.graphql.js";
import type { RenderedOverlayPreviewBurnOverlayMutation } from "../../__generated__/RenderedOverlayPreviewBurnOverlayMutation.graphql.js";
import { formatLapTimeSeconds } from "../../utils/lapTime.js";
import { Modal } from "../Modal.js";
import {
  OverlayAppearanceControls,
  type OverlayPositionOption,
  type OverlayTextColorOption,
} from "./OverlayAppearanceControls.js";
import { recordingButtonStyles } from "./recordingShared.js";

type LapOption = {
  id: string;
  lapNumber: number;
  time: number;
  start: number;
};

type OverlayExportQualityOption = "BEST" | "GOOD";

type RecordingSummary = {
  id: string;
  description: string | null;
  lapOneOffset: number;
  status: string;
  combineProgress: number | null;
  createdAt: string;
  overlayBurned: boolean;
};

type PreviewState = {
  previewUrl: string;
  requestedOffsetSeconds: number;
  usedOffsetSeconds: number;
  previewTimeSeconds: number;
  lapNumber: number;
  generatedAt: string;
};

type Props = {
  recording: RecordingSummary;
  laps: LapOption[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  onBurned?: () => void;
};

function progressPercent(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

const RenderOverlayPreviewMutation = graphql`
  mutation RenderedOverlayPreviewGenerateMutation($input: RenderOverlayPreviewInput!) {
    renderOverlayPreview(input: $input) {
      preview {
        id
        previewUrl
        requestedOffsetSeconds
        usedOffsetSeconds
        previewTimeSeconds
        lapId
        lapNumber
        recordingId
        generatedAt
      }
    }
  }
`;

const BurnOverlayMutation = graphql`
  mutation RenderedOverlayPreviewBurnOverlayMutation($input: BurnRecordingOverlayInput!) {
    burnRecordingOverlay(input: $input) {
      recording {
        id
        overlayBurned
        updatedAt
      }
    }
  }
`;

const layoutStyles = css`
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;

  @media (min-width: 960px) {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  }
`;

const previewFrameStyles = css`
  border-radius: 14px;
  border: 1px solid #1f2937;
  background: radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.25), transparent 45%),
    radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.2), transparent 35%),
    #0b1021;
  min-height: clamp(240px, 45vh, 460px);
  max-height: 70vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    max-height: 100%;
    display: block;
    object-fit: contain;
    background: #0b1021;
    border-radius: 12px;
  }

  .placeholder {
    color: #cbd5e1;
    text-align: center;
    padding: 20px;
    max-width: 360px;
    line-height: 1.5;
  }

  .loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #e2e8f0;
    font-weight: 700;
    background: rgba(15, 23, 42, 0.58);
    letter-spacing: 0.02em;
  }
`;

const controlsPanelStyles = css`
  border: 1px solid #e2e8f4;
  border-radius: 12px;
  background: #f8fafc;
  padding: 14px 16px 16px;
  display: grid;
  gap: 10px;
  align-self: stretch;

  h3 {
    margin: 0;
    font-size: 1.05rem;
    color: #0f172a;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-weight: 600;
    color: #0f172a;
    font-size: 0.95rem;
  }

  select {
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    background: #fff;
    font-size: 0.95rem;
  }

  .muted {
    color: #64748b;
    font-size: 0.95rem;
  }
`;

const selectorRowStyles = css`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const footerStyles = css`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
`;

const badgeStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 10px;
  background: #eef2ff;
  color: #312e81;
  font-weight: 700;
  font-size: 0.9rem;
`;

const primaryButtonStyles = css`
  background: linear-gradient(90deg, #4f46e5, #6366f1);
  color: #fff;
  border: 1px solid #6366f1;
  box-shadow: 0 12px 28px rgba(79, 70, 229, 0.25);
  font-weight: 700;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const progressSectionStyles = css`
  display: grid;
  gap: 6px;
`;

const progressHeaderStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  color: #0f172a;
`;

const progressBarStyles = css`
  height: 10px;
  border-radius: 6px;
  background: #e2e8f4;
  overflow: hidden;
  position: relative;

  .fill {
    background: linear-gradient(90deg, #4f46e5, #0ea5e9);
    height: 100%;
    transition: width 0.25s ease;
  }
`;

export function RenderedOverlayPreview({
  recording,
  laps,
  isOpen,
  onClose,
  onRefresh,
  onBurned,
}: Props) {
  const lapOptions = useMemo(
    () => [...laps].sort((a, b) => a.lapNumber - b.lapNumber),
    [laps]
  );

  const [selectedLapId, setSelectedLapId] = useState<string | null>(
    lapOptions[0]?.id ?? null
  );
  const [offsetSeconds, setOffsetSeconds] = useState(0);
  const [textColor, setTextColor] = useState<OverlayTextColorOption>("WHITE");
  const [textSize, setTextSize] = useState(32);
  const [detailTextSize, setDetailTextSize] = useState(32);
  const [overlayPosition, setOverlayPosition] = useState<OverlayPositionOption>("BOTTOM_LEFT");
  const [backgroundOpacity, setBackgroundOpacity] = useState(60);
  const [showLapInfo, setShowLapInfo] = useState(true);
  const [showLapDeltas, setShowLapDeltas] = useState(true);
  const [quality, setQuality] = useState<OverlayExportQualityOption>("BEST");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commitPreview, isPreviewInFlight] =
    useMutation<RenderedOverlayPreviewGenerateMutation>(RenderOverlayPreviewMutation);
  const [commitBurn, isBurnInFlight] =
    useMutation<RenderedOverlayPreviewBurnOverlayMutation>(BurnOverlayMutation);

  useEffect(() => {
    if (!lapOptions.length) {
      setSelectedLapId(null);
      return;
    }
    if (!selectedLapId || !lapOptions.some((lap) => lap.id === selectedLapId)) {
      setSelectedLapId(lapOptions[0]?.id ?? null);
      setOffsetSeconds(0);
    }
  }, [lapOptions, selectedLapId]);

  const selectedLap = useMemo(
    () => lapOptions.find((lap) => lap.id === selectedLapId) ?? null,
    [lapOptions, selectedLapId]
  );

  const previewSrc = useMemo(() => {
    if (!preview?.previewUrl) return null;
    const suffix = preview.generatedAt ? `?t=${encodeURIComponent(preview.generatedAt)}` : "";
    return `${preview.previewUrl}${suffix}`;
  }, [preview]);

  const encodingPercent = useMemo(
    () => progressPercent(recording.combineProgress ?? 0),
    [recording.combineProgress]
  );

  const isEncoding = isBurnInFlight || recording.status === "COMBINING";

  const handleTextSizeChange = useCallback(
    (nextSize: number) => {
      setTextSize(nextSize);
      setDetailTextSize((current) => (current === textSize ? nextSize : current));
    },
    [textSize]
  );

  const handleDetailTextSizeChange = useCallback((nextSize: number) => {
    setDetailTextSize(nextSize);
  }, []);

  const styleInput = useMemo(
    () => ({
      textColor,
      textSize,
      detailTextSize,
      overlayPosition,
      boxOpacity: Math.max(0, Math.min(1, backgroundOpacity / 100)),
      showLapCounter: showLapInfo,
      showPosition: showLapInfo,
      showLapDeltas,
    }),
    [
      backgroundOpacity,
      detailTextSize,
      overlayPosition,
      showLapDeltas,
      showLapInfo,
      textColor,
      textSize,
    ]
  );

  const requestPreview = useCallback(() => {
    if (!isOpen || !selectedLapId) return;
    setError(null);
    commitPreview({
      variables: {
        input: {
          recordingId: recording.id,
          lapId: selectedLapId,
          offsetSeconds,
          style: styleInput,
        },
      },
      onCompleted: (data) => {
        const next = data.renderOverlayPreview?.preview;
        if (!next) {
          setError("Preview unavailable.");
          return;
        }
        setPreview({
          previewUrl: next.previewUrl,
          requestedOffsetSeconds: next.requestedOffsetSeconds,
          usedOffsetSeconds: next.usedOffsetSeconds,
          previewTimeSeconds: next.previewTimeSeconds,
          lapNumber: next.lapNumber,
          generatedAt: next.generatedAt,
        });
      },
      onError: (err) => setError(err.message),
    });
  }, [commitPreview, isOpen, offsetSeconds, recording.id, selectedLapId, styleInput]);

  const handleBurnOverlay = useCallback(() => {
    if (!isOpen || recording.overlayBurned || isBurnInFlight) return;
    setError(null);
    commitBurn({
      variables: {
        input: {
          recordingId: recording.id,
          quality,
          style: styleInput,
        },
      },
      onCompleted: (data) => {
        const updated = data.burnRecordingOverlay?.recording;
        if (updated?.overlayBurned) {
          onBurned?.();
          onClose();
        }
      },
      onError: (err) => setError(err.message),
    });
    onRefresh?.();
  }, [
    commitBurn,
    isBurnInFlight,
    isOpen,
    onBurned,
    onClose,
    onRefresh,
    quality,
    recording.id,
    recording.overlayBurned,
    styleInput,
  ]);

  useEffect(() => {
    if (!isOpen || !selectedLapId || !lapOptions.length) return;
    requestPreview();
  }, [isOpen, selectedLapId, offsetSeconds, lapOptions.length, requestPreview]);

  const offsetChoices = useMemo(() => [0, 5], []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rendered Overlay Preview" maxWidth="1280px">
      <div css={layoutStyles}>
        <div css={previewFrameStyles}>
          {previewSrc ? (
            <img src={previewSrc} alt="Overlay preview" />
          ) : (
            <div className="placeholder">
              Choose a lap and offset to generate a still frame with the overlay baked in.
            </div>
          )}
          {isPreviewInFlight && <div className="loading">Rendering preview…</div>}
        </div>

        <div css={controlsPanelStyles}>
          <div>
            <h3>{recording.description || "Recording"}</h3>
            <div className="muted">
              {recording.overlayBurned
                ? "Overlay is already burned into this recording. Download it from the recordings list."
                : `Lap 1 starts at ${formatLapTimeSeconds(recording.lapOneOffset)}s in this video. Tweak the overlay styling below, choose a quality, and burn the overlay to export a new copy.`}
            </div>
          </div>

          {!lapOptions.length && (
            <div className="muted">
              Add lap times to this session to generate overlay previews.
            </div>
          )}

          <div css={selectorRowStyles}>
            <label>
              Lap
              <select
                value={selectedLapId ?? ""}
                onChange={(e) => setSelectedLapId(e.target.value || null)}
                disabled={!lapOptions.length}
              >
                {lapOptions.map((lap) => (
                  <option key={lap.id} value={lap.id}>
                    Lap {lap.lapNumber} — {formatLapTimeSeconds(lap.time)}s
                  </option>
                ))}
              </select>
            </label>

            <label>
              Offset into lap
              <select
                value={offsetSeconds}
                onChange={(e) => setOffsetSeconds(Number(e.target.value))}
                disabled={!selectedLap}
              >
                {offsetChoices.map((choice) => (
                  <option key={choice} value={choice}>
                    {choice === 1 ? "1 second" : `${choice} seconds`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <OverlayAppearanceControls
            textColor={textColor}
            textSize={textSize}
            detailTextSize={detailTextSize}
            overlayPosition={overlayPosition}
            backgroundOpacity={backgroundOpacity}
            showLapInfo={showLapInfo}
            showLapDeltas={showLapDeltas}
            onTextColorChange={setTextColor}
            onTextSizeChange={handleTextSizeChange}
            onDetailTextSizeChange={handleDetailTextSizeChange}
            onOverlayPositionChange={setOverlayPosition}
            onBackgroundOpacityChange={setBackgroundOpacity}
            onShowLapInfoChange={setShowLapInfo}
            onShowLapDeltasChange={setShowLapDeltas}
          />

          <label>
            Export quality
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as OverlayExportQualityOption)}
              disabled={recording.overlayBurned}
            >
              <option value="BEST">Best (larger file)</option>
              <option value="GOOD">Good (smaller file)</option>
            </select>
          </label>

          {preview && (
            <div css={badgeStyles}>
              Previewed at {formatLapTimeSeconds(preview.previewTimeSeconds)}s • Offset{" "}
              {formatLapTimeSeconds(preview.usedOffsetSeconds)}s
              {Math.abs(preview.usedOffsetSeconds - preview.requestedOffsetSeconds) > 1e-3
                ? " (clamped)"
                : ""}
            </div>
          )}

          {isEncoding && (
            <div css={progressSectionStyles}>
              <div css={progressHeaderStyles}>
                <span>Recording with overlay</span>
                <span>{encodingPercent}%</span>
              </div>
              <div css={progressBarStyles}>
                <div className="fill" style={{ width: `${encodingPercent}%` }} />
              </div>
            </div>
          )}

          {error && <div css={css`color: #b91c1c; font-weight: 600;`}>{error}</div>}

          <div css={footerStyles}>
            <button
              css={[recordingButtonStyles, css`font-weight: 700;`]}
              onClick={requestPreview}
              type="button"
              disabled={!selectedLap || isPreviewInFlight}
            >
              Refresh preview
            </button>
            <button
              css={[recordingButtonStyles, primaryButtonStyles]}
              type="button"
              onClick={handleBurnOverlay}
              disabled={
                recording.overlayBurned ||
                !lapOptions.length ||
                isEncoding
              }
              title={
                recording.overlayBurned
                  ? "Overlay already burned into this recording"
                  : undefined
              }
            >
              {recording.overlayBurned ? "Overlay burned" : isEncoding ? "Burning…" : "Burn overlay and export"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
