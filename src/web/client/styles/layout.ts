import { css } from "@emotion/react";

export const shellStyles = css`
  max-width: 1240px;
  margin: 0 auto;
  padding: 72px 20px 96px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  

  @media (max-width: 640px) {
    padding: 56px 18px 72px;
    gap: 22px;
  }
`;

export const heroStyles = css`
  display: grid;
  gap: 12px;

  .header {
    display: flex;
    justify-content: space-between; /* pushes them to opposite edges */
    align-items: center; /* vertical alignment */
  }
`;
