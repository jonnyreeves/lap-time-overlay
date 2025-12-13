import { css } from "@emotion/react";
import { useMemo, useRef, useState, type MouseEvent } from "react";
import { formatLapTimeSeconds } from "../../utils/lapTime.js";
import { Card } from "../Card.js";
import type { LapWithEvents } from "./LapsCard.js";

type ConsistencyLap = {
  id: string;
  lapNumber: number;
  time: number;
};

type ExcludedReason = "invalid" | "out-lap" | "outlier";

type ConsistencyStats = {
  score: number | null;
  label: string;
  mean: number | null;
  stdDev: number | null;
  cvPct: number | null;
  median: number | null;
  windowPct: number | null;
  usableLaps: ConsistencyLap[];
  excluded: (ConsistencyLap & { reason: ExcludedReason })[];
  totalValid: number;
};

const cardGridStyles = css`
  display: grid;
  gap: 12px;
`;

const summaryStyles = css`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
`;

const scoreBlockStyles = css`
  display: grid;
  gap: 6px;
  min-width: 220px;

  .label {
    font-size: 0.95rem;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .score {
    font-size: 2.6rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #0f172a;
    margin: 0;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    font-weight: 700;
    background: #ecfeff;
    color: #0f172a;
    border: 1px solid #bae6fd;
  }
`;

const metaGridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  width: 100%;
`;

const metaTileStyles = css`
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f4;
  background: #f8fafc;

  .label {
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
    margin: 0 0 4px;
    font-weight: 800;
  }

  .value {
    font-weight: 800;
    color: #0f172a;
  }

  .hint {
    margin: 2px 0 0;
    color: #475569;
    font-size: 0.9rem;
    font-weight: 600;
  }
`;

const sparklineCardStyles = css`
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f4;
  background: linear-gradient(145deg, #0f172a, #0b1021);
  color: #e2e8f0;
  position: relative;
`;

const sparklineHeaderStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;

  .title {
    font-weight: 700;
    letter-spacing: -0.01em;
    margin: 0;
  }

  .legend {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;

    span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: #38bdf8;
    }

    .hollow {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      border: 2px solid #e2e8f0;
    }
  }
`;

const tooltipStyles = css`
  position: absolute;
  pointer-events: none;
  background: #0b1120;
  color: #e2e8f0;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.88rem;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.35);
  transform: translate(-50%, calc(-100% - 10px));
  white-space: nowrap;
  z-index: 2;
  border: 1px solid #334155;
`;

const emptyStateStyles = css`
  padding: 14px;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  text-align: center;
`;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdDev(values: number[], avg: number | null): number | null {
  if (values.length === 0 || avg == null) return null;
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function classifyLabel(cvPct: number | null, stdDev: number | null): string {
  if (cvPct == null || stdDev == null) return "Need more clean laps";
  if (stdDev <= 0.12 && cvPct <= 2) return "Elite consistency";
  if (stdDev <= 0.2 && cvPct <= 3) return "Very consistent";
  if (stdDev <= 0.35 && cvPct <= 5) return "Consistent";
  if (stdDev <= 0.8 && cvPct <= 8) return "Variable";
  return "Inconsistent";
}

function clampScore(score: number | null): number | null {
  if (score == null || Number.isNaN(score)) return null;
  return Math.min(100, Math.max(30, Math.round(score)));
}

export function computeConsistencyStats(laps: LapWithEvents[]): ConsistencyStats {
  const valid: ConsistencyLap[] = [];
  const excluded: (ConsistencyLap & { reason: ExcludedReason })[] = [];

  laps.forEach((lap) => {
    const lapTime = Number.isFinite(lap.time) ? lap.time : null;
    if (lapTime && lapTime > 0) {
      valid.push({ id: lap.id, lapNumber: lap.lapNumber, time: lapTime });
    } else {
      excluded.push({
        id: lap.id,
        lapNumber: lap.lapNumber,
        time: lap.time,
        reason: "invalid",
      });
    }
  });

  if (valid.length === 0) {
    return {
      score: null,
      label: "Add lap times to see consistency",
      mean: null,
      stdDev: null,
      cvPct: null,
      median: null,
      windowPct: null,
      usableLaps: [],
      excluded,
      totalValid: 0,
    };
  }

  const sorted = [...valid].sort((a, b) => a.lapNumber - b.lapNumber);
  const outLap = sorted.filter((lap) => lap.lapNumber === 1);
  const candidates =
    sorted.length > outLap.length ? sorted.filter((lap) => lap.lapNumber !== 1) : sorted;

  outLap.forEach((lap) => excluded.push({ ...lap, reason: "out-lap" }));

  const med = median(candidates.map((lap) => lap.time));
  if (med == null) {
    return {
      score: null,
      label: "Need more clean laps",
      mean: null,
      stdDev: null,
      cvPct: null,
      median: null,
      windowPct: null,
      usableLaps: [],
      excluded,
      totalValid: candidates.length,
    };
  }

  const baseWindow = candidates.length >= 10 ? 0.05 : 0.06;
  const windowPct = candidates.length < 5 ? 0.08 : baseWindow;
  const lowerBound = med * (1 - windowPct);
  const upperBound = med * (1 + windowPct);

  const usable = candidates.filter(
    (lap) => lap.time >= lowerBound && lap.time <= upperBound
  );
  const outliers = candidates.filter(
    (lap) => lap.time < lowerBound || lap.time > upperBound
  );
  outliers.forEach((lap) => excluded.push({ ...lap, reason: "outlier" }));

  const usableTimes = usable.map((lap) => lap.time);
  const canScore = usable.length >= 2;
  const avg = mean(usableTimes);
  const sigma = canScore ? stdDev(usableTimes, avg) : null;
  const cv = canScore && avg && sigma != null ? sigma / avg : null;
  const cvPct = cv != null ? cv * 100 : null;
  const maxCvForScale = 0.07; // slightly relaxed scaling for elite consistency
  const maxStdForScale = 0.8;
  const normalizedCv = cv != null ? Math.min(cv / maxCvForScale, 1) : null;
  const normalizedStd = sigma != null ? Math.min(sigma / maxStdForScale, 1) : null;
  const normalized =
    normalizedCv != null && normalizedStd != null
      ? Math.max(normalizedCv, normalizedStd)
      : normalizedCv ?? normalizedStd;
  const score =
    normalized != null ? clampScore(100 - normalized * 70) : null;

  const label = canScore ? classifyLabel(cvPct, sigma) : "Need more clean laps";

  return {
    score: canScore ? score : null,
    label,
    mean: avg,
    stdDev: sigma,
    cvPct,
    median: med,
    windowPct,
    usableLaps: usable,
    excluded,
    totalValid: candidates.length,
  };
}

function Sparkline({
  usable,
  excluded,
  medianTime,
  meanTime,
  stdDevTime,
}: {
  usable: ConsistencyLap[];
  excluded: (ConsistencyLap & { reason: ExcludedReason })[];
  medianTime: number | null;
  meanTime: number | null;
  stdDevTime: number | null;
}) {
  const width = 340;
  const height = 160;
  const padLeft = 48;
  const padRight = 12;
  const padTop = 12;
  const padBottom = 28;
  const excludedRenderable = excluded.filter(
    (lap) => Number.isFinite(lap.time) && lap.time > 0
  );
  const baselineTimes = usable
    .map((lap) => lap.time)
    .filter((time) => Number.isFinite(time));
  const baselineMedian = medianTime ?? median(baselineTimes);
  const maxPlotDeviation = 0.2; // 20% from median
  const excludedPlotted =
    baselineMedian != null
      ? excludedRenderable.filter(
        (lap) =>
          lap.time >= baselineMedian * (1 - maxPlotDeviation) &&
          lap.time <= baselineMedian * (1 + maxPlotDeviation)
      )
      : excludedRenderable;
  const combinedOrder = [...usable, ...excludedPlotted].sort(
    (a, b) => a.lapNumber - b.lapNumber
  );

  const domainTimesSource = combinedOrder.length > 0 ? combinedOrder : excludedRenderable;
  const indexById = new Map<string, number>();
  domainTimesSource.forEach((lap, idx) => {
    indexById.set(lap.id, idx);
  });

  const domainTimes = domainTimesSource
    .map((lap) => lap.time)
    .filter((time) => Number.isFinite(time));
  if (domainTimes.length === 0) return null;
  const minTime = Math.min(...domainTimes);
  const maxTime = Math.max(...domainTimes);
  const baseSpan = Math.max(maxTime - minTime, 0);
  const yPaddingFactor = 0.1;
  const yPaddingMin = 0.2;
  const visualMin = Math.max(
    0,
    minTime - Math.max(baseSpan * yPaddingFactor, yPaddingMin)
  );
  const visualMax = maxTime;
  const span = Math.max(visualMax - visualMin, 0.001);
  const scaleX = (idx: number) => {
    if (domainTimesSource.length <= 1) return padLeft;
    const step = (width - padLeft - padRight) / (domainTimesSource.length - 1);
    return padLeft + idx * step;
  };
  const scaleY = (time: number) =>
    height - padBottom - ((time - visualMin) / span) * (height - padTop - padBottom);

  const usablePoints = usable
    .filter((lap) => indexById.has(lap.id))
    .map((lap, idx) => ({
      lap,
      x: scaleX(indexById.get(lap.id) ?? idx),
      y: scaleY(lap.time),
    }));
  const fastest = usablePoints.reduce<(typeof usablePoints)[number] | null>(
    (best, point) => {
      if (!best) return point;
      return point.lap.time < best.lap.time ? point : best;
    },
    null
  );
  const pathD =
    usablePoints.length === 0
      ? ""
      : usablePoints
        .map((point, idx) => `${idx === 0 ? "M" : "L"}${point.x},${point.y}`)
        .join(" ");

  const band = (() => {
    if (meanTime == null || stdDevTime == null) return null;
    const top = scaleY(Math.max(visualMin, meanTime - stdDevTime));
    const bottom = scaleY(Math.min(visualMax, meanTime + stdDevTime));
    return {
      top: Math.min(top, bottom),
      height: Math.abs(bottom - top),
    };
  })();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(
    null
  );

  const showTooltip = (event: MouseEvent<SVGCircleElement>, text: string) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setTooltip({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      text,
    });
  };

  const hideTooltip = () => setTooltip(null);

  return (
    <div css={sparklineCardStyles} ref={containerRef} onMouseLeave={hideTooltip}>
      <div css={sparklineHeaderStyles}>
        <p className="title">Lap time spread</p>
        <div className="legend" aria-hidden>
          <span>
            <span className="dot" />
            Clean
          </span>
          <span>
            <span className="hollow" />
            Excluded
          </span>
        </div>
      </div>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        onMouseLeave={hideTooltip}
      >
        <line
          x1={padLeft}
          y1={padTop}
          x2={padLeft}
          y2={height - padBottom}
          stroke="rgba(226, 232, 240, 0.5)"
          strokeWidth={1}
        />
        <line
          x1={padLeft}
          y1={height - padBottom}
          x2={width - padRight}
          y2={height - padBottom}
          stroke="rgba(226, 232, 240, 0.5)"
          strokeWidth={1}
        />
        {band ? (
          <rect
            x={padLeft}
            width={width - padLeft - padRight}
            y={band.top}
            height={band.height}
            fill="rgba(96, 165, 250, 0.2)"
          />
        ) : null}
        {pathD ? (
          <path
            d={pathD}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {usablePoints.map((point) => (
          <circle
            key={`${point.lap.id}-${point.x}-${point.y}`}
            cx={point.x}
            cy={point.y}
            r={fastest && fastest.lap.id === point.lap.id ? 5 : 4}
            fill={fastest && fastest.lap.id === point.lap.id ? "#22c55e" : "#38bdf8"}
            stroke={fastest && fastest.lap.id === point.lap.id ? "#16a34a" : "#0ea5e9"}
            strokeWidth={fastest && fastest.lap.id === point.lap.id ? 2 : 1.5}
            onMouseEnter={(event) =>
              showTooltip(
                event,
                `Lap ${point.lap.lapNumber}: ${formatLapTimeSeconds(point.lap.time)}s (used)`
              )
            }
            onMouseLeave={hideTooltip}
          >
          </circle>
        ))}
        {excludedRenderable.map((lap, idx) => (
          <circle
            key={`${lap.id}-${idx}`}
            cx={scaleX(indexById.get(lap.id) ?? usable.length + idx)}
            cy={scaleY(lap.time)}
            r={4}
            fill="transparent"
            stroke="#e2e8f0"
            strokeWidth={2}
            opacity={0.8}
            onMouseEnter={(event) =>
              showTooltip(
                event,
                `Lap ${lap.lapNumber}: ${formatLapTimeSeconds(lap.time)}s (excluded: ${lap.reason === "out-lap" ? "out lap" : lap.reason
                })`
              )
            }
            onMouseLeave={hideTooltip}
          >
            <title>
              {`Lap ${lap.lapNumber} excluded (${lap.reason === "out-lap" ? "out lap" : lap.reason})`}
            </title>
          </circle>
        ))}
        <text
          x={width / 2}
          y={height - 6}
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize="12"
        >
          Lap order
        </text>
        <text
          x={14}
          y={height / 2}
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize="12"
          transform={`rotate(-90 14 ${height / 2})`}
        >
          Lap time (s)
        </text>
        <text
          x={padLeft - 8}
          y={scaleY(maxTime) + 4}
          textAnchor="end"
          fill="#cbd5e1"
          fontSize="11"
        >
          {formatLapTimeSeconds(maxTime)}s
        </text>
        <text
          x={padLeft - 8}
          y={scaleY(minTime) + 4}
          textAnchor="end"
          fill="#cbd5e1"
          fontSize="11"
        >
          {formatLapTimeSeconds(minTime)}s
        </text>
      </svg>
      {tooltip ? (
        <div css={tooltipStyles} style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  laps: LapWithEvents[];
};

export function ConsistencyCard({ laps }: Props) {
  const stats = useMemo(() => computeConsistencyStats(laps), [laps]);
  const cleanCount = stats.usableLaps.length;
  const excludedCount = stats.excluded.length;
  const outlapCount = stats.excluded.filter((lap) => lap.reason === "out-lap").length;
  const outlierCount = stats.excluded.filter((lap) => lap.reason === "outlier").length;
  const invalidCount = stats.excluded.filter((lap) => lap.reason === "invalid").length;

  if (laps.length === 0) {
    return (
      <Card title="Consistency">
        <div css={emptyStateStyles}>Add lap times to see consistency.</div>
      </Card>
    );
  }

  const windowLabel =
    stats.windowPct && stats.median
      ? `±${(stats.windowPct * 100).toFixed(1)}% of median (${formatLapTimeSeconds(
        stats.median
      )}s)`
      : "Awaiting more laps";
  const spreadLabel =
    stats.stdDev != null ? `±${stats.stdDev.toFixed(3)}s σ • CV ${stats.cvPct?.toFixed(1) ?? "—"}%` : "Need more clean laps";
  const cleanLabel =
    cleanCount > 0
      ? `${cleanCount} clean lap${cleanCount === 1 ? "" : "s"}`
      : "No clean laps yet";
  const exclusionParts = [
    outlapCount ? `${outlapCount} out lap` : null,
    outlierCount ? `${outlierCount} outlier${outlierCount === 1 ? "" : "s"}` : null,
    invalidCount ? `${invalidCount} invalid` : null,
  ].filter(Boolean);
  const excludedLabel = exclusionParts.length
    ? `${excludedCount} excluded (${exclusionParts.join(", ")})`
    : "No exclusions";

  return (
    <Card title="Consistency">
      <div css={cardGridStyles}>
        <div css={summaryStyles}>
          <div css={scoreBlockStyles}>
            <p className="score">{stats.score != null ? stats.score : "—"}</p>
            <span className="pill">{stats.label}</span>
          </div>
          <div css={metaGridStyles}>
            <div css={metaTileStyles}>
              <p className="label">Window</p>
              <p className="value">{windowLabel}</p>
            </div>
            <div css={metaTileStyles}>
              <p className="label">Spread</p>
              <p className="value">{spreadLabel}</p>
              <p className="hint">
                {cleanLabel} • {excludedLabel}
              </p>
            </div>
          </div>
        </div>

        <Sparkline
          usable={stats.usableLaps}
          excluded={stats.excluded}
          medianTime={stats.median}
          meanTime={stats.mean}
          stdDevTime={stats.stdDev}
        />
      </div>
    </Card>
  );
}
