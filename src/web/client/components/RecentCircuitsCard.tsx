import { css } from "@emotion/react";
import { Card } from "./Card.js";

export type Circuit = {
  id: string;
  name: string;
  heroImage?: string;
};

// Dummy data for now
export const circuits: Circuit[] = [
  {
    id: "1",
    name: "Daytona Sandown Park",
    heroImage: "",
  },
  {
    id: "2",
    name: "Teamsport Farnborough",
    heroImage: "", // No hero image for this one to test initials
  },
  {
    id: "3",
    name: "Daytona Milton Keynes",
    heroImage: "",
  },
  {
    id: "4",
    name: "PFI Karting",
    heroImage: "", // No hero image for this one to test initials
  },
];

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

function getInitials(name: string): string {
  if (!name) return "";
  const words = name.split(" ");
  if (words.length === 1) {
    return name.substring(0, 2).toUpperCase();
  }
  return words
    .filter(word => word.length > 0) // Filter out empty strings from multiple spaces
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function RecentCircuitsCard() {
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
          </div>
        ))}
      </div>
    </Card>
  );
}
