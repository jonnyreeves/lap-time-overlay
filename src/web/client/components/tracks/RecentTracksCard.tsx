import { css } from "@emotion/react";
import { graphql, useFragment } from "react-relay";
import { useNavigate } from "react-router-dom";
import {
  type RecentTracksCard_viewer$key,
} from "../../__generated__/RecentTracksCard_viewer.graphql.js";
import { Card } from "../Card.js";
import { TrackAvatar } from "./TrackAvatar.js";
import { TrackPersonalBestPill } from "./TrackPersonalBestPill.js";
import { groupPersonalBestEntries } from "./personalBestGrouping.js";

const RecentTracksCardFragment = graphql`
  fragment RecentTracksCard_viewer on User {
    id
    recentTracks(first: 5) @connection(key: "RecentTracksCard_recentTracks") {
      edges {
        node {
          id
          name
          heroImage
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
      }
    }
  }
`;

const tracksContainerStyles = css`
  display: flex;
  overflow-x: auto;
  gap: 20px;
  padding-bottom: 10px; /* For scrollbar visibility */
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  scrollbar-width: none; /* Hide scrollbar for Firefox */
  &::-webkit-scrollbar {
    display: none; /* Hide scrollbar for Chrome, Safari, Opera */
  }
`;

const trackItemStyles = css`
  flex-shrink: 0; /* Prevent items from shrinking */
  width: 220px; /* Fixed width for each item */
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px;
  gap: 0;
`;

const trackLinkButtonStyles = css`
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  color: inherit;
  font: inherit;
  text-align: inherit;
  cursor: pointer;
`;

const avatarButtonStyles = css`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
`;

const trackNameStyles = css`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-top: 0;
  display: inline-flex;
  justify-content: center;
  width: 100%;
`;

const trackPbStyles = css`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const emptyStateStyles = css`
  margin-top: 8px;
  padding: 10px 12px;
  width: 100%;
  border-radius: 10px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #94a3b8;
  font-weight: 600;
`;

export function RecentTracksCard({ viewer }: { viewer: RecentTracksCard_viewer$key }) {
  const data = useFragment(RecentTracksCardFragment, viewer);
  const tracks = (data.recentTracks?.edges ?? [])
    .map((edge) => edge?.node)
    .filter(Boolean);
  const navigate = useNavigate();
  const handleTrackNavigate = (trackId: string) => navigate(`/tracks/view/${trackId}`);
  const handleSessionNavigate = (sessionId: string) => navigate(`/session/${sessionId}`);

  return (
    <Card title="Recent Tracks">
      <div css={tracksContainerStyles}>
        {tracks.map((track) => (
          <div
            key={track.id}
            css={trackItemStyles}
          >
            <button
              type="button"
              css={[trackLinkButtonStyles, avatarButtonStyles]}
              onClick={() => handleTrackNavigate(track.id)}
              aria-label={`View ${track.name}`}
            >
              <TrackAvatar name={track.name} heroImage={track.heroImage} size={100} />
            </button>
            <button
              type="button"
              css={[trackLinkButtonStyles, trackNameStyles]}
              onClick={() => handleTrackNavigate(track.id)}
            >
              {track.name}
            </button>
            <div css={trackPbStyles}>
              {track.personalBestEntries?.length ? (
                groupPersonalBestEntries(track.personalBestEntries ?? [], 1).map(
                  ({ key, fastestEntry, topEntries }) => (
                    <TrackPersonalBestPill
                      key={key}
                      entry={fastestEntry}
                      topEntries={[]}
                      onClick={(entry) => handleSessionNavigate(entry.trackSessionId)}
                    />
                  )
                )
              ) : (
                <div css={emptyStateStyles}>No lap data yet</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
