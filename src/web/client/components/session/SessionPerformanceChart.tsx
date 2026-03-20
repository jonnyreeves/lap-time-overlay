import { css } from "@emotion/react";
import { useMemo } from "react";
import { formatLapTimeSeconds } from "../../utils/lapTime.js";
import type { LapWithEvents } from "./LapsCard.js";

type ExcludedLap = {
  lapNumber: number;
  reason: string;
};

type Props = {
  laps: LapWithEvents[];
  cleanLapNumbers: readonly number[];
  excludedLaps: readonly ExcludedLap[];
  highlightLapNumbers: readonly number[];
  representativePace: number | null | undefined;
  thresholdLapTime: number | null | undefined;
  format: string;
};

const chartCardStyles = css`
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #dbe4f0;
  background: linear-gradient(160deg, #0f172a, #111c3a);
  color: #dbeafe;
`;

const legendStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 0.8rem;
  font-weight: 700;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  i {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 999px;
  }
`;

const emptyStateStyles = css`
  padding: 12px;
  border-radius: 10px;
  border: 1px dashed rgba(203, 213, 225, 0.4);
  color: #cbd5e1;
  font-weight: 700;
  text-align: center;
`;

function buildLinePath(points: Array<{ x: number; y: number }>): string {
  if (!points.length) return "";
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
}

export function SessionPerformanceChart({
  laps,
  cleanLapNumbers,
  excludedLaps,
  highlightLapNumbers,
  representativePace,
  thresholdLapTime,
  format,
}: Props) {
  const validLaps = useMemo(
    () =>
      laps
        .filter((lap) => Number.isFinite(lap.time) && lap.time > 0)
        .sort((left, right) => left.lapNumber - right.lapNumber),
    [laps]
  );

  if (!validLaps.length) {
    return <div css={emptyStateStyles}>Add lap times to see session performance.</div>;
  }

  const width = 720;
  const height = 220;
  const xPad = 42;
  const topPad = 16;
  const bottomPad = 26;
  const cleanSet = new Set(cleanLapNumbers);
  const excludedSet = new Set(excludedLaps.map((lap) => lap.lapNumber));
  const highlightSet = new Set(highlightLapNumbers);
  const times = validLaps.map((lap) => lap.time);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeSpan = Math.max(maxTime - minTime, 0.001);
  const plotHeight = height - topPad - bottomPad;
  const xStep =
    validLaps.length > 1 ? (width - xPad * 2) / (validLaps.length - 1) : width - xPad * 2;
  const projectX = (index: number) => xPad + index * xStep;
  const projectY = (value: number) =>
    height - bottomPad - ((value - minTime) / timeSpan) * plotHeight;

  const points = validLaps.map((lap, index) => ({
    lapNumber: lap.lapNumber,
    time: lap.time,
    x: projectX(index),
    y: projectY(lap.time),
  }));
  const linePath = buildLinePath(points);
  const thresholdHalfWindow =
    representativePace != null && thresholdLapTime != null
      ? Math.max(0, thresholdLapTime - representativePace)
      : null;
  const bandLow =
    representativePace != null && thresholdHalfWindow != null
      ? Math.max(minTime, representativePace - thresholdHalfWindow)
      : null;
  const bandHigh = thresholdLapTime ?? null;
  const highlightedPoints = points.filter((point) => highlightSet.has(point.lapNumber));
  const streakStart = highlightLapNumbers.length ? Math.min(...highlightLapNumbers) : null;
  const streakEnd = highlightLapNumbers.length ? Math.max(...highlightLapNumbers) : null;
  const streakStartPoint = points.find((point) => point.lapNumber === streakStart) ?? null;
  const streakEndPoint = points.find((point) => point.lapNumber === streakEnd) ?? null;

  return (
    <div css={chartCardStyles}>
      <div css={legendStyles}>
        <span>
          <i style={{ background: "#38bdf8" }} />
          Clean laps
        </span>
        <span>
          <i style={{ background: "transparent", border: "2px solid #e2e8f0" }} />
          Excluded
        </span>
        <span>
          <i style={{ background: "#f59e0b" }} />
          {format === "Qualifying" ? "Top push laps" : "Key run"}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Session performance chart">
        {bandLow != null && bandHigh != null ? (
          <rect
            x={xPad - 8}
            y={projectY(bandHigh)}
            width={width - (xPad - 8) * 2}
            height={projectY(bandLow) - projectY(bandHigh)}
            fill="rgba(56, 189, 248, 0.12)"
            stroke="rgba(125, 211, 252, 0.25)"
            rx="8"
          />
        ) : null}
        {streakStartPoint && streakEndPoint && format === "Race" ? (
          <rect
            x={streakStartPoint.x - 8}
            y={topPad}
            width={streakEndPoint.x - streakStartPoint.x + 16}
            height={plotHeight}
            fill="rgba(245, 158, 11, 0.12)"
            stroke="rgba(251, 191, 36, 0.28)"
            rx="10"
          />
        ) : null}
        {Array.from({ length: 4 }, (_, index) => {
          const value = minTime + (timeSpan / 3) * index;
          const y = projectY(value);
          return (
            <g key={value}>
              <line x1={xPad} y1={y} x2={width - xPad} y2={y} stroke="rgba(148, 163, 184, 0.16)" />
              <text x={8} y={y + 4} fill="#cbd5e1" fontSize="11">
                {formatLapTimeSeconds(value)}s
              </text>
            </g>
          );
        })}
        <path d={linePath} fill="none" stroke="#94a3b8" strokeWidth="2.2" />
        {representativePace != null ? (
          <line
            x1={xPad}
            y1={projectY(representativePace)}
            x2={width - xPad}
            y2={projectY(representativePace)}
            stroke="#7dd3fc"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
        ) : null}
        {points.map((point) => {
          const isExcluded = excludedSet.has(point.lapNumber);
          const isHighlighted = highlightSet.has(point.lapNumber);
          return (
            <circle
              key={point.lapNumber}
              cx={point.x}
              cy={point.y}
              r={isHighlighted ? 5.5 : 4}
              fill={isExcluded ? "transparent" : isHighlighted ? "#f59e0b" : cleanSet.has(point.lapNumber) ? "#38bdf8" : "#94a3b8"}
              stroke={isExcluded ? "#e2e8f0" : isHighlighted ? "#fde68a" : "#0f172a"}
              strokeWidth={isExcluded ? 2 : 1.5}
            />
          );
        })}
        {points.map((point, index) =>
          index === 0 || index === points.length - 1 || index % Math.max(1, Math.floor(points.length / 6)) === 0 ? (
            <text key={`tick-${point.lapNumber}`} x={point.x} y={height - 8} textAnchor="middle" fill="#cbd5e1" fontSize="11">
              {point.lapNumber}
            </text>
          ) : null
        )}
      </svg>
    </div>
  );
}
