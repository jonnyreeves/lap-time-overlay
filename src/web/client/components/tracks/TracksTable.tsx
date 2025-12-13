import { css } from "@emotion/react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { listTracksQuery } from "../../__generated__/listTracksQuery.graphql.js";
import { Card } from "../Card.js";

type TrackRow = NonNullable<listTracksQuery["response"]["tracks"][number]>;
type SortField = "name" | "timesRaced" | "lastVisit";
type SortDirection = "asc" | "desc";
type SortState = { field: SortField; direction: SortDirection };

const tableWrapperStyles = css`
  overflow-x: auto;
`;

const tableStyles = css`
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
  border-spacing: 0;

  thead th {
    text-align: left;
    padding: 12px 10px;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
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

const sortableHeaderButtonStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  padding: 0;
  cursor: pointer;
`;

const sortArrowStyles = css`
  font-size: 0.85rem;
  color: #cbd5e1;
`;

const activeSortArrowStyles = css`
  color: #4f46e5;
`;

const nameCellStyles = css`
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.01em;
`;

const metaStyles = css`
  color: #475569;
  font-weight: 700;
`;

const emptyStateStyles = css`
  margin: 8px 0 4px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #475569;
`;

type Props = {
  tracks: readonly TrackRow[];
};

export function TracksTable({ tracks }: Props) {
  const [sortState, setSortState] = useState<SortState>({ field: "lastVisit", direction: "desc" });
  const navigate = useNavigate();

  const toggleSort = (field: SortField) => {
    setSortState((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { field, direction: field === "name" ? "asc" : "desc" }
    );
  };

  const sortedTracks = useMemo(() => {
    const items = [...tracks];
    const directionMultiplier = sortState.direction === "asc" ? 1 : -1;

    const getLastVisitTimestamp = (value?: string | null) => {
      if (!value) {
        return null;
      }
      const timestamp = Date.parse(value);
      return Number.isNaN(timestamp) ? null : timestamp;
    };

    items.sort((a, b) => {
      if (sortState.field === "name") {
        return directionMultiplier * a.name.localeCompare(b.name);
      }

      if (sortState.field === "timesRaced") {
        const difference = a.timesRaced - b.timesRaced;
        if (difference === 0) {
          return a.name.localeCompare(b.name);
        }
        return directionMultiplier * difference;
      }

      const aTimestamp = getLastVisitTimestamp(a.lastVisit);
      const bTimestamp = getLastVisitTimestamp(b.lastVisit);

      if (aTimestamp === bTimestamp) {
        return a.name.localeCompare(b.name);
      }
      if (aTimestamp === null) {
        return 1;
      }
      if (bTimestamp === null) {
        return -1;
      }

      return directionMultiplier * (aTimestamp - bTimestamp);
    });

    return items;
  }, [sortState, tracks]);

  const getAriaSort = (field: SortField) =>
    sortState.field === field ? (sortState.direction === "asc" ? "ascending" : "descending") : "none";

  const getSortArrow = (field: SortField) => {
    if (sortState.field !== field) {
      return "<>";
    }
    return sortState.direction === "asc" ? "^" : "v";
  };

  const formatLastVisit = (value?: string | null) => {
    if (!value) {
      return "—";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }
    return format(parsed, "do MMM yyyy");
  };

  return (
    <Card title="Tracks">
      {tracks.length === 0 ? (
        <p css={emptyStateStyles}>No tracks yet. Create a session to add your first track.</p>
      ) : (
        <div css={tableWrapperStyles}>
          <table css={tableStyles}>
            <thead>
              <tr>
                <th aria-sort={getAriaSort("name")}>
                  <button
                    type="button"
                    css={[sortableHeaderButtonStyles, sortState.field === "name" && activeSortArrowStyles]}
                    onClick={() => toggleSort("name")}
                  >
                    <span>Track Name</span>
                    <span css={[sortArrowStyles, sortState.field === "name" && activeSortArrowStyles]}>
                      {getSortArrow("name")}
                    </span>
                  </button>
                </th>
                <th aria-sort={getAriaSort("timesRaced")}>
                  <button
                    type="button"
                    css={[sortableHeaderButtonStyles, sortState.field === "timesRaced" && activeSortArrowStyles]}
                    onClick={() => toggleSort("timesRaced")}
                  >
                    <span>Times Raced</span>
                    <span css={[sortArrowStyles, sortState.field === "timesRaced" && activeSortArrowStyles]}>
                      {getSortArrow("timesRaced")}
                    </span>
                  </button>
                </th>
                <th aria-sort={getAriaSort("lastVisit")}>
                  <button
                    type="button"
                    css={[sortableHeaderButtonStyles, sortState.field === "lastVisit" && activeSortArrowStyles]}
                    onClick={() => toggleSort("lastVisit")}
                  >
                    <span>Last Visit</span>
                    <span css={[sortArrowStyles, sortState.field === "lastVisit" && activeSortArrowStyles]}>
                      {getSortArrow("lastVisit")}
                    </span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTracks.map((track) => (
                <tr key={track.id} onClick={() => navigate(`/tracks/view/${track.id}`)}>
                  <td>
                    <span css={nameCellStyles}>{track.name}</span>
                  </td>
                  <td>
                    <span css={metaStyles}>{track.timesRaced}</span>
                  </td>
                  <td>
                    <span css={metaStyles}>{formatLastVisit(track.lastVisit)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
