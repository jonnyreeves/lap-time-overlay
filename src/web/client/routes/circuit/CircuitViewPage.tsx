import React from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { useParams } from "react-router-dom";
import { CircuitViewPageQuery as CircuitViewPageQueryType } from "../../__generated__/CircuitViewPageQuery.graphql";
import { Card } from "../../components/Card.js";
import { CircuitKartsCard } from "../../components/CircuitKartsCard.js";
import { titleStyles } from "../../styles/typography.js";

export const CIRCUIT_VIEW_QUERY = graphql`
  query CircuitViewPageQuery($circuitId: ID!) {
    track: circuit(id: $circuitId) {
      id
      name
      ...CircuitKartsCard_circuit
    }
  }
`;

export default function CircuitViewPage(): React.ReactNode {
  const { circuitId, trackId } = useParams();
  const data = useLazyLoadQuery<CircuitViewPageQueryType>(
    CIRCUIT_VIEW_QUERY,
    { circuitId: trackId ?? circuitId ?? "" },
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
      <CircuitKartsCard circuit={data.track} />
    </>
  );
}
