import { graphql, useFragment, useMutation, useRelayEnvironment } from "react-relay";
import { useNavigate } from "react-router-dom";
import type { SiteHeader_viewer$key } from "../__generated__/SiteHeader_viewer.graphql.js";
import { heroStyles } from "../styles/layout.js";
import {
    ledeStyles,
    titleStyles
} from "../styles/typography.js";

const SiteHeaderFragment = graphql`
  fragment SiteHeader_viewer on User {
    id
    username
  }
`;

const SiteHeaderLogoutMutation = graphql`
  mutation SiteHeaderLogoutMutation {
    logout {
        success
    }
  }
`;

type SiteHeaderProps = {
    viewer?: SiteHeader_viewer$key,
}

export function SiteHeader({ viewer }: SiteHeaderProps) {
    const navigate = useNavigate();
    const environment = useRelayEnvironment();
    const data = useFragment(SiteHeaderFragment, viewer);

    const isLoggedIn = data != null;


    const [commitLogout, isLogoutInFlight] = useMutation(SiteHeaderLogoutMutation);

    const handleLogout = () => {
        if (isLogoutInFlight) return;
        commitLogout({
            variables: {},
            onCompleted: () => {
                const store = environment.getStore() as unknown as {
                    invalidateStore?: () => void;
                };
                store.invalidateStore?.();
                navigate("/auth/login", { replace: true });
            },
            onError: () => console.error("Failed to log out. Try again."),
        });
    };

    return (
        <header className="hero" css={heroStyles}>
            <div className="header">
                <h1 className="title" css={titleStyles} onClick={() => navigate("/")}>
                    RaceCraft 🏁
                </h1>
                {isLoggedIn ? (
                    <p className="lede" css={ledeStyles}>
                        Signed in as {data.username} | <a href="#" onClick={handleLogout}>Sign out</a>
                    </p>
                ) : null}

            </div>
        </header>
    )
}