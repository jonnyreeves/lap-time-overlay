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
  const boxWidth = Math.floor(width * 0.45);
  const boxHeight = 90;
  const boxX = margin;
  const boxY = height - boxHeight - margin;

  const fontSize = 32;
  const lineSpacing = 8;

  const sessionTotal = totalSessionDuration(laps);

  return (frameIndex: number): Buffer => {
    const t = frameIndex / fps;
    const sessionT = t - startOffsetS;

    ctx.clearRect(0, 0, width, height);

    const showOverlay = sessionT >= 0 && sessionT <= sessionTotal;
    if (showOverlay) {
      const res = lapForSessionTime(laps, sessionT);
      if (res) {
        const { lap, lapElapsed } = res;
        const lapTimeStr = formatLapTime(lapElapsed);
        const totalLaps = laps.length;

        const line1 = `Lap ${lap.number}/${totalLaps}   P${lap.position}`;
        const line2 = lapTimeStr;

        ctx.fillStyle = toRgba(boxColor, boxOpacity);
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = textColor;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textBaseline = "top";

        const textX = boxX + 12;
        let textY = boxY + 10;

        ctx.fillText(line1, textX, textY);
        textY += fontSize + lineSpacing;
        ctx.fillText(line2, textX, textY);
      }
    }

    return canvas.toBuffer("image/png");
  };
}
