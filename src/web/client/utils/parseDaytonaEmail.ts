import { formatLapTimeSeconds, parseLapTimeString } from "./lapTime.js";
import { parseSessionFormat } from "./sessionImportShared.js";
import { type ParsedDaytonaEmail, type ParsedLap } from "./sessionImportTypes.js";

// Matches a single lap entry like `01 0:57:755 [11]` and can appear multiple times on a line.
const LAP_ENTRY_RE = /(\d+)\s+(\d+):(\d+):(\d+)\s+\[(\d+)\]/g;
const TIME_STARTED_RE = /time\s*started\s*(?::|\-)?\s*(.+)/i;
const FASTEST_DRIVER_RE = /fastest\s+driver\s+(.+)/i;
const RACE_POSITION_RE = /race\s+position\s*(?::|\-)?\s*(.*)/i;
const KART_NUMBER_RE = /kart\s*no\.?\s*(?::|\-)?\s*(.*)/i;

export function parseDaytonaEmail(text: string): ParsedDaytonaEmail {
  const lines = text.split(/\r?\n/);
  const { date: sessionDate, time: sessionTime } = parseTimeStarted(text);
  const racePosition = parseRacePosition(text);
  const kartNumber = parseKartNumber(text);
  let sessionFastestLapSeconds: number | null = null;

  const laps: ParsedLap[] = [];

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line || line.startsWith("#")) continue;

    if (sessionFastestLapSeconds == null) {
      const fastestMatch = line.match(FASTEST_DRIVER_RE);
      if (fastestMatch) {
        const fastestRaw = fastestMatch[1];
        const timeMatch = fastestRaw.match(/(\d+:\d{2}:\d{3})/);
        const parsedTime = timeMatch ? parseLapTimeString(timeMatch[1]) : null;
        if (parsedTime != null) {
          sessionFastestLapSeconds = parsedTime;
        }
      }
    }

    const matches = [...line.matchAll(LAP_ENTRY_RE)];
    if (!matches.length) continue;

    for (const m of matches) {
      const lapNum = parseInt(m[1], 10);
      const mm = parseInt(m[2], 10);
      const ss = parseInt(m[3], 10);
      const ms = parseInt(m[4], 10);
      const pos = parseInt(m[5], 10);

      if (![lapNum, mm, ss, ms, pos].every(Number.isFinite)) continue;

      const durationS = mm * 60 + ss + ms / 1000;
      laps.push({
        lapNumber: lapNum,
        timeSeconds: durationS,
        displayTime: formatLapTimeSeconds(durationS),
        lapEvents: [{ offset: 0, event: "position", value: String(pos) }],
      });
    }
  }

  laps.sort((a, b) => a.lapNumber - b.lapNumber);

  const finalPosition = racePosition ?? parseLastLapPosition(laps);

  return {
    provider: "daytona",
    sessionFormat: parseSessionFormat(text),
    sessionDate,
    sessionTime,
    classification: finalPosition,
    sessionFastestLapSeconds,
    kartNumber,
    laps,
  };
}

function parseRacePosition(text: string): number | null {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]?.trim();
    if (!line) continue;
    const match = line.match(RACE_POSITION_RE);
    if (!match) continue;

    const inlineValue = match[1]?.trim();
    const candidate = inlineValue || nextNonEmptyLine(lines, i + 1);
    const parsed = parseOrdinal(candidate);
    if (parsed != null) return parsed;
  }

  return null;
}

function parseKartNumber(text: string): string | null {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]?.trim();
    if (!line) continue;
    const match = line.match(KART_NUMBER_RE);
    if (!match) continue;

    const inlineValue = match[1]?.trim();
    const candidate = inlineValue || nextNonEmptyLine(lines, i + 1);
    const normalized = candidate.trim();
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function nextNonEmptyLine(lines: string[], startIndex: number): string {
  for (let i = startIndex; i < lines.length; i += 1) {
    const line = lines[i]?.trim();
    if (line) return line;
  }
  return "";
}

function parseOrdinal(raw: string): number | null {
  if (!raw) return null;
  const match = raw.match(/(\d+)(?:st|nd|rd|th)?/i);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseLastLapPosition(laps: ParsedLap[]): number | null {
  const lastLap = laps[laps.length - 1];
  const lastLapPosition = lastLap?.lapEvents?.find((event) => event.event === "position");
  if (!lastLapPosition) return null;
  const parsed = Number.parseInt(lastLapPosition.value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTimeStarted(text: string): { date: string | null; time: string | null } {
  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(TIME_STARTED_RE);
    if (!match) continue;

    const raw = match[1].trim();
    const parsedDate = parseDate(raw);
    const parsedTime = parseTime(raw);
    if (parsedDate || parsedTime) {
      return { date: parsedDate, time: parsedTime };
    }
  }

  return { date: null, time: null };
}

function parseDate(raw: string): string | null {
  // Common Daytona format: DD/MM/YYYY HH:mm[:ss]
  const primary = raw.match(
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );
  const fallbackIso = raw.match(
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );

  const parsed = primary ?? fallbackIso;
  if (!parsed) return null;

  const [, a, b, c, hours = "0", minutes = "0", seconds = "0"] = parsed;
  const dayFirst = Boolean(primary);
  const day = Number(dayFirst ? a : b);
  const month = Number(dayFirst ? b : a);
  let year = Number(c.length === 2 ? Number(c) + 2000 : c);

  const hh = Number(hours);
  const mm = Number(minutes);
  const ss = Number(seconds);

  if (
    ![day, month, year, hh, mm, ss].every(Number.isFinite) ||
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseTime(raw: string): string | null {
  const time = raw.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!time) return null;
  const [, h, m] = time;
  const hours = Number(h);
  const minutes = Number(m);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}`;
}
