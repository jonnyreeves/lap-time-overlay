import React from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { useParams } from "react-router-dom";
import { TrackViewPageQuery as TrackViewPageQueryType } from "../../__generated__/TrackViewPageQuery.graphql";
import { Card } from "../../components/Card.js";
import { TrackKartsCard } from "../../components/tracks/TrackKartsCard.js";
import { TrackLayoutCard } from "../../components/tracks/TrackLayoutCard.js";
import { titleStyles } from "../../styles/typography.js";

export const TRACK_VIEW_QUERY = graphql`
  query TrackViewPageQuery($trackId: ID!) {
    track(id: $trackId) {
      id
      name
      ...TrackKartsCard_track
      ...TrackLayoutCard_track
    }
  }
`;

export default function TrackViewPage(): React.ReactNode {
  const { trackId } = useParams();
  const data = useLazyLoadQuery<TrackViewPageQueryType>(
    TRACK_VIEW_QUERY,
    { trackId: trackId ?? "" },
  );

  if (!data.track) {
    return (
      <Card>
        <p css={titleStyles}>Track not found</p>
      </Card>
    );
  }

  const { name } = data.track;

  return (
    <>
      <Card>
        <p css={titleStyles}>{name}</p>
      </Card>
      <TrackKartsCard track={data.track} />
      <TrackLayoutCard track={data.track} />
    </>
  );
}
