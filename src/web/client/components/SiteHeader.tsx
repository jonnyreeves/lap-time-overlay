import { graphql, useFragment } from "react-relay";
import { useNavigate } from "react-router-dom";
import type { SiteHeader_viewer$key } from "../__generated__/SiteHeader_viewer.graphql.js";
import { useLogout } from "../hooks/useLogout.js";
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

type Props = {
    viewer: SiteHeader_viewer$key | null;
};

export function SiteHeader({ viewer }: Props) {
    const navigate = useNavigate();
    const data = useFragment(SiteHeaderFragment, viewer);
    const { handleLogout, isLogoutInFlight } = useLogout();

    const isLoggedIn = !!data?.username;

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