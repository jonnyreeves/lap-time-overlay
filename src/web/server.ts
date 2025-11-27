import http from "node:http";
import { ensureWorkDirs } from "./config.js";
import { scheduleWorkDirCleanup } from "./cleanup/index.js";
import { runMigrations } from "../db/migrations/runner.js";
import { handleGraphQL } from "./graphql/handler.js";
import { serveStatic } from "./http/static.js";
import {
  handleCombineUploads,
  handleUpload,
  handleUploadFile,
  handleUploadInfo,
} from "./routes/uploads.js";
import {
  handleDownload,
  handleJobStatus,
  handlePreview,
  handlePreviewImage,
  handleRender,
} from "./routes/render.js";

await runMigrations();
await ensureWorkDirs();
scheduleWorkDirCleanup();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (req.method === "POST" && url.pathname === "/graphql") {
    return void handleGraphQL(req, res);
  }

  // Deprecated REST API: kept for compatibility during GraphQL migration.
  if (req.method === "POST" && url.pathname === "/api/upload") {
    return void handleUpload(req, res, url);
  }
  if (req.method === "POST" && url.pathname === "/api/upload/combine") {
    return void handleCombineUploads(req, res);
  }
  if (
    req.method === "GET" &&
    url.pathname.startsWith("/api/upload/") &&
    url.pathname.endsWith("/info")
  ) {
    const parts = url.pathname.split("/").filter(Boolean); // api, upload, {id}, info
    const uploadId = parts[2];
    return void handleUploadInfo(res, uploadId);
  }
  if (
    req.method === "GET" &&
    url.pathname.startsWith("/api/upload/") &&
    url.pathname.endsWith("/file")
  ) {
    const parts = url.pathname.split("/").filter(Boolean);
    const uploadId = parts[2];
    return void handleUploadFile(req, res, uploadId);
  }
  if (req.method === "POST" && url.pathname === "/api/preview") {
    return void handlePreview(req, res);
  }
  if (req.method === "POST" && url.pathname === "/api/render") {
    return void handleRender(req, res);
  }
  if (req.method === "GET" && url.pathname.startsWith("/api/preview/")) {
    const previewId = url.pathname.replace("/api/preview/", "");
    return void handlePreviewImage(res, previewId);
  }
  if (req.method === "GET" && url.pathname.startsWith("/api/jobs/")) {
    const jobId = url.pathname.replace("/api/jobs/", "");
    return void handleJobStatus(res, jobId);
  }
  if (req.method === "GET" && url.pathname.startsWith("/api/download/")) {
    const jobId = url.pathname.replace("/api/download/", "");
    return void handleDownload(res, jobId);
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
  } else {
    console.log("Web UI server started.");
  }
});
