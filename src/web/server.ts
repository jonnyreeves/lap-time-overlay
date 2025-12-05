import http from "node:http";
import { runMigrations } from "../db/migrations/runner.js";
import { ensureWorkDirs } from "./config.js";
import { handleGraphQL } from "./graphql/handler.js";
import { serveStatic } from "./http/static.js";

await runMigrations();
await ensureWorkDirs();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (req.method === "POST" && url.pathname === "/graphql") {
    return void handleGraphQL(req, res);
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
