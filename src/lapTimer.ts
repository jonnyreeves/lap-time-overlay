#!/usr/bin/env ts-node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { parseLapFile, totalSessionDuration } from "./laps.js";
import { computeStartOffsetSeconds } from "./time.js";
import { probeVideoInfo } from "./videoInfo.js";
import { getRenderer } from "./renderers/index.js";
import type { OverlayMode } from "./renderers/index.js";
import type { LapFormat } from "./laps.js";

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
      if (argv.lapFormat === "teamsport" && !argv.driverName) {
        throw new Error("--driverName is required when --lapFormat=teamsport");
      }
      return true;
    })
    .conflicts("startTimestamp", "startFrame")
    .strict()
    .parse();

  const inputVideo = argv.inputVideo!;
  const inputLapTimes = argv.inputLapTimes!;
  const lapFormat = (argv.lapFormat as LapFormat) || "daytona";
  const driverName = argv.driverName as string | undefined;
  const startTimestampStr = argv.startTimestamp as string | undefined;
  const startFrame = argv.startFrame as number | undefined;
  const outputFile = argv.outputFile!;
  const overlayMode = (argv.overlayMode as OverlayMode) || "ffmpeg";

  const laps = parseLapFile(inputLapTimes, lapFormat, driverName);
  if (!laps.length) {
    throw new Error("No laps parsed from lap times file");
  }

  console.log(`Parsed ${laps.length} laps.`);
  console.log(`Session duration: ${totalSessionDuration(laps).toFixed(3)} s`);

  const video = await probeVideoInfo(inputVideo);
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

  const renderer = getRenderer(overlayMode);
  console.log(`Overlay mode: ${overlayMode}`);

  await renderer({
    inputVideo,
    outputFile,
    video,
    laps,
    startOffsetS,
  });

  console.log(`Output written to: ${outputFile}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
