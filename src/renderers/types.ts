import type { Lap } from "../laps.js";
import type { VideoInfo } from "../videoInfo.js";

export type OverlayMode = "ffmpeg" | "canvas-pipe" | "images";

export interface RenderContext {
  inputVideo: string;
  outputFile: string;
  video: VideoInfo;
  laps: Lap[];
  startOffsetS: number;
}
