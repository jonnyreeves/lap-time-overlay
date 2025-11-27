import { useMutation, useRelayEnvironment } from "react-relay";
import { Outlet, useNavigate } from "react-router-dom";
import type { LogoutMutation } from "../__generated__/LogoutMutation.graphql.js";
import LogoutMutationNode from "../__generated__/LogoutMutation.graphql.js";
import type { ViewerQuery } from "../__generated__/ViewerQuery.graphql.js";
import { heroStyles, shellStyles } from "../styles/layout.js";
import {
  ledeStyles,
  titleStyles
} from "../styles/typography.js";

type Viewer = NonNullable<ViewerQuery["response"]["viewer"]>;

export function AppShell({ viewer }: { viewer: Viewer }) {
  const navigate = useNavigate();
  const environment = useRelayEnvironment();
  const [commitLogout, isLogoutInFlight] = useMutation<LogoutMutation>(LogoutMutationNode);

  const handleLogout = () => {
    if (isLogoutInFlight) return;
    commitLogout({
      variables: {},
      onCompleted: () => {
        const store = environment.getStore() as unknown as {
          invalidateStore?: () => void;
        };
        store.invalidateStore?.();
        navigate("/login", { replace: true });
      },
      onError: () => console.error("Failed to log out. Try again."),
    });
  };

  return (
    <main className="shell" css={shellStyles}>
      <header className="hero" css={heroStyles}>
        <div className="header">
          <h1 className="title" css={titleStyles}>
            RaceCraft 🏁
          </h1>
          <p className="lede" css={ledeStyles}>
            Signed in as {viewer.username} | <a href="#" onClick={handleLogout}>Sign out</a>
          </p>
        </div>
      </header>
      <Outlet />
    </main>
  );
}
