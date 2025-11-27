import { useState } from "react";
import { useMutation, useRelayEnvironment } from "react-relay";
import { Link, Outlet, useNavigate } from "react-router-dom";
import type { LogoutMutation } from "../__generated__/LogoutMutation.graphql.js";
import LogoutMutationNode from "../__generated__/LogoutMutation.graphql.js";
import type { ViewerQuery } from "../__generated__/ViewerQuery.graphql.js";
import { Card } from "../components/index.js";
import { shellStyles, heroStyles } from "../styles/layout.js";
import {
  eyebrowStyles,
  ledeStyles,
  titleStyles,
} from "../styles/typography.js";

type Viewer = NonNullable<ViewerQuery["response"]["viewer"]>;

export function AppShell({ viewer }: { viewer: Viewer }) {
  const navigate = useNavigate();
  const environment = useRelayEnvironment();
  const [error, setError] = useState<string | null>(null);
  const [commitLogout, isLogoutInFlight] = useMutation<LogoutMutation>(LogoutMutationNode);

  const handleLogout = () => {
    if (isLogoutInFlight) return;
    setError(null);
    commitLogout({
      variables: {},
      onCompleted: () => {
        const store = environment.getStore() as unknown as {
          invalidateStore?: () => void;
        };
        store.invalidateStore?.();
        navigate("/login", { replace: true });
      },
      onError: () => setError("Failed to log out. Try again."),
    });
  };

  return (
    <main className="shell" css={shellStyles}>
      <header className="hero" css={heroStyles}>
        <p className="eyebrow" css={eyebrowStyles}>
          Lap Time Overlap
        </p>
        <h1 className="title" css={titleStyles}>
          Overlay workspace
        </h1>
        <p className="lede" css={ledeStyles}>
          Signed in as {viewer.username}
        </p>
        <Card title="Account">
          <div className="value">{viewer.username}</div>
          <button onClick={handleLogout} disabled={isLogoutInFlight}>
            {isLogoutInFlight ? "Logging out…" : "Log out"}
          </button>
          {error ? <p className="lede" role="alert">{error}</p> : null}
        </Card>
        <Card title="Navigation">
          <p className="value">
            <Link to="/">Home</Link>
          </p>
        </Card>
      </header>
      <Outlet />
    </main>
  );
}
