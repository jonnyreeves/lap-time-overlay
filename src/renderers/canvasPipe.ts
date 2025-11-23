import { once } from "events";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";
import { createOverlayDrawer } from "../overlay/drawing.js";
import type { RenderContext } from "./types.js";

export async function renderWithCanvasPipe(ctx: RenderContext): Promise<void> {
  const {
    inputVideo,
    outputFile,
    video: { width, height, fps, duration },
    laps,
    startOffsetS,
  } = ctx;

  const totalFrames = Math.floor(duration * fps);
  const drawFrame = createOverlayDrawer({
    width,
    height,
    fps,
    laps,
    startOffsetS,
  });
  const overlayStream = new PassThrough();

  console.log(
    `Streaming ${totalFrames} overlay frames via pipe at ${fps.toFixed(2)} fps`
  );

  const ffmpegPromise = new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg()
      .input(inputVideo)
      .input(overlayStream)
      .inputFormat("image2pipe")
      .inputFPS(fps)
      .complexFilter(["[0:v][1:v]overlay=0:0:format=auto[vout]"])
      .outputOptions([
        "-map",
        "[vout]",
        "-map",
        "0:a?",
        "-c:a",
        "copy",
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
        if (progress.percent != null) {
          process.stdout.write(
            `\rRendering: ${progress.percent.toFixed(1)}%     `
          );
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

  for (let i = 0; i < totalFrames; i++) {
    const buffer = drawFrame(i);
    const canContinue = overlayStream.write(buffer);
    if (!canContinue) {
      await once(overlayStream, "drain");
    }
    if (i % 500 === 0) {
      process.stdout.write(`\rGenerated ${i}/${totalFrames} frames`);
    }
  }
  overlayStream.end();
  process.stdout.write(`\rGenerated ${totalFrames}/${totalFrames} frames\n`);

  await ffmpegPromise;
}
