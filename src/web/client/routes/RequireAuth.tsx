import { useEffect } from "react";
import { useLazyLoadQuery } from "react-relay";
import { useLocation, useNavigate } from "react-router-dom";
import type { ViewerQuery } from "../__generated__/ViewerQuery.graphql.js";
import ViewerQueryNode from "../__generated__/ViewerQuery.graphql.js";
import { Card } from "../components/Card.js";
import { AppShell } from "./AppShell.js";

export function RequireAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const data = useLazyLoadQuery<ViewerQuery>(ViewerQueryNode, {}, {
    fetchPolicy: "network-only",
  });

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
