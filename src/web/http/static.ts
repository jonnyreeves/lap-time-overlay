import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import type http from "node:http";
import path from "node:path";
import { publicDir } from "../config.js";
import { sendJson } from "./respond.js";

export async function serveStatic(
  res: http.ServerResponse,
  requestPath: string
): Promise<void> {
  let relativePath = requestPath.split("?")[0];
  if (relativePath === "/") {
    relativePath = "/index.html";
  }

  const targetPath = path.join(publicDir, relativePath);
  if (!targetPath.startsWith(publicDir)) {
    sendJson(res, 400, { error: "Invalid path" });
    return;
  }

  try {
    const stats = await fs.stat(targetPath);
    if (stats.isFile()) {
      const stream = createReadStream(targetPath);
      res.writeHead(200, {
        "Content-Type": getContentType(targetPath),
        "Cache-Control": "no-cache",
      });
      stream.pipe(res);
      return;
    }
  } catch {
    // ignore if file doesn't exist - we'll serve index.html
  }

  // For any path that is not a file, serve index.html for client-side routing.
  try {
    const indexPath = path.join(publicDir, "index.html");
    await fs.stat(indexPath); // check it exists
    const stream = createReadStream(indexPath);
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    });
    stream.pipe(res);
  } catch (err) {
    console.error("Failed to serve index.html", err);
    sendJson(res, 500, { error: "Internal server error" });
  }
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    default:
      return "application/octet-stream";
  }
}
