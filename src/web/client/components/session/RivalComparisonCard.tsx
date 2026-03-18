import { css } from "@emotion/react";
import { format } from "date-fns";
import type { viewSessionQuery$data } from "../../__generated__/viewSessionQuery.graphql.js";
import { Card } from "../Card.js";
import { RivalPaceDecomposition } from "./RivalPaceDecomposition.js";

type RivalAnalysis = NonNullable<NonNullable<viewSessionQuery$data["trackSession"]>["rivalAnalysis"]>;
type RivalLapComparison = RivalAnalysis["lapComparisons"][number];

type Props = {
  rivalParticipants: Array<{ name: string; classification: number | null | undefined }>;
  selectedRivalName: string;
  analysis: RivalAnalysis | null | undefined;
  onSelectRival: (rivalName: string) => void;
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

const summaryStyles = css`
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  color: #1e293b;
  font-weight: 700;
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

function formatDelta(delta: number | null | undefined): string {
  if (delta == null || Number.isNaN(delta)) return "—";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(3)}s`;
}

function trendLabel(direction: RivalAnalysis["trend"]["direction"]): string {
  if (direction === "CLOSING") return "Closing the gap";
  if (direction === "WIDENING") return "Gap widening";
  if (direction === "FLAT") return "Gap is flat";
  return "Insufficient history";
}

function formatClassification(classification: number | null | undefined): string {
  if (classification == null || Number.isNaN(classification)) return "—";
  return `P${classification}`;
}

function formatHeadline(headline: string | null | undefined): string {
  if (!headline) return "No pace insight available for this rival.";
  const trimmed = headline.trim();
  if (trimmed.length <= 90) return trimmed;
  return `${trimmed.slice(0, 87).trimEnd()}...`;
}

const consistencyGapTooltip =
  "Standard deviation of your lap times minus your rival's. Positive means you were less consistent; negative means you were more consistent.";

export function RivalComparisonCard({
  rivalParticipants,
  selectedRivalName,
  analysis,
  onSelectRival,
}: Props) {
  const selectedRival = rivalParticipants.find((participant) => participant.name === selectedRivalName);
  const comparisons = analysis?.lapComparisons ?? [];
  const paceInsights = analysis?.paceInsights;
  const width = 720;
  const height = 240;
  const xPad = 56;
  const yPad = 20;
  const bottomPad = 32;
  const allTimes = comparisons.flatMap((lap) => [lap.selfLap, lap.rivalLap]);
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
  const yTickCount = 4;
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, index) => {
    const ratio = index / yTickCount;
    const value = minTime + ratio * timeSpan;
    return { value, y: projectY(value) };
  });
  const xTickTarget = 6;
  const xTickStep =
    comparisons.length > 1
      ? Math.max(1, Math.floor((comparisons.length - 1) / (xTickTarget - 1)))
      : 1;
  const xTicks = comparisons
    .map((comparison, index) => ({ lapNumber: comparison.lapNumber, x: projectX(index), index }))
    .filter(
      ({ index }) =>
        index === 0 || index === comparisons.length - 1 || index % xTickStep === 0
    );

  const selfPath = buildLinePath(
    comparisons.map((lap, index) => ({ x: projectX(index), y: projectY(lap.selfLap) }))
  );
  const rivalPath = buildLinePath(
    comparisons.map((lap, index) => ({ x: projectX(index), y: projectY(lap.rivalLap) }))
  );

  return (
    <Card title="Rival Comparison">
      <div css={containerStyles}>
        <div css={inputFieldStyles}>
          <label htmlFor="session-rival-select">Rival</label>
          <select
            id="session-rival-select"
            value={selectedRivalName}
            onChange={(event) => onSelectRival(event.target.value)}
          >
            {rivalParticipants.map((participant) => (
              <option key={participant.name} value={participant.name}>
                {participant.name} ({formatClassification(participant.classification)})
              </option>
            ))}
          </select>
        </div>

        {analysis ? (
          <>
            <p css={summaryStyles}>{formatHeadline(paceInsights?.headline)}</p>
            <RivalPaceDecomposition paceInsights={paceInsights} />
            <div css={insightGridStyles}>
              <div css={insightTileStyles}>
                <p className="label">Faster / Slower / Tie</p>
                <p className="value">
                  {analysis.sessionInsights.fasterLapCount} / {analysis.sessionInsights.slowerLapCount} /{" "}
                  {analysis.sessionInsights.tieCount}
                </p>
              </div>
              <div css={insightTileStyles}>
                <p className="label">Rival Classification</p>
                <p className="value">{formatClassification(selectedRival?.classification)}</p>
              </div>
              <div css={insightTileStyles}>
                <p className="label">Median Delta</p>
                <p className="value">{formatDelta(analysis.sessionInsights.medianDelta)}</p>
              </div>
              <div css={insightTileStyles}>
                <p className="label">Gain/Loss Streak</p>
                <p className="value">
                  {analysis.sessionInsights.longestGainStreak} /{" "}
                  {analysis.sessionInsights.longestLossStreak}
                </p>
              </div>
              <div css={insightTileStyles}>
                <p className="label" title={consistencyGapTooltip}>
                  Consistency Gap
                </p>
                <p className="value">{formatDelta(analysis.sessionInsights.consistencyGap)}</p>
              </div>
            </div>

            <div css={chartCardStyles}>
              <div css={legendStyles}>
                <span>
                  <i css={css`background: #4f46e5;`} />
                  You
                </span>
                <span>
                  <i css={css`background: #f97316;`} />
                  {analysis.rivalName} ({formatClassification(selectedRival?.classification)})
                </span>
              </div>
              {comparisons.length > 0 ? (
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  width="100%"
                  role="img"
                  aria-label="Lap-by-lap rival pace comparison chart"
                >
                  {yTicks.map((tick) => (
                    <g key={`y-${tick.y.toFixed(2)}`}>
                      <line
                        x1={xPad}
                        x2={width - xPad}
                        y1={tick.y}
                        y2={tick.y}
                        stroke="#e2e8f4"
                        strokeWidth={1}
                      />
                      <text
                        x={xPad - 8}
                        y={tick.y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="#64748b"
                      >
                        {tick.value.toFixed(3)}s
                      </text>
                    </g>
                  ))}
                  {xTicks.map((tick) => (
                    <g key={`x-${tick.index}`}>
                      <line
                        x1={tick.x}
                        x2={tick.x}
                        y1={yPad}
                        y2={plotBottomY}
                        stroke="#f1f5f9"
                        strokeWidth={1}
                      />
                      <text
                        x={tick.x}
                        y={plotBottomY + 14}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#64748b"
                      >
                        {tick.lapNumber}
                      </text>
                    </g>
                  ))}
                  <line x1={xPad} x2={xPad} y1={yPad} y2={plotBottomY} stroke="#94a3b8" strokeWidth={1.2} />
                  <line
                    x1={xPad}
                    x2={width - xPad}
                    y1={plotBottomY}
                    y2={plotBottomY}
                    stroke="#94a3b8"
                    strokeWidth={1.2}
                  />
                  <text
                    x={(xPad + (width - xPad)) / 2}
                    y={height - 6}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#334155"
                  >
                    Lap number
                  </text>
                  <text
                    x={14}
                    y={height / 2}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#334155"
                    transform={`rotate(-90 14 ${height / 2})`}
                  >
                    Lap time
                  </text>
                  <path d={selfPath} fill="none" stroke="#4f46e5" strokeWidth={2.5} />
                  <path d={rivalPath} fill="none" stroke="#f97316" strokeWidth={2.5} />
                </svg>
              ) : (
                <div css={emptyStateStyles}>No comparable laps in this session for this rival.</div>
              )}
            </div>

            <div css={chartCardStyles}>
              <strong>{trendLabel(analysis.trend.direction)}</strong>
              <table css={trendTableStyles}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Delta (Best-10 Avg)</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.trend.points.length ? (
                    analysis.trend.points
                      .slice()
                      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
                      .slice(0, 8)
                      .map((point) => (
                        <tr key={point.sessionId}>
                          <td>{format(new Date(point.date), "dd/MM/yyyy")}</td>
                          <td>{formatDelta(point.delta)}</td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={2}>No comparable history yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div css={emptyStateStyles}>
            Rival analysis is unavailable until this session contains an imported self driver and the
            selected rival.
          </div>
        )}
      </div>
    </Card>
  );
}
