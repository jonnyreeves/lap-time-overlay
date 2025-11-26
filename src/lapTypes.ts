export interface PositionChange {
  atS: number; // seconds into the lap
  position: number;
}

export interface Lap {
  number: number;
  durationS: number;
  position: number;
  positionChanges: PositionChange[];
  startS: number; // session-relative start
}

export interface PositionChangeInput {
  atS?: number;
  position?: number;
}

export interface LapInput {
  number?: number;
  durationMs?: number;
  durationS?: number;
  position?: number;
  positionChanges?: PositionChangeInput[];
}
