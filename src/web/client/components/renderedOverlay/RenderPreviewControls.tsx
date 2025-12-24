import { css } from "@emotion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { graphql, useMutation } from "react-relay";
import type { RenderPreviewControlsGenerateMutation } from "../../__generated__/RenderPreviewControlsGenerateMutation.graphql.js";
import { formatLapTimeSeconds } from "../../utils/lapTime.js";
import { recordingButtonStyles } from "../session/recordingShared.js";
import type {
  OverlayPositionOption,
  OverlayTextColorOption,
} from "./OverlayAppearanceControls.js";

export type LapOption = {
  id: string;
  lapNumber: number;
  time: number;
  start: number;
};

export type OverlayPreviewStyleInput = {
  textColor: OverlayTextColorOption;
  textSize: number;
  detailTextSize: number;
  overlayPosition: OverlayPositionOption;
  boxOpacity: number;
  showLapCounter: boolean;
  showPosition: boolean;
  showPreviousLapTime: boolean;
  showLapDeltas: boolean;
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
  recordingId: string;
  laps: LapOption[];
  style: OverlayPreviewStyleInput;
  isOpen: boolean;
  onError: (message: string | null) => void;
  disabled?: boolean;
};

const RenderPreviewControlsMutation = graphql`
  mutation RenderPreviewControlsGenerateMutation($input: RenderOverlayPreviewInput!) {
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

const previewColumnStyles = css`
  display: grid;
  gap: 12px;
  grid-template-rows: auto 1fr;
  align-self: stretch;
`;

const selectorPanelStyles = css`
  border: 1px solid #e2e8f4;
  border-radius: 12px;
  background: #f8fafc;
  padding: 12px 14px;
  display: grid;
  gap: 10px;

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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  align-items: end;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const refreshButtonContainerStyles = css`
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;

  button {
    width: 100%;
  }
`;

const previewFrameStyles = css`
  border-radius: 14px;
  border: 1px solid #1f2937;
  background: radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.25), transparent 45%),
    radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.2), transparent 35%), #0b1021;
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

const offsetChoices = [0, 5, 10, 15, 20];

export function RenderPreviewControls({
  recordingId,
  laps,
  style,
  isOpen,
  onError,
  disabled,
}: Props) {
  const lapOptions = useMemo(
    () => [...laps].sort((a, b) => a.lapNumber - b.lapNumber),
    [laps]
  );
  const [selectedLapId, setSelectedLapId] = useState<string | null>(
    lapOptions[0]?.id ?? null
  );
  const [offsetSeconds, setOffsetSeconds] = useState(0);
  const [preview, setPreview] = useState<PreviewState | null>(null);
const [commitPreview, isPreviewInFlight] =
  useMutation<RenderPreviewControlsGenerateMutation>(RenderPreviewControlsMutation);

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

  const requestPreview = useCallback(() => {
    if (!isOpen || !selectedLapId || disabled) return;
    onError(null);
    commitPreview({
      variables: {
        input: {
          recordingId,
          lapId: selectedLapId,
          offsetSeconds,
          style,
        },
      },
      onCompleted: (data) => {
        const next = data.renderOverlayPreview?.preview;
        if (!next) {
          onError("Preview unavailable.");
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
      onError: (err) => onError(err.message),
    });
  }, [commitPreview, isOpen, offsetSeconds, recordingId, selectedLapId, style, onError, disabled]);

  useEffect(() => {
    if (!isOpen || !selectedLapId || !lapOptions.length || disabled) return;
    requestPreview();
  }, [isOpen, selectedLapId, offsetSeconds, lapOptions.length, requestPreview]);

  return (
    <div css={previewColumnStyles}>
      <div css={selectorPanelStyles}>
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
              disabled={disabled || !lapOptions.length}
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
              disabled={disabled || !selectedLap}
            >
              {offsetChoices.map((choice) => (
                <option key={choice} value={choice}>
                  {choice === 1 ? "1 second" : `${choice} seconds`}
                </option>
              ))}
            </select>
          </label>

          <div css={refreshButtonContainerStyles}>
            <button
              css={[recordingButtonStyles, css`font-weight: 700;`]}
              onClick={requestPreview}
              type="button"
              disabled={disabled || !selectedLap || isPreviewInFlight}
            >
              Refresh preview
            </button>
          </div>
        </div>
      </div>

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
    </div>
  );
}
