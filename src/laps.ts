import type { Lap } from "./lapTypes.js";
import { parseDaytonaLapFile, parseDaytonaLapText } from "./lapFormats/daytona.js";
import {
  parseTeamsportLapFile,
  parseTeamsportLapText,
} from "./lapFormats/teamsport.js";

export type LapFormat = "daytona" | "teamsport";

export function parseLapFile(
  filePath: string,
  format: LapFormat = "daytona",
  driverName?: string
): Lap[] {
  switch (format) {
    case "daytona":
      return parseDaytonaLapFile(filePath);
    case "teamsport":
      return parseTeamsportLapFile(filePath, driverName);
    default:
      throw new Error(`Unknown lap format: ${format}`);
  }
}

export function parseLapText(
  text: string,
  format: LapFormat = "daytona",
  driverName?: string
): Lap[] {
  switch (format) {
    case "daytona":
      return parseDaytonaLapText(text);
    case "teamsport":
      return parseTeamsportLapText(text, driverName);
    default:
      throw new Error(`Unknown lap format: ${format}`);
  }
}

export function totalSessionDuration(laps: Lap[]): number {
  if (!laps.length) return 0;
  const last = laps[laps.length - 1];
  return last.startS + last.durationS;
}

export function lapForSessionTime(
  laps: Lap[],
  t: number
): { lap: Lap; lapElapsed: number } | null {
  if (t < 0) return null;
  if (!laps.length) return null;

  const sessionTotal = totalSessionDuration(laps);
  if (t > sessionTotal) return null;

  let current: Lap | null = null;

  for (const lap of laps) {
    const start = lap.startS;
    const end = lap.startS + lap.durationS;
    if (t >= start && t < end) {
      current = lap;
      break;
    }
  }

  if (!current && Math.abs(t - sessionTotal) < 1e-3) {
    current = laps[laps.length - 1];
  }

  if (!current) return null;

  let lapElapsed = t - current.startS;
  if (lapElapsed > current.durationS) {
    lapElapsed = current.durationS;
  }

  return { lap: current, lapElapsed };
}

export type { Lap } from "./lapTypes.js";
