import type http from "node:http";
import { graphql } from "graphql";
import { readJsonBody } from "../http/body.js";
import { sendJson } from "../http/respond.js";
import { rootValue, schema } from "./schema.js";
import {
  appendSetCookie,
  buildSessionCookie,
  clearSessionCookie as buildClearCookie,
  parseCookies,
  SESSION_COOKIE_NAME,
} from "../auth/cookies.js";
import {
  loadUserFromSession,
  refreshSession,
} from "../auth/service.js";
import type { GraphQLContext } from "./context.js";

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

  const cookies = parseCookies(req.headers.cookie);
  const sessionToken =
    typeof cookies[SESSION_COOKIE_NAME] === "string"
      ? cookies[SESSION_COOKIE_NAME]
      : null;
  const auth = sessionToken ? loadUserFromSession(sessionToken) : null;

  if (!auth && sessionToken) {
    appendSetCookie(res, buildClearCookie());
  }

  if (auth && sessionToken) {
    const newExpires = refreshSession(sessionToken);
    if (newExpires) {
      appendSetCookie(res, buildSessionCookie(sessionToken, newExpires));
    }
  }

  const context: GraphQLContext = {
    currentUser: auth?.user ?? null,
    sessionToken: sessionToken ?? null,
    setSessionCookie: (token: string, expiresAt: number) =>
      appendSetCookie(res, buildSessionCookie(token, expiresAt)),
    clearSessionCookie: () => appendSetCookie(res, buildClearCookie()),
  };

  try {
    const result = await graphql({
      schema,
      source: query,
      rootValue,
      variableValues: variables,
      contextValue: context,
    });
    sendJson(res, 200, result);
  } catch (err) {
    console.error("GraphQL execution error:", err);
    sendJson(res, 500, { error: "GraphQL execution failed" });
  }
}
