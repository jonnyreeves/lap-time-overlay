import type http from "node:http";
import { graphql } from "graphql";
import { readJsonBody } from "../http/body.js";
import { sendJson } from "../http/respond.js";
import { rootValue, schema } from "./schema.js";

export async function handleGraphQL(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  let payload: Record<string, unknown>;
  try {
    payload = await readJsonBody(req);
  } catch (err) {
    console.error("GraphQL payload parse failed:", err);
    sendJson(res, 400, { error: "Invalid JSON payload" });
    return;
  }

  const query = typeof payload.query === "string" ? payload.query : null;
  const variables =
    payload.variables && typeof payload.variables === "object"
      ? (payload.variables as Record<string, unknown>)
      : undefined;

  if (!query) {
    sendJson(res, 400, { error: "Query is required" });
    return;
  }

  try {
    const result = await graphql({
      schema,
      source: query,
      rootValue,
      variableValues: variables,
    });
    sendJson(res, 200, result);
  } catch (err) {
    console.error("GraphQL execution error:", err);
    sendJson(res, 500, { error: "GraphQL execution failed" });
  }
}
