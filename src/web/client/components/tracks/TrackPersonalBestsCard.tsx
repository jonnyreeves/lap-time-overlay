import { css } from "@emotion/react";
import { graphql, useFragment } from "react-relay";
import { useNavigate } from "react-router-dom";
import type { TrackPersonalBestsCard_track$key } from "../../__generated__/TrackPersonalBestsCard_track.graphql.js";
import { Card } from "../Card.js";
import { TrackPersonalBestPill, type TrackPersonalBestEntry } from "./TrackPersonalBestPill.js";

const TrackPersonalBestsFragment = graphql`
  fragment TrackPersonalBestsCard_track on Track {
    id
    personalBestEntries {
      trackSessionId
      conditions
      lapTime
      kart {
        id
        name
      }
      trackLayout {
        id
        name
      }
    }
  }
`;

const pillGridStyles = css`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const emptyStateStyles = css`
  margin-top: 4px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #94a3b8;
  font-weight: 600;
  text-align: center;
`;

type Props = {
  track: TrackPersonalBestsCard_track$key;
};

export function TrackPersonalBestsCard({ track }: Props) {
  const data = useFragment(TrackPersonalBestsFragment, track);
  const navigate = useNavigate();
  const personalBestEntries = data.personalBestEntries ?? [];

  function handleNavigate(entry: TrackPersonalBestEntry) {
    navigate(`/session/${entry.trackSessionId}`);
  }

  return (
    <Card title="Personal Bests">
      {personalBestEntries.length ? (
        <div css={pillGridStyles}>
          {personalBestEntries.map((entry) => (
            <TrackPersonalBestPill
              key={entry.trackSessionId}
              entry={entry}
              onClick={handleNavigate}
            />
          ))}
        </div>
      ) : (
        <div css={emptyStateStyles}>No lap data yet</div>
      )}
    </Card>
  );
}
