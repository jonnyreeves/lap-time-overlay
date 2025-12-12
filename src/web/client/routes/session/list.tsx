import { css } from "@emotion/react";
import { useEffect } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import type { listQuery } from "../../__generated__/listQuery.graphql.js";
import { TrackSessionsTable } from "../../components/session/TrackSessionsTable.js";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs.js";

const pageStyles = css`
  display: grid;
  gap: 16px;
`;

const TrackSessionsPageQuery = graphql`
  query listQuery($first: Int = 20) {
    ...TrackSessionsTable_query @arguments(first: $first)
  }
`;

export default function TrackSessionsListRoute() {
  const data = useLazyLoadQuery<listQuery>(TrackSessionsPageQuery, { first: 20 });
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: "Sessions" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  return (
    <div css={pageStyles}>
      <TrackSessionsTable query={data} pageSize={20} />
    </div>
  );
}
