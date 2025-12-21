import { describe, expect, it } from "vitest";
import type { Lap } from "../../src/ffmpeg/lapTypes.js";
import {
  DEFAULT_OVERLAY_STYLE,
  buildDrawtextFilterGraph,
} from "../../src/ffmpeg/overlay.js";

const sampleLaps: Lap[] = [
  {
    number: 1,
    durationS: 60,
    position: 2,
    positionChanges: [{ atS: 0, position: 2 }],
    startS: 0,
  },
  {
    number: 2,
    durationS: 62,
    position: 1,
    positionChanges: [
      { atS: 0, position: 2 },
      { atS: 30, position: 1 },
    ],
    startS: 60,
  },
];

describe("buildDrawtextFilterGraph", () => {
  it("builds overlay pipeline with lap and position info", () => {
    const { filterGraph, outputLabel } = buildDrawtextFilterGraph({
      inputVideo: "input.mp4",
      outputFile: "out.mp4",
      video: { width: 1920, height: 1080, fps: 30, duration: 180 },
      laps: sampleLaps,
      startOffsetS: 5,
      style: DEFAULT_OVERLAY_STYLE,
    });

    expect(filterGraph.length).toBeGreaterThan(0);
    expect(outputLabel).toBeTruthy();

    const combined = filterGraph.join(";");
    expect(combined).toContain("drawtext");
    expect(combined).toContain("Lap 1/2");
    expect(combined).toContain("P2");
    expect(combined).toContain("Δ vs Best");
    expect(combined).toContain("Δ vs Avg");
    expect(combined).toContain("overlay=x=");
  });

  it("omits lap time overlay when disabled", () => {
    const { filterGraph } = buildDrawtextFilterGraph({
      inputVideo: "input.mp4",
      outputFile: "out.mp4",
      video: { width: 1280, height: 720, fps: 24, duration: 120 },
      laps: sampleLaps,
      startOffsetS: 10,
      style: { ...DEFAULT_OVERLAY_STYLE, showCurrentLapTime: false },
    });

    const combined = filterGraph.join(";");
    expect(combined).not.toContain("%{eif:");
    expect(combined).toContain("Lap 1/2");
  });

  it("omits lap deltas when disabled", () => {
    const { filterGraph } = buildDrawtextFilterGraph({
      inputVideo: "input.mp4",
      outputFile: "out.mp4",
      video: { width: 1280, height: 720, fps: 24, duration: 120 },
      laps: sampleLaps,
      startOffsetS: 0,
      style: { ...DEFAULT_OVERLAY_STYLE, showLapDeltas: false },
    });

    const combined = filterGraph.join(";");
    expect(combined).not.toContain("Δ vs Best");
    expect(combined).not.toContain("Δ vs Avg");
  });
});
