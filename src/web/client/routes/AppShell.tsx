import { Outlet } from "react-router-dom";
import type { RequireAuthViewerQuery } from "../__generated__/RequireAuthViewerQuery.graphql.js";
import { SiteHeader } from "../components/SiteHeader.js";
import { shellStyles } from "../styles/layout.js";

type Props = {
  viewer: NonNullable<RequireAuthViewerQuery["response"]["viewer"]>;
};
export function AppShell({ viewer }: Props) {
  return (
    <main className="shell" css={shellStyles}>
      <SiteHeader />
      <Outlet context={{ viewer }} />
    </main>
  );
}