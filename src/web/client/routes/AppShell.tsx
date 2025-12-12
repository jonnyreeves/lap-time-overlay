import { Outlet } from "react-router-dom";
import { Breadcrumbs } from "../components/Breadcrumbs.js";
import { SiteHeader } from "../components/SiteHeader.js";
import { BreadcrumbsProvider, useBreadcrumbs } from "../hooks/useBreadcrumbs.js";
import type { RequireAuthViewerQuery } from "../__generated__/RequireAuthViewerQuery.graphql.js";
import { shellStyles } from "../styles/layout.js";

type Props = {
  viewer: NonNullable<RequireAuthViewerQuery["response"]["viewer"]>;
};
export function AppShell({ viewer }: Props) {
  return (
    <BreadcrumbsProvider>
      <ShellContent viewer={viewer} />
    </BreadcrumbsProvider>
  );
}

function ShellContent({ viewer }: Props) {
  const { items } = useBreadcrumbs();

  return (
    <main className="shell" css={shellStyles}>
      <SiteHeader viewer={viewer} />
      <Breadcrumbs items={items} />
      <Outlet context={{ viewer }} />
    </main>
  );
}
