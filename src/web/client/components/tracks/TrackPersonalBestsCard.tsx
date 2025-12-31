import { css } from "@emotion/react";
import { graphql, useFragment } from "react-relay";
import { useNavigate } from "react-router-dom";
import type { TrackPersonalBestsCard_track$key } from "../../__generated__/TrackPersonalBestsCard_track.graphql.js";
import { titleStyles } from "../../styles/typography.js";
import { Card } from "../Card.js";
import { TrackAvatar } from "./TrackAvatar.js";
import { TrackPersonalBestPill, type TrackPersonalBestEntry } from "./TrackPersonalBestPill.js";
import { groupPersonalBestEntries } from "./personalBestGrouping.js";

const TrackPersonalBestsFragment = graphql`
  fragment TrackPersonalBestsCard_track on Track {
    id
    name
    heroImage
    postcode
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

const trackHeaderStyles = css`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const trackTitleStyles = css`
  ${titleStyles};
  font-size: 2.4rem;
  margin: 0;
  cursor: default;
`;

const trackMetaStyles = css`
  margin: 4px 0 0;
  color: #64748b;
  font-weight: 600;
`;

type Props = {
  track: TrackPersonalBestsCard_track$key;
  showTrackHeader?: boolean;
};

export function TrackPersonalBestsCard({ track, showTrackHeader = false }: Props) {
  const data = useFragment(TrackPersonalBestsFragment, track);
  const navigate = useNavigate();
  const personalBestEntries = data.personalBestEntries ?? [];
  const groupedEntries = groupPersonalBestEntries(personalBestEntries, 3);
  const postcodeLabel = data.postcode?.trim() ?? "";

  function handleNavigate(entry: TrackPersonalBestEntry) {
    navigate(`/session/${entry.trackSessionId}`);
  }

  return (
    <Card title="">
      {showTrackHeader ? (
        <div css={trackHeaderStyles}>
          <TrackAvatar name={data.name ?? ""} heroImage={data.heroImage} size={84} />
          <div>
            <p css={trackTitleStyles}>{data.name}</p>
            {postcodeLabel ? <p css={trackMetaStyles}>Postcode: {postcodeLabel}</p> : null}
          </div>
        </div>
      ) : null}
      {groupedEntries.length ? (
        <div css={pillGridStyles}>
          {groupedEntries.map(({ key, fastestEntry, topEntries }) => (
            <TrackPersonalBestPill
              key={key}
              entry={fastestEntry}
              topEntries={topEntries}
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
