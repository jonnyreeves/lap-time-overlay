import { css } from "@emotion/react";
import { recordingButtonStyles } from "../session/recordingShared.js";

export type OverlayExportQualityOption = "BEST" | "GOOD" | "ULTRAFAST";

export type OverlayExportCodecOption = "H265" | "H264";

type Props = {
  quality: OverlayExportQualityOption;
  onQualityChange: (next: OverlayExportQualityOption) => void;
  codec: OverlayExportCodecOption;
  onCodecChange: (next: OverlayExportCodecOption) => void;
  embedChapters: boolean;
  onEmbedChaptersChange: (checked: boolean) => void;
  isEncoding: boolean;
  encodingPercent: number;
  error: string | null;
  overlayBurned: boolean;
  canRenderOverlay: boolean;
  onBurn: () => void;
};

const exportSettingsStyles = css`
  display: grid;
  gap: 10px;
`;

const exportSectionHeaderStyles = css`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
`;

const exportOptionsRowStyles = css`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  align-items: end;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const exportButtonRowStyles = css`
  display: flex;
  justify-content: flex-end;
`;

const primaryButtonStyles = css`
  background: linear-gradient(90deg, #4f46e5, #6366f1);
  color: #fff;
  border: 1px solid #6366f1;
  box-shadow: 0 12px 28px rgba(79, 70, 229, 0.25);
  font-weight: 700;

  &:not(:disabled):hover {
    background: linear-gradient(90deg, #4338ca, #4f46e5);
    border-color: #4f46e5;
    color: #fff;
  }

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

export function ExportSettingControls({
  quality,
  onQualityChange,
  codec,
  onCodecChange,
  embedChapters,
  onEmbedChaptersChange,
  isEncoding,
  encodingPercent,
  error,
  overlayBurned,
  canRenderOverlay,
  onBurn,
}: Props) {
  const optionDisabled = overlayBurned || isEncoding;
  const buttonDisabled = overlayBurned || !canRenderOverlay || isEncoding;
  const buttonTitle = overlayBurned ? "Overlay already burned into this recording" : undefined;
  const buttonLabel = isEncoding ? "Rendering…" : "Export";

  return (
    <div css={exportSettingsStyles}>
      <div>
        <h3 css={exportSectionHeaderStyles}>Export Settings</h3>
      </div>

      <div css={exportOptionsRowStyles}>
        <label>
          Export quality
          <select
            value={quality}
            onChange={(event) => onQualityChange(event.target.value as OverlayExportQualityOption)}
            disabled={optionDisabled}
          >
            <option value="BEST">Best (larger file)</option>
            <option value="GOOD">Good (smaller file)</option>
            <option value="ULTRAFAST">Ultra-fast (fastest preset)</option>
          </select>
        </label>

        <label>
          Codec
          <select
            value={codec}
            onChange={(event) => onCodecChange(event.target.value as OverlayExportCodecOption)}
            disabled={optionDisabled}
          >
            <option value="H265">H.265 (default)</option>
            <option value="H264">H.264</option>
          </select>
        </label>
      </div>

      <label className="inline-checkbox">
        <input
          type="checkbox"
          checked={embedChapters}
          onChange={(event) => onEmbedChaptersChange(event.target.checked)}
          disabled={optionDisabled}
        />
        <span>Embed lap chapters in the MP4</span>
      </label>

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

      <div css={exportButtonRowStyles}>
        <button
          css={[recordingButtonStyles, primaryButtonStyles]}
          type="button"
          onClick={onBurn}
          disabled={buttonDisabled}
          title={buttonTitle}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
