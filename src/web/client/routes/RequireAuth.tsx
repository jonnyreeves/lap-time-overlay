import { useEffect } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { useLocation, useNavigate } from "react-router-dom";
import type { RequireAuthViewerQuery } from "../__generated__/RequireAuthViewerQuery.graphql.js";
import { Card } from "../components/Card.js";
import { AppShell } from "./AppShell.js";

const RequireAuthViewerQuery = graphql`
  query RequireAuthViewerQuery {
    viewer {
      ...HomePage_viewer
      ...SiteHeader_viewer
    }
  }
`;

export function RequireAuth() {
  const navigate = useNavigate();
  const location = useLocation();

  const data = useLazyLoadQuery<RequireAuthViewerQuery>(
    RequireAuthViewerQuery,
    {},
    { fetchPolicy: "network-only" }
  );

  useEffect(() => {
    if (!data.viewer) {
      navigate("/auth/login", {
        replace: true,
        state: { from: location.pathname + location.search },
      });
    }
  }, [data.viewer, navigate, location.pathname, location.search]);

  if (!data.viewer) {
    return <Card>Redirecting to login…</Card>;
  }

  return <AppShell viewer={data.viewer} />;
}
