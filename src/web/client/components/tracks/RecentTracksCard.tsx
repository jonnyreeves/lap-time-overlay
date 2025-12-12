import { css } from "@emotion/react";
import { graphql, useFragment } from "react-relay";
import {
  type RecentTracksCard_viewer$data,
  type RecentTracksCard_viewer$key,
} from "../../__generated__/RecentTracksCard_viewer.graphql.js";
import { Card } from "../Card.js";
import { useNavigate } from "react-router-dom";
import { RecentTrackPersonalBestPill } from "./RecentTrackPersonalBestPill.js";

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
  cursor: pointer;
`;

const heroImageContainerStyles = css`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e2e8f4; /* Light background for initials */
  color: #6366f1; /* Accent color for initials */
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 10px;
  border: 1px solid #e0e0e0; /* Subtle border */

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const trackNameStyles = css`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-top: 5px;
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

function getInitials(name: string): string {
  if (!name) return "";
  const words = name.split(" ");
  if (words.length === 1) {
    return name.substring(0, 2).toUpperCase();
  }
  return words
    .filter((word) => word.length > 0) // Filter out empty strings from multiple spaces
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

type PersonalBestEntry = NonNullable<
  NonNullable<
    NonNullable<RecentTracksCard_viewer$data["recentTracks"]>["edges"]
  >[number]
>["node"]["personalBestEntries"][number];

export function RecentTracksCard({ viewer }: { viewer: RecentTracksCard_viewer$key }) {
  const data = useFragment(RecentTracksCardFragment, viewer);
  const tracks = (data.recentTracks?.edges ?? [])
    .map((edge) => edge?.node)
    .filter(Boolean);
  const navigate = useNavigate();

  return (
    <Card title="Recent Tracks">
      <div css={tracksContainerStyles}>
        {tracks.map((track) => (
          <div
            key={track.id}
            css={trackItemStyles}
            onClick={() => navigate(`/tracks/view/${track.id}`)}
          >
            <div css={heroImageContainerStyles}>
              {track.heroImage ? (
                <img src={track.heroImage} alt={track.name} />
              ) : (
                <span>{getInitials(track.name)}</span>
              )}
            </div>
            <div css={trackNameStyles}>{track.name}</div>
            <div css={trackPbStyles}>
              {track.personalBestEntries?.length ? (
                track.personalBestEntries.map((entry: PersonalBestEntry) => (
                  <RecentTrackPersonalBestPill
                    key={`${entry.trackLayout.id}-${entry.kart.id}-${entry.conditions}`}
                    entry={entry}
                  />
                ))
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
