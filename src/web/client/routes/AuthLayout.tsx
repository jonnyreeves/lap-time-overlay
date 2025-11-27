import { Outlet } from "react-router-dom";
import { shellStyles, heroStyles } from "../styles/layout.js";
import {
  eyebrowStyles,
  ledeStyles,
  titleStyles,
} from "../styles/typography.js";

export function AuthLayout() {
  return (
    <main className="shell" css={shellStyles}>
      <header className="hero" css={heroStyles}>
        <p className="eyebrow" css={eyebrowStyles}>
          RaceCraft
        </p>
        <h1 className="title" css={titleStyles}>
          Welcome
        </h1>
        <p className="lede" css={ledeStyles}>
          Log in or create an account to keep going.
        </p>
      </header>
      <Outlet />
    </main>
  );
}
