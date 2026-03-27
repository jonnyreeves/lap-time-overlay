import { css } from "@emotion/react";
import { useState, type MouseEvent } from "react";
import { Modal } from "../Modal.js";
import { formatStopwatchTime } from "../../utils/lapTime.js";
import { resolveChartTooltipY } from "./chartTooltipPosition.js";
import { createCompressedLapTimeScale } from "./selfComparisonLapChartScale.js";

type LapComparison = {
  readonly lapNumber: number;
  readonly currentLap: number;
  readonly comparisonLap: number;
};

type Props = {
  comparisons: ReadonlyArray<LapComparison>;
  currentSessionLabel: string;
  comparisonSessionLabel: string;
};

const chartCardStyles = css`
  border: 1px solid #e2e8f4;
  border-radius: 10px;
  background: #ffffff;
  padding: 10px;
`;

const chartHeaderStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const legendStyles = css`
  display: flex;
  gap: 16px;
  font-size: 0.85rem;
  color: #334155;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  i {
    display: inline-block;
    width: 12px;
    height: 2px;
    border-radius: 999px;
  }
`;

const expandButtonStyles = css`
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #f8fafc;
  color: #0f172a;
  padding: 7px 12px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: #eef2ff;
    border-color: #c7d2fe;
  }
`;

const chartSvgStyles = css`
  display: block;
  width: 100%;
  overflow: visible;
`;

const modalBodyStyles = css`
  display: grid;
  gap: 14px;
`;

const modalHintStyles = css`
  margin: 0;
  color: #475569;
  font-size: 0.95rem;
  font-weight: 600;
`;

const emptyStateStyles = css`
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  padding: 12px;
  font-weight: 600;
`;

function buildLinePath(points: Array<{ x: number; y: number }>): string {
  if (!points.length) return "";
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}

function formatLap(time: number | null | undefined): string {
  if (time == null || !Number.isFinite(time) || time <= 0) return "—";
  return formatStopwatchTime(time);
}

function buildTickIndices(length: number, maxTicks: number): number[] {
  if (length <= 0) return [];
  if (length <= maxTicks) return Array.from({ length }, (_, index) => index);

  const ticks = new Set<number>([0, length - 1]);
  const step = (length - 1) / (maxTicks - 1);
  for (let tick = 1; tick < maxTicks - 1; tick += 1) {
    ticks.add(Math.round(step * tick));
  }

  return Array.from(ticks).sort((a, b) => a - b);
}

function SelfComparisonLapChartSvg({
  comparisons,
  currentSessionLabel,
  comparisonSessionLabel,
  width,
  height,
}: {
  comparisons: ReadonlyArray<LapComparison>;
  currentSessionLabel: string;
  comparisonSessionLabel: string;
  width: number;
  height: number;
}) {
  const [hoveredLapIndex, setHoveredLapIndex] = useState<number | null>(null);

  const xPad = 56;
  const yPad = 20;
  const bottomPad = 70;
  const allTimes = comparisons.flatMap((lap) => [lap.currentLap, lap.comparisonLap]);
  const scale = createCompressedLapTimeScale(allTimes, yPad, height - bottomPad);
  const plotBottomY = height - bottomPad;
  const plotHeight = height - yPad - bottomPad;
  const xStep =
    comparisons.length > 1 ? (width - xPad * 2) / (comparisons.length - 1) : width - xPad * 2;
  const projectX = (index: number) => xPad + index * xStep;
  const projectY = scale.project;
  const yTicks = scale.ticks;
  const currentPath = buildLinePath(
    comparisons.map((lap, index) => ({ x: projectX(index), y: projectY(lap.currentLap) }))
  );
  const comparisonPath = buildLinePath(
    comparisons.map((lap, index) => ({ x: projectX(index), y: projectY(lap.comparisonLap) }))
  );
  const xTickIndices = buildTickIndices(comparisons.length, 6);
  const hoveredLap = hoveredLapIndex != null ? comparisons[hoveredLapIndex] ?? null : null;
  const hoveredX = hoveredLapIndex != null ? projectX(hoveredLapIndex) : null;
  const hoveredCurrentY = hoveredLap ? projectY(hoveredLap.currentLap) : null;
  const hoveredComparisonY = hoveredLap ? projectY(hoveredLap.comparisonLap) : null;
  const tooltipWidth = 188;
  const tooltipHeight = 56;
  const tooltipX =
    hoveredX == null
      ? null
      : Math.max(12, Math.min(width - tooltipWidth - 12, hoveredX - tooltipWidth / 2));
  const tooltipY =
    hoveredCurrentY != null && hoveredComparisonY != null
      ? resolveChartTooltipY([hoveredCurrentY, hoveredComparisonY], tooltipHeight, yPad, plotBottomY)
      : yPad;

  function updateHoveredLap(event: MouseEvent<SVGSVGElement>) {
    if (!comparisons.length) {
      setHoveredLapIndex(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - bounds.left) / bounds.width) * width;
    const clampedX = Math.max(xPad, Math.min(width - xPad, relativeX));
    const rawIndex = xStep === 0 ? 0 : Math.round((clampedX - xPad) / xStep);
    const nextIndex = Math.max(0, Math.min(comparisons.length - 1, rawIndex));
    setHoveredLapIndex(nextIndex);
  }

  return (
    <svg
      css={chartSvgStyles}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Lap-by-lap self comparison chart"
      onMouseMove={updateHoveredLap}
      onMouseLeave={() => setHoveredLapIndex(null)}
    >
      {yTicks.map((tick) => (
        <g key={`y-${tick.y.toFixed(2)}`}>
          <line x1={xPad} x2={width - xPad} y1={tick.y} y2={tick.y} stroke="#e2e8f4" strokeWidth={1} />
          <text x={xPad - 8} y={tick.y + 4} textAnchor="end" fontSize="10" fill="#64748b">
            {tick.value.toFixed(3)}s
          </text>
        </g>
      ))}
      {scale.breakYs.map((breakY) => (
        <g key={`break-${breakY.toFixed(2)}`} stroke="#94a3b8" strokeWidth={1.4} strokeLinecap="round">
          <line x1={xPad - 6} x2={xPad - 1} y1={breakY - 4} y2={breakY} />
          <line x1={xPad - 6} x2={xPad - 1} y1={breakY} y2={breakY + 4} />
        </g>
      ))}
      {xTickIndices.map((index) => {
        const x = projectX(index);
        return (
          <g key={`x-${comparisons[index]?.lapNumber ?? index}`}>
            <line x1={x} x2={x} y1={plotBottomY} y2={plotBottomY + 6} stroke="#94a3b8" strokeWidth={1} />
            <text x={x} y={plotBottomY + 20} textAnchor="middle" fontSize="10" fill="#64748b">
              {comparisons[index]?.lapNumber}
            </text>
          </g>
        );
      })}
      <line x1={xPad} x2={xPad} y1={yPad} y2={plotBottomY} stroke="#94a3b8" strokeWidth={1.2} />
      <line x1={xPad} x2={width - xPad} y1={plotBottomY} y2={plotBottomY} stroke="#94a3b8" strokeWidth={1.2} />
      <text x={(xPad + width - xPad) / 2} y={height - 14} textAnchor="middle" fontSize="11" fill="#64748b">
        Lap number
      </text>
      <text
        x={14}
        y={height / 2}
        textAnchor="middle"
        fontSize="11"
        fill="#64748b"
        transform={`rotate(-90 14 ${height / 2})`}
      >
        Lap time (faster down)
      </text>
      <path d={currentPath} fill="none" stroke="#0f766e" strokeWidth={2.5} />
      <path d={comparisonPath} fill="none" stroke="#f97316" strokeWidth={2.5} />
      {hoveredLap && hoveredX != null && hoveredCurrentY != null && hoveredComparisonY != null ? (
        <>
          <line
            x1={hoveredX}
            x2={hoveredX}
            y1={yPad}
            y2={plotBottomY}
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <circle cx={hoveredX} cy={hoveredCurrentY} r={5.5} fill="#0f766e" stroke="#ffffff" strokeWidth={2} />
          <circle cx={hoveredX} cy={hoveredComparisonY} r={5.5} fill="#f97316" stroke="#ffffff" strokeWidth={2} />
          <g transform={`translate(${tooltipX ?? 12}, ${tooltipY})`}>
            <rect width={tooltipWidth} height={tooltipHeight} rx={10} fill="#0f172a" opacity={0.94} />
            <text x={12} y={18} fontSize="11" fill="#f8fafc" fontWeight={700}>
              Lap {hoveredLap.lapNumber}
            </text>
            <text x={12} y={34} fontSize="10" fill="#ccfbf1">
              {currentSessionLabel} {formatLap(hoveredLap.currentLap)}
            </text>
            <text x={12} y={48} fontSize="10" fill="#fed7aa">
              {comparisonSessionLabel} {formatLap(hoveredLap.comparisonLap)}
            </text>
          </g>
        </>
      ) : null}
      <rect
        x={xPad}
        y={yPad}
        width={width - xPad * 2}
        height={plotHeight}
        fill="transparent"
        style={{ cursor: "crosshair" }}
      />
    </svg>
  );
}

export function SelfComparisonLapChart({
  comparisons,
  currentSessionLabel,
  comparisonSessionLabel,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasCompressedOutliers = createCompressedLapTimeScale(
    comparisons.flatMap((lap) => [lap.currentLap, lap.comparisonLap]),
    0,
    100
  ).hasCompressedOutliers;

  return (
    <>
      <div css={chartCardStyles}>
        <div css={chartHeaderStyles}>
          <div css={legendStyles}>
            <span>
              <i css={css`background: #0f766e;`} />
              {currentSessionLabel}
            </span>
            <span>
              <i css={css`background: #f97316;`} />
              {comparisonSessionLabel}
            </span>
          </div>
          {comparisons.length > 0 ? (
            <button type="button" css={expandButtonStyles} onClick={() => setIsExpanded(true)}>
              Expand chart
            </button>
          ) : null}
        </div>
        {comparisons.length > 0 ? (
          <SelfComparisonLapChartSvg
            comparisons={comparisons}
            currentSessionLabel={currentSessionLabel}
            comparisonSessionLabel={comparisonSessionLabel}
            width={720}
            height={284}
          />
        ) : (
          <div css={emptyStateStyles}>No aligned lap numbers exist between these sessions.</div>
        )}
      </div>

      <Modal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        title="Self Comparison Chart"
        maxWidth="1200px"
      >
        <div css={modalBodyStyles}>
          <p css={modalHintStyles}>Compare both sessions lap by lap with more space for the axes and hover detail.</p>
          {hasCompressedOutliers ? (
            <p css={modalHintStyles}>Outlier laps are compressed on the y-axis so the race-pace window stays readable.</p>
          ) : null}
          <div css={legendStyles}>
            <span>
              <i css={css`background: #0f766e;`} />
              {currentSessionLabel}
            </span>
            <span>
              <i css={css`background: #f97316;`} />
              {comparisonSessionLabel}
            </span>
          </div>
          <SelfComparisonLapChartSvg
            comparisons={comparisons}
            currentSessionLabel={currentSessionLabel}
            comparisonSessionLabel={comparisonSessionLabel}
            width={1080}
            height={440}
          />
        </div>
      </Modal>
    </>
  );
}
