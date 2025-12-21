import ffmpeg from "fluent-ffmpeg";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import type { Lap } from "../../src/ffmpeg/lapTypes.js";
import type { OverlayStyle } from "../../src/ffmpeg/overlay.js";
import {
  DEFAULT_OVERLAY_STYLE,
  renderWithFfmpegDrawtext,
} from "../../src/ffmpeg/overlay.js";
import { probeVideoInfo } from "../../src/ffmpeg/videoInfo.js";

const FIXTURE_DIR = path.resolve("tests/testdata");
const EXPECTED_DIR = path.join(FIXTURE_DIR, "expected");
const SAMPLE_VIDEO = path.join(FIXTURE_DIR, "sample.mp4");

async function extractFrame(videoPath: string, timeSeconds: number, outPath: string) {
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .seekInput(Math.max(0, timeSeconds))
      .outputOptions(["-frames:v", "1"])
      .output(outPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

function loadPng(filePath: string): PNG {
  return PNG.sync.read(fs.readFileSync(filePath));
}

type SnapshotOptions = {
  name: string;
  style: Partial<OverlayStyle>;
  laps?: Lap[];
};

async function assertOverlaySnapshot({ name, style, laps }: SnapshotOptions) {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "overlay-test-"));
  const outputVideo = path.join(workDir, `${randomUUID()}.mp4`);
  const outputFrame = path.join(workDir, "frame.png");
  const expectedFrame = path.join(EXPECTED_DIR, `${name}.png`);
  const diffFrame = path.join(workDir, "diff.png");

  const video = await probeVideoInfo(SAMPLE_VIDEO);
  const lapDuration = Math.max(1, Math.min(10, video.duration / 2));
  const defaultLaps: Lap[] = [
    {
      number: 1,
      durationS: lapDuration,
      position: 2,
      positionChanges: [{ atS: 0, position: 2 }],
      startS: 0,
    },
    {
      number: 2,
      durationS: lapDuration,
      position: 1,
      positionChanges: [{ atS: 0, position: 2 }],
      startS: lapDuration,
    },
  ];

  await renderWithFfmpegDrawtext({
    inputVideo: SAMPLE_VIDEO,
    outputFile: outputVideo,
    video,
    laps: laps ?? defaultLaps,
    startOffsetS: 0,
    style: { ...DEFAULT_OVERLAY_STYLE, ...style },
  });

  await extractFrame(outputVideo, Math.min(video.duration - 0.1, 1), outputFrame);

  if (process.env.UPDATE_OVERLAY_FIXTURE === "1" || !fs.existsSync(expectedFrame)) {
    fs.copyFileSync(outputFrame, expectedFrame);
    return;
  }

  const actualPng = loadPng(outputFrame);
  const expectedPng = loadPng(expectedFrame);

  expect(actualPng.width).toBe(expectedPng.width);
  expect(actualPng.height).toBe(expectedPng.height);

  const diff = new PNG({ width: actualPng.width, height: actualPng.height });
  const mismatch = pixelmatch(
    actualPng.data,
    expectedPng.data,
    diff.data,
    actualPng.width,
    actualPng.height,
    { threshold: 0.05 }
  );

  const maxAllowed = Math.ceil(actualPng.width * actualPng.height * 0.02); // allow small codec noise

  if (mismatch > maxAllowed) {
    fs.writeFileSync(diffFrame, PNG.sync.write(diff));
    const message = [
      `Mismatch: ${mismatch} pixels (allowed up to ${maxAllowed}) for ${name}`,
      `expected: ${expectedFrame}`,
      `actual:   ${outputFrame}`,
      `diff:     ${diffFrame}`,
    ].join("\n");
    throw new Error(message);
  }
}

describe("overlay integration", () => {
  it(
    "renders overlay matching fixture",
    async () => {
      await assertOverlaySnapshot({ name: "overlay-expected", style: {} });
    },
    20000
  );

  it(
    "renders overlay with custom text color",
    async () => {
      await assertOverlaySnapshot({
        name: "overlay-yellow",
        style: { textColor: "#f2d20a" },
        laps: [
          {
            number: 1,
            durationS: 2,
            position: 3,
            positionChanges: [{ atS: 0, position: 3 }],
            startS: 0,
          },
        ],
      });
    },
    20000
  );

  it(
    "renders overlay top-left",
    async () => {
      await assertOverlaySnapshot({
        name: "overlay-top-left",
        style: { overlayPosition: "top-left" },
      });
    },
    20000
  );

  it(
    "renders overlay top-right",
    async () => {
      await assertOverlaySnapshot({
        name: "overlay-top-right",
        style: { overlayPosition: "top-right" },
      });
    },
    20000
  );

  it(
    "renders overlay bottom-right",
    async () => {
      await assertOverlaySnapshot({
        name: "overlay-bottom-right",
        style: { overlayPosition: "bottom-right" },
      });
    },
    20000
  );

  it(
    "renders overlay with narrow width",
    async () => {
      await assertOverlaySnapshot({
        name: "overlay-auto-width-small-text",
        style: { textSize: 12, detailTextSize: 12, showLapDeltas: false },
      });
    },
    20000
  );

  it(
    "renders overlay with low opacity",
    async () => {
      await assertOverlaySnapshot({
        name: "overlay-low-opacity",
        style: { boxOpacity: 0.1 },
      });
    },
    20000
  );

  it(
    "renders overlay with large lap time and small detail text",
    async () => {
      await assertOverlaySnapshot({
        name: "overlay-large-lap-small-detail",
        style: { textSize: 192, detailTextSize: 32 },
      });
    },
    20000
  );
});
