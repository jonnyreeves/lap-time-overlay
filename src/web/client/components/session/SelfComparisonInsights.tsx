import { css } from "@emotion/react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { SelfComparisonLapChart } from "./SelfComparisonLapChart.js";
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

function formatTrendDateLabel(date: string): string {
  return format(new Date(date), "dd/MM");
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
  const comparisons = analysis.lapComparisons ?? [];
  const trendPoints = analysis.trend.points ?? [];

  const trendWidth = 320;
  const trendHeight = 136;
  const trendXPad = 52;
  const trendRightPad = 16;
  const trendTopPad = 16;
  const trendBottomPad = 34;
  const trendTimes = trendPoints.map((point) => point.value);
  const trendMin = trendTimes.length ? Math.min(...trendTimes) : 0;
  const trendMax = trendTimes.length ? Math.max(...trendTimes) : 1;
  const trendSpan = Math.max(trendMax - trendMin, 0.001);
  const trendPlotBottomY = trendHeight - trendBottomPad;
  const trendPlotHeight = trendHeight - trendTopPad - trendBottomPad;
  const trendPlotWidth = trendWidth - trendXPad - trendRightPad;
  const trendXStep =
    trendPoints.length > 1 ? trendPlotWidth / (trendPoints.length - 1) : trendPlotWidth;
  const projectTrendX = (index: number) => trendXPad + index * trendXStep;
  const projectTrendY = (value: number) => {
    const ratio = (value - trendMin) / trendSpan;
    return trendPlotBottomY - ratio * trendPlotHeight;
  };
  const trendYTicks = Array.from({ length: 4 }, (_, index) => {
    const ratio = index / 3;
    const value = trendMin + ratio * trendSpan;
    return { value, y: projectTrendY(value) };
  });
  const trendXTickIndices = buildTickIndices(trendPoints.length, 4);
  const trendPath = buildLinePath(
    trendPoints.map((point, index) => ({
      x: projectTrendX(index),
      y: projectTrendY(point.value),
    }))
  );

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

      <SelfComparisonLapChart
        comparisons={comparisons}
        currentSessionLabel="Current session"
        comparisonSessionLabel="Comparison session"
      />

      <div css={chartCardStyles}>
        <div css={metaRowStyles}>
          <strong>{trendDirectionLabel(analysis.trend.direction)}</strong>
          <span>{trendMetricLabel(analysis.trend.metric)}</span>
        </div>
        {trendPoints.length ? (
          <>
            <svg
              viewBox={`0 0 ${trendWidth} ${trendHeight}`}
              width="100%"
              role="img"
              aria-label="Self comparison trend chart with session date on the x-axis and lap time on the y-axis"
            >
              {trendYTicks.map((tick) => (
                <g key={`trend-y-${tick.y.toFixed(2)}`}>
                  <line
                    x1={trendXPad}
                    x2={trendWidth - trendRightPad}
                    y1={tick.y}
                    y2={tick.y}
                    stroke="#e2e8f4"
                    strokeWidth={1}
                  />
                  <text
                    x={trendXPad - 8}
                    y={tick.y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#64748b"
                  >
                    {formatLap(tick.value)}
                  </text>
                </g>
              ))}
              {trendXTickIndices.map((index: number) => {
                const point = trendPoints[index];
                if (!point) return null;
                const x = projectTrendX(index);
                const isFirst = index === 0;
                const isLast = index === trendPoints.length - 1;
                return (
                  <g key={`trend-x-${point.sessionId}`}>
                    <line
                      x1={x}
                      x2={x}
                      y1={trendTopPad}
                      y2={trendPlotBottomY}
                      stroke="#f1f5f9"
                      strokeWidth={1}
                    />
                    <text
                      x={x}
                      y={trendPlotBottomY + 16}
                      textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
                      fontSize="10"
                      fill="#64748b"
                    >
                      {formatTrendDateLabel(point.date)}
                    </text>
                  </g>
                );
              })}
              <line
                x1={trendXPad}
                x2={trendXPad}
                y1={trendTopPad}
                y2={trendPlotBottomY}
                stroke="#94a3b8"
                strokeWidth={1.2}
              />
              <line
                x1={trendXPad}
                x2={trendWidth - trendRightPad}
                y1={trendPlotBottomY}
                y2={trendPlotBottomY}
                stroke="#94a3b8"
                strokeWidth={1.2}
              />
              <text
                x={(trendXPad + trendWidth - trendRightPad) / 2}
                y={trendHeight - 4}
                textAnchor="middle"
                fontSize="11"
                fill="#334155"
              >
                Session date
              </text>
              <text
                x={16}
                y={trendHeight / 2}
                textAnchor="middle"
                fontSize="11"
                fill="#334155"
                transform={`rotate(-90 16 ${trendHeight / 2})`}
              >
                Lap time (faster up)
              </text>
              <path d={trendPath} fill="none" stroke="#2563eb" strokeWidth={2.5} />
              {trendPoints.map((point, index) => {
                const x = projectTrendX(index);
                const y = projectTrendY(point.value);
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
