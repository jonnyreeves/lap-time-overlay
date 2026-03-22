import { css } from "@emotion/react";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { graphql, useFragment, useLazyLoadQuery } from "react-relay";
import type { TrackSessionComparisonCardQuery } from "../../__generated__/TrackSessionComparisonCardQuery.graphql.js";
import type {
  TrackSessionComparisonCard_track$data,
  TrackSessionComparisonCard_track$key,
} from "../../__generated__/TrackSessionComparisonCard_track.graphql.js";
import { Card } from "../Card.js";
import {
  SelfComparisonInsights,
  type SelfComparisonAnalysisView,
} from "../session/SelfComparisonInsights.js";
import {
  getInitialTrackComparisonSelection,
  getScopeByKey,
  normalizeTrackComparisonSelection,
  type TrackComparisonScopeState,
} from "./trackComparisonState.js";

const TrackSessionComparisonCardFragment = graphql`
  fragment TrackSessionComparisonCard_track on Track {
    id
    name
    comparisonScopes {
      key
      format
      sessionCount
      latestSessionDate
      trackLayout {
        id
        name
      }
      kart {
        id
        name
      }
      sessions {
        sessionId
        date
        classification
        fastestLap
        conditions
        temperature
        sessionPerformanceScore
        isDefaultCurrent
        isDefaultBaseline
      }
    }
  }
`;

const TrackSessionComparisonAnalysisQuery = graphql`
  query TrackSessionComparisonCardQuery($currentSessionId: ID!, $baselineSessionId: ID) {
    trackSession(id: $currentSessionId) {
      id
      selfComparison(compareToSessionId: $baselineSessionId) {
        comparisonSession {
          sessionId
          date
          classification
          fastestLap
          sessionPerformanceScore
          conditions
          temperature
          isDefault
          confidence
          confidenceReasons
        }
        confidence
        confidenceReasons
        performanceScoreDelta
        classificationDelta
        lapComparisons {
          lapNumber
          currentLap
          comparisonLap
          delta
          cumulativeDelta
          outcome
        }
        sessionInsights {
          currentFasterLapCount
          comparisonFasterLapCount
          tieCount
          longestCurrentAdvantageStreak
          longestComparisonAdvantageStreak
          medianDelta
          consistencyGap
          insightLabel
        }
        paceInsights {
          current {
            bestLap
            fastest5Avg
            fastest10Avg
            bestRolling5 {
              average
              startLapNumber
              endLapNumber
            }
            bestRolling10 {
              average
              startLapNumber
              endLapNumber
            }
          }
          comparison {
            bestLap
            fastest5Avg
            fastest10Avg
            bestRolling5 {
              average
              startLapNumber
              endLapNumber
            }
            bestRolling10 {
              average
              startLapNumber
              endLapNumber
            }
          }
          deltas {
            bestLap
            fastest5Avg
            fastest10Avg
            bestRolling5Avg
            bestRolling10Avg
            overallMean
            overallMedian
            slowLapSpread
          }
          headline
        }
        coachingSignals {
          deltas {
            firstLapWithin103Pct
            lapsWithinPoint2OfBest
            stintFade
          }
        }
        trend {
          direction
          metric
          points {
            sessionId
            date
            value
            metric
            isCurrent
          }
        }
      }
    }
  }
`;

type Props = {
  track: TrackSessionComparisonCard_track$key;
};

type TrackComparisonScopeOption = TrackSessionComparisonCard_track$data["comparisonScopes"][number];

const containerStyles = css`
  display: grid;
  gap: 14px;
`;

const selectorGridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
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

const metaStyles = css`
  color: #64748b;
  font-weight: 600;
  font-size: 0.88rem;
`;

const emptyStateStyles = css`
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  padding: 12px;
  font-weight: 600;
`;

function formatScopeOption(scope: TrackComparisonScopeOption) {
  return `${scope.trackLayout.name} • ${scope.kart.name} • ${scope.format} (${scope.sessionCount})`;
}

function formatSessionOption(session: { date: string; conditions: string; fastestLap: number | null | undefined; sessionPerformanceScore: number | null | undefined }) {
  const dateLabel = format(new Date(session.date), "dd/MM/yyyy");
  const lapLabel =
    session.fastestLap != null && Number.isFinite(session.fastestLap)
      ? `${session.fastestLap.toFixed(3)}s`
      : "—";
  const scoreLabel =
    session.sessionPerformanceScore == null ? "—" : String(session.sessionPerformanceScore);
  return `${dateLabel} • FL ${lapLabel} • ${session.conditions} • score ${scoreLabel}`;
}

export function TrackSessionComparisonCard({ track }: Props) {
  const data = useFragment(TrackSessionComparisonCardFragment, track);
  const scopes = data.comparisonScopes ?? [];
  const scopeState = useMemo<TrackComparisonScopeState[]>(
    () =>
      scopes.map((scope) => ({
        key: scope.key,
        sessions: scope.sessions.map((session) => ({
          sessionId: session.sessionId,
          date: session.date,
          isDefaultCurrent: session.isDefaultCurrent,
          isDefaultBaseline: session.isDefaultBaseline,
        })),
      })),
    [scopes]
  );
  const [selection, setSelection] = useState(() => getInitialTrackComparisonSelection(scopeState));

  useEffect(() => {
    setSelection((current) => normalizeTrackComparisonSelection(scopeState, current));
  }, [scopeState]);

  const selectedScope = useMemo(
    () => scopes.find((scope) => scope.key === selection.scopeKey) ?? null,
    [scopes, selection.scopeKey]
  );
  const currentSession =
    selectedScope?.sessions.find((session) => session.sessionId === selection.currentSessionId) ?? null;
  const baselineSession =
    selectedScope?.sessions.find((session) => session.sessionId === selection.baselineSessionId) ?? null;

  function handleScopeChange(scopeKey: string) {
    const scope = getScopeByKey(scopeState, scopeKey);
    if (!scope) {
      setSelection(getInitialTrackComparisonSelection(scopeState));
      return;
    }
    const next = normalizeTrackComparisonSelection(scopeState, {
      scopeKey,
      currentSessionId: "",
      baselineSessionId: "",
    });
    setSelection(next);
  }

  function handleCurrentSessionChange(currentSessionId: string) {
    const scope = getScopeByKey(scopeState, selection.scopeKey);
    const next = normalizeTrackComparisonSelection(scopeState, {
      scopeKey: selection.scopeKey,
      currentSessionId,
      baselineSessionId: scope?.sessions.find(
        (session) => session.sessionId !== currentSessionId && session.sessionId === selection.baselineSessionId
      )
        ? selection.baselineSessionId
        : "",
    });
    setSelection(next);
  }

  function handleBaselineSessionChange(baselineSessionId: string) {
    setSelection((current) => ({
      ...current,
      baselineSessionId,
    }));
  }

  return (
    <Card title="Compare Sessions">
      <div css={containerStyles}>
        {scopes.length === 0 ? (
          <div css={emptyStateStyles}>
            Comparison is unavailable for this track until you have at least two sessions with the
            same layout, kart, and format.
          </div>
        ) : (
          <>
            <div css={selectorGridStyles}>
              <div css={inputFieldStyles}>
                <label htmlFor="track-comparison-scope">Scope</label>
                <select
                  id="track-comparison-scope"
                  value={selection.scopeKey}
                  onChange={(event) => handleScopeChange(event.target.value)}
                >
                  {scopes.map((scope) => (
                    <option key={scope.key} value={scope.key}>
                      {formatScopeOption(scope)}
                    </option>
                  ))}
                </select>
              </div>
              <div css={inputFieldStyles}>
                <label htmlFor="track-comparison-current">Left session</label>
                <select
                  id="track-comparison-current"
                  value={selection.currentSessionId}
                  onChange={(event) => handleCurrentSessionChange(event.target.value)}
                >
                  {(selectedScope?.sessions ?? []).map((session) => (
                    <option key={session.sessionId} value={session.sessionId}>
                      {formatSessionOption(session)}
                    </option>
                  ))}
                </select>
              </div>
              <div css={inputFieldStyles}>
                <label htmlFor="track-comparison-baseline">Right session</label>
                <select
                  id="track-comparison-baseline"
                  value={selection.baselineSessionId}
                  onChange={(event) => handleBaselineSessionChange(event.target.value)}
                >
                  <option value="">No baseline selected</option>
                  {(selectedScope?.sessions ?? [])
                    .filter((session) => session.sessionId !== selection.currentSessionId)
                    .map((session) => (
                      <option key={session.sessionId} value={session.sessionId}>
                        {formatSessionOption(session)}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {selectedScope ? (
              <p css={metaStyles}>
                Comparing {selectedScope.trackLayout.name} in {selectedScope.kart.name} for{" "}
                {selectedScope.format}. {selectedScope.sessionCount} sessions in this scope.
              </p>
            ) : null}

            {!baselineSession ? (
              <div css={emptyStateStyles}>
                This scope does not have an earlier baseline session yet. Choose another scope or
                log more sessions in the same layout, kart, and format.
              </div>
            ) : (
              currentSession && (
                <TrackSessionComparisonAnalysis
                  currentSession={currentSession}
                  baselineSession={baselineSession}
                />
              )
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function TrackSessionComparisonAnalysis({
  currentSession,
  baselineSession,
}: {
  currentSession: {
    sessionId: string;
    date: string;
  };
  baselineSession: {
    sessionId: string;
    date: string;
  };
}) {
  const analysisData = useLazyLoadQuery<TrackSessionComparisonCardQuery>(
    TrackSessionComparisonAnalysisQuery,
    {
      currentSessionId: currentSession.sessionId,
      baselineSessionId: baselineSession.sessionId,
    },
    {
      fetchPolicy: "store-and-network",
      fetchKey: `${currentSession.sessionId}:${baselineSession.sessionId}`,
    }
  );

  const analysis = analysisData.trackSession?.selfComparison ?? null;
  if (!analysis) {
    return <div css={emptyStateStyles}>Comparison data is not available for the selected session pair.</div>;
  }

  return (
    <SelfComparisonInsights
      analysis={analysis as SelfComparisonAnalysisView}
      currentSession={{
        label: `Left: ${format(new Date(currentSession.date), "dd/MM/yyyy")}`,
        href: `/session/${currentSession.sessionId}`,
      }}
      comparisonSessionHref={`/session/${baselineSession.sessionId}`}
    />
  );
}
