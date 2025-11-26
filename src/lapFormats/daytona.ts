import type { Lap } from "../lapTypes.js";
import { addStartOffsets } from "./shared.js";
import fs from "fs";

const DAYTONA_LAP_LINE_RE = /^\s*(\d+)\s+(\d+):(\d+):(\d+)\s+\[(\d+)\]\s*$/; // 01 0:57:755 [11]

export function parseDaytonaLapText(text: string): Lap[] {
  const lines = text.split(/\r?\n/);

  const laps: Lap[] = [];

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line || line.startsWith("#")) continue;

    const m = line.match(DAYTONA_LAP_LINE_RE);
    if (!m) {
      throw new Error(`Cannot parse lap line: "${line}"`);
    }

    const lapNum = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ss = parseInt(m[3], 10);
    const ms = parseInt(m[4], 10);
    const pos = parseInt(m[5], 10);

    const durationS = mm * 60 + ss + ms / 1000;
    laps.push({
      number: lapNum,
      durationS,
      position: pos,
      positionChanges: [{ atS: 0, position: pos }],
      startS: 0,
    });
  }

  return addStartOffsets(laps);
}

export function parseDaytonaLapFile(filePath: string): Lap[] {
  const text = fs.readFileSync(filePath, "utf8");
  return parseDaytonaLapText(text);
}
