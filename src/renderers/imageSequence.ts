import fs from "fs";
import os from "os";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { createOverlayDrawer } from "../overlay/drawing.js";
import type { RenderContext } from "./types.js";

async function generateOverlayFrames(options: {
  tmpDir: string;
  width: number;
  height: number;
  fps: number;
  videoDuration: number;
  laps: RenderContext["laps"];
  startOffsetS: number;
  style: RenderContext["style"];
}) {
  const {
    tmpDir,
    width,
    height,
    fps,
    videoDuration,
    laps,
    startOffsetS,
    style,
  } = options;

  const totalFrames = Math.floor(videoDuration * fps);
  const drawFrame = createOverlayDrawer({
    width,
    height,
    fps,
    laps,
    startOffsetS,
    style,
  });

  console.log(
    `Generating ${totalFrames} overlay frames at ${fps.toFixed(
      2
    )} fps (duration ~${videoDuration.toFixed(2)}s)`
  );

  for (let i = 0; i < totalFrames; i++) {
    const outPath = path.join(
      tmpDir,
      `overlay_${String(i).padStart(6, "0")}.png`
    );
    const buffer = drawFrame(i);
    fs.writeFileSync(outPath, buffer);

    if (i % 500 === 0) {
      console.log(`  ...${i}/${totalFrames} frames`);
    }
  }

  console.log("Overlay frame generation complete.");
}

async function renderFinalVideo(options: {
  inputVideo: string;
  overlayDir: string;
  fps: number;
  outputFile: string;
  onProgress?: (percent: number) => void;
}) {
  const { inputVideo, overlayDir, fps, outputFile, onProgress } = options;

  const overlayPattern = path.join(overlayDir, "overlay_%06d.png");

  console.log("Starting ffmpeg render...");

  return new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg()
      .input(inputVideo)
      // second input: image sequence
      .input(overlayPattern)
      .inputOptions(["-framerate", fps.toString()])
      .complexFilter(["[0:v][1:v]overlay=0:0:format=auto[vout]"])
      .outputOptions([
        "-map",
        "[vout]",
        "-map",
        "0:a?",
        "-c:a",
        "copy", // copy audio as-is
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
      ])
      .output(outputFile);

    cmd
      .on("start", (cmdLine) => {
        console.log("ffmpeg command:");
        console.log(cmdLine);
      })
      .on("progress", (progress) => {
        const pct = Number(progress.percent);
        if (Number.isFinite(pct)) {
          const clamped = Math.min(100, Math.max(0, pct));
          onProgress?.(clamped);
          process.stdout.write(`\rRendering: ${clamped.toFixed(1)}%     `);
        }
      })
      .on("end", () => {
        console.log("\nffmpeg render complete.");
        resolve();
      })
      .on("error", (err, stdout, stderr) => {
        console.error("ffmpeg error:", err.message);
        console.error(stderr);
        reject(err);
      });

    cmd.run();
  });
}

export async function renderWithImageSequence(
  ctx: RenderContext
): Promise<void> {
  const {
    inputVideo,
    outputFile,
    video: { width, height, fps, duration },
    laps,
    startOffsetS,
    style,
  } = ctx;

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lapOverlay-"));
  console.log(`Using temp directory: ${tmpDir}`);

  try {
    await generateOverlayFrames({
      tmpDir,
      width,
      height,
      fps,
      videoDuration: duration,
      laps,
      startOffsetS,
      style,
    });

    await renderFinalVideo({
      inputVideo,
      overlayDir: tmpDir,
      fps,
      outputFile,
      onProgress: ctx.onProgress,
    });
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {
      console.warn(
        `Could not remove temp dir ${tmpDir}:`,
        (e as Error).message
      );
    }
  }
}
