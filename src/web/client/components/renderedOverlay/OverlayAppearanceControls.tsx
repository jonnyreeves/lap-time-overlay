import { css } from "@emotion/react";
import type { ChangeEvent } from "react";

export type OverlayTextColorOption = "WHITE" | "YELLOW";
export type OverlayPositionOption = "TOP_LEFT" | "TOP_RIGHT" | "BOTTOM_LEFT" | "BOTTOM_RIGHT";

type Props = {
  textColor: OverlayTextColorOption;
  textSize: number;
  detailTextSize: number;
  overlayPosition: OverlayPositionOption;
  backgroundOpacity: number;
  showLapDeltas: boolean;
  showLapCounter: boolean;
  showPosition: boolean;
  onTextColorChange: (value: OverlayTextColorOption) => void;
  onTextSizeChange: (value: number) => void;
  onDetailTextSizeChange: (value: number) => void;
  onOverlayPositionChange: (value: OverlayPositionOption) => void;
  onBackgroundOpacityChange: (value: number) => void;
  onShowLapCounterChange: (value: boolean) => void;
  onShowPositionChange: (value: boolean) => void;
  onShowLapDeltasChange: (value: boolean) => void;
  disabled?: boolean;
};

const sectionHeadingStyles = css`
  font-weight: 700;
  color: #0f172a;
  margin: 2px 0;
`;

const appearanceGridStyles = css`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
`;

const sliderFieldStyles = css`
  gap: 8px;

  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .value {
    font-variant-numeric: tabular-nums;
    color: #0f172a;
    font-weight: 600;
  }

  input[type="range"] {
    width: 100%;
    accent-color: #4f46e5;
  }
`;

const textColorOptions: { value: OverlayTextColorOption; label: string }[] = [
  { value: "WHITE", label: "White" },
  { value: "YELLOW", label: "Yellow" },
];

const textSizeOptions = [12, 14, 16, 20, 24, 32, 48, 64, 72, 96, 128, 160, 192] as const;

const overlayPositionOptions: { value: OverlayPositionOption; label: string }[] = [
  { value: "TOP_LEFT", label: "Top left" },
  { value: "TOP_RIGHT", label: "Top right" },
  { value: "BOTTOM_LEFT", label: "Bottom left" },
  { value: "BOTTOM_RIGHT", label: "Bottom right" },
];

export function OverlayAppearanceControls({
  textColor,
  textSize,
  detailTextSize,
  overlayPosition,
  backgroundOpacity,
  showLapDeltas,
  showLapCounter,
  showPosition,
  onTextColorChange,
  onTextSizeChange,
  onDetailTextSizeChange,
  onOverlayPositionChange,
  onBackgroundOpacityChange,
  onShowLapCounterChange,
  onShowPositionChange,
  onShowLapDeltasChange,
  disabled,
}: Props) {
  const handleOpacityChange = (event: ChangeEvent<HTMLInputElement>) => {
    onBackgroundOpacityChange(Number(event.target.value));
  };

  return (
    <div>
      <div css={appearanceGridStyles}>
        <label>
          Text color
          <select
            value={textColor}
            onChange={(e) => onTextColorChange(e.target.value as OverlayTextColorOption)}
            disabled={disabled}
          >
            {textColorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Overlay position
          <select
            value={overlayPosition}
            onChange={(e) => onOverlayPositionChange(e.target.value as OverlayPositionOption)}
            disabled={disabled}
          >
            {overlayPositionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Current lap time size
          <select
            value={textSize}
            onChange={(e) => onTextSizeChange(Number(e.target.value))}
            disabled={disabled}
          >
            {textSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}px
              </option>
            ))}
          </select>
        </label>

        <label>
          Lap info & Δ size
          <select
            value={detailTextSize}
            onChange={(e) => onDetailTextSizeChange(Number(e.target.value))}
            disabled={disabled}
          >
            {textSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}px
              </option>
            ))}
          </select>
        </label>

        <label css={sliderFieldStyles}>
          <div className="label-row">
            <span>Background opacity</span>
            <span className="value">{backgroundOpacity}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={backgroundOpacity}
            onChange={handleOpacityChange}
            disabled={disabled}
          />
        </label>

        <label>
          <div>
            <input
              type="checkbox"
              checked={showLapCounter}
              onChange={(e) => onShowLapCounterChange(e.target.checked)}
              disabled={disabled}
            />{" "}
            Show lap number
          </div>
        </label>
        <label>
          <div>
            <input
              type="checkbox"
              checked={showPosition}
              onChange={(e) => onShowPositionChange(e.target.checked)}
              disabled={disabled}
            />{" "}
            Show position
          </div>
        </label>

        <label>
          <div>
            <input
              type="checkbox"
              checked={showLapDeltas}
              onChange={(e) => onShowLapDeltasChange(e.target.checked)}
              disabled={disabled}
            />{" "}
            Show Δ vs best and avg
          </div>
        </label>
      </div>
    </div>
  );
}
