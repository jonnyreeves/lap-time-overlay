import {
  type ImportedSessionData,
  type ImportedSessionDriver,
  type ImportedSessionFormat,
  type ImportedSessionLap,
  SessionImportError,
  type UrlImportProvider,
  type UrlImportProviderMatch,
} from "../types.js";
import { extractAlphaTimingSessionUrl } from "../../shared/alphaTimingUrl.js";

const ALLOWED_HOST = "results.alphatiming.co.uk";
const SESSION_PATH_RE =
  /^\/([a-z0-9-]+)\/e\/([0-9]+)\/s\/([0-9]+)(?:\/(result|laptimes))?\/?$/i;
const BEST_LAP_RE = /best\s+lap\s+([0-9:.]+)/i;
const START_TIME_RE = /start\s+(\d{1,2}:\d{2})/i;
const TEXT_DATE_RE = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/;
const RESULT_SECTION_RE = /Pos[\s\S]*?Ultimate([\s\S]*?)(?:Notifications|Loading|©|$)/i;
const RESULT_ROW_RE =
  /(\d+)\s+((?:\d+\s+)+)([A-Za-z][A-Za-z0-9.' -]+?)\s+(\d+)\s+\d{1,2}:\d{2}\.\d{3}\s+\d+(?:\.\d+)?\s+MPH(?:\s+\d+(?:\.\d+)?)?\s+(\d+(?:\.\d+)?)\s+(\d+)\s+\d+\.\d+\s+\d+\.\d+\s+\d+\.\d+\s+\d+\.\d+/g;
const LAP_TIME_PATTERN = "(\\d+:\\d{2}\\.\\d{3}|\\d+\\.\\d{3}|\\d+:\\d{2}:\\d{3})";
const FETCH_TIMEOUT_MS = 12_000;
const FETCH_MAX_CHARS = 2_500_000;
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const MONTH_INDEX: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

type ResultDriverRow = {
  name: string;
  classification: number | null;
  kartNumber: string | null;
  bestLapSeconds: number;
  bestLapNumber: number;
};

function padTwo(value: number): string {
  return value.toString().padStart(2, "0");
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeNameKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'");
}

function stripTags(raw: string): string {
  return raw.replace(/<[^>]+>/g, " ");
}

function stripHtmlToText(raw: string): string {
  const withoutScripts = raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const withBreaks = withoutScripts
    .replace(/<\/(p|div|tr|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
  const withoutTags = withBreaks.replace(/<[^>]+>/g, " ");
  const decoded = decodeHtmlEntities(withoutTags);

  return decoded
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function parseSessionFormat(text: string): ImportedSessionFormat | null {
  const lower = text.toLowerCase();
  if (lower.includes("practice")) return "Practice";
  if (lower.includes("qualifying")) return "Qualifying";
  if (lower.includes("race")) return "Race";
  return null;
}

function parseSessionDate(text: string): string | null {
  const match = text.match(TEXT_DATE_RE);
  if (!match) return null;

  const day = Number.parseInt(match[1], 10);
  const monthName = match[2].toLowerCase();
  const year = Number.parseInt(match[3], 10);
  const month = MONTH_INDEX[monthName];
  if (!Number.isInteger(day) || !Number.isInteger(year) || !month) return null;
  if (day < 1 || day > 31) return null;

  return `${year.toString().padStart(4, "0")}-${padTwo(month)}-${padTwo(day)}`;
}

function parseSessionTime(text: string): string | null {
  const match = text.match(START_TIME_RE);
  if (!match) return null;
  const [hoursRaw, minutesRaw] = match[1].split(":");
  const hours = Number.parseInt(hoursRaw, 10);
  const minutes = Number.parseInt(minutesRaw, 10);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${padTwo(hours)}:${padTwo(minutes)}`;
}

function parseLapTimeString(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const colonCount = (trimmed.match(/:/g) ?? []).length;
  if (colonCount === 2) {
    const [minutesRaw, secondsRaw, millisRaw] = trimmed.split(":");
    const minutes = Number(minutesRaw);
    const seconds = Number(secondsRaw);
    const millis = Number(millisRaw);
    if (![minutes, seconds, millis].every(Number.isFinite)) return null;
    const total = minutes * 60 + seconds + millis / 1000;
    return total > 0 ? total : null;
  }
  if (colonCount === 1) {
    const [minutesRaw, secondsRaw] = trimmed.split(":");
    const minutes = Number(minutesRaw);
    const seconds = Number(secondsRaw);
    if (![minutes, seconds].every(Number.isFinite)) return null;
    const total = minutes * 60 + seconds;
    return total > 0 ? total : null;
  }

  const seconds = Number(trimmed);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return seconds;
}

function formatLapTimeSeconds(durationSeconds: number): string {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return "";
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds - minutes * 60;
  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(3).padStart(6, "0")}`;
  }
  return seconds.toFixed(3);
}

function parseSessionFastestLap(text: string): number | null {
  const match = text.match(BEST_LAP_RE);
  if (!match) return null;
  return parseLapTimeString(match[1]);
}

function parseKartNumberFromNoColumn(value: string): string | null {
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;
  return tokens[tokens.length - 1] ?? null;
}

function parseResultRows(resultText: string): ResultDriverRow[] {
  const sectionMatch = resultText.match(RESULT_SECTION_RE);
  if (!sectionMatch) return [];

  const section = normalizeWhitespace(sectionMatch[1]);
  if (!section) return [];

  const rows: ResultDriverRow[] = [];
  const seen = new Set<string>();
  for (const match of section.matchAll(RESULT_ROW_RE)) {
    const classification = Number.parseInt(match[1], 10);
    const noColumnRaw = match[2];
    const name = normalizeWhitespace(match[3]);
    const bestLapSeconds = parseLapTimeString(match[5]);
    const bestLapNumber = Number.parseInt(match[6], 10);

    if (!name || seen.has(name)) continue;
    if (!Number.isInteger(classification) || classification < 1) continue;
    if (bestLapSeconds == null || bestLapSeconds <= 0) continue;

    rows.push({
      name,
      classification,
      kartNumber: parseKartNumberFromNoColumn(noColumnRaw),
      bestLapSeconds,
      bestLapNumber: Number.isInteger(bestLapNumber) && bestLapNumber > 0 ? bestLapNumber : 1,
    });
    seen.add(name);
  }

  return rows;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function addLap(
  lapsByDriver: Map<string, ImportedSessionLap[]>,
  driverName: string,
  lapNumber: number,
  timeSeconds: number
) {
  if (!Number.isInteger(lapNumber) || lapNumber < 1) return;
  if (!Number.isFinite(timeSeconds) || timeSeconds <= 0) return;
  const current = lapsByDriver.get(driverName) ?? [];
  if (current.some((lap) => lap.lapNumber === lapNumber)) {
    return;
  }
  current.push({
    lapNumber,
    timeSeconds,
    displayTime: formatLapTimeSeconds(timeSeconds),
  });
  lapsByDriver.set(driverName, current);
}

function parseLaptimesByDriver(
  laptimesHtml: string,
  laptimesText: string,
  resultRows: ResultDriverRow[]
): Map<string, ImportedSessionLap[]> {
  const lapsByDriver = parseLaptimesTableFromHtml(laptimesHtml, resultRows);
  const lines = laptimesText
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  for (const driver of resultRows) {
    if ((lapsByDriver.get(driver.name)?.length ?? 0) > 0) {
      continue;
    }
    const escapedName = escapeRegExp(driver.name);
    const nameFirst = new RegExp(`${escapedName}\\s+(\\d+)\\s+${LAP_TIME_PATTERN}`, "i");
    const lapFirst = new RegExp(`(\\d+)\\s+${escapedName}\\s+${LAP_TIME_PATTERN}`, "i");

    for (const line of lines) {
      let match = line.match(nameFirst);
      if (!match) {
        match = line.match(lapFirst);
      }
      if (!match) continue;

      const lapNumber = Number.parseInt(match[1], 10);
      const timeSeconds = parseLapTimeString(match[2] ?? "");
      if (timeSeconds == null) continue;
      addLap(lapsByDriver, driver.name, lapNumber, timeSeconds);
    }
  }

  for (const driver of resultRows) {
    if ((lapsByDriver.get(driver.name)?.length ?? 0) > 0) {
      continue;
    }
    const existing = lapsByDriver.get(driver.name);
    if (existing && existing.length > 0) continue;

    const nameIndex = lines.findIndex((line) => line.toLowerCase().includes(driver.name.toLowerCase()));
    if (nameIndex === -1) continue;

    for (let idx = nameIndex + 1; idx < Math.min(lines.length, nameIndex + 80); idx += 1) {
      const line = lines[idx] ?? "";
      if (!line) continue;
      if (
        resultRows.some(
          (candidate) =>
            candidate.name !== driver.name &&
            line.toLowerCase().includes(candidate.name.toLowerCase())
        )
      ) {
        break;
      }
      const blockRow = line.match(new RegExp(`^(\\d+)\\s+${LAP_TIME_PATTERN}$`, "i"));
      if (!blockRow) continue;
      const lapNumber = Number.parseInt(blockRow[1], 10);
      const timeSeconds = parseLapTimeString(blockRow[2] ?? "");
      if (timeSeconds == null) continue;
      addLap(lapsByDriver, driver.name, lapNumber, timeSeconds);
    }
  }

  for (const [driverName, laps] of lapsByDriver.entries()) {
    laps.sort((a, b) => a.lapNumber - b.lapNumber);
    lapsByDriver.set(driverName, laps);
  }

  return lapsByDriver;
}

function extractDriverNameFromLegendCell(cellHtml: string): string | null {
  const spanMatches = [...cellHtml.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)];
  const candidates = spanMatches
    .map((match) => normalizeWhitespace(decodeHtmlEntities(stripTags(match[1] ?? ""))))
    .filter(Boolean);

  for (let idx = candidates.length - 1; idx >= 0; idx -= 1) {
    const candidate = candidates[idx];
    if (/[a-z]/i.test(candidate)) {
      return candidate;
    }
  }

  const fallback = normalizeWhitespace(decodeHtmlEntities(stripTags(cellHtml)));
  return /[a-z]/i.test(fallback) ? fallback : null;
}

function extractLapTimeFromCell(cellHtml: string): string | null {
  const text = normalizeWhitespace(decodeHtmlEntities(stripTags(cellHtml)));
  if (!text) return null;
  const match = text.match(/(\d+:\d{2}\.\d{3}|\d+\.\d{3}|\d+:\d{2}:\d{3})/);
  return match?.[1] ?? null;
}

function parseLaptimesTableFromHtml(
  laptimesHtml: string,
  resultRows: ResultDriverRow[]
): Map<string, ImportedSessionLap[]> {
  const resultNameByKey = new Map<string, string>();
  resultRows.forEach((row) => {
    resultNameByKey.set(normalizeNameKey(row.name), row.name);
  });

  const lapsByDriver = new Map<string, ImportedSessionLap[]>();
  const tableMatch = laptimesHtml.match(
    /<table[^>]*class="[^"]*at-lap-chart-legend-table[^"]*"[^>]*>([\s\S]*?)<\/table>/i
  );
  if (!tableMatch) return lapsByDriver;

  const tbodyMatch = tableMatch[1]?.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  const tableBody = tbodyMatch?.[1] ?? tableMatch[1] ?? "";
  if (!tableBody) return lapsByDriver;

  for (const rowMatch of tableBody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const rowHtml = rowMatch[1] ?? "";
    if (!rowHtml) continue;

    const firstCell = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/i)?.[1] ?? "";
    const parsedName = extractDriverNameFromLegendCell(firstCell);
    if (!parsedName) continue;

    const canonicalName =
      resultNameByKey.get(normalizeNameKey(parsedName)) ?? parsedName;
    let lapNumber = 0;
    for (const lapCell of rowHtml.matchAll(
      /<td[^>]*class="[^"]*at-lap-chart-legend-table-laptime[^"]*"[^>]*>([\s\S]*?)<\/td>/gi
    )) {
      lapNumber += 1;
      const lapText = extractLapTimeFromCell(lapCell[1] ?? "");
      if (!lapText) continue;
      const lapSeconds = parseLapTimeString(lapText);
      if (lapSeconds == null) continue;
      addLap(lapsByDriver, canonicalName, lapNumber, lapSeconds);
    }
  }

  for (const [name, laps] of lapsByDriver.entries()) {
    laps.sort((a, b) => a.lapNumber - b.lapNumber);
    lapsByDriver.set(name, laps);
  }

  return lapsByDriver;
}

function buildResultDrivers(
  resultRows: ResultDriverRow[],
  lapsByDriver: Map<string, ImportedSessionLap[]>
): ImportedSessionDriver[] {
  return resultRows.map((driver) => {
    const laps = lapsByDriver.get(driver.name);
    if (laps && laps.length > 0) {
      return {
        name: driver.name,
        classification: driver.classification,
        kartNumber: driver.kartNumber,
        laps,
      };
    }

    return {
      name: driver.name,
      classification: driver.classification,
      kartNumber: driver.kartNumber,
      laps: [
        {
          lapNumber: driver.bestLapNumber,
          timeSeconds: driver.bestLapSeconds,
          displayTime: formatLapTimeSeconds(driver.bestLapSeconds),
        },
      ],
    };
  });
}

function normalizeAlphaTimingSource(source: string): string | null {
  const extractedSource = extractAlphaTimingSessionUrl(source);
  if (!extractedSource) return null;
  let parsed: URL;
  try {
    parsed = new URL(extractedSource);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  if (parsed.hostname.toLowerCase() !== ALLOWED_HOST) return null;
  const pathMatch = parsed.pathname.match(SESSION_PATH_RE);
  if (!pathMatch) return null;

  const venue = pathMatch[1];
  const eventId = pathMatch[2];
  const sessionId = pathMatch[3];
  return `${parsed.origin}/${venue}/e/${eventId}/s/${sessionId}`;
}

function splitSetCookieHeader(value: string): string[] {
  return value
    .split(/,(?=[^;=,\s]+=[^;=,]+)/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getSetCookieValues(response: Response): string[] {
  const headers = response.headers as unknown as {
    getSetCookie?: () => string[];
    get?: (name: string) => string | null;
  };
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }
  const joined = typeof headers.get === "function" ? headers.get("set-cookie") : null;
  return joined ? splitSetCookieHeader(joined) : [];
}

function mergeCookies(cookieJar: Map<string, string>, setCookies: string[]) {
  for (const setCookie of setCookies) {
    const firstPart = setCookie.split(";")[0]?.trim();
    if (!firstPart) continue;
    const separatorIndex = firstPart.indexOf("=");
    if (separatorIndex <= 0) continue;
    const name = firstPart.slice(0, separatorIndex).trim();
    const value = firstPart.slice(separatorIndex + 1).trim();
    if (!name) continue;
    cookieJar.set(name, value);
  }
}

function buildCookieHeader(cookieJar: Map<string, string>): string | null {
  if (cookieJar.size === 0) return null;
  return Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function buildRequestHeaders(
  cookieJar: Map<string, string>,
  referer?: string
): Record<string, string> {
  const cookieHeader = buildCookieHeader(cookieJar);
  return {
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
    "User-Agent": BROWSER_USER_AGENT,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "Upgrade-Insecure-Requests": "1",
    ...(referer ? { Referer: referer } : {}),
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  };
}

async function fetchPageWithState(
  url: string,
  state: { cookieJar: Map<string, string> },
  referer?: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: buildRequestHeaders(state.cookieJar, referer),
    });
  } catch (error) {
    throw new SessionImportError(`Unable to fetch ${url}: ${String(error)}`, "FETCH_FAILED");
  } finally {
    clearTimeout(timeout);
  }

  const resolved = new URL(response.url);
  if (resolved.hostname.toLowerCase() !== ALLOWED_HOST || resolved.protocol !== "https:") {
    throw new SessionImportError("Unexpected redirect while fetching session data", "FETCH_FAILED");
  }

  if (!response.ok) {
    throw new SessionImportError(`Failed to fetch Alpha Timing page (${response.status})`, "FETCH_FAILED");
  }
  mergeCookies(state.cookieJar, getSetCookieValues(response));

  const body = await response.text();
  if (body.length > FETCH_MAX_CHARS) {
    throw new SessionImportError("Fetched page was unexpectedly large", "FETCH_FAILED");
  }
  if (/not authorised to access this page/i.test(body)) {
    throw new SessionImportError("Alpha Timing URL requires authentication", "AUTH_REQUIRED");
  }
  return body;
}

async function primeSessionCookies(baseSessionUrl: string, cookieJar: Map<string, string>) {
  const origin = new URL(baseSessionUrl).origin;
  await fetchPageWithState(`${origin}/`, { cookieJar });
  await fetchPageWithState(baseSessionUrl, { cookieJar }, `${origin}/`);
}

async function importAlphaTimingSession(match: UrlImportProviderMatch): Promise<ImportedSessionData> {
  const cookieJar = new Map<string, string>();
  await primeSessionCookies(match.normalizedSource, cookieJar);

  const resultUrl = `${match.normalizedSource}/result`;
  const laptimesUrl = `${match.normalizedSource}/laptimes`;
  const resultHtml = await fetchPageWithState(resultUrl, { cookieJar }, match.normalizedSource);
  const laptimesHtml = await fetchPageWithState(laptimesUrl, { cookieJar }, resultUrl);
  if (/not authorised to access this page/i.test(resultHtml) || /not authorised to access this page/i.test(laptimesHtml)) {
    throw new SessionImportError("Alpha Timing URL requires authentication", "AUTH_REQUIRED");
  }

  const resultText = stripHtmlToText(resultHtml);
  const laptimesText = stripHtmlToText(laptimesHtml);
  const resultRows = parseResultRows(resultText);
  if (resultRows.length === 0) {
    throw new SessionImportError("Unable to parse session standings from Alpha Timing", "PARSE_FAILED");
  }

  const lapsByDriver = parseLaptimesByDriver(laptimesHtml, laptimesText, resultRows);
  const drivers = buildResultDrivers(resultRows, lapsByDriver);

  return {
    provider: "alphatiming",
    sessionFormat: parseSessionFormat(resultText),
    sessionDate: parseSessionDate(resultText),
    sessionTime: parseSessionTime(resultText),
    classification: null,
    sessionFastestLapSeconds: parseSessionFastestLap(resultText),
    kartNumber: null,
    trackLayoutName: null,
    selfDriverName: null,
    kartTypeName: null,
    laps: [],
    drivers,
  };
}

export const alphaTimingUrlProvider: UrlImportProvider = {
  id: "alphatiming",
  canHandle: (source) => {
    const normalizedSource = normalizeAlphaTimingSource(source);
    if (!normalizedSource) return null;
    return { normalizedSource };
  },
  importFromUrl: importAlphaTimingSession,
};
