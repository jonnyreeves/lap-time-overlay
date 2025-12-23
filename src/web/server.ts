import { getDatabasePath } from "../db/config.js";
import http from "node:http";
import { runMigrations } from "../db/migrations/runner.js";
import { ensureWorkDirs } from "./config.js";
import { handleGraphQL } from "./graphql/handler.js";
import { handleOverlayPreviewRequest } from "./http/overlayPreview.js";
import { handleRecordingDownloadRequest, handleRecordingUploadRequest } from "./http/uploads.js";
import { serveStatic } from "./http/static.js";
import { tempCleanupScheduler } from "./recordings/tempCleanupScheduler.js";

await runMigrations();
await ensureWorkDirs();
await tempCleanupScheduler.start();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (req.method === "PUT" && url.pathname.startsWith("/uploads/recordings/")) {
    const match = url.pathname.match(/^\/uploads\/recordings\/([^/]+)$/);
    if (match) {
      return void handleRecordingUploadRequest(req, res, match[1], url.searchParams.get("token"));
    }
  }

  if (req.method === "GET" && url.pathname.startsWith("/recordings/")) {
    const match = url.pathname.match(/^\/recordings\/([^/]+)$/);
    if (match) {
      return void handleRecordingDownloadRequest(req, res, match[1]);
    }
  }

  if (req.method === "POST" && url.pathname === "/graphql") {
    return void handleGraphQL(req, res);
  }

  if (req.method === "GET" && url.pathname.startsWith("/previews/")) {
    const match = url.pathname.match(/^\/previews\/([^/]+)\/([^/]+)$/);
    if (match) {
      return void handleOverlayPreviewRequest(req, res, match[1], match[2]);
    }
  }

  if (req.method === "GET") {
    return void serveStatic(res, url.pathname);
  }

  res.writeHead(404).end();
});

server.listen(process.env.PORT || 3000, () => {
  const address = server.address();
  if (address && typeof address === "object") {
    console.log(`Web UI running on http://localhost:${address.port}`);
    console.log(`Database is persisted to: ${getDatabasePath()}`);
  } else {
    console.log("Web UI server started.");
  }
});
