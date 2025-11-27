import { css } from "@emotion/react";

export const globalStyles = css`
  @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&display=swap");

  :root {
    font-family: "Space Grotesk", "SF Pro Text", "Segoe UI", -apple-system,
      system-ui, sans-serif;
    color: #0b1021;
    background-color: #eef2f8;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-height: 100vh;
    background: radial-gradient(circle at 20% 20%, #f9fbff, #e6ecf7 50%),
      radial-gradient(circle at 80% 0%, #f3f7ff, #e1e8f4 40%),
      linear-gradient(135deg, #f7faff, #f0f5ff);
    color: inherit;
  }
`;
