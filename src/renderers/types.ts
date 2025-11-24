import type { Lap } from "../laps.js";
import type { VideoInfo } from "../videoInfo.js";

export interface OverlayStyle {
  textColor: string;
  boxColor: string;
  boxOpacity: number;
  showLapCounter: boolean;
  showPosition: boolean;
  showCurrentLapTime: boolean;
  overlayPosition: "bottom-left" | "top-left" | "top-right" | "bottom-right";
  boxWidthRatio: number;
}

export interface RenderContext {
  inputVideo: string;
  outputFile: string;
  video: VideoInfo;
  laps: Lap[];
  startOffsetS: number;
  style: OverlayStyle;
  onProgress?: (percent: number) => void;
}

export const DEFAULT_OVERLAY_STYLE: OverlayStyle = {
  textColor: "#ffffff",
  boxColor: "#000000",
  boxOpacity: 0.6,
  showLapCounter: true,
  showPosition: true,
  showCurrentLapTime: true,
  overlayPosition: "bottom-left",
  boxWidthRatio: 0.45,
};
