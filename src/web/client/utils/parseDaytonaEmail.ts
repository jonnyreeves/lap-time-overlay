import { formatLapTimeSeconds } from "./lapTime.js";
import { parseSessionFormat } from "./sessionImportShared.js";
import { type ParsedDaytonaEmail, type ParsedLap } from "./sessionImportTypes.js";

const LAP_LINE_RE = /^\s*(\d+)\s+(\d+):(\d+):(\d+)\s+\[(\d+)\]\s*$/; // 01 0:57:755 [11]
const TIME_STARTED_RE = /time\s*started\s*(?::|\-)?\s*(.+)/i;

export function parseDaytonaEmail(text: string): ParsedDaytonaEmail {
  const lines = text.split(/\r?\n/);
  const { date: sessionDate, time: sessionTime } = parseTimeStarted(text);
  let finalPosition: number | null = null;

  const laps: ParsedLap[] = [];

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line || line.startsWith("#")) continue;

    const m = line.match(LAP_LINE_RE);
    if (!m) {
      continue;
    }

    const lapNum = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ss = parseInt(m[3], 10);
    const ms = parseInt(m[4], 10);
    const pos = parseInt(m[5], 10);

    if (![lapNum, mm, ss, ms, pos].every(Number.isFinite)) continue;
    finalPosition = pos;

    const durationS = mm * 60 + ss + ms / 1000;
    laps.push({
      lapNumber: lapNum,
      timeSeconds: durationS,
      displayTime: formatLapTimeSeconds(durationS),
      lapEvents: [{ offset: 0, event: "position", value: String(pos) }],
    });
  }

  laps.sort((a, b) => a.lapNumber - b.lapNumber);

  return {
    provider: "daytona",
    sessionFormat: parseSessionFormat(text),
    sessionDate,
    sessionTime,
    classification: finalPosition,
    laps,
  };
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
