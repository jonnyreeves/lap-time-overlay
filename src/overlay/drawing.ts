import { createCanvas } from "canvas";
import { lapForSessionTime, totalSessionDuration } from "../laps.js";
import type { Lap } from "../laps.js";
import { formatLapTime } from "../timeFormat.js";

export function createOverlayDrawer(params: {
  width: number;
  height: number;
  fps: number;
  laps: Lap[];
  startOffsetS: number;
}) {
  const { width, height, fps, laps, startOffsetS } = params;

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

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = "#ffffff";
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
