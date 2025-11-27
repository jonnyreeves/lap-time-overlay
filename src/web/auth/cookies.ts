import type http from "node:http";

export const SESSION_COOKIE_NAME = "session_id";

interface CookieOptions {
  httpOnly?: boolean;
  maxAgeSeconds?: number;
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
}

export function parseCookies(
  header: string | undefined | null
): Record<string, string> {
  if (!header) return {};
  const pairs = header.split(";").map((part) => part.trim());
  const out: Record<string, string> = {};
  for (const pair of pairs) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const key = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}

export function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions
): string {
  const attrs = [`${name}=${value}`];
  attrs.push(`Path=${options.path ?? "/"}`);
  if (options.httpOnly) attrs.push("HttpOnly");
  if (options.sameSite) attrs.push(`SameSite=${options.sameSite}`);
  if (options.secure) attrs.push("Secure");
  if (typeof options.maxAgeSeconds === "number") {
    attrs.push(`Max-Age=${Math.max(0, Math.floor(options.maxAgeSeconds))}`);
  }
  return attrs.join("; ");
}

export function appendSetCookie(
  res: http.ServerResponse,
  cookie: string
): void {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", cookie);
    return;
  }
  if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing, cookie]);
    return;
  }
  res.setHeader("Set-Cookie", [existing.toString(), cookie]);
}

export function buildSessionCookie(token: string, expiresAt: number): string {
  const maxAgeSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  return serializeCookie(SESSION_COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    maxAgeSeconds,
  });
}

export function clearSessionCookie(): string {
  return serializeCookie(SESSION_COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    maxAgeSeconds: 0,
  });
}
