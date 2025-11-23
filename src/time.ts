export function parseStartTimestamp(ts: string): number {
  // Accept "00:12:53.221", "12:53.221", "53.221"
  let main = ts;
  let ms = 0;

  if (ts.includes(".")) {
    const [m, msPart] = ts.split(".");
    main = m;
    ms = parseInt(msPart.padEnd(3, "0").slice(0, 3), 10);
  }

  const parts = main.split(":").map((p) => parseInt(p, 10));
  let h = 0,
    m = 0,
    s = 0;

  if (parts.length === 3) {
    [h, m, s] = parts;
  } else if (parts.length === 2) {
    [m, s] = parts;
  } else if (parts.length === 1) {
    s = parts[0];
  } else {
    throw new Error(`Unrecognised timestamp format: ${ts}`);
  }

  return h * 3600 + m * 60 + s + ms / 1000;
}

export function computeStartOffsetSeconds(options: {
  startTimestamp?: string;
  startFrame?: number;
  fps: number;
}): number {
  const { startTimestamp, startFrame, fps } = options;

  if (startFrame != null) {
    if (!Number.isFinite(startFrame)) {
      throw new Error("startFrame must be a finite number");
    }
    if (!Number.isInteger(startFrame)) {
      throw new Error("startFrame must be an integer");
    }
    if (!Number.isFinite(fps) || fps <= 0) {
      throw new Error("Cannot use startFrame without a valid fps");
    }
    if (startFrame < 0) {
      throw new Error("startFrame must be >= 0");
    }
    return startFrame / fps;
  }

  if (startTimestamp) {
    return parseStartTimestamp(startTimestamp);
  }

  throw new Error("Either startTimestamp or startFrame must be provided");
}
