import ffmpeg from "fluent-ffmpeg";
import { totalSessionDuration, type Lap } from "./laps.js";
import { DEFAULT_OVERLAY_STYLE, type RenderContext } from "./overlayTypes.js";

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
  return text.replace(/['\\:,]/g, "\\$&");
}

function escapeDrawtextExpression(text: string): string {
  // Expressions still need ':' and ',' escaped so the filter parser doesn't split options
  return text.replace(/['\\:,]/g, "\\$&");
}

function buildLapTimeExpr(lapStartAbs: number): string {
  const tExpr = `(t-${lapStartAbs.toFixed(6)})`;
  const minExpr = `floor(${tExpr}/60)`;
  const secExpr = `floor(mod(${tExpr},60))`;
  const msExpr = `floor(mod(${tExpr}*1000,1000))`;

  // eif fmt is x/X/d/u; width is the optional 3rd argument (no %02d style)
  return `%{eif:${minExpr}:d:2}:%{eif:${secExpr}:d:2}:%{eif:${msExpr}:d:3}`;
}

type PositionSegment = { start: number; end: number; position: number };
type TextSegment = { start: number; end: number; text: string };

function formatDelta(delta: number): string {
  if (!Number.isFinite(delta)) return "N/A";
  const sign = delta < 0 ? "-" : "+";
  return `${sign}${Math.abs(delta).toFixed(3)}`;
}

function buildPositionTimeline(
  lap: Lap,
  lapStartAbs: number,
  carryPosition: number
): { segments: PositionSegment[]; lastPosition: number } {
  const lapDuration = lap.durationS;
  const raw = (lap.positionChanges || []).map((change, idx) => ({
    atS: Number(change?.atS),
    position: Math.max(
      0,
      Math.round(Number(change?.position ?? lap.position ?? 0))
    ),
    idx,
  }));

  const normalized = raw
    .filter(
      ({ atS }) =>
        Number.isFinite(atS) && (atS as number) >= 0 && (atS as number) <= lapDuration
    )
    .sort((a, b) => {
      if (a.atS === b.atS) return a.idx - b.idx;
      return (a.atS as number) - (b.atS as number);
    });

  const fallbackPosition = Math.max(
    0,
    Math.round(Number.isFinite(lap.position) ? (lap.position as number) : 0)
  );
  const startPosition = carryPosition > 0 ? carryPosition : fallbackPosition;

  let withFallback = normalized;
  if (withFallback.length === 0 && startPosition > 0) {
    withFallback = [
      {
        atS: 0,
        position: startPosition,
        idx: -1,
      },
    ];
  }

  if (
    withFallback.length > 0 &&
    (withFallback[0]?.atS as number) > 0
  ) {
    const initialPosition =
      carryPosition > 0
        ? carryPosition
        : Math.max(0, Math.round(withFallback[0]?.position ?? startPosition));
    withFallback = [
      { atS: 0, position: initialPosition, idx: -2 },
      ...withFallback,
    ];
  }

  const segments: PositionSegment[] = [];
  for (let i = 0; i < withFallback.length; i++) {
    const current = withFallback[i];
    const next = withFallback[i + 1];
    const segStart = lapStartAbs + (current.atS as number);
    const segEndWithinLap =
      next != null
        ? Math.max(current.atS as number, Math.min(next.atS as number, lapDuration))
        : lapDuration;
    const segEnd = lapStartAbs + Math.min(lapDuration, segEndWithinLap);
    if (segEnd > segStart) {
      segments.push({
        start: segStart,
        end: segEnd,
        position: current.position,
      });
    }
  }

  const lastPosition =
    segments.length > 0
      ? segments[segments.length - 1].position
      : startPosition > 0
        ? startPosition
        : carryPosition;

  return { segments, lastPosition };
}

function mergeTextSegments(segments: TextSegment[]): TextSegment[] {
  if (!segments.length) return segments;
  const merged: TextSegment[] = [];
  for (const seg of segments) {
    const prev = merged[merged.length - 1];
    if (prev && Math.abs(prev.end - seg.start) < 1e-6 && prev.text === seg.text) {
      prev.end = seg.end;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

function buildInfoSegments(options: {
  lap: Lap;
  lapCount: number;
  lapStart: number;
  showLapCounter: boolean;
  showPosition: boolean;
  positionSegments: PositionSegment[];
}): TextSegment[] {
  const { lap, lapCount, lapStart, showLapCounter, showPosition, positionSegments } =
    options;
  const lapEnd = lapStart + lap.durationS;
  const baseSegments =
    showPosition && positionSegments.length > 0
      ? positionSegments
      : [{ start: lapStart, end: lapEnd, position: 0 }];

  const infoSegments = baseSegments
    .map((seg) => {
      const parts: string[] = [];
      if (showLapCounter) {
        parts.push(`Lap ${lap.number}/${lapCount}`);
      }
      if (showPosition && seg.position > 0) {
        parts.push(`P${seg.position}`);
      }
      return { start: seg.start, end: seg.end, text: parts.join("   ") };
    })
    .filter((seg) => seg.text);

  return mergeTextSegments(infoSegments);
}

export function buildDrawtextFilterGraph(ctx: RenderContext) {
  const {
    video: { width, height },
    laps,
    startOffsetS,
    style,
  } = ctx;

  const videoDuration = ctx.video.duration;

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
  const showLapDeltas =
    style.showLapDeltas ?? DEFAULT_OVERLAY_STYLE.showLapDeltas;
  const boxWidthRatio =
    style.boxWidthRatio ?? DEFAULT_OVERLAY_STYLE.boxWidthRatio;
  const overlayPosition =
    style.overlayPosition ?? DEFAULT_OVERLAY_STYLE.overlayPosition;

  const lapCount = laps.length;
  const boxWidth = Math.round(width * boxWidthRatio);
  const fontSize = Math.round(style.textSize || DEFAULT_OVERLAY_STYLE.textSize);

  const fontColor = toFfmpegColor(textColor);
  const boxColorWithAlpha = toFfmpegColor(boxColor, boxOpacity);

  const safeWidth = Math.max(200, Math.min(width, boxWidth));
  const safeFontSize = Math.max(12, Math.min(192, fontSize));
  const halfPad = Math.round(safeFontSize * 0.35);
  const padding = { x: halfPad, y: halfPad };
  const lineGapAfterFirst = Math.round(safeFontSize * 1.35);
  const lineGap = Math.round(safeFontSize * 1.1);
  const lapDurations = laps
    .map((lap) => lap.durationS)
    .filter((value) => Number.isFinite(value) && value > 0);
  const fastestLapTime =
    lapDurations.length > 0
      ? lapDurations.reduce(
          (best, value) => Math.min(best, value),
          Number.POSITIVE_INFINITY
        )
      : null;
  const averageLapTime =
    lapDurations.length > 0
      ? lapDurations.reduce((sum, value) => sum + value, 0) / lapDurations.length
      : null;

  const lapTimeline: TextSegment[] = [];
  const infoTimeline: TextSegment[] = [];
  const deltaBestTimeline: TextSegment[] = [];
  const deltaAverageTimeline: TextSegment[] = [];
  let lastPosition = 0;
  for (let idx = 0; idx < laps.length; idx++) {
    const lap = laps[idx];
    const lapStartAbs = startOffsetS + lap.startS;

    if (showCurrentLapTime) {
      lapTimeline.push({
        start: lapStartAbs,
        end: lapStartAbs + lap.durationS,
        text: buildLapTimeExpr(lapStartAbs),
      });
    }

    const positionTimeline = buildPositionTimeline(lap, lapStartAbs, lastPosition);
    lastPosition = positionTimeline.lastPosition;
    infoTimeline.push(
      ...buildInfoSegments({
        lap,
        lapCount,
        lapStart: lapStartAbs,
        showLapCounter,
        showPosition,
        positionSegments: positionTimeline.segments,
      })
    );

    if (showLapDeltas && fastestLapTime != null) {
      const deltaToBest = lap.durationS - fastestLapTime;
      deltaBestTimeline.push({
        start: lapStartAbs,
        end: lapStartAbs + lap.durationS,
        text: `Δ vs Best ${formatDelta(deltaToBest)}`,
      });
    }

    if (showLapDeltas && averageLapTime != null) {
      const deltaToAverage = lap.durationS - averageLapTime;
      deltaAverageTimeline.push({
        start: lapStartAbs,
        end: lapStartAbs + lap.durationS,
        text: `Δ vs Avg ${formatDelta(deltaToAverage)}`,
      });
    }
  }

  const lineOffsets = (index: number) => {
    if (index === 0) return padding.y;
    if (index === 1) return padding.y + lineGapAfterFirst;
    return padding.y + lineGapAfterFirst + lineGap * (index - 1);
  };

  const overlays: { timeline: TextSegment[]; labelPrefix: string; y: number }[] = [];
  let overlayIndex = 0;

  if (lapTimeline.length) {
    overlays.push({
      timeline: lapTimeline,
      labelPrefix: "lap",
      y: lineOffsets(overlayIndex++),
    });
  }

  if (infoTimeline.length) {
    overlays.push({
      timeline: infoTimeline,
      labelPrefix: "info",
      y: lineOffsets(overlayIndex++),
    });
  }

  if (deltaBestTimeline.length) {
    overlays.push({
      timeline: deltaBestTimeline,
      labelPrefix: "deltaBest",
      y: lineOffsets(overlayIndex++),
    });
  }

  if (deltaAverageTimeline.length) {
    overlays.push({
      timeline: deltaAverageTimeline,
      labelPrefix: "deltaAvg",
      y: lineOffsets(overlayIndex++),
    });
  }

  const lastLineOffset = overlays.length
    ? overlays[overlays.length - 1]!.y
    : padding.y;
  const boxHeight = Math.round(lastLineOffset + safeFontSize + padding.y);
  const boxY = overlayPosition.startsWith("top") ? 32 : height - boxHeight - 32;
  const boxX = overlayPosition.endsWith("left") ? 32 : width - safeWidth - 32;

  let currentLabel = "0:v";

  const backgroundBox = buildOverlayBox({
    width: safeWidth,
    height: boxHeight,
    x: boxX,
    y: boxY,
    color: boxColorWithAlpha,
    duration:
      laps.length
        ? laps[laps.length - 1].startS + laps[laps.length - 1].durationS + startOffsetS
        : videoDuration,
    inputLabel: currentLabel,
  });

  const filters: string[] = [];

  if (backgroundBox) {
    filters.push(backgroundBox.filter);
    currentLabel = backgroundBox.label;
  }

  overlays.forEach((line) => {
    const overlay = buildDrawtextTimeline({
      inputs: line.timeline,
      color: fontColor,
      fontSize: safeFontSize,
      x: boxX + padding.x,
      y: boxY + line.y,
      inputLabel: currentLabel,
      labelPrefix: line.labelPrefix,
    });
    if (overlay) {
      filters.push(overlay.filter);
      currentLabel = overlay.label;
    }
  });

  const filterGraph = filters;
  const outputLabel = currentLabel;

  return { filterGraph, outputLabel };
}

function buildOverlayBox(options: {
  width: number;
  height: number;
  x: number;
  y: number;
  color: string;
  duration: number;
  inputLabel: string;
}): { filter: string; label: string } {
  const { width, height, x, y, color, duration, inputLabel } = options;
  const source = inputLabel.startsWith("[") ? inputLabel : `[${inputLabel}]`;
  const drawBox = `color=color=${color}:size=${width}x${height}:duration=${Math.max(
    0,
    duration
  ).toFixed(3)} [box]; ${source}[box] overlay=x=${x}:y=${y}:shortest=1 [v_box]`;
  return { filter: drawBox, label: "v_box" };
}

function buildDrawtextTimeline(options: {
  inputs: TextSegment[];
  color: string;
  fontSize: number;
  x: number;
  y: number;
  inputLabel: string;
  labelPrefix: string;
}): { filter: string; label: string } | null {
  const { inputs, color, fontSize, x, y, inputLabel, labelPrefix } = options;
  if (!inputs.length) return null;

  const drawtextFilters = inputs.map((seg, idx) => {
    const enable = `between(t,${seg.start.toFixed(3)},${seg.end.toFixed(3)})`;
    const expr = escapeDrawtext(seg.text);
    return `drawtext=text='${expr}':fontcolor=${color}:fontsize=${fontSize}:x=${x}:y=${y}:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:box=0:alpha=1:enable='${enable}'`;
  });

  const pipeline: string[] = [];
  let current = inputLabel;
  for (let idx = 0; idx < drawtextFilters.length; idx++) {
    const output = `${labelPrefix}${idx}`;
    const source = current.startsWith("[") ? current : `[${current}]`;
    pipeline.push(`${source} ${drawtextFilters[idx]} [${output}]`);
    current = output;
  }

  return { filter: pipeline.join("; "), label: current };
}

export function renderWithFfmpegDrawtext(ctx: RenderContext) {
  const { inputVideo, outputFile, video, laps, startOffsetS, style, onProgress } =
    ctx;

  if (!laps.length) {
    return Promise.reject(new Error("No laps provided"));
  }

  // build overlay graph first
  const { filterGraph, outputLabel } = buildDrawtextFilterGraph({
    ...ctx,
    startOffsetS,
  });

  return new Promise<void>((resolve, reject) => {
    const totalDuration = totalSessionDuration(laps);

    const cmd = ffmpeg()
      .input(inputVideo)
      .complexFilter(filterGraph)
      .outputOptions(["-map", `[${outputLabel}]`]);

    if (ctx.trimStartS != null) {
      cmd.seekInput(Math.max(0, ctx.trimStartS));
    }
    if (ctx.trimEndS != null) {
      cmd.duration(Math.max(0, ctx.trimEndS - (ctx.trimStartS ?? 0)));
    }

    cmd
      .on("progress", (progress) => {
        if (!onProgress || !progress.timemark) return;
        const [h, m, s] = progress.timemark.split(":");
        const sec = Number(h) * 3600 + Number(m) * 60 + Number(s);
        const pct = (sec / Math.max(1, totalDuration)) * 100;
        onProgress(pct);
      })
      .on("error", (err) => reject(err))
      .on("end", () => resolve())
      .save(outputFile);

    if (onProgress) {
      cmd.on("start", () => onProgress(0));
    }
  });
}
