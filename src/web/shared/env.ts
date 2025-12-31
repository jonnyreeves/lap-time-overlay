import fs from "node:fs/promises";
import path from "node:path";

const envFiles = [".env.local", ".env"];

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function applyEnvLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;

  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex <= 0) return;

  const key = trimmed.slice(0, separatorIndex).trim();
  const value = stripQuotes(trimmed.slice(separatorIndex + 1));

  if (!key || key in process.env) return;
  process.env[key] = value;
}

export async function loadEnvFiles(): Promise<void> {
  const cwd = process.cwd();
  for (const file of envFiles) {
    const fullPath = path.join(cwd, file);
    try {
      const contents = await fs.readFile(fullPath, "utf8");
      contents.split(/\r?\n/).forEach(applyEnvLine);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn(`Failed to read ${file}`, error);
      }
    }
  }
}
