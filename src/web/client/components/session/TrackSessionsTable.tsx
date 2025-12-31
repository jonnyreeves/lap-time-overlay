import { css } from "@emotion/react";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { graphql, usePaginationFragment } from "react-relay";
import { Link, useNavigate } from "react-router-dom";
import type {
  TrackSessionsTablePaginationQuery,
} from "../../__generated__/TrackSessionsTablePaginationQuery.graphql.js";
import type {
  TrackSessionsTable_query$key,
} from "../../__generated__/TrackSessionsTable_query.graphql.js";
import { getConditionsEmoji } from "../../utils/conditionsEmoji.js";
import { formatStopwatchTime } from "../../utils/lapTime.js";
import { Card } from "../Card.js";
import { IconButton } from "../IconButton.js";

export type TrackSessionFilters = {
  trackId: string;
  trackLayoutId: string;
  kartId: string;
  conditions: string;
  format: string;
};

type Props = {
  query: TrackSessionsTable_query$key;
  pageSize?: number;
  initialFilters?: Partial<TrackSessionFilters>;
  onFiltersChange?: (filters: TrackSessionFilters) => void;
};

const DEFAULT_PAGE_SIZE = 20;

type SortField = "date" | "fastestLap" | "consistency";
type SortDirection = "asc" | "desc";
type SortState = {
  field: SortField;
  direction: SortDirection;
};

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

const consistencyBadgeStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  padding: 8px 10px;
  border-radius: 12px;
  background: #ecfeff;
  border: 1px solid #bae6fd;
  color: #0f172a;
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

const addSessionButtonStyles = css`
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid #5b6fe9;
  background: linear-gradient(140deg, #5b6fe9, #7487ff);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;

  &:hover:enabled {
    transform: translateY(-1px);
    box-shadow: 0 10px 18px rgba(91, 111, 233, 0.25);
  }

  &:active:enabled {
    transform: translateY(0);
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

const filterBarStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
  align-items: end;
`;

const filterFieldStyles = css`
  display: grid;
  gap: 6px;
`;

const filterSelectStyles = css`
  width: 100%;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f4;
  background: #fff;
  font-weight: 600;
  color: #0f172a;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  position: relative;

  &:focus {
    outline: none;
    border-color: #5b6fe9;
    box-shadow: 0 0 0 2px rgba(91, 111, 233, 0.15);
  }

  &:disabled {
    background: #f8fafc;
    color: #cbd5e1;
    cursor: not-allowed;
  }
`;

const sortableHeaderButtonStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }
`;

const activeSortHeaderStyles = css`
  color: #0f172a;
`;

const sortArrowStyles = css`
  font-size: 0.9rem;
  color: #475569;
`;

const disabledSortArrowStyles = css`
  color: #cbd5e1;
`;

const clearButtonStyles = css`
  justify-self: flex-end;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f4;
  background: #f8fafc;
  color: #111827;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.12s ease, background 0.12s ease;

  &:hover {
    border-color: #cbd5e1;
    background: #f1f5f9;
  }
`;

const disabledHintStyles = css`
  font-size: 0.8rem;
  color: #94a3b8;
`;

function formatFastestLap(time: number | null | undefined): string | null {
  if (!Number.isFinite(time) || !time || time <= 0) return null;
  const formatted = formatStopwatchTime(time);
  const [minutes, rest] = formatted.split(":");
  return rest ? `${minutes.padStart(2, "0")}:${rest}` : formatted;
}

const defaultFilters: TrackSessionFilters = {
  trackId: "",
  trackLayoutId: "",
  kartId: "",
  conditions: "",
  format: "",
};

function normalizeFilters(partial?: Partial<TrackSessionFilters>): TrackSessionFilters {
  return {
    ...defaultFilters,
    ...partial,
  };
}

function areFiltersEqual(a: TrackSessionFilters, b: TrackSessionFilters) {
  return (
    a.trackId === b.trackId &&
    a.trackLayoutId === b.trackLayoutId &&
    a.kartId === b.kartId &&
    a.conditions === b.conditions &&
    a.format === b.format
  );
}

const TrackSessionsTableFragment = graphql`
  fragment TrackSessionsTable_query on Query
  @refetchable(queryName: "TrackSessionsTablePaginationQuery")
  @argumentDefinitions(
    first: { type: "Int", defaultValue: 20 }
    after: { type: "String" }
    filter: { type: "TrackSessionFilterInput", defaultValue: null }
    sort: { type: "TrackSessionSort", defaultValue: DATE_DESC }
  ) {
    tracks {
      id
      name
      isIndoors
      karts {
        id
        name
      }
      trackLayouts {
        id
        name
      }
    }
    viewer {
      id
      recentTrackSessions(first: $first, after: $after, filter: $filter, sort: $sort)
        @connection(key: "TrackSessionsTable_recentTrackSessions", filters: ["filter", "sort"]) {
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
              isIndoors
            }
            trackLayout {
              id
              name
            }
            kart {
              id
              name
            }
            consistencyScore
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

export function TrackSessionsTable({
  query,
  pageSize = DEFAULT_PAGE_SIZE,
  initialFilters,
  onFiltersChange,
}: Props) {
  const navigate = useNavigate();
  const { data, loadNext, hasNext, isLoadingNext, refetch } = usePaginationFragment<
    TrackSessionsTablePaginationQuery,
    TrackSessionsTable_query$key
  >(TrackSessionsTableFragment, query);

  const normalizedInitialFilters = useMemo(
    () => normalizeFilters(initialFilters),
    [
      initialFilters?.trackId,
      initialFilters?.trackLayoutId,
      initialFilters?.kartId,
      initialFilters?.conditions,
      initialFilters?.format,
    ]
  );

  const [filters, setFilters] = useState<TrackSessionFilters>(normalizedInitialFilters);
  const [sortState, setSortState] = useState<SortState>({ field: "date", direction: "desc" });
  const tracks = data.tracks ?? [];

  const layoutToTrackId = useMemo(() => {
    const map = new Map<string, string>();
    tracks.forEach((track) =>
      (track.trackLayouts ?? []).forEach((layout) => {
        map.set(layout.id, track.id);
      })
    );
    return map;
  }, [tracks]);

  const trackOptions = useMemo(
    () =>
      tracks
        .map((track) => ({ id: track.id, name: track.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [tracks]
  );
  const selectedTrackIsIndoors =
    tracks.find((track) => track.id === filters.trackId)?.isIndoors ?? false;

  const trackLayoutOptions = useMemo(() => {
    if (!filters.trackId) return [];
    const track = tracks.find((t) => t.id === filters.trackId);
    return (track?.trackLayouts ?? [])
      .map((layout) => ({
        id: layout.id,
        name: layout.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filters.trackId, tracks]);

  const kartOptions = useMemo(() => {
    if (!filters.trackId) return [];
    const track = tracks.find((t) => t.id === filters.trackId);
    return (track?.karts ?? [])
      .map((kart) => ({ id: kart.id, name: kart.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filters.trackId, tracks]);

  const buildFilterInput = useCallback((merged: TrackSessionFilters) => {
    const filterInput = {
      ...(merged.trackId ? { trackId: merged.trackId } : null),
      ...(merged.trackLayoutId ? { trackLayoutId: merged.trackLayoutId } : null),
      ...(merged.kartId ? { kartId: merged.kartId } : null),
      ...(merged.conditions ? { conditions: merged.conditions } : null),
      ...(merged.format ? { format: merged.format } : null),
    };
    return Object.keys(filterInput).length ? filterInput : null;
  }, []);

  const toSortInput = useCallback(
    (sort: SortState) => {
      if (sort.field === "date") {
        return sort.direction === "asc" ? "DATE_ASC" : "DATE_DESC";
      }
      if (sort.field === "fastestLap") {
        return sort.direction === "asc" ? "FASTEST_LAP_ASC" : "FASTEST_LAP_DESC";
      }
      return sort.direction === "asc" ? "CONSISTENCY_ASC" : "CONSISTENCY_DESC";
    },
    []
  );

  const refetchSessions = useCallback(
    (nextFilters: TrackSessionFilters, nextSort: SortState) => {
      refetch(
        {
          first: pageSize,
          after: null,
          filter: buildFilterInput(nextFilters),
          sort: toSortInput(nextSort),
        },
        { fetchPolicy: "store-and-network" }
      );
    },
    [buildFilterInput, pageSize, refetch, toSortInput]
  );

  useEffect(() => {
    let didUpdate = false;
    setFilters((current) => {
      if (areFiltersEqual(current, normalizedInitialFilters)) {
        return current;
      }
      didUpdate = true;
      return normalizedInitialFilters;
    });
    if (didUpdate) {
      refetchSessions(normalizedInitialFilters, sortState);
      onFiltersChange?.(normalizedInitialFilters);
    }
  }, [normalizedInitialFilters, onFiltersChange, refetchSessions, sortState]);

  const applyFilter = useCallback(
    (nextPartial: Partial<TrackSessionFilters>) => {
      let nextFiltersRef: TrackSessionFilters | null = null;
      setFilters((current) => {
        const merged: TrackSessionFilters = { ...current, ...nextPartial };
        const targetTrack = nextPartial.trackId ?? merged.trackId;
        if (
          targetTrack &&
          merged.trackLayoutId &&
          layoutToTrackId.get(merged.trackLayoutId) !== targetTrack
        ) {
          merged.trackLayoutId = "";
        }
        if (nextPartial.trackId !== undefined && !nextPartial.trackId) {
          merged.trackLayoutId = "";
          merged.kartId = "";
        }
        if (nextPartial.trackId && merged.kartId) {
          const track = tracks.find((t) => t.id === nextPartial.trackId);
          const hasKart = (track?.karts ?? []).some((kart) => kart.id === merged.kartId);
          if (!hasKart) merged.kartId = "";
        }

        nextFiltersRef = merged;
        return merged;
      });
      if (nextFiltersRef) {
        refetchSessions(nextFiltersRef, sortState);
        onFiltersChange?.(nextFiltersRef);
      }
    },
    [layoutToTrackId, onFiltersChange, refetchSessions, sortState, tracks]
  );

  const toggleSort = (field: SortField) => {
    const defaultDirection: SortDirection = field === "fastestLap" ? "asc" : "desc";
    const nextSort: SortState =
      sortState.field === field
        ? { field, direction: sortState.direction === "asc" ? "desc" : "asc" }
        : { field, direction: defaultDirection };

    setSortState(nextSort);
    refetchSessions(filters, nextSort);
  };

  const getSortArrow = (field: SortField) => {
    if (sortState.field !== field) return "↕";
    return sortState.direction === "asc" ? "↑" : "↓";
  };

  const isFilterActive = Boolean(
    filters.trackId || filters.trackLayoutId || filters.kartId || filters.conditions || filters.format
  );

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
        <IconButton
          type="button"
          icon="+"
          css={addSessionButtonStyles}
          onClick={() => navigate("/session/create")}
        >
          Add session
        </IconButton>
      }
    >
      <div css={filterBarStyles}>
        <label css={filterFieldStyles}>
          <span css={subtleMetaStyles}>Track</span>
          <select
            css={filterSelectStyles}
            value={filters.trackId}
            onChange={(event) => applyFilter({ trackId: event.target.value })}
          >
            <option value="">All tracks</option>
            {trackOptions.map((track) => (
              <option key={track.id} value={track.id}>
                {track.name}
              </option>
            ))}
          </select>
        </label>
        <label css={filterFieldStyles}>
          <span css={subtleMetaStyles}>Track layout</span>
          <select
            css={filterSelectStyles}
            value={filters.trackLayoutId}
            onChange={(event) => applyFilter({ trackLayoutId: event.target.value })}
            disabled={!filters.trackId}
            title={filters.trackId ? undefined : "Select a track to filter by layout"}
          >
            <option value="">All layouts</option>
            {trackLayoutOptions.map((layout) => (
              <option key={layout.id} value={layout.id}>
                {layout.name}
              </option>
            ))}
          </select>
        </label>
        <label css={filterFieldStyles}>
          <span css={subtleMetaStyles}>Kart type</span>
          <select
            css={filterSelectStyles}
            value={filters.kartId}
            onChange={(event) => applyFilter({ kartId: event.target.value })}
            disabled={!filters.trackId}
            title={filters.trackId ? undefined : "Select a track to filter by kart"}
          >
            <option value="">All karts</option>
            {kartOptions.map((kart) => (
              <option key={kart.id} value={kart.id}>
                {kart.name}
              </option>
            ))}
          </select>
        </label>
        <label css={filterFieldStyles}>
          <span css={subtleMetaStyles}>Conditions</span>
          <select
            css={filterSelectStyles}
            value={filters.conditions}
            onChange={(event) => applyFilter({ conditions: event.target.value })}
            disabled={selectedTrackIsIndoors}
          >
            <option value="">All</option>
            <option value="Dry">Dry</option>
            <option value="Wet">Wet</option>
          </select>
        </label>
        <label css={filterFieldStyles}>
          <span css={subtleMetaStyles}>Format</span>
          <select
            css={filterSelectStyles}
            value={filters.format}
            onChange={(event) => applyFilter({ format: event.target.value })}
          >
            <option value="">All</option>
            <option value="Practice">Practice</option>
            <option value="Qualifying">Qualifying</option>
            <option value="Race">Race</option>
          </select>
        </label>
        <button
          type="button"
          css={clearButtonStyles}
          onClick={() =>
            applyFilter({
              trackId: "",
              trackLayoutId: "",
              kartId: "",
              conditions: "",
              format: "",
            })
          }
          disabled={!isFilterActive}
        >
          Clear filters
        </button>
      </div>

      {sessions.length === 0 ? (
        <div css={emptyStateStyles}>No sessions yet. Start by adding your first one.</div>
      ) : (
        <>
          <div css={tableWrapperStyles}>
            <table css={tableStyles}>
              <thead>
                <tr>
                  <th style={{ minWidth: 180 }}>
                    <button
                      type="button"
                      css={[
                        sortableHeaderButtonStyles,
                        sortState.field === "date" && activeSortHeaderStyles,
                      ]}
                      onClick={() => toggleSort("date")}
                      aria-label={`Sort by date (${sortState.field === "date" ? sortState.direction : "desc"})`}
                    >
                      <span>Date</span>
                      <span css={sortArrowStyles}>{getSortArrow("date")}</span>
                    </button>
                  </th>
                  <th>Track</th>
                  <th>Track Layout</th>
                  <th>Kart Type</th>
                  <th>Format</th>
                  <th>Pos.</th>
                  <th>Conditions</th>
                  <th>
                    <button
                      type="button"
                      css={[
                        sortableHeaderButtonStyles,
                        sortState.field === "fastestLap" && activeSortHeaderStyles,
                      ]}
                      disabled={!filters.trackId}
                      onClick={() => toggleSort("fastestLap")}
                      aria-label={`Sort by fastest lap (${sortState.field === "fastestLap" ? sortState.direction : "asc"})`}
                      title={
                        filters.trackId
                          ? undefined
                          : "Select a track to enable fastest lap sorting"
                      }
                    >
                      <span>Fastest Lap</span>
                      <span
                        css={[
                          sortArrowStyles,
                          !filters.trackId && disabledSortArrowStyles,
                        ]}
                        aria-hidden
                      >
                        {getSortArrow("fastestLap")}
                      </span>
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      css={[
                        sortableHeaderButtonStyles,
                        sortState.field === "consistency" && activeSortHeaderStyles,
                      ]}
                      onClick={() => toggleSort("consistency")}
                      aria-label={`Sort by consistency (${sortState.field === "consistency" ? sortState.direction : "desc"})`}
                    >
                      <span>Consistency</span>
                      <span css={sortArrowStyles} aria-hidden>
                        {getSortArrow("consistency")}
                      </span>
                    </button>
                  </th>
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
                  const consistencyScore = session.consistencyScore ?? null;
                  const formattedDate = format(new Date(session.date), "do MMM yyyy");
                  const formattedTime = format(new Date(session.date), "p");
                  const isTrackIndoors = session.track?.isIndoors ?? false;
                  const conditionsLabel = isTrackIndoors ? "Dry" : session.conditions ?? "—";
                  const conditionsEmoji = getConditionsEmoji(conditionsLabel);

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
                        <span
                          css={[pillStyles, conditionsPillStyles]}
                          aria-label={conditionsLabel ?? "Conditions unknown"}
                        >
                          <span aria-hidden>{conditionsEmoji}</span>
                          <span>{conditionsLabel}</span>
                        </span>
                      </td>
                      <td>
                        <span css={lapBadgeStyles}>{personalBest ?? "—"}</span>
                      </td>
                      <td>
                        <span css={consistencyBadgeStyles}>{consistencyScore ?? "—"}</span>
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
