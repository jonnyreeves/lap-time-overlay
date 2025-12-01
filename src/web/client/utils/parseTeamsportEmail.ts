import { formatLapTimeSeconds, parseLapTimeString } from "./lapTime.js";
import { parseSessionFormat } from "./sessionImportShared.js";
import {
  type ParsedLap,
  type ParsedTeamsportEmail,
} from "./sessionImportTypes.js";

function splitColumns(line: string): string[] {
  if (line.includes("\t")) {
    return line
      .split(/\t+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  // Fallback: split on 2+ spaces (names with spaces will be preserved because we look for extra gaps)
  return line
    .split(/\s{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parseTeamsportEmail(text: string): ParsedTeamsportEmail | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const detailIdx = lines.findIndex((line) => line.toLowerCase().includes("detailed results"));
  if (detailIdx === -1) return null;

  const headerLine = lines.slice(detailIdx + 1).find((line) => line.length > 0);
  if (!headerLine) return null;

  const driverNames = splitColumns(headerLine);
  if (!driverNames.length) return null;

  const lapsByDriver = new Map<string, ParsedLap[]>();
  driverNames.forEach((name) => lapsByDriver.set(name, []));

  const headerLineIdx = lines.indexOf(headerLine);
  for (let i = headerLineIdx + 1; i < lines.length; i++) {
    const columns = splitColumns(lines[i]);
    if (columns.length < 2) continue;
    if (!/^\d+$/.test(columns[0])) continue; // ignore historical/best-of tables

    const lapNumber = Number.parseInt(columns[0], 10);
    if (!Number.isFinite(lapNumber)) continue;

    driverNames.forEach((name, idx) => {
      const rawTime = columns[idx + 1];
      const timeSeconds = rawTime ? parseLapTimeString(rawTime) : null;
      if (timeSeconds == null) return;

      const driverLaps = lapsByDriver.get(name);
      if (!driverLaps) return;
      driverLaps.push({
        lapNumber,
        timeSeconds,
        displayTime: formatLapTimeSeconds(timeSeconds),
      });
    });
  }

  const drivers = driverNames
    .map((name) => ({
      name,
      laps: (lapsByDriver.get(name) ?? []).sort((a, b) => a.lapNumber - b.lapNumber),
    }))
    .filter((driver) => driver.laps.length > 0);

  if (!drivers.length) return null;

  return {
    provider: "teamsport",
    sessionFormat: parseSessionFormat(text),
    sessionDate: null,
    sessionTime: null,
    drivers,
  };
}
