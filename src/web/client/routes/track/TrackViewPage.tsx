import React from "react";
import { css } from "@emotion/react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { useParams } from "react-router-dom";
import { TrackViewPageQuery as TrackViewPageQueryType } from "../../__generated__/TrackViewPageQuery.graphql";
import { Card } from "../../components/Card.js";
import { TrackKartsCard } from "../../components/tracks/TrackKartsCard.js";
import { TrackLayoutCard } from "../../components/tracks/TrackLayoutCard.js";
import { TrackPersonalBestsCard } from "../../components/tracks/TrackPersonalBestsCard.js";
import { titleStyles } from "../../styles/typography.js";

const sideBySideStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
`;

export const TRACK_VIEW_QUERY = graphql`
  query TrackViewPageQuery($trackId: ID!) {
    track(id: $trackId) {
      id
      name
      ...TrackKartsCard_track
      ...TrackLayoutCard_track
      ...TrackPersonalBestsCard_track
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
      <TrackPersonalBestsCard track={data.track} />
      <div css={sideBySideStyles}>
        <TrackKartsCard track={data.track} />
        <TrackLayoutCard track={data.track} />
      </div>
    </>
  );
}
