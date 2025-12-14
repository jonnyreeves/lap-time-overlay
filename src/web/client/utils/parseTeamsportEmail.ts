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

function parseClassifications(lines: string[], endIndex: number) {
  const standings = new Map<string, number>();
  const sliceEnd = endIndex >= 0 ? endIndex : lines.length;

  for (const line of lines.slice(0, sliceEnd)) {
    const columns = splitColumns(line);
    if (columns.length < 2) continue;

    const positionRaw = columns[0];
    const match = positionRaw.match(/^(\d+)(?:[.)])?$/);
    const position = match ? Number.parseInt(match[1], 10) : Number.parseInt(positionRaw, 10);
    if (!Number.isInteger(position) || position < 1) continue;

    const driverName = columns[1];
    if (!driverName) continue;

    standings.set(driverName, position);
  }

  return standings;
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

  const classifications = parseClassifications(lines, detailIdx);
  const lapsByDriver = new Map<string, ParsedLap[]>();
  driverNames.forEach((name) => lapsByDriver.set(name, []));
  let sessionFastestLapSeconds: number | null = null;

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

      if (sessionFastestLapSeconds == null || timeSeconds < sessionFastestLapSeconds) {
        sessionFastestLapSeconds = timeSeconds;
      }

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
      classification: classifications.get(name) ?? null,
    }))
    .filter((driver) => driver.laps.length > 0);

  if (!drivers.length) return null;

  return {
    provider: "teamsport",
    sessionFormat: parseSessionFormat(text),
    sessionDate: null,
    sessionTime: null,
    sessionFastestLapSeconds,
    drivers,
  };
}
