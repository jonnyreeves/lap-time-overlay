import React, { useEffect } from "react";
import { css } from "@emotion/react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { useParams } from "react-router-dom";
import { TrackViewPageQuery as TrackViewPageQueryType } from "../../__generated__/TrackViewPageQuery.graphql";
import { Card } from "../../components/Card.js";
import { TrackDetailsCard } from "../../components/tracks/TrackDetailsCard.js";
import { TrackKartsCard } from "../../components/tracks/TrackKartsCard.js";
import { TrackLayoutCard } from "../../components/tracks/TrackLayoutCard.js";
import { TrackPersonalBestsCard } from "../../components/tracks/TrackPersonalBestsCard.js";
import { TrackVisitStatsCard } from "../../components/tracks/TrackVisitStatsCard.js";
import { type BreadcrumbItem, useBreadcrumbs } from "../../hooks/useBreadcrumbs.js";

const sideBySideStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
`;

const overviewGridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 14px;
  align-items: start;
`;

export const TRACK_VIEW_QUERY = graphql`
  query TrackViewPageQuery($trackId: ID!) {
    track(id: $trackId) {
      id
      name
      heroImage
      ...TrackDetailsCard_track
      ...TrackKartsCard_track
      ...TrackLayoutCard_track
      ...TrackPersonalBestsCard_track
      ...TrackVisitStatsCard_track
    }
  }
`;

export default function TrackViewPage(): React.ReactNode {
  const { trackId } = useParams();
  const { setBreadcrumbs } = useBreadcrumbs();
  const data = useLazyLoadQuery<TrackViewPageQueryType>(
    TRACK_VIEW_QUERY,
    { trackId: trackId ?? "" },
  );

  useEffect(() => {
    const crumbs: BreadcrumbItem[] = [{ label: "Tracks", to: "/tracks" }];
    if (data.track) {
      crumbs.push({ label: data.track.name });
    } else if (trackId) {
      crumbs.push({ label: "Track not found" });
    }
    setBreadcrumbs(crumbs);
    return () => setBreadcrumbs([]);
  }, [data.track, setBreadcrumbs, trackId]);

  if (!data.track) {
    return (
      <Card>
        <p>Track not found</p>
      </Card>
    );
  }

  return (
    <>
      <div css={overviewGridStyles}>
        <TrackPersonalBestsCard track={data.track} showTrackHeader />
        <TrackVisitStatsCard track={data.track} />
      </div>
      <div css={sideBySideStyles}>
        <TrackKartsCard track={data.track} />
        <TrackLayoutCard track={data.track} />
        <TrackDetailsCard track={data.track} />
      </div>
    </>
  );
}
