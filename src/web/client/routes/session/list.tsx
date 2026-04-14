import { css } from "@emotion/react";
import { useCallback, useEffect, useMemo } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { useSearchParams } from "react-router-dom";
import type { listQuery } from "../../__generated__/listQuery.graphql.js";
import { TrackSessionsTable, type TrackSessionFilters } from "../../components/session/TrackSessionsTable.js";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs.js";

const pageStyles = css`
  display: grid;
  gap: 16px;
`;

const validConditions = new Set(["Dry", "Wet"]);
const validFormats = new Set(["Practice", "Qualifying", "Race"]);

function parseFilters(searchParams: URLSearchParams): TrackSessionFilters {
  const conditions = searchParams.get("conditions") ?? "";
  const format = searchParams.get("format") ?? "";
  const sessionIds = (searchParams.get("sessionId") ?? "")
    .split(",")
    .map((sessionId) => sessionId.trim())
    .filter(Boolean);

  return {
    sessionIds,
    trackId: searchParams.get("trackId") ?? "",
    trackLayoutId: searchParams.get("trackLayoutId") ?? "",
    kartId: searchParams.get("kartId") ?? "",
    conditions: validConditions.has(conditions) ? conditions : "",
    format: validFormats.has(format) ? format : "",
  };
}

function buildFilterInput(filters: TrackSessionFilters) {
  const filterInput = {
    ...(filters.sessionIds.length ? { sessionIds: filters.sessionIds } : null),
    ...(filters.trackId ? { trackId: filters.trackId } : null),
    ...(filters.trackLayoutId ? { trackLayoutId: filters.trackLayoutId } : null),
    ...(filters.kartId ? { kartId: filters.kartId } : null),
    ...(filters.conditions ? { conditions: filters.conditions } : null),
    ...(filters.format ? { format: filters.format } : null),
  };
  return Object.keys(filterInput).length ? filterInput : null;
}

const TrackSessionsPageQuery = graphql`
  query listQuery($first: Int = 20, $filter: TrackSessionFilterInput, $sort: TrackSessionSort = DATE_DESC) {
    ...TrackSessionsTable_query @arguments(first: $first, filter: $filter, sort: $sort)
  }
`;

export default function TrackSessionsListRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const filterInput = useMemo(() => buildFilterInput(initialFilters), [initialFilters]);
  const pageSize = initialFilters.sessionIds.length
    ? Math.max(20, initialFilters.sessionIds.length)
    : 20;
  const data = useLazyLoadQuery<listQuery>(TrackSessionsPageQuery, {
    first: pageSize,
    filter: filterInput,
    sort: "DATE_DESC",
  });
  const { setBreadcrumbs } = useBreadcrumbs();

  const handleFiltersChange = useCallback(
    (nextFilters: TrackSessionFilters) => {
      const next = new URLSearchParams(searchParams);
      const setParam = (key: string, value: string) => {
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
      };

      setParam("trackId", nextFilters.trackId);
      setParam("trackLayoutId", nextFilters.trackLayoutId);
      setParam("kartId", nextFilters.kartId);
      setParam("conditions", nextFilters.conditions);
      setParam("format", nextFilters.format);
      if (nextFilters.sessionIds.length) {
        next.set("sessionId", nextFilters.sessionIds.join(","));
      } else {
        next.delete("sessionId");
      }

      if (!nextFilters.trackId) {
        next.delete("trackLayoutId");
        next.delete("kartId");
      }

      if (next.toString() !== searchParams.toString()) {
        setSearchParams(next, { replace: true });
      }
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    setBreadcrumbs([{ label: "Sessions" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  return (
    <div css={pageStyles}>
      <TrackSessionsTable
        query={data}
        pageSize={pageSize}
        initialFilters={initialFilters}
        onFiltersChange={handleFiltersChange}
      />
    </div>
  );
}
