import { describe, expect, it } from "vitest";
import { formatStopwatchTime } from "../../../../src/web/client/utils/lapTime.js";

describe("formatStopwatchTime", () => {
  it("formats zero with leading seconds", () => {
    expect(formatStopwatchTime(0)).toBe("0:00.000");
  });

  it("formats sub-minute values with padded seconds", () => {
    expect(formatStopwatchTime(1.234)).toBe("0:01.234");
  });

  it("formats multi-minute values", () => {
    expect(formatStopwatchTime(61.002)).toBe("1:01.002");
    expect(formatStopwatchTime(600)).toBe("10:00.000");
  });

  it("defaults to zero stopwatch when input is invalid", () => {
    expect(formatStopwatchTime(NaN)).toBe("0:00.000");
    expect(formatStopwatchTime(-2)).toBe("0:00.000");
  });
});
