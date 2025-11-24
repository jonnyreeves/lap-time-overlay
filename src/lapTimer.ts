#!/usr/bin/env ts-node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { parseLapFile, totalSessionDuration } from "./laps.js";
import { computeStartOffsetSeconds } from "./time.js";
import { probeVideoInfo } from "./videoInfo.js";
import { DEFAULT_OVERLAY_STYLE, getRenderer } from "./renderers/index.js";
import type { LapFormat } from "./laps.js";

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("inputVideo", {
      type: "string",
      array: true,
      demandOption: true,
      describe:
        "Input video file(s) in order (e.g. --inputVideo seg1.mp4 --inputVideo seg2.mp4)",
    })
    .option("inputLapTimes", {
      type: "string",
      demandOption: true,
      describe: "Lap times text file",
    })
    .option("lapFormat", {
      type: "string",
      choices: ["daytona", "teamsport"] as const,
      default: "daytona",
      describe: "Lap file format",
    })
    .option("driverName", {
      type: "string",
      describe: "Driver name (required for teamsport format)",
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
    .check((argv) => {
      if (argv.startTimestamp == null && argv.startFrame == null) {
        throw new Error("Either --startTimestamp or --startFrame is required");
      }
      if (argv.lapFormat === "teamsport" && !argv.driverName) {
        throw new Error("--driverName is required when --lapFormat=teamsport");
      }
      return true;
    })
    .conflicts("startTimestamp", "startFrame")
    .strict()
    .parse();

  const inputVideosRaw = argv.inputVideo as string[] | string;
  const inputVideos = Array.isArray(inputVideosRaw)
    ? inputVideosRaw.filter(Boolean)
    : [inputVideosRaw].filter(Boolean);
  const inputLapTimes = argv.inputLapTimes!;
  const lapFormat = (argv.lapFormat as LapFormat) || "daytona";
  const driverName = argv.driverName as string | undefined;
  const startTimestampStr = argv.startTimestamp as string | undefined;
  const startFrame = argv.startFrame as number | undefined;
  const outputFile = argv.outputFile!;

  const laps = parseLapFile(inputLapTimes, lapFormat, driverName);
  if (!laps.length) {
    throw new Error("No laps parsed from lap times file");
  }

  console.log(`Parsed ${laps.length} laps.`);
  console.log(`Session duration: ${totalSessionDuration(laps).toFixed(3)} s`);

  if (!inputVideos.length) {
    throw new Error("Provide at least one --inputVideo");
  }

  const { videoPath, cleanup } = await prepareInputVideo(inputVideos);

  try {
    const video = await probeVideoInfo(videoPath);
    console.log(`Video resolution: ${video.width}x${video.height}`);
    console.log(`Video fps: ${video.fps.toFixed(3)}`);
    console.log(`Video duration: ${video.duration.toFixed(3)} s`);

    const startOffsetS = computeStartOffsetSeconds({
      startTimestamp: startTimestampStr,
      startFrame,
      fps: video.fps,
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

    const renderer = getRenderer();

    await renderer({
      inputVideo: videoPath,
      outputFile,
      video,
      laps,
      startOffsetS,
      style: DEFAULT_OVERLAY_STYLE,
    });

    console.log(`Output written to: ${outputFile}`);
  } finally {
    await cleanup();
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

async function prepareInputVideo(paths: string[]): Promise<{
  videoPath: string;
  cleanup: () => Promise<void>;
}> {
  if (paths.length === 1) {
    return { videoPath: paths[0], cleanup: async () => {} };
  }

  console.log(`Combining ${paths.length} input files in order…`);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "lap-overlay-"));
  const listPath = path.join(tempDir, "concat.txt");
  const outputPath = path.join(tempDir, "combined.mp4");

  const listContent = paths
    .map((filePath) => {
      const escaped = filePath.replace(/'/g, "''");
      return `file '${escaped}'`;
    })
    .join("\n");

  await fs.writeFile(listPath, listContent, "utf8");

  const cleanup = async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  };

  try {
    await runConcat(listPath, outputPath);
    return { videoPath: outputPath, cleanup };
  } catch (err) {
    await cleanup();
    throw err;
  }
}

function runConcat(listPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg()
      .input(listPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-c", "copy", "-fflags", "+genpts"])
      .output(outputPath);

    cmd
      .on("end", () => resolve())
      .on("error", (err) => reject(err));

    cmd.run();
  });
}
