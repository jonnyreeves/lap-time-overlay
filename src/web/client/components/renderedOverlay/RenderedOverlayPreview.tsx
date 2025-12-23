import { css } from "@emotion/react";
import { useCallback, useMemo, useState } from "react";
import { graphql, useMutation } from "react-relay";
import type { RenderedOverlayPreviewBurnOverlayMutation } from "../../__generated__/RenderedOverlayPreviewBurnOverlayMutation.graphql.js";
import { Modal } from "../Modal.js";
import {
  OverlayAppearanceControls,
  type OverlayPositionOption,
  type OverlayTextColorOption,
} from "../renderedOverlay/OverlayAppearanceControls.js";
import { recordingButtonStyles } from "../session/recordingShared.js";
import {
  RenderPreviewControls,
  type LapOption,
  type OverlayPreviewStyleInput,
} from "../renderedOverlay/RenderPreviewControls.js";
import {
  ExportSettingControls,
  type OverlayExportCodecOption,
  type OverlayExportQualityOption,
} from "../renderedOverlay/ExportSettingControls.js";

export type RecordingSummary = {
  id: string;
  description: string | null;
  lapOneOffset: number;
  status: string;
  combineProgress: number | null;
  createdAt: string;
  overlayBurned: boolean;
};

type Props = {
  recording: RecordingSummary;
  overlayRecording?: RecordingSummary | null;
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

const controlsColumnStyles = css`
  display: grid;
  gap: 12px;
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

  .inline-checkbox {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
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

export function RenderedOverlayPreview({
  recording,
  overlayRecording,
  laps,
  isOpen,
  onClose,
  onRefresh,
  onBurned,
}: Props) {
  const [textColor, setTextColor] = useState<OverlayTextColorOption>("WHITE");
  const [textSize, setTextSize] = useState(32);
  const [detailTextSize, setDetailTextSize] = useState(32);
  const [overlayPosition, setOverlayPosition] = useState<OverlayPositionOption>("BOTTOM_LEFT");
  const [backgroundOpacity, setBackgroundOpacity] = useState(60);
  const [showLapInfo, setShowLapInfo] = useState(true);
  const [showLapDeltas, setShowLapDeltas] = useState(true);
  const [quality, setQuality] = useState<OverlayExportQualityOption>("BEST");
  const [codec, setCodec] = useState<OverlayExportCodecOption>("H265");
  const [embedChapters, setEmbedChapters] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commitBurn, isBurnInFlight] =
    useMutation<RenderedOverlayPreviewBurnOverlayMutation>(BurnOverlayMutation);
  const canRenderOverlay = laps.length > 0;

  const handleTextSizeChange = useCallback(
    (nextSize: number) => {
      setTextSize(nextSize);
    },
    [textSize]
  );

  const handleDetailTextSizeChange = useCallback((nextSize: number) => {
    setDetailTextSize(nextSize);
  }, []);

  const styleInput = useMemo<OverlayPreviewStyleInput>(
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

  const overlayCombineProgress =
    overlayRecording?.combineProgress ??
    (isBurnInFlight ? 0 : recording.combineProgress);
  const overlayStatus =
    overlayRecording?.status ?? (isBurnInFlight ? "COMBINING" : recording.status);

  const encodingPercent = useMemo(
    () => progressPercent(overlayCombineProgress ?? 0),
    [overlayCombineProgress]
  );

  const isEncoding = isBurnInFlight || overlayStatus === "COMBINING";

  const handleBurnOverlay = useCallback(() => {
    if (!isOpen || recording.overlayBurned || isBurnInFlight) return;
    setError(null);
    commitBurn({
      variables: {
        input: {
          recordingId: recording.id,
          quality,
          codec,
          style: styleInput,
          embedChapters,
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
    codec,
    recording.id,
    recording.overlayBurned,
    styleInput,
    embedChapters,
  ]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rendered Overlay Preview" maxWidth="1280px">
      <div css={layoutStyles}>
        <RenderPreviewControls
          recordingId={recording.id}
          laps={laps}
          style={styleInput}
          isOpen={isOpen}
          onError={setError}
          disabled={isEncoding}
        />

        <div css={controlsColumnStyles}>
          <div css={controlsPanelStyles}>
            <div>
              <h3>{"Overlay Settings"}</h3>
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
              disabled={isEncoding}
            />
          </div>

          <div css={controlsPanelStyles}>
            <ExportSettingControls
              quality={quality}
              onQualityChange={setQuality}
              codec={codec}
              onCodecChange={setCodec}
              embedChapters={embedChapters}
              onEmbedChaptersChange={setEmbedChapters}
              isEncoding={isEncoding}
              encodingPercent={encodingPercent}
              error={error}
              overlayBurned={recording.overlayBurned}
              canRenderOverlay={canRenderOverlay}
              onBurn={handleBurnOverlay}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
