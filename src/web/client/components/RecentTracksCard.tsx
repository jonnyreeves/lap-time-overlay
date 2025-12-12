import { css } from "@emotion/react";
import { graphql, useFragment } from "react-relay";
import { type RecentTracksCard_viewer$key } from "../__generated__/RecentTracksCard_viewer.graphql.js";
import { Card } from "./Card.js";
import { formatStopwatchTime } from "../utils/lapTime.js";
import { useNavigate } from "react-router-dom";

const RecentTracksCardFragment = graphql`
  fragment RecentTracksCard_viewer on User {
    id
    recentTracks(first: 5) @connection(key: "RecentTracksCard_recentTracks") {
      edges {
        node {
          id
          name
          heroImage
          personalBest
          personalBestDry
          personalBestWet
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
  width: 150px; /* Fixed width for each item */
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
  margin-top: 6px;
  display: grid;
  gap: 6px;
  width: 100%;
`;

const pbRowStyles = css`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid #e2e8f4;
  background: #f8fafc;
  color: #475569;
  text-align: left;
`;

const pbEmojiStyles = css`
  font-size: 1.1rem;
  width: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const pbValueStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
`;

const pbLabelStyles = css`
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
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

function formatPersonalBest(time: number | null | undefined): string | null {
  if (typeof time !== "number" || time <= 0 || Number.isNaN(time)) {
    return null;
  }
  const formatted = formatStopwatchTime(time);
  const [minutes, rest] = formatted.split(":");
  if (!rest) return formatted;
  return `${minutes.padStart(2, "0")}:${rest}`;
}

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
              <div css={pbRowStyles}>
                <span css={pbEmojiStyles} aria-hidden>
                  ☀️
                </span>
                <span css={pbValueStyles}>
                  <span css={pbLabelStyles}>PB</span>
                  <span>{formatPersonalBest(track.personalBestDry) ?? "—"}</span>
                </span>
              </div>
              <div css={pbRowStyles}>
                <span css={pbEmojiStyles} aria-hidden>
                  🌧️
                </span>
                <span css={pbValueStyles}>
                  <span css={pbLabelStyles}>PB</span>
                  <span>{formatPersonalBest(track.personalBestWet) ?? "—"}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
