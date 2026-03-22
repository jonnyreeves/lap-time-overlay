import { css } from "@emotion/react";
import { format } from "date-fns";
import { useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { formatStopwatchTime } from "../../utils/lapTime.js";

export type SelfComparisonSelectableSession = {
  readonly sessionId: string;
  readonly date: string;
  readonly classification: number;
  readonly fastestLap: number | null | undefined;
  readonly sessionPerformanceScore: number | null | undefined;
  readonly conditions: string;
  readonly temperature?: string | null | undefined;
};

export type SelfComparisonAnalysisView = {
  readonly comparisonSession: SelfComparisonSelectableSession;
  readonly confidence: "HIGH" | "MEDIUM";
  readonly confidenceReasons: ReadonlyArray<string>;
  readonly performanceScoreDelta: number | null | undefined;
  readonly classificationDelta: number | null | undefined;
  readonly lapComparisons: ReadonlyArray<{
    readonly lapNumber: number;
    readonly currentLap: number;
    readonly comparisonLap: number;
    readonly delta: number;
    readonly cumulativeDelta: number;
    readonly outcome: string;
  }>;
  readonly sessionInsights: {
    readonly currentFasterLapCount: number;
    readonly comparisonFasterLapCount: number;
    readonly tieCount: number;
    readonly longestCurrentAdvantageStreak: number;
    readonly longestComparisonAdvantageStreak: number;
    readonly medianDelta: number | null | undefined;
    readonly consistencyGap: number | null | undefined;
    readonly insightLabel: string;
  };
  readonly paceInsights: {
    readonly current: {
      readonly bestLap: number | null | undefined;
      readonly fastest5Avg: number | null | undefined;
      readonly fastest10Avg: number | null | undefined;
      readonly bestRolling5:
        | { readonly average: number; readonly startLapNumber: number; readonly endLapNumber: number }
        | null
        | undefined;
      readonly bestRolling10:
        | { readonly average: number; readonly startLapNumber: number; readonly endLapNumber: number }
        | null
        | undefined;
    };
    readonly comparison: {
      readonly bestLap: number | null | undefined;
      readonly fastest5Avg: number | null | undefined;
      readonly fastest10Avg: number | null | undefined;
      readonly bestRolling5:
        | { readonly average: number; readonly startLapNumber: number; readonly endLapNumber: number }
        | null
        | undefined;
      readonly bestRolling10:
        | { readonly average: number; readonly startLapNumber: number; readonly endLapNumber: number }
        | null
        | undefined;
    };
    readonly deltas: {
      readonly bestLap: number | null | undefined;
      readonly fastest5Avg: number | null | undefined;
      readonly fastest10Avg: number | null | undefined;
      readonly bestRolling5Avg: number | null | undefined;
      readonly bestRolling10Avg: number | null | undefined;
      readonly overallMean: number | null | undefined;
      readonly overallMedian: number | null | undefined;
      readonly slowLapSpread: number | null | undefined;
    };
    readonly headline: string;
  };
  readonly coachingSignals: {
    readonly deltas: {
      readonly firstLapWithin103Pct: number | null | undefined;
      readonly lapsWithinPoint2OfBest: number;
      readonly stintFade: number | null | undefined;
    };
  };
  readonly trend: {
    readonly direction: "IMPROVING" | "REGRESSING" | "FLAT" | "INSUFFICIENT";
    readonly metric: "FASTEST_10_AVG" | "FASTEST_5_AVG" | "BEST_LAP" | null | undefined;
    readonly points: ReadonlyArray<{
      readonly sessionId: string;
      readonly date: string;
      readonly value: number;
      readonly metric: "FASTEST_10_AVG" | "FASTEST_5_AVG" | "BEST_LAP";
      readonly isCurrent: boolean;
    }>;
  };
};

type Props = {
  analysis: SelfComparisonAnalysisView;
  currentSession?: {
    readonly label: string;
    readonly href?: string;
    readonly date?: string;
  };
  comparisonSessionHref?: string;
};

const metaRowStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const badgeStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const highConfidenceStyles = css`
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
`;

const mediumConfidenceStyles = css`
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
`;

const summaryStyles = css`
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  color: #1e293b;
  font-weight: 700;
`;

const reasonListStyles = css`
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f4;
  color: #334155;
  font-weight: 600;
`;

const sessionLinkStyles = css`
  color: #1d4ed8;
  text-decoration: none;
  font-weight: 700;

  &:hover {
    text-decoration: underline;
  }
`;

const fastestLapGridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
`;

const fastestLapTileStyles = css`
  border: 1px solid #dbe4f0;
  border-radius: 12px;
  background: linear-gradient(145deg, #f8fbff, #eef4ff);
  padding: 12px 14px;
  display: grid;
  gap: 6px;

  .label {
    margin: 0;
    color: #64748b;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 800;
  }

  .value {
    margin: 0;
    color: #0f172a;
    font-size: 1.65rem;
    line-height: 1;
    font-weight: 900;
    letter-spacing: -0.04em;
  }

  .meta {
    margin: 0;
    color: #475569;
    font-size: 0.82rem;
    font-weight: 700;
  }
`;

const insightGridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
`;

const insightTileStyles = css`
  border: 1px solid #e2e8f4;
  border-radius: 10px;
  background: #f8fafc;
  padding: 10px;

  .label {
    margin: 0;
    font-size: 0.78rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 700;
  }

  .value {
    margin: 4px 0 0;
    font-weight: 800;
    color: #0f172a;
    font-size: 1.05rem;
  }
`;

const chartCardStyles = css`
  border: 1px solid #e2e8f4;
  border-radius: 10px;
  background: #ffffff;
  padding: 10px;
`;

const chartSvgStyles = css`
  display: block;
  width: 100%;
  overflow: visible;
`;

const legendStyles = css`
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
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

const trendTableStyles = css`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;

  th,
  td {
    text-align: left;
    padding: 6px 8px;
    border-bottom: 1px solid #e2e8f4;
  }

  th {
    color: #64748b;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.75rem;
  }
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

function formatDelta(delta: number | null | undefined, unit = "s"): string {
  if (delta == null || !Number.isFinite(delta)) return "—";
  return `${delta > 0 ? "+" : ""}${delta.toFixed(unit === "s" ? 3 : 0)}${unit}`;
}

function formatClassificationDelta(delta: number | null | undefined): string {
  if (delta == null || !Number.isFinite(delta)) return "—";
  if (delta === 0) return "Level";
  const direction = delta < 0 ? "better" : "worse";
  return `${delta > 0 ? "+" : ""}${delta.toFixed(0)} ${direction}`;
}

function trendDirectionLabel(direction: Props["analysis"]["trend"]["direction"]): string {
  if (direction === "IMPROVING") return "Improving";
  if (direction === "REGRESSING") return "Regressing";
  if (direction === "FLAT") return "Flat";
  return "Insufficient history";
}

function trendMetricLabel(metric: Props["analysis"]["trend"]["metric"]): string {
  if (metric === "FASTEST_10_AVG") return "Fastest 10 Avg";
  if (metric === "FASTEST_5_AVG") return "Fastest 5 Avg";
  if (metric === "BEST_LAP") return "Best Lap";
  return "Best pace";
}

function pickSustainedDelta(analysis: SelfComparisonAnalysisView): number | null {
  return (
    analysis.paceInsights.deltas.bestRolling10Avg ??
    analysis.paceInsights.deltas.bestRolling5Avg ??
    null
  );
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

export function SelfComparisonInsights({
  analysis,
  currentSession,
  comparisonSessionHref,
}: Props) {
  const [hoveredLapIndex, setHoveredLapIndex] = useState<number | null>(null);
  const comparisons = analysis.lapComparisons ?? [];
  const trendPoints = analysis.trend.points ?? [];
  const width = 720;
  const height = 284;
  const xPad = 56;
  const yPad = 20;
  const bottomPad = 70;
  const allTimes = comparisons.flatMap((lap) => [lap.currentLap, lap.comparisonLap]);
  const minTime = allTimes.length ? Math.min(...allTimes) : 0;
  const maxTime = allTimes.length ? Math.max(...allTimes) : 1;
  const timeSpan = Math.max(maxTime - minTime, 0.001);
  const plotBottomY = height - bottomPad;
  const plotHeight = height - yPad - bottomPad;
  const xStep =
    comparisons.length > 1 ? (width - xPad * 2) / (comparisons.length - 1) : width - xPad * 2;
  const projectX = (index: number) => xPad + index * xStep;
  const projectY = (value: number) => {
    const ratio = (value - minTime) / timeSpan;
    return plotBottomY - ratio * plotHeight;
  };
  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const value = minTime + ratio * timeSpan;
    return { value, y: projectY(value) };
  });
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
  const tooltipWidth = 172;
  const tooltipHeight = 56;
  const tooltipX =
    hoveredX == null
      ? null
      : Math.max(12, Math.min(width - tooltipWidth - 12, hoveredX - tooltipWidth / 2));
  const tooltipY = 10;

  const trendWidth = 240;
  const trendHeight = 72;
  const trendTimes = trendPoints.map((point) => point.value);
  const trendMin = trendTimes.length ? Math.min(...trendTimes) : 0;
  const trendMax = trendTimes.length ? Math.max(...trendTimes) : 1;
  const trendSpan = Math.max(trendMax - trendMin, 0.001);
  const trendXStep =
    trendPoints.length > 1 ? (trendWidth - 20) / (trendPoints.length - 1) : trendWidth - 20;
  const trendPath = buildLinePath(
    trendPoints.map((point, index) => ({
      x: 10 + index * trendXStep,
      y: 10 + ((point.value - trendMin) / trendSpan) * (trendHeight - 20),
    }))
  );

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
    <>
      <div css={metaRowStyles}>
        <span css={[badgeStyles, analysis.confidence === "HIGH" ? highConfidenceStyles : mediumConfidenceStyles]}>
          {analysis.confidence} confidence
        </span>
        {currentSession?.href ? (
          <Link css={sessionLinkStyles} to={currentSession.href}>
            {currentSession.label}
          </Link>
        ) : currentSession?.label ? (
          <span>{currentSession.label}</span>
        ) : null}
        {comparisonSessionHref ? (
          <Link css={sessionLinkStyles} to={comparisonSessionHref}>
            {format(new Date(analysis.comparisonSession.date), "dd/MM/yyyy")}
          </Link>
        ) : (
          <span>{format(new Date(analysis.comparisonSession.date), "dd/MM/yyyy")}</span>
        )}
        <span>{analysis.comparisonSession.conditions}</span>
      </div>

      <p css={summaryStyles}>{analysis.paceInsights.headline}</p>
      <p css={reasonListStyles}>{analysis.confidenceReasons.join(" ")}</p>

      <div css={fastestLapGridStyles}>
        <div css={fastestLapTileStyles}>
          <p className="label">Left Fastest Lap</p>
          <p className="value">{formatLap(analysis.paceInsights.current.bestLap)}</p>
          <p className="meta">{currentSession?.label ?? "Left session"}</p>
        </div>
        <div css={fastestLapTileStyles}>
          <p className="label">Right Fastest Lap</p>
          <p className="value">{formatLap(analysis.paceInsights.comparison.bestLap)}</p>
          <p className="meta">{format(new Date(analysis.comparisonSession.date), "dd/MM/yyyy")}</p>
        </div>
      </div>

      <div css={insightGridStyles}>
        <div css={insightTileStyles}>
          <p className="label">Best Lap Delta</p>
          <p className="value">{formatDelta(analysis.paceInsights.deltas.bestLap)}</p>
        </div>
        <div css={insightTileStyles}>
          <p className="label">Sustained Pace</p>
          <p className="value">{formatDelta(pickSustainedDelta(analysis))}</p>
        </div>
        <div css={insightTileStyles}>
          <p className="label">Consistency Gap</p>
          <p className="value">{formatDelta(analysis.sessionInsights.consistencyGap)}</p>
        </div>
        <div css={insightTileStyles}>
          <p className="label">Performance Score</p>
          <p className="value">{formatDelta(analysis.performanceScoreDelta, "")}</p>
        </div>
        <div css={insightTileStyles}>
          <p className="label">Classification</p>
          <p className="value">{formatClassificationDelta(analysis.classificationDelta)}</p>
        </div>
        <div css={insightTileStyles}>
          <p className="label">Warm-up Delta</p>
          <p className="value">{formatDelta(analysis.coachingSignals.deltas.firstLapWithin103Pct, "")}</p>
        </div>
        <div css={insightTileStyles}>
          <p className="label">Repeatability ±0.2s</p>
          <p className="value">{formatDelta(analysis.coachingSignals.deltas.lapsWithinPoint2OfBest, "")}</p>
        </div>
        <div css={insightTileStyles}>
          <p className="label">Stint Fade</p>
          <p className="value">{formatDelta(analysis.coachingSignals.deltas.stintFade)}</p>
        </div>
      </div>

      <div css={chartCardStyles}>
        <div css={legendStyles}>
          <span>
            <i css={css`background: #0f766e;`} />
            Left session
          </span>
          <span>
            <i css={css`background: #f97316;`} />
            Right session
          </span>
        </div>
        {comparisons.length > 0 ? (
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
                <circle
                  cx={hoveredX}
                  cy={hoveredComparisonY}
                  r={5.5}
                  fill="#f97316"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                <g transform={`translate(${tooltipX ?? 12}, ${tooltipY})`}>
                  <rect width={tooltipWidth} height={tooltipHeight} rx={10} fill="#0f172a" opacity={0.94} />
                  <text x={12} y={18} fontSize="11" fill="#f8fafc" fontWeight={700}>
                    Lap {hoveredLap.lapNumber}
                  </text>
                  <text x={12} y={34} fontSize="10" fill="#ccfbf1">
                    Left {formatLap(hoveredLap.currentLap)}
                  </text>
                  <text x={12} y={48} fontSize="10" fill="#fed7aa">
                    Right {formatLap(hoveredLap.comparisonLap)}
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
        ) : (
          <div css={emptyStateStyles}>No aligned lap numbers exist between these sessions.</div>
        )}
      </div>

      <div css={chartCardStyles}>
        <div css={metaRowStyles}>
          <strong>{trendDirectionLabel(analysis.trend.direction)}</strong>
          <span>{trendMetricLabel(analysis.trend.metric)}</span>
        </div>
        {trendPoints.length ? (
          <>
            <svg viewBox={`0 0 ${trendWidth} ${trendHeight}`} width="100%" role="img" aria-label="Self comparison trend chart">
              <path d={trendPath} fill="none" stroke="#2563eb" strokeWidth={2.5} />
              {trendPoints.map((point, index) => {
                const x = 10 + index * trendXStep;
                const y = 10 + ((point.value - trendMin) / trendSpan) * (trendHeight - 20);
                return (
                  <circle
                    key={point.sessionId}
                    cx={x}
                    cy={y}
                    r={point.isCurrent ? 4 : 3}
                    fill={point.isCurrent ? "#0f172a" : "#2563eb"}
                  />
                );
              })}
            </svg>
            <table css={trendTableStyles}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {trendPoints
                  .slice()
                  .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
                  .slice(0, 6)
                  .map((point) => (
                    <tr key={point.sessionId}>
                      <td>{format(new Date(point.date), "dd/MM/yyyy")}</td>
                      <td>{trendMetricLabel(point.metric)}</td>
                      <td>
                        {formatLap(point.value)}
                        {point.isCurrent ? " (current)" : ""}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </>
        ) : (
          <div css={emptyStateStyles}>Not enough comparable history to show a trend yet.</div>
        )}
      </div>
    </>
  );
}
