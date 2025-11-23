import type { Lap } from "../laps.js";
import type { VideoInfo } from "../videoInfo.js";

export interface OverlayStyle {
  textColor: string;
  boxColor: string;
  boxOpacity: number;
}

export interface RenderContext {
  inputVideo: string;
  outputFile: string;
  video: VideoInfo;
  laps: Lap[];
  startOffsetS: number;
  style: OverlayStyle;
}

export const DEFAULT_OVERLAY_STYLE: OverlayStyle = {
  textColor: "#ffffff",
  boxColor: "#000000",
  boxOpacity: 0.6,
};
