import { renderWithFfmpegDrawtext } from "./ffmpegDrawtext.js";
import { renderWithCanvasPipe } from "./canvasPipe.js";
import { renderWithImageSequence } from "./imageSequence.js";
import type { OverlayMode, RenderContext } from "./types.js";

export function getRenderer(
  mode: OverlayMode
): (ctx: RenderContext) => Promise<void> {
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

export type { OverlayMode, RenderContext } from "./types.js";
