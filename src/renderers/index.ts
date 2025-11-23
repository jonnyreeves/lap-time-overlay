import { renderWithFfmpegDrawtext } from "./ffmpegDrawtext.js";
import type { RenderContext } from "./types.js";

export function getRenderer(): (ctx: RenderContext) => Promise<void> {
  return renderWithFfmpegDrawtext;
}

export type { RenderContext, OverlayStyle } from "./types.js";
export { DEFAULT_OVERLAY_STYLE } from "./types.js";
