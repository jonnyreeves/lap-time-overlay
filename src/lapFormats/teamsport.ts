import fs from "fs";
import type { Lap } from "../ffmpeg/lapTypes.js";
import { parseStartTimestamp } from "../ffmpeg/time.js";
import { addStartOffsets } from "./shared.js";

function splitCells(line: string): string[] {
  const tabParts = line.split(/\t+/);
  if (tabParts.length > 1) {
    return tabParts.map((p) => p.trim());
  }
  // Fallback: split on 2+ spaces to preserve spaces inside names
  return line.split(/ {2,}/).map((p) => p.trim());
}

export function parseTeamsportLapText(
  text: string,
  driverName?: string
): Lap[] {
  if (!driverName) {
    throw new Error("driverName is required for teamsport format");
  }

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) {
    throw new Error("No lines found in lap file");
  }

  const headerCells = splitCells(lines[0]);
  if (headerCells.length < 2) {
    throw new Error("Header row not found or invalid for teamsport format");
  }

  const driverCells = headerCells.slice(1);
  const driverIndex = driverCells.findIndex(
    (name) => name.toLowerCase() === driverName.toLowerCase()
  );
  if (driverIndex === -1) {
    throw new Error(`Driver "${driverName}" not found in header`);
  }

  const laps: Lap[] = [];
  for (let i = 1; i < lines.length; i++) {
    const rowCells = splitCells(lines[i]);
    if (rowCells.length <= driverIndex + 1) continue;
    const lapNum = parseInt(rowCells[0], 10);
    const timeStr = rowCells[driverIndex + 1];
    if (!timeStr) continue;
    const durationS = parseStartTimestamp(timeStr);
    laps.push({
      number: lapNum,
      durationS,
      position: 0,
      positionChanges: [],
      startS: 0,
    });
  }

  return addStartOffsets(laps);
}

export function parseTeamsportLapFile(
  filePath: string,
  driverName?: string
): Lap[] {
  const text = fs.readFileSync(filePath, "utf8");
  return parseTeamsportLapText(text, driverName);
}
