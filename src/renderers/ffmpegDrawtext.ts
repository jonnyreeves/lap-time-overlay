import ffmpeg from "fluent-ffmpeg";
import { totalSessionDuration } from "../laps.js";
import {
  DEFAULT_OVERLAY_STYLE,
  type CompareAudioMode,
  type CompareRenderContext,
  type RenderContext,
} from "./types.js";

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
  const baseLabel = ctx.inputLabel || "0:v";
  const labelPrefix = ctx.labelPrefix || "ov";

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
    const nullLabel = `${labelPrefix}out`;
    return { filterGraph: `[${baseLabel}]null[${nullLabel}]`, outputLabel: nullLabel };
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
  let currentLabel = baseLabel;
  let idx = 0;
  const nextLabel = () => `${labelPrefix}${idx++}`;

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
  const trimStart = Math.max(0, ctx.trimStartS ?? 0);
  const trimEnd = Number.isFinite(ctx.trimEndS as number)
    ? (ctx.trimEndS as number)
    : null;
  const clipDuration =
    trimEnd != null ? Math.max(0, trimEnd - trimStart) : null;

  console.log("Using ffmpeg drawtext overlay (no temp images)...");
  console.log("ffmpeg drawtext filter graph:");
  console.log(filterGraph);
  return new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg().input(ctx.inputVideo);
    if (trimStart > 0) {
      cmd.seekInput(trimStart);
    }
    if (clipDuration != null) {
      cmd.duration(clipDuration);
    }
    cmd
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

export async function renderSideBySideCompare(
  ctx: CompareRenderContext
): Promise<void> {
  const { video } = ctx;
  const lapAStart = Math.max(0, ctx.lapA.startTime);
  const lapBStart = Math.max(0, ctx.lapB.startTime);
  const lapAEnd = Math.min(video.duration, lapAStart + ctx.lapA.lap.durationS);
  const lapBEnd = Math.min(video.duration, lapBStart + ctx.lapB.lap.durationS);
  const lapADuration = lapAEnd - lapAStart;
  const lapBDuration = lapBEnd - lapBStart;

  if (!Number.isFinite(lapADuration) || lapADuration <= 0) {
    throw new Error("Left lap timing is invalid for comparison.");
  }
  if (!Number.isFinite(lapBDuration) || lapBDuration <= 0) {
    throw new Error("Right lap timing is invalid for comparison.");
  }

  const targetDuration = Math.max(lapADuration, lapBDuration);
  const padA = Math.max(0, targetDuration - lapADuration);
  const padB = Math.max(0, targetDuration - lapBDuration);

  const leftLap = { ...ctx.lapA.lap, startS: 0, durationS: lapADuration };
  const rightLap = { ...ctx.lapB.lap, startS: 0, durationS: lapBDuration };

  const leftGraph = buildDrawtextFilterGraph({
    inputVideo: ctx.inputVideo,
    outputFile: ctx.outputFile,
    video: ctx.video,
    laps: [leftLap],
    startOffsetS: 0,
    style: { ...ctx.style, overlayPosition: "bottom-left" },
    inputLabel: "lv0",
    labelPrefix: "la",
    trimStartS: 0,
  });

  const rightGraph = buildDrawtextFilterGraph({
    inputVideo: ctx.inputVideo,
    outputFile: ctx.outputFile,
    video: ctx.video,
    laps: [rightLap],
    startOffsetS: 0,
    style: { ...ctx.style, overlayPosition: "bottom-right" },
    inputLabel: "rv0",
    labelPrefix: "rb",
    trimStartS: 0,
  });

  const filters: string[] = [];
  filters.push(
    `[0:v]trim=start=${lapAStart.toFixed(
      6
    )}:end=${lapAEnd.toFixed(6)},setpts=PTS-STARTPTS[lv0]`
  );
  filters.push(
    `[0:v]trim=start=${lapBStart.toFixed(
      6
    )}:end=${lapBEnd.toFixed(6)},setpts=PTS-STARTPTS[rv0]`
  );

  filters.push(leftGraph.filterGraph);
  filters.push(rightGraph.filterGraph);

  filters.push(
    `[${leftGraph.outputLabel}]tpad=stop_mode=clone:stop_duration=${padA.toFixed(
      6
    )}[lvpad]`
  );
  filters.push(
    `[${rightGraph.outputLabel}]tpad=stop_mode=clone:stop_duration=${padB.toFixed(
      6
    )}[rvpad]`
  );

  filters.push(`[lvpad]scale=iw/2:ih[lvs]`);
  filters.push(`[rvpad]scale=iw/2:ih[rvs]`);
  filters.push(`[lvs][rvs]hstack=inputs=2[vout]`);

  const hasAudio = video.hasAudio;
  const audioMode: CompareAudioMode = hasAudio
    ? ctx.audioMode
    : "mute";
  let audioOutLabel: string | null = null;

  if (audioMode !== "mute" && hasAudio) {
    filters.push(
      `[0:a]atrim=start=${lapAStart.toFixed(
        6
      )}:end=${lapAEnd.toFixed(6)},asetpts=PTS-STARTPTS[laa0]`
    );
    filters.push(
      `[0:a]atrim=start=${lapBStart.toFixed(
        6
      )}:end=${lapBEnd.toFixed(6)},asetpts=PTS-STARTPTS[rba0]`
    );
    filters.push(`[laa0]apad=pad_dur=${padA.toFixed(6)}[laa]`);
    filters.push(`[rba0]apad=pad_dur=${padB.toFixed(6)}[rba]`);

    if (audioMode === "mix") {
      filters.push(
        `[laa][rba]amix=inputs=2:normalize=0:dropout_transition=0[aout]`
      );
      audioOutLabel = "aout";
    } else if (audioMode === "left") {
      filters.push(`[laa]anull[aout]`);
      audioOutLabel = "aout";
    } else if (audioMode === "right") {
      filters.push(`[rba]anull[aout]`);
      audioOutLabel = "aout";
    }
  }

  const filterGraph = filters.join(";");

  console.log("Using ffmpeg side-by-side comparison graph:");
  console.log(filterGraph);

  return new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg().input(ctx.inputVideo).complexFilter(filterGraph);
    cmd.outputOptions([
      "-map",
      "[vout]",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "18",
    ]);

    if (audioOutLabel) {
      cmd.outputOptions(["-map", `[${audioOutLabel}]`, "-c:a", "aac", "-b:a", "192k"]);
    } else {
      cmd.outputOptions(["-an"]);
    }

    cmd.output(ctx.outputFile);

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
        console.log("\nffmpeg compare render complete.");
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
