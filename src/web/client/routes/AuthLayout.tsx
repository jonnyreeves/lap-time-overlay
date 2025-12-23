import { css } from "@emotion/react";
import { Outlet } from "react-router-dom";
import { SiteHeader } from "../components/SiteHeader.js";

export function AuthLayout() {
  return (
    <main css={authLayoutStyles}>
      <div css={authHeaderStyles}>
        <SiteHeader viewer={null} />
      </div>
      <div css={authContentStyles}>
        <Outlet />
      </div>
    </main>
  );
}

const authLayoutStyles = css`
  min-height: 100vh;
  width: 100%;
  position: relative;
  padding: 32px 20px;
  overflow: hidden;
`;

const authHeaderStyles = css`
  position: absolute;
  top: 32px;
  left: 20px;
  right: 20px;
  z-index: 1;
`;

const authContentStyles = css`
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;
