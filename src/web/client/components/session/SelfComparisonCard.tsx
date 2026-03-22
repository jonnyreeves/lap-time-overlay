import { css } from "@emotion/react";
import { format } from "date-fns";
import type { viewSessionQuery$data } from "../../__generated__/viewSessionQuery.graphql.js";
import { formatStopwatchTime } from "../../utils/lapTime.js";
import { Card } from "../Card.js";

type SessionPayload = NonNullable<viewSessionQuery$data["trackSession"]>;
type ComparableSelfSession = SessionPayload["comparableSelfSessions"][number];
type SelfComparisonAnalysis = NonNullable<SessionPayload["selfComparison"]>;

type Props = {
  comparableSessions: ReadonlyArray<ComparableSelfSession>;
  selectedComparisonSessionId: string;
  analysis: SelfComparisonAnalysis | null | undefined;
  onSelectComparisonSession: (sessionId: string) => void;
};

const containerStyles = css`
  display: grid;
  gap: 14px;
`;

const inputFieldStyles = css`
  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 700;
    color: #334155;
  }

  select {
    width: 100%;
    padding: 10px;
    border: 1px solid #e2e8f4;
    border-radius: 8px;
    background: #f8fafc;
  }
`;

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

const reasonListStyles = css`
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f4;
  color: #334155;
  font-weight: 600;
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

function formatSessionOption(session: ComparableSelfSession): string {
  const dateLabel = format(new Date(session.date), "dd/MM/yyyy");
  const bestLapLabel = formatLap(session.fastestLap);
  const scoreLabel =
    session.sessionPerformanceScore == null ? "—" : String(session.sessionPerformanceScore);
  return `${dateLabel} • ${session.conditions} • ${bestLapLabel} • score ${scoreLabel}`;
}

function trendDirectionLabel(
  direction: SelfComparisonAnalysis["trend"]["direction"]
): string {
  if (direction === "IMPROVING") return "Improving";
  if (direction === "REGRESSING") return "Regressing";
  if (direction === "FLAT") return "Flat";
  return "Insufficient history";
}

function trendMetricLabel(metric: SelfComparisonAnalysis["trend"]["metric"]): string {
  if (metric === "FASTEST_10_AVG") return "Fastest 10 Avg";
  if (metric === "FASTEST_5_AVG") return "Fastest 5 Avg";
  if (metric === "BEST_LAP") return "Best Lap";
  return "Best pace";
}

function pickSustainedDelta(analysis: SelfComparisonAnalysis): number | null {
  return (
    analysis.paceInsights.deltas.bestRolling10Avg ??
    analysis.paceInsights.deltas.bestRolling5Avg ??
    null
  );
}

export function SelfComparisonCard({
  comparableSessions,
  selectedComparisonSessionId,
  analysis,
  onSelectComparisonSession,
}: Props) {
  const comparisons = analysis?.lapComparisons ?? [];
  const trendPoints = analysis?.trend.points ?? [];
  const width = 720;
  const height = 240;
  const xPad = 56;
  const yPad = 20;
  const bottomPad = 32;
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

  return (
    <Card title="Self Comparison">
      <div css={containerStyles}>
        <div css={inputFieldStyles}>
          <label htmlFor="session-self-comparison-select">Comparison session</label>
          <select
            id="session-self-comparison-select"
            value={selectedComparisonSessionId}
            onChange={(event) => onSelectComparisonSession(event.target.value)}
          >
            <option value="">Choose a comparable session</option>
            {comparableSessions.map((session) => (
              <option key={session.sessionId} value={session.sessionId}>
                {formatSessionOption(session)}
              </option>
            ))}
          </select>
        </div>

        {comparableSessions.length === 0 ? (
          <div css={emptyStateStyles}>
            Self comparison is unavailable until you have another session with the same track,
            layout, kart, and format.
          </div>
        ) : analysis ? (
          <>
            <div css={metaRowStyles}>
              <span css={[badgeStyles, analysis.confidence === "HIGH" ? highConfidenceStyles : mediumConfidenceStyles]}>
                {analysis.confidence} confidence
              </span>
              <span>{format(new Date(analysis.comparisonSession.date), "dd/MM/yyyy")}</span>
              <span>{analysis.comparisonSession.conditions}</span>
            </div>

            <p css={summaryStyles}>{analysis.paceInsights.headline}</p>
            <p css={reasonListStyles}>{analysis.confidenceReasons.join(" ")}</p>

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
                <p className="value">
                  {formatDelta(analysis.coachingSignals.deltas.firstLapWithin103Pct, "")}
                </p>
              </div>
              <div css={insightTileStyles}>
                <p className="label">Repeatability ±0.2s</p>
                <p className="value">
                  {formatDelta(analysis.coachingSignals.deltas.lapsWithinPoint2OfBest, "")}
                </p>
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
                  Current session
                </span>
                <span>
                  <i css={css`background: #f97316;`} />
                  Comparison session
                </span>
              </div>
              {comparisons.length > 0 ? (
                <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Lap-by-lap self comparison chart">
                  {yTicks.map((tick) => (
                    <g key={`y-${tick.y.toFixed(2)}`}>
                      <line x1={xPad} x2={width - xPad} y1={tick.y} y2={tick.y} stroke="#e2e8f4" strokeWidth={1} />
                      <text x={xPad - 8} y={tick.y + 4} textAnchor="end" fontSize="10" fill="#64748b">
                        {tick.value.toFixed(3)}s
                      </text>
                    </g>
                  ))}
                  <line x1={xPad} x2={xPad} y1={yPad} y2={plotBottomY} stroke="#94a3b8" strokeWidth={1.2} />
                  <line x1={xPad} x2={width - xPad} y1={plotBottomY} y2={plotBottomY} stroke="#94a3b8" strokeWidth={1.2} />
                  <path d={currentPath} fill="none" stroke="#0f766e" strokeWidth={2.5} />
                  <path d={comparisonPath} fill="none" stroke="#f97316" strokeWidth={2.5} />
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
        ) : (
          <div css={emptyStateStyles}>
            No earlier comparable session exists for this baseline. Choose another eligible session to compare manually.
          </div>
        )}
      </div>
    </Card>
  );
}
