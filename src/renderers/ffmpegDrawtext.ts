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

  const margin = 20;
  const boxWidth = Math.floor(width * 0.45);
  const boxHeight = 90;
  const boxX = margin;
  const boxY = height - boxHeight - margin;

  const fontSize = 32;
  const lineSpacing = 8;

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

  laps.forEach((lap) => {
    const lapStart = overlayStart + lap.startS;
    const lapEnd = lapStart + lap.durationS;
    const lapEnable = `between(t,${lapStart},${lapEnd})`;
    const line1 = `Lap ${lap.number}/${laps.length}   P${lap.position}`;

    filters.push(
      `[${currentLabel}]drawtext=text='${escapeDrawtext(
        line1
      )}':fontcolor=${toFfmpegColor(textColor)}:fontsize=${fontSize}:x=${boxX + 12}:y=${
        boxY + 10
      }:enable='${lapEnable}'[${(currentLabel = nextLabel())}]`
    );

    const timeText = buildLapTimeExpr(lapStart);
    filters.push(
      `[${currentLabel}]drawtext=text='${escapeDrawtextExpression(
        timeText
      )}':fontcolor=${toFfmpegColor(textColor)}:fontsize=${fontSize}:x=${boxX + 12}:y=${
        boxY + 10 + fontSize + lineSpacing
      }:enable='${lapEnable}'[${(currentLabel = nextLabel())}]`
    );
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
        if (progress.percent != null) {
          process.stdout.write(
            `\rRendering: ${progress.percent.toFixed(1)}%     `
          );
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
