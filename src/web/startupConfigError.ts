import type { IncomingMessage, ServerResponse } from "node:http";

type StartupConfigErrorPageArgs = {
  message: string;
  keyCandidates: string[];
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderStartupConfigErrorPage({
  message,
  keyCandidates,
}: StartupConfigErrorPageArgs): string {
  const candidateItems = keyCandidates
    .map(
      (candidate) =>
        `<li><code>USER_SECRET_ENCRYPTION_KEY=${escapeHtml(candidate)}</code></li>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>RaceCraft configuration error</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f4f6f8;
        color: #181c20;
      }

      main {
        width: min(760px, calc(100% - 32px));
        padding: 32px;
        border: 1px solid #d6d9dc;
        border-radius: 8px;
        background: #ffffff;
        box-sizing: border-box;
      }

      h1 {
        margin: 0 0 12px;
        font-size: 28px;
        line-height: 1.2;
      }

      p {
        margin: 0 0 20px;
        line-height: 1.55;
      }

      ul {
        display: grid;
        gap: 12px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      code {
        display: block;
        overflow-wrap: anywhere;
        padding: 12px;
        border-radius: 6px;
        background: #eef1f4;
        color: #11181f;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 14px;
        line-height: 1.5;
      }

      .env-name {
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-weight: 700;
      }

      .error {
        font-weight: 700;
        color: #b42318;
      }

      @media (prefers-color-scheme: dark) {
        body {
          background: #111418;
          color: #f3f5f7;
        }

        main {
          border-color: #333a42;
          background: #1a1f25;
        }

        code {
          background: #252c34;
          color: #f4f7fa;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Configuration required</h1>
      <p class="error">${escapeHtml(message)}</p>
      <p>Set <span class="env-name">USER_SECRET_ENCRYPTION_KEY</span> to one of these valid values, then restart RaceCraft.</p>
      <ul>${candidateItems}</ul>
    </main>
  </body>
</html>`;
}

export function handleStartupConfigErrorRequest(
  _req: IncomingMessage,
  res: ServerResponse,
  args: StartupConfigErrorPageArgs
): void {
  const body = renderStartupConfigErrorPage(args);
  res.writeHead(503, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}
