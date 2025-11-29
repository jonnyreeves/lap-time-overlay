import { Outlet } from "react-router-dom";
import { SiteHeader } from "../components/SiteHeader.js";
import { shellStyles } from "../styles/layout.js";

export function AuthLayout() {
  return (
    <main className="shell" css={shellStyles}>
      <SiteHeader viewer={null} />
      <Outlet />
    </main>
  );
}
