export interface Lap {
  number: number;
  durationS: number;
  position: number;
  startS: number; // session-relative start
}

export interface LapInput {
  number?: number;
  durationMs?: number;
  durationS?: number;
  position?: number;
}
