import fs from "node:fs/promises";
import path from "node:path";
import { CLEANUP_INTERVAL_MS, cleanupTargets } from "../config.js";
import { safeUnlink } from "../shared/fs.js";
import { uploads } from "../state/uploads.js";
import { jobs } from "../state/jobs.js";

export function scheduleWorkDirCleanup(): void {
  const runCleanup = () => {
    cleanupWorkDir().catch((err) => {
      console.error("Work dir cleanup failed:", err);
    });
  };
  runCleanup();
  const timer = setInterval(runCleanup, CLEANUP_INTERVAL_MS);
  if (typeof timer.unref === "function") {
    timer.unref();
  }
}

async function cleanupWorkDir(): Promise<void> {
  const now = Date.now();
  const activePaths = collectActivePaths();

  for (const target of cleanupTargets) {
    try {
      const entries = await fs.readdir(target.dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) continue;
        const filePath = path.join(target.dir, entry.name);
        if (activePaths.has(path.resolve(filePath))) continue;
        try {
          const stats = await fs.stat(filePath);
          const ageMs = now - stats.mtimeMs;
          if (ageMs > target.maxAgeMs) {
            await safeUnlink(filePath);
          }
        } catch (err) {
          console.error(`Failed to inspect ${filePath} during cleanup`, err);
        }
      }
    } catch (err) {
      console.error(`Unable to read ${target.dir} for cleanup`, err);
      continue;
    }
  }
}

function collectActivePaths(): Set<string> {
  const active = new Set<string>();
  for (const upload of uploads.values()) {
    active.add(path.resolve(upload.path));
  }
  for (const job of jobs.values()) {
    if (job.inputPath) active.add(path.resolve(job.inputPath));
    if (job.outputPath) active.add(path.resolve(job.outputPath));
  }
  return active;
}
