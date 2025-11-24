import { createCanvas } from "canvas";
import { lapForSessionTime, totalSessionDuration } from "../laps.js";
import type { Lap } from "../laps.js";
import { DEFAULT_OVERLAY_STYLE, type OverlayStyle } from "../renderers/types.js";
import { formatLapTime } from "../timeFormat.js";

const normalizeHex = (value: string | undefined, fallback: string) => {
  const match = value?.match(/^#?([0-9a-fA-F]{6})$/);
  const hex = match ? match[1] : fallback.replace("#", "");
  return `#${hex.toLowerCase()}`;
};

export function createOverlayDrawer(params: {
  width: number;
  height: number;
  fps: number;
  laps: Lap[];
  startOffsetS: number;
  style: OverlayStyle;
}) {
  const { width, height, fps, laps, startOffsetS, style } = params;

  const textColor = normalizeHex(
    style.textColor,
    DEFAULT_OVERLAY_STYLE.textColor
  );
  const boxColor = normalizeHex(
    style.boxColor,
    DEFAULT_OVERLAY_STYLE.boxColor
  );
  const boxOpacity =
    Number.isFinite(style.boxOpacity) && style.boxOpacity >= 0
      ? Math.min(1, style.boxOpacity)
      : DEFAULT_OVERLAY_STYLE.boxOpacity;
  const showLapCounter =
    style.showLapCounter ?? DEFAULT_OVERLAY_STYLE.showLapCounter;
  const showPosition =
    style.showPosition ?? DEFAULT_OVERLAY_STYLE.showPosition;
  const showCurrentLapTime =
    style.showCurrentLapTime ?? DEFAULT_OVERLAY_STYLE.showCurrentLapTime;
  const overlayPosition =
    style.overlayPosition ?? DEFAULT_OVERLAY_STYLE.overlayPosition;
  const boxWidthRatio =
    Number.isFinite(style.boxWidthRatio) && style.boxWidthRatio > 0
      ? Math.min(0.9, Math.max(0.15, style.boxWidthRatio))
      : DEFAULT_OVERLAY_STYLE.boxWidthRatio;
  const hasPositionData = showPosition && laps.some((lap) => lap.position > 0);
  const hasInfoLine = showLapCounter || hasPositionData;
  const lineCount =
    (hasInfoLine ? 1 : 0) + (showCurrentLapTime ? 1 : 0);
  const hasOverlayContent = lineCount > 0;

  const toRgba = (hex: string, alpha: number) => {
    const match = hex.match(/^#?([0-9a-fA-F]{6})$/);
    const value = match ? match[1] : DEFAULT_OVERLAY_STYLE.boxColor.replace("#", "");
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const margin = 20;
  const boxWidth = Math.floor(width * boxWidthRatio);
  const fontSize = 32;
  const lineSpacing = 8;
  const paddingY = 10;
  const boxHeight =
    lineCount * fontSize +
    Math.max(0, lineCount - 1) * lineSpacing +
    paddingY * 2;
  const boxX =
    overlayPosition.endsWith("right") && width > margin + boxWidth
      ? width - boxWidth - margin
      : margin;
  const boxY = overlayPosition.startsWith("top")
    ? margin
    : height - boxHeight - margin;
  const alignRight = overlayPosition.endsWith("right");
  const paddingX = 12;

  const sessionTotal = totalSessionDuration(laps);

  return (frameIndex: number): Buffer => {
    const t = frameIndex / fps;
    const sessionT = t - startOffsetS;

    ctx.clearRect(0, 0, width, height);

    const showOverlay = hasOverlayContent && sessionT >= 0 && sessionT <= sessionTotal;
    if (showOverlay) {
      const res = lapForSessionTime(laps, sessionT);
      if (res) {
        const { lap, lapElapsed } = res;
        const infoParts: string[] = [];
        if (showLapCounter) {
          infoParts.push(`Lap ${lap.number}/${laps.length}`);
        }
        if (hasPositionData && lap.position > 0) {
          infoParts.push(`P${lap.position}`);
        }
        const lapTimeStr = formatLapTime(lapElapsed);

        ctx.fillStyle = toRgba(boxColor, boxOpacity);
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = textColor;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textBaseline = "top";
        ctx.textAlign = alignRight ? "right" : "left";

        const textX = alignRight
          ? boxX + boxWidth - paddingX
          : boxX + paddingX;
        let textY = boxY + paddingY;

        if (hasInfoLine && infoParts.length) {
          ctx.fillText(infoParts.join("   "), textX, textY);
          textY += fontSize + lineSpacing;
        }

        if (showCurrentLapTime) {
          ctx.fillText(lapTimeStr, textX, textY);
        }
      }
    }

    return canvas.toBuffer("image/png");
  };
}
