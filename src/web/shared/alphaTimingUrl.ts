const ALPHA_TIMING_HOST = "results.alphatiming.co.uk";
const ALPHA_TIMING_EVENT_PATH_RE = /^\/([a-z0-9-]+)\/e\/(\d+)\/?$/i;
const ALPHA_TIMING_SESSION_PATH_RE =
  /^\/([a-z0-9-]+)\/e\/(\d+)\/s\/(\d+)(?:\/(?:result|laptimes))?\/?$/i;
const ALPHA_TIMING_URL_IN_TEXT_RE = /https?:\/\/results\.alphatiming\.co\.uk\/[^\s"'<>]+/gi;
const ALPHA_TIMING_URL_COMPACT_RE =
  /https?:\/\/results\.alphatiming\.co\.uk\/[a-z0-9-]+\/e\/\d+(?:\/s\/\d+(?:\/(?:result|laptimes))?)?\/?/i;

export type AlphaTimingImportSource =
  | {
      kind: "event";
      normalizedSource: string;
      venue: string;
      eventId: string;
    }
  | {
      kind: "session";
      normalizedSource: string;
      venue: string;
      eventId: string;
      sessionId: string;
    };

function stripUrlBoundaryPunctuation(input: string): string {
  return input
    .trim()
    .replace(/^[("'`<[{]+/, "")
    .replace(/[)"'`>\]},.;:!?]+$/, "");
}

function normalizeAlphaTimingCandidate(input: string): AlphaTimingImportSource | null {
  const candidate = stripUrlBoundaryPunctuation(input).replace(/\s+/g, "");
  if (!candidate) return null;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  if (parsed.hostname.toLowerCase() !== ALPHA_TIMING_HOST) return null;
  const eventMatch = parsed.pathname.match(ALPHA_TIMING_EVENT_PATH_RE);
  if (eventMatch) {
    const venue = eventMatch[1] ?? "";
    const eventId = eventMatch[2] ?? "";
    return {
      kind: "event",
      normalizedSource: `https://${ALPHA_TIMING_HOST}/${venue}/e/${eventId}`,
      venue,
      eventId,
    };
  }

  const sessionMatch = parsed.pathname.match(ALPHA_TIMING_SESSION_PATH_RE);
  if (!sessionMatch) return null;

  const venue = sessionMatch[1] ?? "";
  const eventId = sessionMatch[2] ?? "";
  const sessionId = sessionMatch[3] ?? "";
  return {
    kind: "session",
    normalizedSource: `https://${ALPHA_TIMING_HOST}/${venue}/e/${eventId}/s/${sessionId}`,
    venue,
    eventId,
    sessionId,
  };
}

export function extractAlphaTimingImportSource(
  source: string | null | undefined
): AlphaTimingImportSource | null {
  const raw = source?.trim() ?? "";
  if (!raw) return null;

  const direct = normalizeAlphaTimingCandidate(raw);
  if (direct) return direct;

  for (const match of raw.matchAll(ALPHA_TIMING_URL_IN_TEXT_RE)) {
    const candidate = normalizeAlphaTimingCandidate(match[0]);
    if (candidate) return candidate;
  }

  const compactSource = raw.replace(/\s+/g, "");
  const compactMatch = compactSource.match(ALPHA_TIMING_URL_COMPACT_RE);
  if (!compactMatch) return null;
  return normalizeAlphaTimingCandidate(compactMatch[0]);
}

export function extractAlphaTimingSessionUrl(source: string | null | undefined): string | null {
  const extracted = extractAlphaTimingImportSource(source);
  return extracted?.kind === "session" ? extracted.normalizedSource : null;
}

export function isAlphaTimingImportSource(source: string | null | undefined): boolean {
  return extractAlphaTimingImportSource(source) != null;
}

export function isAlphaTimingSessionUrlSource(source: string | null | undefined): boolean {
  const extracted = extractAlphaTimingImportSource(source);
  return extracted?.kind === "session";
}
