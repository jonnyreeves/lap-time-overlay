import { css } from "@emotion/react";
import type { viewSessionQuery$data } from "../../__generated__/viewSessionQuery.graphql.js";
import { Card } from "../Card.js";
import {
  SelfComparisonInsights,
  type SelfComparisonAnalysisView,
} from "./SelfComparisonInsights.js";

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

const emptyStateStyles = css`
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  padding: 12px;
  font-weight: 600;
`;

function formatSessionOption(session: ComparableSelfSession): string {
  const bestLapLabel =
    session.fastestLap != null && Number.isFinite(session.fastestLap)
      ? session.fastestLap.toFixed(3)
      : "—";
  const scoreLabel =
    session.sessionPerformanceScore == null ? "—" : String(session.sessionPerformanceScore);
  return `${session.date.slice(0, 10)} • FL ${bestLapLabel}s • ${session.conditions} • score ${scoreLabel}`;
}

export function SelfComparisonCard({
  comparableSessions,
  selectedComparisonSessionId,
  analysis,
  onSelectComparisonSession,
}: Props) {
  return (
    <Card title="Self Comparison">
      <div css={containerStyles}>
        <div css={inputFieldStyles}>
          <label htmlFor="session-self-comparison-select">Right session</label>
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
          <SelfComparisonInsights
            analysis={analysis as SelfComparisonAnalysisView}
            currentSession={{ label: "Left session" }}
          />
        ) : (
          <div css={emptyStateStyles}>
            No earlier comparable session exists for this baseline. Choose another eligible session
            to compare manually.
          </div>
        )}
      </div>
    </Card>
  );
}
