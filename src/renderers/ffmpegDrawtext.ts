import ffmpeg from "fluent-ffmpeg";
import { totalSessionDuration } from "../laps.js";
import { DEFAULT_OVERLAY_STYLE, type RenderContext } from "./types.js";

function normalizeHexColor(input: string | undefined, fallback: string): string {
  const match = input?.match(/^#?[0-9a-fA-F]{6}$/);
  if (!match) return fallback;
  return `#${input!.replace("#", "").toLowerCase()}`;
}

function clampOpacity(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, value as number));
}

function toFfmpegColor(hex: string, alpha?: number): string {
  const base = `0x${hex.replace("#", "")}`;
  if (alpha == null) return base;
  return `${base}@${alpha}`;
}

function escapeDrawtext(text: string): string {
  // Escape characters that would be interpreted as option separators in drawtext
  return text.replace(/['\\\\:,]/g, "\\$&");
}

function escapeDrawtextExpression(text: string): string {
  // Expressions still need ':' and ',' escaped so the filter parser doesn't split options
  return text.replace(/['\\\\:,]/g, "\\$&");
}

function buildLapTimeExpr(lapStartAbs: number): string {
  const tExpr = `(t-${lapStartAbs.toFixed(6)})`;
  const minExpr = `floor(${tExpr}/60)`;
  const secExpr = `floor(mod(${tExpr},60))`;
  const msExpr = `floor(mod(${tExpr}*1000,1000))`;

  // eif fmt is x/X/d/u; width is the optional 3rd argument (no %02d style)
  return `%{eif:${minExpr}:d:2}:%{eif:${secExpr}:d:2}:%{eif:${msExpr}:d:3}`;
}

export function buildDrawtextFilterGraph(ctx: RenderContext) {
  const {
    video: { width, height },
    laps,
    startOffsetS,
    style,
  } = ctx;

  const textColor = normalizeHexColor(
    style.textColor,
    DEFAULT_OVERLAY_STYLE.textColor
  );
  const boxColor = normalizeHexColor(
    style.boxColor,
    DEFAULT_OVERLAY_STYLE.boxColor
  );
  const boxOpacity = clampOpacity(
    style.boxOpacity,
    DEFAULT_OVERLAY_STYLE.boxOpacity
  );
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

  if (lineCount === 0) {
    return { filterGraph: "[0:v]null[vout]", outputLabel: "vout" };
  }

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

  const overlayStart = startOffsetS;
  const overlayEnd = startOffsetS + totalSessionDuration(laps);

  const filters: string[] = [];
  let currentLabel = "0:v";
  let idx = 0;
  const nextLabel = () => `ov${idx++}`;

  filters.push(
    `[${currentLabel}]drawbox=x=${boxX}:y=${boxY}:w=${boxWidth}:h=${boxHeight}:color=${toFfmpegColor(
      boxColor,
      boxOpacity
    )}:t=fill:enable='between(t,${overlayStart},${overlayEnd})'[${(currentLabel =
      nextLabel())}]`
  );

  const infoLineIndex = hasInfoLine ? 0 : null;
  const timeLineIndex =
    showCurrentLapTime && lineCount > 0 ? lineCount - 1 : null;
  const textXExpr = alignRight
    ? `${boxX + boxWidth - paddingX}-text_w`
    : `${boxX + paddingX}`;

  laps.forEach((lap) => {
    const lapStart = overlayStart + lap.startS;
    const lapEnd = lapStart + lap.durationS;
    const lapEnable = `between(t,${lapStart},${lapEnd})`;
    const infoParts: string[] = [];
    if (showLapCounter) {
      infoParts.push(`Lap ${lap.number}/${laps.length}`);
    }
    if (hasPositionData && lap.position > 0) {
      infoParts.push(`P${lap.position}`);
    }

    if (infoLineIndex !== null && infoParts.length) {
      const y = boxY + paddingY + infoLineIndex * (fontSize + lineSpacing);
      filters.push(
        `[${currentLabel}]drawtext=text='${escapeDrawtext(
          infoParts.join("   ")
        )}':fontcolor=${toFfmpegColor(textColor)}:fontsize=${fontSize}:x=${textXExpr}:y=${y}:enable='${lapEnable}'[${(currentLabel =
          nextLabel())}]`
      );
    }

    if (timeLineIndex !== null) {
      const timeText = buildLapTimeExpr(lapStart);
      const y = boxY + paddingY + timeLineIndex * (fontSize + lineSpacing);
      filters.push(
        `[${currentLabel}]drawtext=text='${escapeDrawtextExpression(
          timeText
        )}':fontcolor=${toFfmpegColor(textColor)}:fontsize=${fontSize}:x=${textXExpr}:y=${y}:enable='${lapEnable}'[${(currentLabel =
          nextLabel())}]`
      );
    }
  });

  const outputLabel = currentLabel || "0:v";
  return { filterGraph: filters.join(";"), outputLabel };
}

export async function renderWithFfmpegDrawtext(
  ctx: RenderContext
): Promise<void> {
  const { filterGraph, outputLabel } = buildDrawtextFilterGraph(ctx);

  console.log("Using ffmpeg drawtext overlay (no temp images)...");
  console.log("ffmpeg drawtext filter graph:");
  console.log(filterGraph);
  return new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg()
      .input(ctx.inputVideo)
      .complexFilter(filterGraph)
      .outputOptions([
        "-map",
        `[${outputLabel}]`,
        "-map",
        "0:a?",
        "-c:a",
        "copy",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
      ])
      .output(ctx.outputFile);

    cmd
      .on("start", (cmdLine) => {
        console.log("ffmpeg command:");
        console.log(cmdLine);
      })
      .on("progress", (progress) => {
        const pct = Number(progress.percent);
        if (Number.isFinite(pct)) {
          const clamped = Math.min(100, Math.max(0, pct));
          ctx.onProgress?.(clamped);
          process.stdout.write(`\rRendering: ${clamped.toFixed(1)}%     `);
        }
      })
      .on("end", () => {
        console.log("\nffmpeg render complete.");
        resolve();
      })
      .on("error", (err, stdout, stderr) => {
        console.error("ffmpeg error:", err.message);
        console.error(stderr);
        reject(err);
      });

    cmd.run();
  });
}
