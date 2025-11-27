import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const projectRoot = path.resolve(__dirname, "../..");
export const publicDir = path.join(projectRoot, "public");
export const uploadsDir = path.join(projectRoot, "work/uploads");
export const rendersDir = path.join(projectRoot, "work/renders");
export const previewsDir = path.join(projectRoot, "work/previews");

export const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
export const UPLOAD_RETENTION_MS = 24 * 60 * 60 * 1000;
export const RENDER_RETENTION_MS = 24 * 60 * 60 * 1000;
export const PREVIEW_RETENTION_MS = 6 * 60 * 60 * 1000;

export const cleanupTargets = [
  { dir: uploadsDir, maxAgeMs: UPLOAD_RETENTION_MS },
  { dir: rendersDir, maxAgeMs: RENDER_RETENTION_MS },
  { dir: previewsDir, maxAgeMs: PREVIEW_RETENTION_MS },
];

export async function ensureWorkDirs(): Promise<void> {
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.mkdir(rendersDir, { recursive: true });
  await fs.mkdir(previewsDir, { recursive: true });
}
