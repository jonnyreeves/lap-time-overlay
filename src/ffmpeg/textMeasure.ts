import * as fontkit from "fontkit";
import type { Font, FontCollection } from "fontkit";
import fs from "node:fs";

const FONT_CANDIDATES = [
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
];

let cachedFont: Font | null = null;
let cachedPath: string | null = null;

function toFont(resource: Font | FontCollection): Font {
  if ("layout" in resource) return resource;
  const first = resource.fonts?.[0];
  if (first) return first;
  throw new Error("Overlay font collection did not include any fonts");
}

function resolveFont(): Font {
  if (cachedFont) return cachedFont;

  const path = FONT_CANDIDATES.find((candidate) => fs.existsSync(candidate));
  if (!path) {
    throw new Error("Overlay font not found: expected DejaVuSans at a known path");
  }

  cachedFont = toFont(fontkit.openSync(path));
  cachedPath = path;
  return cachedFont;
}

export function measureTextWidth(text: string, fontSize: number): number {
  if (!text) return 0;
  try {
    const font = resolveFont();
    const run = font.layout(text);
    const scale = fontSize / font.unitsPerEm;
    return Math.ceil(run.advanceWidth * scale);
  } catch (err) {
    // Fall back to a conservative estimate so we still render a background if font loading fails.
    const averageCharWidth = fontSize * 0.6;
    return Math.ceil(text.length * averageCharWidth);
  }
}

export function fontPathUsed(): string | null {
  return cachedPath;
}
