import { Outlet } from "react-router-dom";
import type { ViewerQuery } from "../__generated__/ViewerQuery.graphql.js";
import { SiteHeader } from "../components/SiteHeader.js";
import { shellStyles } from "../styles/layout.js";

type Viewer = NonNullable<ViewerQuery["response"]["viewer"]>;

export function AppShell({ viewer }: { viewer: Viewer }) {


  return (
    <main className="shell" css={shellStyles}>
      <SiteHeader viewer={viewer} />
      <Outlet context={{ viewer }} />
    </main>
  );
}
