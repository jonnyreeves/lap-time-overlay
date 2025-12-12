import { css } from "@emotion/react";
import { format } from "date-fns";
import { useMemo } from "react";
import { graphql, usePaginationFragment } from "react-relay";
import { Link, useNavigate } from "react-router-dom";
import type {
  TrackSessionsTablePaginationQuery,
} from "../../__generated__/TrackSessionsTablePaginationQuery.graphql.js";
import type {
  TrackSessionsTable_query$key,
} from "../../__generated__/TrackSessionsTable_query.graphql.js";
import { formatStopwatchTime } from "../../utils/lapTime.js";
import { Card } from "../Card.js";

type Props = {
  query: TrackSessionsTable_query$key;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 20;

const tableWrapperStyles = css`
  overflow-x: auto;
`;

const tableStyles = css`
  width: 100%;
  border-collapse: collapse;
  min-width: 1120px;
  border-spacing: 0;

  thead th {
    text-align: left;
    padding: 12px 10px;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6b7280;
    border-bottom: 1px solid #e2e8f4;
    background: linear-gradient(135deg, #f8fafc, #eef2ff);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  tbody tr {
    cursor: pointer;
    transition: transform 0.05s ease, box-shadow 0.12s ease, background 0.12s ease;
  }

  tbody tr:hover td {
    background: linear-gradient(135deg, #f3f6ff, #eef2ff);
  }

  tbody tr:active {
    transform: translateY(1px);
  }

  tbody td {
    padding: 14px 10px;
    border-bottom: 1px solid #eef2ff;
    background: #fff;
  }
`;

const cellStackStyles = css`
  display: grid;
  gap: 4px;
`;

const subtleMetaStyles = css`
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  color: #94a3b8;
  font-weight: 700;
`;

const trackLinkStyles = css`
  font-weight: 700;
  color: #0f172a;
  text-decoration: none;
  letter-spacing: -0.01em;

  &:hover {
    color: #536ad6;
  }
`;

const pillStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid #e2e8f4;
  background: #f8fafc;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.01em;
`;

const formatPillStyles = css`
  border-color: #c7d2fe;
  background: #e0e7ff;
  color: #3730a3;
`;

const conditionsPillStyles = css`
  border-color: #d7e3f4;
  background: #f1f5fb;
`;

const classificationPillStyles = css`
  border-color: #fed7aa;
  background: #fff7ed;
  color: #9a3412;
`;

const recordingDotStyles = css`
  width: 12px;
  height: 12px;
  border-radius: 999px;
  display: inline-flex;
  background: #f472b6;
  box-shadow: 0 0 0 6px rgba(244, 114, 182, 0.14);
`;

const recordingBadgeStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid #fce7f3;
  background: linear-gradient(135deg, #fff0f6, #fdf2f8);
  color: #9d174d;
  font-weight: 700;
`;

const recordingMutedStyles = css`
  border-color: #e2e8f4;
  background: #f8fafc;
  color: #94a3b8;
  box-shadow: none;
`;

const lapBadgeStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  padding: 8px 10px;
  border-radius: 12px;
  background: #e0e7ff;
  border: 1px solid #c7d2fe;
  color: #111827;
  font-weight: 800;
  letter-spacing: -0.01em;
`;

const paginationBarStyles = css`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
`;

const loadMoreButtonStyles = css`
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #5b6fe9;
  background: linear-gradient(140deg, #5b6fe9, #7487ff);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.16s ease, opacity 0.1s ease;

  &:hover:enabled {
    transform: translateY(-1px);
    box-shadow: 0 10px 18px rgba(91, 111, 233, 0.25);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const emptyStateStyles = css`
  margin-top: 8px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #475569;
`;

function formatFastestLap(time: number | null | undefined): string | null {
  if (!Number.isFinite(time) || !time || time <= 0) return null;
  const formatted = formatStopwatchTime(time);
  const [minutes, rest] = formatted.split(":");
  return rest ? `${minutes.padStart(2, "0")}:${rest}` : formatted;
}

const TrackSessionsTableFragment = graphql`
  fragment TrackSessionsTable_query on Query
  @refetchable(queryName: "TrackSessionsTablePaginationQuery")
  @argumentDefinitions(
    first: { type: "Int", defaultValue: 20 }
    after: { type: "String" }
  ) {
    viewer {
      id
      recentTrackSessions(first: $first, after: $after)
        @connection(key: "TrackSessionsTable_recentTrackSessions") {
        edges {
          cursor
          node {
            id
            date
            format
            classification
            conditions
            track {
              id
              name
            }
            trackLayout {
              id
              name
            }
            kart {
              id
              name
            }
            laps(first: 1) {
              id
              personalBest
            }
            trackRecordings(first: 1) {
              id
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export function TrackSessionsTable({ query, pageSize = DEFAULT_PAGE_SIZE }: Props) {
  const navigate = useNavigate();
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment<
    TrackSessionsTablePaginationQuery,
    TrackSessionsTable_query$key
  >(TrackSessionsTableFragment, query);

  const sessions = useMemo(
    () =>
      (data.viewer?.recentTrackSessions?.edges ?? [])
        .map((edge) => edge?.node)
        .filter(Boolean),
    [data.viewer?.recentTrackSessions?.edges]
  );

  function handleLoadMore() {
    if (!hasNext || isLoadingNext) return;
    loadNext(pageSize);
  }

  return (
    <Card
      title="All sessions"
      rightHeaderContent={
        <Link to="/session/create" css={loadMoreButtonStyles}>
          Add session
        </Link>
      }
    >
      {sessions.length === 0 ? (
        <div css={emptyStateStyles}>No sessions yet. Start by adding your first one.</div>
      ) : (
        <>
          <div css={tableWrapperStyles}>
            <table css={tableStyles}>
              <thead>
                <tr>
                  <th style={{ minWidth: 180 }}>Date</th>
                  <th>Track</th>
                  <th>Track Layout</th>
                  <th>Kart Type</th>
                  <th>Format</th>
                  <th>Classification</th>
                  <th>Conditions</th>
                  <th>Fastest Lap</th>
                  <th>Recording</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const personalBestSeconds = session.laps?.[0]?.personalBest ?? null;
                  const personalBest = formatFastestLap(personalBestSeconds);
                  const trackName = session.track?.name ?? "Unknown track";
                  const trackLayoutName = session.trackLayout?.name ?? "—";
                  const kartName = session.kart?.name ?? "Not set";
                  const classification = session.classification
                    ? `P${session.classification}`
                    : "—";
                  const hasRecording = Boolean(session.trackRecordings?.length);
                  const formattedDate = format(new Date(session.date), "do MMM yyyy");
                  const formattedTime = format(new Date(session.date), "p");

                  return (
                    <tr key={session.id} onClick={() => navigate(`/session/${session.id}`)}>
                      <td>
                        <div css={cellStackStyles}>
                          <span>{formattedDate}</span>
                          <span css={subtleMetaStyles}>{formattedTime}</span>
                        </div>
                      </td>
                      <td>
                        <div css={cellStackStyles}>
                          <Link to={`/session/${session.id}`} css={trackLinkStyles}>
                            {trackName}
                          </Link>
                        </div>
                      </td>
                      <td>
                        <div css={cellStackStyles}>
                          <span>{trackLayoutName}</span>
                        </div>
                      </td>
                      <td>
                        <span css={pillStyles}>{kartName}</span>
                      </td>
                      <td>
                        <span css={[pillStyles, formatPillStyles]}>{session.format ?? "—"}</span>
                      </td>
                      <td>
                        <span css={[pillStyles, classificationPillStyles]}>{classification}</span>
                      </td>
                      <td>
                        <span css={[pillStyles, conditionsPillStyles]}>
                          {session.conditions ?? "—"}
                        </span>
                      </td>
                      <td>
                        <span css={lapBadgeStyles}>{personalBest ?? "—"}</span>
                      </td>
                      <td>
                        <span
                          css={[recordingBadgeStyles, !hasRecording && recordingMutedStyles]}
                          aria-label={hasRecording ? "Recording attached" : "No recording attached"}
                        >
                          <span css={recordingDotStyles} aria-hidden />
                          {hasRecording ? "Ready" : "None"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div css={paginationBarStyles}>
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={!hasNext || isLoadingNext}
              css={loadMoreButtonStyles}
            >
              {isLoadingNext ? "Loading…" : hasNext ? "Load more" : "All sessions loaded"}
            </button>
          </div>
        </>
      )}
    </Card>
  );
}
