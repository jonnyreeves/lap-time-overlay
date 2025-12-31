import { getDatabasePath } from "../db/config.js";
import http from "node:http";
import { runMigrations } from "../db/migrations/runner.js";
import { ensureWorkDirs } from "./config.js";
import { loadEnvFiles } from "./shared/env.js";
import { handleGraphQL } from "./graphql/handler.js";
import { handleOverlayPreviewRequest } from "./http/overlayPreview.js";
import { handleRecordingDownloadRequest, handleRecordingUploadRequest } from "./http/uploads.js";
import { serveStatic } from "./http/static.js";
import { tempCleanupScheduler } from "./recordings/tempCleanupScheduler.js";
import { startHardwareProbe } from "../video/hwProbe.js";

await loadEnvFiles();
await runMigrations();
await ensureWorkDirs();
void startHardwareProbe().catch((err) => {
  console.warn("Hardware encoding probe failed to start", err);
});
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
    if (process.env.BUILD_TIMESTAMP) {
      console.log(`Build timestamp: ${process.env.BUILD_TIMESTAMP}`);
    }
  } else {
    console.log("Web UI server started.");
  }
});
