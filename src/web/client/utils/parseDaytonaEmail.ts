import { formatLapTimeSeconds } from "./lapTime.js";

export type SessionFormat = "Practice" | "Qualifying" | "Race";

export type ParsedLap = {
  lapNumber: number;
  timeSeconds: number;
  displayTime: string;
};

export type ParsedDaytonaEmail = {
  sessionFormat: SessionFormat | null;
  laps: ParsedLap[];
};

const LAP_LINE_RE = /^\s*(\d+)\s+(\d+):(\d+):(\d+)\s+\[(\d+)\]\s*$/;

const FORMAT_MATCHERS: { token: string; value: SessionFormat }[] = [
  { token: "practice", value: "Practice" },
  { token: "qualifying", value: "Qualifying" },
  { token: "race", value: "Race" },
];

function parseSessionFormat(text: string): SessionFormat | null {
  const lower = text.toLowerCase();
  const match = FORMAT_MATCHERS.find(({ token }) => lower.includes(token));
  return match?.value ?? null;
}

export function parseDaytonaEmail(text: string): ParsedDaytonaEmail {
  const lines = text.split(/\r?\n/);
  const laps: ParsedLap[] = [];

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line) continue;

    const match = line.match(LAP_LINE_RE);
    if (!match) continue;

    const lapNumber = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    const millis = Number(match[4]);

    if (![lapNumber, minutes, seconds, millis].every(Number.isFinite)) {
      continue;
    }

    const timeSeconds = minutes * 60 + seconds + millis / 1000;
    laps.push({
      lapNumber,
      timeSeconds,
      displayTime: formatLapTimeSeconds(timeSeconds),
    });
  }

  laps.sort((a, b) => a.lapNumber - b.lapNumber);

  return {
    sessionFormat: parseSessionFormat(text),
    laps,
  };
}
