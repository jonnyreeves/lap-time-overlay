import { css } from "@emotion/react";
import { format } from "date-fns";
import type { viewSessionQuery$data } from "../../__generated__/viewSessionQuery.graphql.js";
import { Card } from "../Card.js";
import { RivalComparisonLapChart } from "./RivalComparisonLapChart.js";
import { RivalPaceDecomposition } from "./RivalPaceDecomposition.js";

type RivalAnalysis = NonNullable<NonNullable<viewSessionQuery$data["trackSession"]>["rivalAnalysis"]>;

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

            <RivalComparisonLapChart
              comparisons={comparisons}
              rivalName={analysis.rivalName}
              rivalClassification={`(${formatClassification(selectedRival?.classification)})`}
            />

            <div css={css`
              border: 1px solid #e2e8f4;
              border-radius: 10px;
              background: #ffffff;
              padding: 10px;
            `}>
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
