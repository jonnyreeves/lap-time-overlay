import { css } from "@emotion/react";
import { useEffect } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import type { listTracksQuery } from "../../__generated__/listTracksQuery.graphql.js";
import { TracksTable } from "../../components/tracks/TracksTable.js";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs.js";

const pageStyles = css`
  display: grid;
  gap: 16px;
`;

const TracksListPageQuery = graphql`
  query listTracksQuery {
    tracks {
      id
      name
      timesRaced
      lastVisit
    }
  }
`;

export default function TracksListRoute() {
  const data = useLazyLoadQuery<listTracksQuery>(TracksListPageQuery, {});
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: "Tracks" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  return (
    <div css={pageStyles}>
      <TracksTable tracks={data.tracks ?? []} />
    </div>
  );
}
