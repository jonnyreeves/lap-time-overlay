const ALPHA_TIMING_HOST = "results.alphatiming.co.uk";
const ALPHA_TIMING_SESSION_PATH_RE =
  /^\/[a-z0-9-]+\/e\/\d+\/s\/\d+(?:\/(result|laptimes))?\/?$/i;
const ALPHA_TIMING_URL_IN_TEXT_RE = /https?:\/\/results\.alphatiming\.co\.uk\/[^\s"'<>]+/gi;
const ALPHA_TIMING_URL_COMPACT_RE =
  /https?:\/\/results\.alphatiming\.co\.uk\/[a-z0-9-]+\/e\/\d+\/s\/\d+(?:\/(?:result|laptimes))?\/?/i;

function stripUrlBoundaryPunctuation(input: string): string {
  return input
    .trim()
    .replace(/^[("'`<[{]+/, "")
    .replace(/[)"'`>\]},.;:!?]+$/, "");
}

function normalizeAlphaTimingCandidate(input: string): string | null {
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
  if (!ALPHA_TIMING_SESSION_PATH_RE.test(parsed.pathname)) return null;

  return `https://${ALPHA_TIMING_HOST}${parsed.pathname}`;
}

export function extractAlphaTimingSessionUrl(source: string | null | undefined): string | null {
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

export function isAlphaTimingSessionUrlSource(source: string | null | undefined): boolean {
  return extractAlphaTimingSessionUrl(source) != null;
}
