import {
  type DaytonaClubspeedCredentials,
  type DaytonaClubspeedSessionSummary,
  type ImportedSessionData,
  type ImportedSessionDriver,
  type ImportedSessionFormat,
  type ImportedSessionLap,
  SessionImportError,
} from "../types.js";

const CLUBSPEED_HOST = "daytonasp.clubspeedtiming.com";
const SIGN_IN_PATH = "/sp_center/SignIn.aspx";
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 12_000;
const FETCH_MAX_CHARS = 2_500_000;

type DaytonaHistoryRow = DaytonaClubspeedSessionSummary & {
  heatId: string;
  topTimeSeconds: number | null;
};

type DaytonaHeatDriver = ImportedSessionDriver;
type DaytonaSessionState = {
  cookieJar: Map<string, string>;
  historyUrl: string;
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
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

function parseOrdinal(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const match = raw.match(/(\d+)(?:st|nd|rd|th)?/i);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseLapTimeString(value: string | null | undefined): number | null {
  const trimmed = value?.trim() ?? "";
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
  referer?: string,
  extraHeaders?: Record<string, string>
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
    ...extraHeaders,
  };
}

async function fetchHtml(
  url: string,
  options: {
    cookieJar: Map<string, string>;
    method?: "GET" | "POST";
    body?: URLSearchParams;
    referer?: string;
    redirect?: RequestRedirect;
  }
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: options.method ?? "GET",
      redirect: options.redirect ?? "follow",
      signal: controller.signal,
      headers: buildRequestHeaders(
        options.cookieJar,
        options.referer,
        options.body ? { "Content-Type": "application/x-www-form-urlencoded" } : undefined
      ),
      body: options.body?.toString(),
    });
  } catch (error) {
    throw new SessionImportError(`Unable to fetch ${url}: ${String(error)}`, "FETCH_FAILED");
  } finally {
    clearTimeout(timeout);
  }
}

async function readHtmlBody(response: Response, message: string): Promise<string> {
  if (!response.ok) {
    throw new SessionImportError(`${message} (${response.status})`, "FETCH_FAILED");
  }
  const body = await response.text();
  if (body.length > FETCH_MAX_CHARS) {
    throw new SessionImportError("Fetched page was unexpectedly large", "FETCH_FAILED");
  }
  return body;
}

function assertTrustedResponseUrl(response: Response) {
  const resolved = new URL(response.url);
  if (resolved.protocol !== "https:" || resolved.hostname.toLowerCase() !== CLUBSPEED_HOST) {
    throw new SessionImportError("Unexpected redirect while fetching Club Speed data", "FETCH_FAILED");
  }
}

function parseHiddenInput(html: string, id: string): string {
  const match = html.match(new RegExp(`id="${id}" value="([^"]*)"`, "i"));
  if (!match?.[1]) {
    throw new SessionImportError(`Missing ${id} from Club Speed login page`, "PARSE_FAILED");
  }
  return decodeHtmlEntities(match[1]);
}

async function loginToDaytonaClubspeed(
  credentials: DaytonaClubspeedCredentials
): Promise<DaytonaSessionState> {
  const cookieJar = new Map<string, string>();
  const signInUrl = `https://${CLUBSPEED_HOST}${SIGN_IN_PATH}`;
  const signInResponse = await fetchHtml(signInUrl, { cookieJar });
  assertTrustedResponseUrl(signInResponse);
  mergeCookies(cookieJar, getSetCookieValues(signInResponse));
  const signInHtml = await readHtmlBody(signInResponse, "Failed to fetch Club Speed login page");

  const body = new URLSearchParams();
  body.set("__VIEWSTATE", parseHiddenInput(signInHtml, "__VIEWSTATE"));
  body.set("__VIEWSTATEGENERATOR", parseHiddenInput(signInHtml, "__VIEWSTATEGENERATOR"));
  body.set("__EVENTVALIDATION", parseHiddenInput(signInHtml, "__EVENTVALIDATION"));
  body.set("tbxUserName", credentials.username);
  body.set("tbxPassword", credentials.password);
  body.set("btnSubmit", "Submit");

  const loginResponse = await fetchHtml(signInUrl, {
    cookieJar,
    method: "POST",
    body,
    referer: signInUrl,
    redirect: "manual",
  });
  mergeCookies(cookieJar, getSetCookieValues(loginResponse));

  const location = loginResponse.headers.get("location");
  if (loginResponse.status !== 302 || !location || !cookieJar.get(".ASPXAUTH")) {
    throw new SessionImportError("Invalid Daytona Club Speed credentials", "INVALID_CREDENTIALS");
  }

  const historyUrl = new URL(location, signInUrl);
  if (historyUrl.protocol !== "https:" || historyUrl.hostname.toLowerCase() !== CLUBSPEED_HOST) {
    throw new SessionImportError("Unexpected redirect after Daytona Club Speed login", "FETCH_FAILED");
  }

  return {
    cookieJar,
    historyUrl: historyUrl.toString(),
  };
}

function parseHistoryDate(raw: string): { date: string | null; time: string | null } {
  const match = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (!match) {
    return { date: null, time: null };
  }
  const day = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const year = Number.parseInt(match[3], 10);
  const hours = Number.parseInt(match[4], 10);
  const minutes = Number.parseInt(match[5], 10);
  if (![day, month, year, hours, minutes].every(Number.isFinite)) {
    return { date: null, time: null };
  }
  const pad = (value: number) => value.toString().padStart(2, "0");
  return {
    date: `${year.toString().padStart(4, "0")}-${pad(month)}-${pad(day)}`,
    time: `${pad(hours)}:${pad(minutes)}`,
  };
}

function encodeHeatSelectionToken(row: DaytonaHistoryRow): string {
  const parts = [
    row.heatId,
    row.sessionDate ?? "",
    row.sessionTime ?? "",
    row.kartNumber ?? "",
    row.classification?.toString() ?? "",
    row.topTimeSeconds != null ? row.topTimeSeconds.toFixed(3) : "",
  ];
  return parts.map((part) => encodeURIComponent(part)).join("|");
}

function parseHeatSelectionToken(token: string): {
  heatId: string;
  sessionDate: string | null;
  sessionTime: string | null;
  kartNumber: string | null;
  classification: number | null;
  topTimeSeconds: number | null;
} {
  const [heatIdRaw, dateRaw, timeRaw, kartRaw, classificationRaw, topTimeRaw] = token
    .split("|")
    .map((part) => decodeURIComponent(part ?? ""));
  const classification = parseOrdinal(classificationRaw);
  const topTimeSeconds = parseLapTimeString(topTimeRaw);
  return {
    heatId: heatIdRaw,
    sessionDate: dateRaw || null,
    sessionTime: timeRaw || null,
    kartNumber: kartRaw || null,
    classification,
    topTimeSeconds,
  };
}

function parseHistoryRows(historyHtml: string): DaytonaHistoryRow[] {
  const rows: DaytonaHistoryRow[] = [];
  for (const match of historyHtml.matchAll(/<tr class="Normal"[\s\S]*?>([\s\S]*?)<\/tr>/gi)) {
    const rowHtml = match[1] ?? "";
    const heatMatch = rowHtml.match(/HeatDetails\.aspx\?HeatNo=(\d+)/i);
    if (!heatMatch?.[1]) continue;

    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) =>
      normalizeWhitespace(decodeHtmlEntities(stripTags(cell[1] ?? "")))
    );
    if (cells.length < 5) continue;

    const activityType = cells[0] ?? "";
    const { date: sessionDate, time: sessionTime } = parseHistoryDate(cells[1] ?? "");
    const topTimeSeconds = parseLapTimeString(cells[3] ?? "");
    const classification = parseOrdinal(cells[4] ?? "");
    const kartMatch = activityType.match(/\bKart\s+([A-Za-z0-9-]+)\b/i);
    const heatId = heatMatch[1];
    const row: DaytonaHistoryRow = {
      heatNo: heatId,
      heatId,
      activityType,
      sessionDate,
      sessionTime,
      kartNumber: kartMatch?.[1] ?? null,
      classification,
      topTimeSeconds,
    };
    row.heatNo = encodeHeatSelectionToken(row);
    rows.push(row);
  }
  return rows;
}

function parseDateTimeValue(date: string | null, time: string | null): number | null {
  if (!date || !time) return null;
  const timestamp = Date.parse(`${date}T${time}:00`);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function inferSessionFormat(
  activityType: string,
  sessionDate: string | null,
  sessionTime: string | null,
  rows: DaytonaHistoryRow[],
  index: number
): ImportedSessionFormat {
  const upper = activityType.toUpperCase();
  if (upper.includes("RACE")) return "Race";
  if (upper.includes("PRACTICE")) return "Practice";

  const currentTimestamp = parseDateTimeValue(sessionDate, sessionTime);
  if (currentTimestamp != null) {
    for (let previousIndex = index - 1; previousIndex >= 0; previousIndex -= 1) {
      const nextSession = rows[previousIndex];
      if (nextSession.sessionDate !== sessionDate) continue;
      const nextSessionTimestamp = parseDateTimeValue(
        nextSession.sessionDate,
        nextSession.sessionTime
      );
      if (nextSessionTimestamp == null || nextSessionTimestamp <= currentTimestamp) continue;
      const deltaMinutes = (nextSessionTimestamp - currentTimestamp) / 60_000;
      if (deltaMinutes > 0 && deltaMinutes < 12) {
        return "Qualifying";
      }
      break;
    }
  }

  return "Practice";
}

function inferKartTypeName(activityType: string): string | null {
  const withoutKart = activityType.replace(/\s*-\s*Kart\s+[A-Za-z0-9-]+\s*$/i, "").trim();
  if (!withoutKart) return null;

  const keywordMatch = withoutKart.match(/\b(DMAX|Sodi)\b/i);
  if (keywordMatch?.[1]) {
    return keywordMatch[1].toUpperCase() === "SODI" ? "Sodi" : keywordMatch[1].toUpperCase();
  }

  const cutoffMatch = withoutKart.match(/\b(Race|Practice|Qualifying|Sprint|Session)\b/i);
  const cutoffIndex = cutoffMatch?.index;
  if (cutoffIndex != null && cutoffIndex > 0) {
    return normalizeWhitespace(withoutKart.slice(0, cutoffIndex)).replace(/\s+/g, " ") || null;
  }

  const firstToken = withoutKart.split(/\s+/).find(Boolean);
  return firstToken ?? null;
}

async function fetchHistoryHtml(state: DaytonaSessionState): Promise<string> {
  const url = state.historyUrl;
  const response = await fetchHtml(url, {
    cookieJar: state.cookieJar,
    referer: `https://${CLUBSPEED_HOST}${SIGN_IN_PATH}`,
  });
  assertTrustedResponseUrl(response);
  mergeCookies(state.cookieJar, getSetCookieValues(response));
  return readHtmlBody(response, "Failed to fetch Daytona Club Speed history");
}

function parseWinnerPosition(raw: string): number | null {
  const normalized = normalizeWhitespace(raw);
  if (/heat winner/i.test(normalized)) return 1;
  return parseOrdinal(normalized);
}

function parseDriverRows(detailHtml: string): Map<string, { classification: number | null; bestLap: number | null }> {
  const results = new Map<string, { classification: number | null; bestLap: number | null }>();
  for (const match of detailHtml.matchAll(
    /<tr class='Top3WinnersRow(?:Alt)?'><td class='Position' rowspan='3' colspan='2'>([\s\S]*?)<\/td>[\s\S]*?<td class='Racername' colspan='5'>[\s\S]*?<span><a [^>]+>([\s\S]*?)<\/a><\/span><\/td><\/tr>\s*<tr class='Top3WinnersRow(?:Alt)?'>[\s\S]*?<td class='BestLap'>Best Lap<span>([\s\S]*?)<\/span><\/td>/gi
  )) {
    const classification = parseWinnerPosition(
      normalizeWhitespace(decodeHtmlEntities(stripTags(match[1] ?? "")))
    );
    const driverName = normalizeWhitespace(decodeHtmlEntities(stripTags(match[2] ?? "")));
    const bestLap = parseLapTimeString(normalizeWhitespace(decodeHtmlEntities(stripTags(match[3] ?? ""))));
    if (driverName) {
      results.set(driverName, { classification, bestLap });
    }
  }

  for (const match of detailHtml.matchAll(/<tr class='RegularRow(?:Alt)?'>([\s\S]*?)<\/tr>/gi)) {
    const rowHtml = match[1] ?? "";
    const cells = [...rowHtml.matchAll(/<td[^>]*class='([^']+)'[^>]*>([\s\S]*?)<\/td>/gi)];
    const classification = parseOrdinal(
      normalizeWhitespace(
        decodeHtmlEntities(stripTags(cells.find(([, className]) => className === "Position")?.[2] ?? ""))
      )
    );
    const driverName = normalizeWhitespace(
      decodeHtmlEntities(stripTags(cells.find(([, className]) => className === "Racername")?.[2] ?? ""))
    );
    const bestLap = parseLapTimeString(
      normalizeWhitespace(
        decodeHtmlEntities(stripTags(cells.find(([, className]) => className === "BestLap")?.[2] ?? ""))
      )
    );
    if (driverName) {
      results.set(driverName, { classification, bestLap });
    }
  }
  return results;
}

function parseLapTables(detailHtml: string): DaytonaHeatDriver[] {
  const drivers: DaytonaHeatDriver[] = [];
  for (const tableMatch of detailHtml.matchAll(/<table class='LapTimes'>([\s\S]*?)<\/table>/gi)) {
    const tableHtml = tableMatch[1] ?? "";
    const name = normalizeWhitespace(
      decodeHtmlEntities(stripTags(tableHtml.match(/<th[^>]*>([\s\S]*?)<\/th>/i)?.[1] ?? ""))
    );
    if (!name) continue;

    const laps: ImportedSessionLap[] = [];
    for (const lapMatch of tableHtml.matchAll(/<tr class='LapTimesRow(?:Alt)?'><td>(\d+)<\/td><td>([\s\S]*?)<\/td><\/tr>/gi)) {
      const lapNumber = Number.parseInt(lapMatch[1], 10);
      const lapValue = normalizeWhitespace(decodeHtmlEntities(stripTags(lapMatch[2] ?? "")));
      const lapMatchResult = lapValue.match(/([0-9:.]+)(?:\s*\[(\d+)\])?/);
      const timeMatch = lapMatchResult?.[1] ?? null;
      const position = lapMatchResult?.[2] ?? null;
      const timeSeconds = parseLapTimeString(timeMatch);
      if (!Number.isInteger(lapNumber) || timeSeconds == null) continue;
      laps.push({
        lapNumber,
        timeSeconds,
        displayTime: formatLapTimeSeconds(timeSeconds),
        lapEvents: position ? [{ offset: timeSeconds, event: "position", value: position }] : [],
      });
    }

    drivers.push({
      name,
      classification: null,
      kartNumber: null,
      laps,
    });
  }
  return drivers;
}

function chooseSelfDriver(
  drivers: DaytonaHeatDriver[],
  summary: {
    classification: number | null;
    topTimeSeconds: number | null;
  }
): DaytonaHeatDriver | null {
  if (drivers.length === 0) return null;
  const summaryTopTime = summary.topTimeSeconds;
  const byClassification =
    summary.classification != null
      ? drivers.filter((driver) => driver.classification === summary.classification)
      : [];
  if (byClassification.length === 1) {
    return byClassification[0] ?? null;
  }
  if (byClassification.length > 1 && summaryTopTime != null) {
    const matched = byClassification.find((driver) => {
      const bestLap = driver.laps.reduce<number | null>((best, lap) => {
        if (best == null || lap.timeSeconds < best) return lap.timeSeconds;
        return best;
      }, null);
      return bestLap != null && Math.abs(bestLap - summaryTopTime) < 0.02;
    });
    if (matched) return matched;
  }
  if (summaryTopTime != null) {
    const matched = drivers.find((driver) => {
      const bestLap = driver.laps.reduce<number | null>((best, lap) => {
        if (best == null || lap.timeSeconds < best) return lap.timeSeconds;
        return best;
      }, null);
      return bestLap != null && Math.abs(bestLap - summaryTopTime) < 0.02;
    });
    if (matched) return matched;
  }
  return drivers[0] ?? null;
}

async function fetchHeatDetailsHtml(state: DaytonaSessionState, heatId: string): Promise<string> {
  const url = `https://${CLUBSPEED_HOST}/sp_center/HeatDetails.aspx?HeatNo=${encodeURIComponent(heatId)}`;
  const response = await fetchHtml(url, {
    cookieJar: state.cookieJar,
    referer: state.historyUrl,
  });
  assertTrustedResponseUrl(response);
  mergeCookies(state.cookieJar, getSetCookieValues(response));
  return readHtmlBody(response, "Failed to fetch Daytona Club Speed heat details");
}

function mapHeatToImportedSession(
  detailHtml: string,
  historyRows: DaytonaHistoryRow[],
  selectionToken: string
): ImportedSessionData {
  const selection = parseHeatSelectionToken(selectionToken);
  const summary =
    historyRows.find((row) => row.heatNo === selectionToken) ??
    historyRows.find((row) => row.heatId === selection.heatId);
  if (!summary) {
    throw new SessionImportError("Selected Daytona Club Speed session was not found", "PARSE_FAILED");
  }

  const driverRows = parseDriverRows(detailHtml);
  const drivers = parseLapTables(detailHtml).map((driver) => {
    const detailRow = driverRows.get(driver.name);
    return {
      ...driver,
      classification: detailRow?.classification ?? null,
    };
  });
  if (drivers.length === 0) {
    throw new SessionImportError("Unable to parse Daytona Club Speed lap times", "PARSE_FAILED");
  }

  const selfDriver =
    chooseSelfDriver(drivers, {
      classification: summary.classification,
      topTimeSeconds: summary.topTimeSeconds,
    }) ?? drivers[0];
  const sessionFastestLapSeconds = drivers.reduce<number | null>((best, driver) => {
    const driverBest = driver.laps.reduce<number | null>((lapBest, lap) => {
      if (lapBest == null || lap.timeSeconds < lapBest) return lap.timeSeconds;
      return lapBest;
    }, null);
    if (driverBest == null) return best;
    if (best == null || driverBest < best) return driverBest;
    return best;
  }, null);

  return {
    provider: "daytona",
    sessionFormat: inferSessionFormat(
      summary.activityType,
      summary.sessionDate,
      summary.sessionTime,
      historyRows,
      historyRows.findIndex((row) => row.heatNo === summary.heatNo)
    ),
    sessionDate: summary.sessionDate,
    sessionTime: summary.sessionTime,
    classification: selfDriver.classification ?? summary.classification,
    sessionFastestLapSeconds,
    kartNumber: summary.kartNumber,
    trackLayoutName: null,
    selfDriverName: selfDriver.name,
    kartTypeName: inferKartTypeName(summary.activityType),
    laps: selfDriver.laps,
    drivers,
  };
}

export async function fetchDaytonaClubspeedSessions(
  credentials: DaytonaClubspeedCredentials
): Promise<DaytonaClubspeedSessionSummary[]> {
  const state = await loginToDaytonaClubspeed(credentials);
  const historyHtml = await fetchHistoryHtml(state);
  const rows = parseHistoryRows(historyHtml);
  if (rows.length === 0) {
    throw new SessionImportError("No Daytona Club Speed sessions were found", "PARSE_FAILED");
  }

  return rows.map((row, index) => ({
    heatNo: row.heatNo,
    activityType: row.activityType,
    sessionDate: row.sessionDate,
    sessionTime: row.sessionTime,
    kartNumber: row.kartNumber,
    classification: row.classification,
  }));
}

export async function importDaytonaClubspeedSession(
  heatNo: string,
  credentials: DaytonaClubspeedCredentials
): Promise<ImportedSessionData> {
  const token = heatNo.trim();
  if (!token) {
    throw new SessionImportError("heatNo is required", "UNSUPPORTED_SOURCE");
  }
  const selection = parseHeatSelectionToken(token);
  if (!selection.heatId) {
    throw new SessionImportError("Invalid Daytona Club Speed session selection", "UNSUPPORTED_SOURCE");
  }

  const state = await loginToDaytonaClubspeed(credentials);
  const historyHtml = await fetchHistoryHtml(state);
  const rows = parseHistoryRows(historyHtml);
  const detailHtml = await fetchHeatDetailsHtml(state, selection.heatId);
  return mapHeatToImportedSession(detailHtml, rows, token);
}
