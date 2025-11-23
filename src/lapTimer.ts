#!/usr/bin/env ts-node

import fs from "fs";
import path from "path";
import os from "os";
import ffmpeg from "fluent-ffmpeg";
import { createCanvas } from "canvas";
import { PassThrough } from "stream";
import { once } from "events";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// -------- Types --------

interface Lap {
  number: number;
  durationS: number;
  position: number;
  startS: number; // session-relative start
}

type OverlayMode = "ffmpeg" | "canvas-pipe" | "images";

interface VideoInfo {
  width: number;
  height: number;
  fps: number;
  duration: number;
}

interface RenderContext {
  inputVideo: string;
  outputFile: string;
  video: VideoInfo;
  laps: Lap[];
  startOffsetS: number;
}

// -------- Parsing helpers --------

function parseStartTimestamp(ts: string): number {
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

function computeStartOffsetSeconds(options: {
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

const LAP_LINE_RE =
  /^\s*(\d+)\s+(\d+):(\d+):(\d+)\s+\[(\d+)\]\s*$/; // 01 0:57:755 [11]

function parseLapFile(filePath: string): Lap[] {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);

  const laps: Lap[] = [];

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line || line.startsWith("#")) continue;

    const m = line.match(LAP_LINE_RE);
    if (!m) {
      throw new Error(`Cannot parse lap line: "${line}"`);
    }

    const lapNum = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ss = parseInt(m[3], 10);
    const ms = parseInt(m[4], 10);
    const pos = parseInt(m[5], 10);

    const durationS = mm * 60 + ss + ms / 1000;
    laps.push({ number: lapNum, durationS, position: pos, startS: 0 });
  }

  // Compute cumulative start times
  let cumulative = 0;
  for (const lap of laps) {
    lap.startS = cumulative;
    cumulative += lap.durationS;
  }

  return laps;
}

function totalSessionDuration(laps: Lap[]): number {
  if (!laps.length) return 0;
  const last = laps[laps.length - 1];
  return last.startS + last.durationS;
}

// -------- Lap lookup & formatting --------

function lapForSessionTime(
  laps: Lap[],
  t: number
): { lap: Lap; lapElapsed: number } | null {
  if (t < 0) return null;
  if (!laps.length) return null;

  const sessionTotal = totalSessionDuration(laps);
  if (t > sessionTotal) return null;

  let current: Lap | null = null;

  for (const lap of laps) {
    const start = lap.startS;
    const end = lap.startS + lap.durationS;
    if (t >= start && t < end) {
      current = lap;
      break;
    }
  }

  if (!current && Math.abs(t - sessionTotal) < 1e-3) {
    current = laps[laps.length - 1];
  }

  if (!current) return null;

  let lapElapsed = t - current.startS;
  if (lapElapsed > current.durationS) {
    lapElapsed = current.durationS;
  }

  return { lap: current, lapElapsed };
}

function formatLapTime(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const totalMs = Math.round(seconds * 1000);
  const ms = totalMs % 1000;
  const totalS = Math.floor(totalMs / 1000);
  const m = Math.floor(totalS / 60);
  const s = totalS % 60;
  return `${m}:${s.toString().padStart(2, "0")}:${ms
    .toString()
    .padStart(3, "0")}`;
}

// -------- ffmpeg helpers --------

function ffprobeAsync(filePath: string): Promise<ffmpeg.FfprobeData> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

function parseFps(rateStr?: string): number {
  if (!rateStr || rateStr === "0/0") return 30;
  const [numStr, denStr] = rateStr.split("/");
  const num = parseFloat(numStr);
  const den = parseFloat(denStr || "1");
  if (!den) return num;
  return num / den;
}

// -------- Overlay frame generation --------

function createOverlayDrawer(params: {
  width: number;
  height: number;
  fps: number;
  laps: Lap[];
  startOffsetS: number;
}) {
  const { width, height, fps, laps, startOffsetS } = params;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const margin = 20;
  const boxWidth = Math.floor(width * 0.45);
  const boxHeight = 90;
  const boxX = margin;
  const boxY = height - boxHeight - margin;

  const fontSize = 32;
  const lineSpacing = 8;

  const sessionTotal = totalSessionDuration(laps);

  return (frameIndex: number): Buffer => {
    const t = frameIndex / fps;
    const sessionT = t - startOffsetS;

    ctx.clearRect(0, 0, width, height);

    const showOverlay = sessionT >= 0 && sessionT <= sessionTotal;
    if (showOverlay) {
      const res = lapForSessionTime(laps, sessionT);
      if (res) {
        const { lap, lapElapsed } = res;
        const lapTimeStr = formatLapTime(lapElapsed);
        const totalLaps = laps.length;

        const line1 = `Lap ${lap.number}/${totalLaps}   P${lap.position}`;
        const line2 = lapTimeStr;

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = "#ffffff";
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textBaseline = "top";

        const textX = boxX + 12;
        let textY = boxY + 10;

        ctx.fillText(line1, textX, textY);
        textY += fontSize + lineSpacing;
        ctx.fillText(line2, textX, textY);
      }
    }

    return canvas.toBuffer("image/png");
  };
}

async function generateOverlayFrames(options: {
  tmpDir: string;
  width: number;
  height: number;
  fps: number;
  videoDuration: number;
  laps: Lap[];
  startOffsetS: number;
}) {
  const { tmpDir, width, height, fps, videoDuration, laps, startOffsetS } =
    options;

  const totalFrames = Math.floor(videoDuration * fps);
  const drawFrame = createOverlayDrawer({
    width,
    height,
    fps,
    laps,
    startOffsetS,
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

// -------- ffmpeg composition --------

async function renderFinalVideo(options: {
  inputVideo: string;
  overlayDir: string;
  fps: number;
  outputFile: string;
}) {
  const { inputVideo, overlayDir, fps, outputFile } = options;

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
}

function escapeDrawtext(text: string): string {
  // Escape characters that would be interpreted as option separators in drawtext
  return text.replace(/['\\\\:,]/g, "\\$&");
}

function buildLapTimeExpr(lapStartAbs: number): string {
  const tExpr = `(t-${lapStartAbs.toFixed(6)})`;
  const minExpr = `floor(${tExpr}/60)`;
  const secExpr = `floor(mod(${tExpr},60))`;
  const msExpr = `floor(mod(${tExpr}*1000,1000))`;

  return `%{eif:${minExpr}:%d}:%{eif:${secExpr}:%02d}:%{eif:${msExpr}:%03d}`;
}

function buildDrawtextFilterGraph(options: {
  video: VideoInfo;
  laps: Lap[];
  startOffsetS: number;
}) {
  const {
    video: { width, height },
    laps,
    startOffsetS,
  } = options;

  const margin = 20;
  const boxWidth = Math.floor(width * 0.45);
  const boxHeight = 90;
  const boxX = margin;
  const boxY = height - boxHeight - margin;

  const fontSize = 32;
  const lineSpacing = 8;

  const overlayStart = startOffsetS;
  const overlayEnd = startOffsetS + totalSessionDuration(laps);

  const filters: string[] = [];
  let currentLabel = "0:v";
  let idx = 0;
  const nextLabel = () => `ov${idx++}`;

  filters.push(
    `[${currentLabel}]drawbox=x=${boxX}:y=${boxY}:w=${boxWidth}:h=${boxHeight}:color=black@0.6:t=fill:enable='between(t,${overlayStart},${overlayEnd})'[${(currentLabel =
      nextLabel())}]`
  );

  laps.forEach((lap) => {
    const lapStart = overlayStart + lap.startS;
    const lapEnd = lapStart + lap.durationS;
    const lapEnable = `between(t,${lapStart},${lapEnd})`;
    const line1 = `Lap ${lap.number}/${laps.length}   P${lap.position}`;

    filters.push(
      `[${currentLabel}]drawtext=text='${escapeDrawtext(
        line1
      )}':fontcolor=white:fontsize=${fontSize}:x=${boxX + 12}:y=${
        boxY + 10
      }:enable='${lapEnable}'[${(currentLabel = nextLabel())}]`
    );

    const timeText = buildLapTimeExpr(lapStart);
    filters.push(
      `[${currentLabel}]drawtext=text='${escapeDrawtext(
        timeText
      )}':fontcolor=white:fontsize=${fontSize}:x=${boxX + 12}:y=${
        boxY + 10 + fontSize + lineSpacing
      }:enable='${lapEnable}'[${(currentLabel = nextLabel())}]`
    );
  });

  const outputLabel = currentLabel || "0:v";
  return { filterGraph: filters.join(";"), outputLabel };
}

async function renderWithFfmpegDrawtext(ctx: RenderContext): Promise<void> {
  const { filterGraph, outputLabel } = buildDrawtextFilterGraph(ctx);

  console.log("Using ffmpeg drawtext overlay (no temp images)...");
  return new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg()
      .input(ctx.inputVideo)
      .complexFilter(filterGraph)
      .outputOptions([
        "-map",
        `[${outputLabel}]`,
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
      .output(ctx.outputFile);

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
}

async function renderWithImageSequence(ctx: RenderContext): Promise<void> {
  const {
    inputVideo,
    outputFile,
    video: { width, height, fps, duration },
    laps,
    startOffsetS,
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
    });

    await renderFinalVideo({
      inputVideo,
      overlayDir: tmpDir,
      fps,
      outputFile,
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

async function renderWithCanvasPipe(ctx: RenderContext): Promise<void> {
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

function getRenderer(mode: OverlayMode): (ctx: RenderContext) => Promise<void> {
  switch (mode) {
    case "ffmpeg":
      return renderWithFfmpegDrawtext;
    case "canvas-pipe":
      return renderWithCanvasPipe;
    case "images":
      return renderWithImageSequence;
    default:
      return renderWithFfmpegDrawtext;
  }
}

// -------- Main CLI --------

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("inputVideo", {
      type: "string",
      demandOption: true,
      describe: "Input video file (e.g. my_gopro_footage.mp4)",
    })
    .option("inputLapTimes", {
      type: "string",
      demandOption: true,
      describe: "Lap times text file",
    })
    .option("startTimestamp", {
      type: "string",
      describe: "Offset into video where lap 1 starts (e.g. 00:12:53.221)",
    })
    .option("startFrame", {
      type: "number",
      describe:
        "Offset into video where lap 1 starts, specified as a frame number (0 = first frame)",
    })
    .option("outputFile", {
      type: "string",
      demandOption: true,
      describe: "Output video file (e.g. out.mp4)",
    })
    .option("overlayMode", {
      type: "string",
      choices: ["ffmpeg", "canvas-pipe", "images"] as const,
      default: "ffmpeg",
      describe:
        "Overlay renderer: ffmpeg drawtext (fast), canvas pipe (no temp files), or image sequence (debug)",
    })
    .check((argv) => {
      if (argv.startTimestamp == null && argv.startFrame == null) {
        throw new Error("Either --startTimestamp or --startFrame is required");
      }
      return true;
    })
    .conflicts("startTimestamp", "startFrame")
    .strict()
    .parse();

  const inputVideo = argv.inputVideo!;
  const inputLapTimes = argv.inputLapTimes!;
  const startTimestampStr = argv.startTimestamp as string | undefined;
  const startFrame = argv.startFrame as number | undefined;
  const outputFile = argv.outputFile!;
  const overlayMode = (argv.overlayMode as OverlayMode) || "ffmpeg";

  const laps = parseLapFile(inputLapTimes);
  if (!laps.length) {
    throw new Error("No laps parsed from lap times file");
  }

  console.log(`Parsed ${laps.length} laps.`);
  console.log(`Session duration: ${totalSessionDuration(laps).toFixed(3)} s`);

  const meta = await ffprobeAsync(inputVideo);
  const videoStream = meta.streams.find((s) => s.codec_type === "video");
  if (!videoStream) {
    throw new Error("No video stream found in input");
  }

  const width = videoStream.width || 1920;
  const height = videoStream.height || 1080;
  const fps = parseFps(
    (videoStream.r_frame_rate as string) ||
      (videoStream.avg_frame_rate as string)
  );

  const duration =
    Number(videoStream.duration) || Number(meta.format.duration) || 0;
  if (!duration) {
    throw new Error("Unable to determine video duration");
  }

  console.log(`Video resolution: ${width}x${height}`);
  console.log(`Video fps: ${fps.toFixed(3)}`);
  console.log(`Video duration: ${duration.toFixed(3)} s`);

  const startOffsetS = computeStartOffsetSeconds({
    startTimestamp: startTimestampStr,
    startFrame,
    fps,
  });

  if (startFrame != null) {
    console.log(
      `Lap 1 starts at frame ${startFrame} (~${startOffsetS.toFixed(
        3
      )} s into the video timeline)`
    );
  } else {
    console.log(
      `Lap 1 starts at ${startOffsetS.toFixed(
        3
      )} s into the video timeline`
    );
  }

  const renderer = getRenderer(overlayMode);
  console.log(`Overlay mode: ${overlayMode}`);

  await renderer({
    inputVideo,
    outputFile,
    video: { width, height, fps, duration },
    laps,
    startOffsetS,
  });

  console.log(`Output written to: ${outputFile}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
