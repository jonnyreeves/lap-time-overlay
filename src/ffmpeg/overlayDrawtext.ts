import ffmpeg from "fluent-ffmpeg";
import { totalSessionDuration, type Lap } from "./laps.js";
import { DEFAULT_OVERLAY_STYLE, type RenderContext } from "./overlayTypes.js";
import { measureTextWidth } from "./textMeasure.js";

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

function formatLapTimeForWidth(seconds: number): string {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const ms = totalMs % 1000;
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const secondsWithinMinute = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secondsWithinMinute
    .toString()
    .padStart(2, "0")}:${ms.toString().padStart(3, "0")}`;
}

const PREVIOUS_LAP_DISPLAY_S = 10;

type PositionSegment = { start: number; end: number; position: number };
type TextSegment = {
  start: number;
  end: number;
  text: string;
  color?: string;
  align?: "left" | "right";
};

function formatDelta(delta: number): string {
  if (!Number.isFinite(delta)) return "N/A";
  const sign = delta < 0 ? "-" : "+";
  return `${sign}${Math.abs(delta).toFixed(3)}`;
}

function deltaColor({
  delta,
  isFastest,
  colors,
}: {
  delta: number;
  isFastest: boolean;
  colors: {
    fastest: string;
    faster: string;
    slower: string;
    neutral: string;
  };
}): string {
  if (isFastest || Math.abs(delta) < 0.0005) return colors.fastest;
  if (delta < 0) return colors.faster;
  if (delta > 0) return colors.slower;
  return colors.neutral;
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
  const showPreviousLapTime =
    style.showPreviousLapTime ?? DEFAULT_OVERLAY_STYLE.showPreviousLapTime;
  const overlayPosition =
    style.overlayPosition ?? DEFAULT_OVERLAY_STYLE.overlayPosition;

  const clampFontSize = (value: number, fallback: number) => {
    if (!Number.isFinite(value)) return Math.max(12, Math.min(192, fallback));
    return Math.max(12, Math.min(192, Math.round(value as number)));
  };

  const lapCount = laps.length;
  const lapFontSize = clampFontSize(
    style.textSize,
    DEFAULT_OVERLAY_STYLE.textSize
  );
  const detailFontSize = clampFontSize(
    style.detailTextSize,
    lapFontSize
  );

  const fontColor = toFfmpegColor(textColor);
  const deltaColors = {
    fastest: toFfmpegColor("#a855f7"),
    faster: toFfmpegColor("#22c55e"),
    slower: toFfmpegColor("#ef4444"),
    neutral: fontColor,
  };
  const boxColorWithAlpha = toFfmpegColor(boxColor, boxOpacity);

  const padding = (() => {
    const paddingBase = Math.max(detailFontSize, Math.min(lapFontSize, detailFontSize + 24));
    const halfPad = Math.round(Math.max(10, Math.min(26, paddingBase * 0.35)));
    return { x: halfPad, y: halfPad };
  })();
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
  const deltaBestLabelTimeline: TextSegment[] = [];
  const deltaBestValueTimeline: TextSegment[] = [];
  const deltaAverageLabelTimeline: TextSegment[] = [];
  const deltaAverageValueTimeline: TextSegment[] = [];
  const previousLapLabelSegments: TextSegment[] = [];
  const previousLapValueSegments: TextSegment[] = [];
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

    if (showPreviousLapTime && idx > 0) {
      const previousLap = laps[idx - 1];
      const previousLapDuration = previousLap.durationS;
      if (Number.isFinite(previousLapDuration) && previousLapDuration > 0) {
        const displayDuration = Math.min(
          PREVIOUS_LAP_DISPLAY_S,
          Math.max(0, lap.durationS)
        );
        if (displayDuration > 0) {
          const start = lapStartAbs;
          const end = lapStartAbs + displayDuration;
          if (end > start) {
            const priorLap =
              idx - 2 >= 0 ? laps[idx - 2] : null;
            const priorLapTime =
              priorLap &&
              Number.isFinite(priorLap.durationS) &&
              priorLap.durationS > 0
                ? priorLap.durationS
                : null;
            const deltaToPrior =
              priorLapTime != null
                ? previousLapDuration - priorLapTime
                : null;
            const previousLapIsFastest =
              fastestLapTime != null &&
              Math.abs(previousLapDuration - fastestLapTime) < 0.0005;
            previousLapLabelSegments.push({
              start,
              end,
              text: "Prev",
            });
            previousLapValueSegments.push({
              start,
              end,
              text: `${formatLapTimeForWidth(previousLapDuration)}`,
              color:
                deltaToPrior != null
                  ? deltaColor({
                      delta: deltaToPrior,
                      isFastest: previousLapIsFastest,
                      colors: deltaColors,
                    })
                  : fontColor,
              align: "right",
            });
          }
        }
      }
    }

    if (showLapDeltas && fastestLapTime != null) {
      const deltaToBest = lap.durationS - fastestLapTime;
      const isFastestLap = Math.abs(deltaToBest) < 0.0005;
      deltaBestLabelTimeline.push({
        start: lapStartAbs,
        end: lapStartAbs + lap.durationS,
        text: "Δ vs Best",
      });
      deltaBestValueTimeline.push({
        start: lapStartAbs,
        end: lapStartAbs + lap.durationS,
        text: formatDelta(deltaToBest),
        color: deltaColor({
          delta: deltaToBest,
          isFastest: isFastestLap,
          colors: deltaColors,
        }),
        align: "right",
      });
    }

    if (showLapDeltas && averageLapTime != null) {
      const deltaToAverage = lap.durationS - averageLapTime;
      const deltaToBest =
        fastestLapTime != null
          ? lap.durationS - fastestLapTime
          : Number.POSITIVE_INFINITY;
      const isFastestLap = Math.abs(deltaToBest) < 0.0005;
      deltaAverageLabelTimeline.push({
        start: lapStartAbs,
        end: lapStartAbs + lap.durationS,
        text: "Δ vs Avg",
      });
      deltaAverageValueTimeline.push({
        start: lapStartAbs,
        end: lapStartAbs + lap.durationS,
        text: formatDelta(deltaToAverage),
        color: deltaColor({
          delta: deltaToAverage,
          isFastest: isFastestLap,
          colors: deltaColors,
        }),
        align: "right",
      });
    }
  }

  type OverlayLine = {
    timeline: TextSegment[];
    labelPrefix: string;
    defaultColor: string;
    fontSize: number;
    y?: number;
  };

  type OverlayRow = { items: OverlayLine[]; fontSize: number };

  const previousLapLabelTimeline = mergeTextSegments(previousLapLabelSegments);
  const previousLapValueTimeline = mergeTextSegments(previousLapValueSegments);
  const rows: OverlayRow[] = [];

  if (infoTimeline.length) {
    rows.push({
      fontSize: detailFontSize,
      items: [
        {
          timeline: infoTimeline,
          labelPrefix: "info",
          defaultColor: fontColor,
          fontSize: detailFontSize,
        },
      ],
    });
  }

  if (lapTimeline.length) {
    rows.push({
      fontSize: lapFontSize,
      items: [
        {
          timeline: lapTimeline,
          labelPrefix: "lap",
          defaultColor: fontColor,
          fontSize: lapFontSize,
        },
      ],
    });
  }

  if (deltaBestLabelTimeline.length || deltaBestValueTimeline.length) {
    const items: OverlayLine[] = [];
    if (deltaBestLabelTimeline.length) {
      items.push({
        timeline: deltaBestLabelTimeline,
        labelPrefix: "deltaBestLabel",
        defaultColor: fontColor,
        fontSize: detailFontSize,
      });
    }
    if (deltaBestValueTimeline.length) {
      items.push({
        timeline: deltaBestValueTimeline,
        labelPrefix: "deltaBestValue",
        defaultColor: fontColor,
        fontSize: detailFontSize,
      });
    }
    if (items.length) {
      rows.push({ items, fontSize: detailFontSize });
    }
  }

  if (deltaAverageLabelTimeline.length || deltaAverageValueTimeline.length) {
    const items: OverlayLine[] = [];
    if (deltaAverageLabelTimeline.length) {
      items.push({
        timeline: deltaAverageLabelTimeline,
        labelPrefix: "deltaAvgLabel",
        defaultColor: fontColor,
        fontSize: detailFontSize,
      });
    }
    if (deltaAverageValueTimeline.length) {
      items.push({
        timeline: deltaAverageValueTimeline,
        labelPrefix: "deltaAvgValue",
        defaultColor: fontColor,
        fontSize: detailFontSize,
      });
    }
    if (items.length) {
      rows.push({ items, fontSize: detailFontSize });
    }
  }

  if (previousLapLabelTimeline.length || previousLapValueTimeline.length) {
    rows.push({
      fontSize: detailFontSize,
      items: [
        {
          timeline: previousLapLabelTimeline,
          labelPrefix: "previousLabel",
          defaultColor: fontColor,
          fontSize: detailFontSize,
        },
        {
          timeline: previousLapValueTimeline,
          labelPrefix: "previousValue",
          defaultColor: fontColor,
          fontSize: detailFontSize,
        },
      ],
    });
  }

  const measureSegments = (segments: TextSegment[], fontSize: number) => {
    const texts = Array.from(
      new Set(
        segments
          .map((seg) => seg.text)
          .filter((text): text is string => typeof text === "string" && text.length > 0)
      )
    );
    if (!texts.length) return 0;
    return texts.reduce(
      (max, text) => Math.max(max, measureTextWidth(text, fontSize)),
      0
    );
  };

  const lapTimeWidth =
    lapTimeline.length && lapDurations.length
      ? measureTextWidth(
          formatLapTimeForWidth(
            lapDurations.reduce((max, value) => Math.max(max, value), 0)
          ),
          lapFontSize
        )
      : 0;

  const infoWidth = measureSegments(infoTimeline, detailFontSize);
  const deltaBestLabelWidth = measureSegments(deltaBestLabelTimeline, detailFontSize);
  const deltaBestValueWidth = measureSegments(deltaBestValueTimeline, detailFontSize);
  const deltaAvgLabelWidth = measureSegments(deltaAverageLabelTimeline, detailFontSize);
  const deltaAvgValueWidth = measureSegments(deltaAverageValueTimeline, detailFontSize);
  const previousLabelWidth = measureSegments(previousLapLabelTimeline, detailFontSize);
  const previousValueWidth = measureSegments(previousLapValueTimeline, detailFontSize);
  const horizontalGap = Math.max(12, Math.round(padding.x * 0.6));

  const pairedWidth = (left: number, right: number) => {
    if (left && right) return left + right + horizontalGap;
    return Math.max(left, right);
  };

  const rowWidths: number[] = [];
  if (infoWidth) rowWidths.push(infoWidth);
  if (lapTimeWidth) rowWidths.push(lapTimeWidth);

  const deltaBestWidth = pairedWidth(deltaBestLabelWidth, deltaBestValueWidth);
  if (deltaBestWidth) rowWidths.push(deltaBestWidth);

  const deltaAvgWidth = pairedWidth(deltaAvgLabelWidth, deltaAvgValueWidth);
  if (deltaAvgWidth) rowWidths.push(deltaAvgWidth);

  const widestRow = rowWidths.length ? Math.max(...rowWidths) : 0;
  const paddingWidth = padding.x * 2;
  const baseContentWidth =
    widestRow || measureTextWidth("00:00:000", lapFontSize);
  const safety = Math.round(Math.max(4, Math.min(24, lapFontSize * 0.1)));
  const computedWidth = baseContentWidth + paddingWidth + safety;
  const availableWidth = Math.max(80, width - 64);
  const minWidth = Math.min(
    availableWidth,
    Math.max(
      140,
      paddingWidth +
        measureTextWidth(
          "00:00:000",
          Math.max(lapFontSize, detailFontSize, 12)
        )
    )
  );
  const safeWidth = Math.min(availableWidth, Math.max(minWidth, computedWidth));

  let boxHeight = Math.round(padding.y * 2);

  if (rows.length) {
    const gapBase = (currentSize: number, nextSize: number) => {
      const minSize = Math.min(currentSize, nextSize);
      const maxSize = Math.max(currentSize, nextSize);
      return Math.min(maxSize, Math.max(minSize * 1.25, minSize + 24));
    };
    const computeGap = (prevSize: number, nextSize: number, isFirstGap: boolean) => {
      const base = gapBase(prevSize, nextSize);
      const factor = isFirstGap ? 1.1 : 0.95;
      return Math.round(base * factor * 0.5);
    };

    let cursorY = padding.y;
    rows.forEach((row, idx) => {
      if (idx > 0) {
        const prev = rows[idx - 1]!;
        cursorY += computeGap(prev.fontSize, row.fontSize, idx === 1);
      }
      row.items.forEach((item) => {
        item.y = cursorY;
      });
      cursorY += row.fontSize;
    });

    boxHeight = Math.round(cursorY + padding.y);
  }
  const boxY = overlayPosition.startsWith("top") ? 32 : height - boxHeight - 32;
  const boxX = overlayPosition.endsWith("left") ? 32 : width - safeWidth - 32;

  const lapStartAbsolute = laps.length ? startOffsetS + laps[0]!.startS : 0;
  const lastLapEnd =
    laps.length > 0
      ? laps[laps.length - 1]!.startS + laps[laps.length - 1]!.durationS
      : 0;
  const overlayStart = Math.max(0, lapStartAbsolute);
  const overlayEnd = laps.length
    ? Math.max(overlayStart, startOffsetS + lastLapEnd)
    : videoDuration;
  const overlayDuration = Math.max(0, overlayEnd);

  let currentLabel = "0:v";

  const backgroundBox = buildOverlayBox({
    width: safeWidth,
    height: boxHeight,
    x: boxX,
    y: boxY,
    color: boxColorWithAlpha,
    startAt: overlayStart,
    endAt: overlayEnd,
    duration: overlayDuration,
    inputLabel: currentLabel,
  });

  const filters: string[] = [];

  if (backgroundBox) {
    filters.push(backgroundBox.filter);
    currentLabel = backgroundBox.label;
  }

  const xLeft = boxX + padding.x;
  const xRight = boxX + safeWidth - padding.x;

  const overlayLines: OverlayLine[] = rows.flatMap((row) => row.items);

  overlayLines.forEach((line) => {
    const overlay = buildDrawtextTimeline({
      inputs: line.timeline,
      defaultColor: line.defaultColor,
      fontSize: line.fontSize,
      x: xLeft,
      xRight,
      y: boxY + (line.y ?? padding.y),
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
  inputLabel: string;
  startAt: number;
  endAt: number;
  duration?: number;
}): { filter: string; label: string } {
  const { width, height, x, y, color, startAt, endAt, duration, inputLabel } = options;
  const start = Math.max(0, Number.isFinite(startAt) ? (startAt as number) : 0);
  const end = Math.max(start, Number.isFinite(endAt) ? (endAt as number) : start);
  const overlayDuration = Math.max(
    end,
    Number.isFinite(duration) ? (duration as number) : end
  );
  const source = inputLabel.startsWith("[") ? inputLabel : `[${inputLabel}]`;
  const enable = `between(t,${start.toFixed(3)},${end.toFixed(3)})`;
  const drawBox = `color=color=${color}:size=${width}x${height}:duration=${Math.max(
    0,
    overlayDuration
  ).toFixed(3)} [box]; ${source}[box] overlay=x=${x}:y=${y}:enable='${enable}' [v_box]`;
  return { filter: drawBox, label: "v_box" };
}

function buildDrawtextTimeline(options: {
  inputs: TextSegment[];
  defaultColor: string;
  fontSize: number;
  x: number;
  xRight: number;
  y: number;
  inputLabel: string;
  labelPrefix: string;
}): { filter: string; label: string } | null {
  const { inputs, defaultColor, fontSize, x, xRight, y, inputLabel, labelPrefix } = options;
  if (!inputs.length) return null;

  const drawtextFilters = inputs.map((seg, idx) => {
    const enable = `between(t,${seg.start.toFixed(3)},${seg.end.toFixed(3)})`;
    const expr = escapeDrawtext(seg.text);
    const fontcolor = seg.color ?? defaultColor;
    const xExpr = seg.align === "right" ? `${xRight.toFixed(3)}-text_w` : x.toFixed(3);
    const yExpr = y.toFixed(3);
    return `drawtext=text='${expr}':fontcolor=${fontcolor}:fontsize=${fontSize}:x=${xExpr}:y=${yExpr}:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:box=0:alpha=1:enable='${enable}'`;
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
