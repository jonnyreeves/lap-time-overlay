import { css } from "@emotion/react";
import { graphql, useFragment } from "react-relay";
import { type RecentCircuitsCard_viewer$key } from "../__generated__/RecentCircuitsCard_viewer.graphql.js";
import { Card } from "./Card.js";
import { formatStopwatchTime } from "../utils/lapTime.js";

const RecentCircuitsCardFragment = graphql`
  fragment RecentCircuitsCard_viewer on User {
    id
    recentCircuits(first: 5)
      @connection(key: "RecentCircuitsCard_recentCircuits") {
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

const circuitsContainerStyles = css`
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

const circuitItemStyles = css`
  flex-shrink: 0; /* Prevent items from shrinking */
  width: 150px; /* Fixed width for each item */
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px;
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

const circuitNameStyles = css`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-top: 5px;
`;

const circuitPbStyles = css`
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

export function RecentCircuitsCard({
  viewer,
}: {
  viewer: RecentCircuitsCard_viewer$key;
}) {
  const data = useFragment(RecentCircuitsCardFragment, viewer);
  const circuits = (data.recentCircuits?.edges ?? [])
    .map((edge) => edge?.node)
    .filter(Boolean);

  return (
    <Card title="Recent Circuits">
      <div css={circuitsContainerStyles}>
        {circuits.map((circuit) => (
          <div key={circuit.id} css={circuitItemStyles}>
            <div css={heroImageContainerStyles}>
              {circuit.heroImage ? (
                <img src={circuit.heroImage} alt={circuit.name} />
              ) : (
                <span>{getInitials(circuit.name)}</span>
              )}
            </div>
            <div css={circuitNameStyles}>{circuit.name}</div>
            <div css={circuitPbStyles}>
              <div css={pbRowStyles}>
                <span css={pbEmojiStyles} aria-hidden>
                  ☀️
                </span>
                <span css={pbValueStyles}>
                  <span css={pbLabelStyles}>PB</span>
                  <span>{formatPersonalBest(circuit.personalBestDry) ?? "—"}</span>
                </span>
              </div>
              <div css={pbRowStyles}>
                <span css={pbEmojiStyles} aria-hidden>
                  🌧️
                </span>
                <span css={pbValueStyles}>
                  <span css={pbLabelStyles}>PB</span>
                  <span>{formatPersonalBest(circuit.personalBestWet) ?? "—"}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
