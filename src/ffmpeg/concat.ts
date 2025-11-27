import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";

export async function concatVideos(paths: string[]): Promise<{
  outputPath: string;
  cleanup: () => Promise<void>;
}> {
  if (paths.length === 0) {
    throw new Error("Provide at least one video path to concatenate");
  }

  if (paths.length === 1) {
    return { outputPath: paths[0], cleanup: async () => {} };
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "lap-overlay-"));
  const listPath = path.join(tempDir, "concat.txt");
  const outputPath = path.join(tempDir, "combined.mp4");

  const listContent = paths
    .map((filePath) => {
      const escaped = filePath.replace(/'/g, "''");
      return `file '${escaped}'`;
    })
    .join("\n");

  await fs.writeFile(listPath, listContent, "utf8");

  const cleanup = async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  };

  try {
    await runConcat(listPath, outputPath);
    return { outputPath, cleanup };
  } catch (err) {
    await cleanup();
    throw err;
  }
}

async function runConcat(listPath: string, outputPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg()
      .input(listPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-c", "copy", "-fflags", "+genpts"])
      .output(outputPath);

    cmd
      .on("end", () => resolve())
      .on("error", (err) => reject(err));

    cmd.run();
  });
}
