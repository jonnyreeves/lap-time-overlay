import type { Lap } from "../lapTypes.js";

export function addStartOffsets(laps: Lap[]): Lap[] {
  let cumulative = 0;
  for (const lap of laps) {
    lap.startS = cumulative;
    cumulative += lap.durationS;
  }
  return laps;
}
