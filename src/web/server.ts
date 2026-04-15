import { getDatabasePath } from "../db/config.js";
import http from "node:http";
import { runMigrations } from "../db/migrations/runner.js";
import { ensureWorkDirs } from "./config.js";
import { loadEnvFiles } from "./shared/env.js";
import { handleGraphQL } from "./graphql/handler.js";
import { handleOverlayPreviewRequest } from "./http/overlayPreview.js";
import { handleTusUploadRequest } from "./http/tus.js";
import { handleRecordingDownloadRequest } from "./http/recordingDownload.js";
import { serveStatic } from "./http/static.js";
import { tempCleanupScheduler } from "./recordings/tempCleanupScheduler.js";
import { startHardwareProbe } from "../video/hwProbe.js";
import { handleStartupConfigErrorRequest } from "./startupConfigError.js";
import {
  generateUserSecretEncryptionKeyCandidates,
  UserSecretConfigError,
  validateUserSecretEncryptionKey,
} from "./shared/userSecretCrypto.js";

await loadEnvFiles();
let startupConfigError: UserSecretConfigError | null = null;
try {
  validateUserSecretEncryptionKey();
} catch (err) {
  if (err instanceof UserSecretConfigError) {
    startupConfigError = err;
  } else {
    throw err;
  }
}

if (startupConfigError) {
  const keyCandidates = generateUserSecretEncryptionKeyCandidates();
  console.error("USER_SECRET_ENCRYPTION_KEY is not configured correctly.");
  console.error(startupConfigError.message);
  console.error("");
  console.error("Use one of these valid values:");
  for (const candidate of keyCandidates) {
    console.error(`  USER_SECRET_ENCRYPTION_KEY=${candidate}`);
  }

  const server = http.createServer((req, res) => {
    handleStartupConfigErrorRequest(req, res, {
      message: startupConfigError.message,
      keyCandidates,
    });
  });

  server.listen(process.env.PORT || 3000, () => {
    const address = server.address();
    if (address && typeof address === "object") {
      console.log(`Configuration error page running on http://localhost:${address.port}`);
    } else {
      console.log("Configuration error page server started.");
    }
  });
} else {
  console.log("Running DB migrations...");
  try {
    await runMigrations();
  } catch (err) {
    console.error("Failed to run DB migrations. Server will not start.", err);
    process.exit(1);
  }
  await ensureWorkDirs();
  void startHardwareProbe().catch((err) => {
    console.warn("Hardware encoding probe failed to start", err);
  });
  await tempCleanupScheduler.start();

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    const tusMatch = url.pathname.match(/^\/api\/uploads\/tus(?:\/([^/]+))?$/);
    if (tusMatch) {
      return void handleTusUploadRequest(req, res, tusMatch[1] ?? null);
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
}
