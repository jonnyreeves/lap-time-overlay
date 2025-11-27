import { renderWithFfmpegDrawtext } from "./overlayDrawtext.js";
import type { RenderContext } from "./overlayTypes.js";

export function getRenderer(): (ctx: RenderContext) => Promise<void> {
  return renderWithFfmpegDrawtext;
}

export type { RenderContext, OverlayStyle } from "./overlayTypes.js";
export { DEFAULT_OVERLAY_STYLE } from "./overlayTypes.js";
export { buildDrawtextFilterGraph, renderWithFfmpegDrawtext } from "./overlayDrawtext.js";
