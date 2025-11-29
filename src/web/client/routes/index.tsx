import { css } from "@emotion/react";
import { Suspense } from "react";
import { useOutletContext } from "react-router-dom";
import type { RecentCircuitsCard_viewer$key } from "../components/__generated__/RecentCircuitsCard_viewer.graphql.js";
import { RecentCircuitsCard } from "../components/RecentCircuitsCard.js";
import { RecentSessionsCard } from "../components/RecentSessionsCard.js";

const homePageLayoutStyles = css`
  display: grid;
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

type OutletContext = {
  viewer: RecentCircuitsCard_viewer$key;
};

export function HomePage() {
  const { viewer } = useOutletContext<OutletContext>();

  return (
    <div css={homePageLayoutStyles}>
      <RecentSessionsCard />
      <Suspense fallback={<p>Loading recent circuits...</p>}>
        <RecentCircuitsCard viewer={viewer} />
      </Suspense>
    </div>
  );
}
