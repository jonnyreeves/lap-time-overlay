import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const projectRoot = path.resolve(__dirname, "../..");
export const publicDir = path.join(projectRoot, "public");

export const sessionRecordingsDir = path.join(projectRoot, "media/session_recordings");
export const mediaLibraryProjectionDir = path.join(projectRoot, "media/library");

export const tmpUploadsDir = path.join(projectRoot, "temp/uploads");
export const tmpRendersDir = path.join(projectRoot, "temp/renders");
export const tmpPreviewsDir = path.join(projectRoot, "temp/previews");


export async function ensureWorkDirs(): Promise<void> {
  await fs.mkdir(sessionRecordingsDir, { recursive: true });
  await fs.mkdir(mediaLibraryProjectionDir, { recursive: true });

  await fs.mkdir(tmpPreviewsDir, { recursive: true });
  await fs.mkdir(tmpRendersDir, { recursive: true });
  await fs.mkdir(tmpUploadsDir, { recursive: true });
}
