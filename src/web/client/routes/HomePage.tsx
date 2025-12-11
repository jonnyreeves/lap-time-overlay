import { css } from "@emotion/react";
import { Suspense } from "react";
import { graphql, useFragment } from "react-relay";
import { useOutletContext } from "react-router-dom";
import type { HomePage_viewer$key } from "../__generated__/HomePage_viewer.graphql.js";
import { RecentTracksCard } from "../components/RecentTracksCard.js";
import { RecentSessionsCard } from "../components/RecentSessionsCard.js";

const HomePageFragment = graphql`
  fragment HomePage_viewer on User {
    id
    username
    ...RecentTracksCard_viewer
    ...RecentSessionsCard_viewer
  }
`;

const homePageLayoutStyles = css`
  display: grid;
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

type OutletContext = {
  viewer: HomePage_viewer$key;
};

export function HomePage() {
  const { viewer } = useOutletContext<OutletContext>();
  const data = useFragment(HomePageFragment, viewer);

  return (
    <div css={homePageLayoutStyles}>
      <Suspense fallback={<p>Loading recent sessions...</p>}>
        <RecentSessionsCard viewer={data} />
      </Suspense>
      <Suspense fallback={<p>Loading recent tracks...</p>}>
        <RecentTracksCard viewer={data} />
      </Suspense>
    </div>
  );
}
