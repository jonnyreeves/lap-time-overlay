import { css } from "@emotion/react";
import { RecentCircuitsCard } from "../components/RecentCircuitsCard.js";
import { RecentSessionsCard } from "../components/RecentSessionsCard.js";

const homePageLayoutStyles = css`
  display: grid;
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export function HomePage() {
  return (
    <div css={homePageLayoutStyles}>
      <RecentSessionsCard />
      <RecentCircuitsCard />
    </div>
  );
}
