import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

export type HardwareBackend = "qsv" | "vaapi" | "none";

export interface HardwareProbeDetails {
  hasDri: boolean;
  hasRenderD128: boolean;
  hasCard0: boolean;
  ffmpegHasHwaccel: { qsv: boolean; vaapi: boolean };
  ffmpegHasEncoder: {
    h264_qsv: boolean;
    hevc_qsv: boolean;
    h264_vaapi: boolean;
    hevc_vaapi: boolean;
  };
  probeErrors: string[];
}

export interface HardwareProbeResult {
  available: boolean;
  backend: HardwareBackend;
  details: HardwareProbeDetails;
}

export interface HardwareProbeSnapshot {
  result: HardwareProbeResult;
  probing: boolean;
}

type CommandResult = {
  stdout: string;
  stderr: string;
  code: number | null;
  timedOut: boolean;
  error?: Error;
};

type CommandRunner = (args: string[], timeoutMs: number) => Promise<CommandResult>;

const DEFAULT_DETAILS: HardwareProbeDetails = {
  hasDri: false,
  hasRenderD128: false,
  hasCard0: false,
  ffmpegHasHwaccel: { qsv: false, vaapi: false },
  ffmpegHasEncoder: {
    h264_qsv: false,
    hevc_qsv: false,
    h264_vaapi: false,
    hevc_vaapi: false,
  },
  probeErrors: [],
};

const DEFAULT_RESULT: HardwareProbeResult = {
  available: false,
  backend: "none",
  details: DEFAULT_DETAILS,
};

let cachedResult: HardwareProbeResult | null = null;
let probePromise: Promise<HardwareProbeResult> | null = null;
let hasLoggedResult = false;

function parseLines(output: string): string[] {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseHwaccelList(output: string): { qsv: boolean; vaapi: boolean } {
  const lines = parseLines(output);
  const entries = new Set(lines.map((line) => line.toLowerCase()));
  return {
    qsv: entries.has("qsv"),
    vaapi: entries.has("vaapi"),
  };
}

export function parseEncoderList(output: string): HardwareProbeDetails["ffmpegHasEncoder"] {
  const lines = parseLines(output);
  const encoders = new Set<string>();
  for (const line of lines) {
    const match = line.match(/^[A-Z\.]+\s+([a-z0-9_]+)/i);
    if (match?.[1]) {
      encoders.add(match[1].toLowerCase());
    }
  }
  return {
    h264_qsv: encoders.has("h264_qsv"),
    hevc_qsv: encoders.has("hevc_qsv"),
    h264_vaapi: encoders.has("h264_vaapi"),
    hevc_vaapi: encoders.has("hevc_vaapi"),
  };
}

async function checkReadable(path: string): Promise<boolean> {
  try {
    await fs.access(path, fsConstants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function runCommand(args: string[], timeoutMs: number): Promise<CommandResult> {
  return await new Promise<CommandResult>((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    const child = spawn(args[0] ?? "", args.slice(1));

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      resolve({ stdout, stderr, code: null, timedOut: true });
    }, timeoutMs);

    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, code: null, timedOut: false, error });
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, code, timedOut: false });
    });
  });
}

async function runProbe({ runner = runCommand }: { runner?: CommandRunner } = {}): Promise<HardwareProbeResult> {
  const probeErrors: string[] = [];
  const details: HardwareProbeDetails = {
    ...DEFAULT_DETAILS,
    probeErrors,
  };

  details.hasRenderD128 = await checkReadable("/dev/dri/renderD128");
  details.hasCard0 = await checkReadable("/dev/dri/card0");
  details.hasDri = details.hasRenderD128 || details.hasCard0;

  const hwaccelResult = await runner(["ffmpeg", "-hide_banner", "-hwaccels"], 6000);
  if (hwaccelResult.timedOut) {
    probeErrors.push("ffmpeg -hwaccels timed out");
  } else if (hwaccelResult.error) {
    probeErrors.push(`ffmpeg -hwaccels failed to start: ${hwaccelResult.error.message}`);
  }
  details.ffmpegHasHwaccel = parseHwaccelList(hwaccelResult.stdout || hwaccelResult.stderr);
  if (!details.ffmpegHasHwaccel.qsv && !details.ffmpegHasHwaccel.vaapi) {
    probeErrors.push("ffmpeg does not list qsv/vaapi hwaccels");
  }

  const encoderResult = await runner(["ffmpeg", "-hide_banner", "-encoders"], 6000);
  if (encoderResult.timedOut) {
    probeErrors.push("ffmpeg -encoders timed out");
  } else if (encoderResult.error) {
    probeErrors.push(`ffmpeg -encoders failed to start: ${encoderResult.error.message}`);
  }
  details.ffmpegHasEncoder = parseEncoderList(encoderResult.stdout || encoderResult.stderr);

  let qsvProof = false;
  let vaapiProof = false;

  if (
    details.ffmpegHasEncoder.h264_qsv ||
    details.ffmpegHasEncoder.hevc_qsv ||
    details.ffmpegHasHwaccel.qsv
  ) {
    const qsvResult = await runner(
      [
        "ffmpeg",
        "-hide_banner",
        "-f",
        "lavfi",
        "-i",
        "testsrc2=size=128x128:rate=30:duration=1",
        "-c:v",
        "h264_qsv",
        "-f",
        "null",
        "-",
      ],
      6000
    );
    qsvProof = !qsvResult.timedOut && !qsvResult.error && qsvResult.code === 0;
    if (!qsvProof) {
      const reason = qsvResult.timedOut
        ? "timed out"
        : qsvResult.code != null
          ? `exit ${qsvResult.code}`
          : "failed";
      probeErrors.push(`qsv probe failed (${reason})`);
    }
  }

  if (
    details.ffmpegHasEncoder.h264_vaapi ||
    details.ffmpegHasEncoder.hevc_vaapi ||
    details.ffmpegHasHwaccel.vaapi
  ) {
    if (!details.hasRenderD128) {
      probeErrors.push("VA-API encoders detected but /dev/dri/renderD128 is not readable");
    } else {
      const vaResult = await runner(
        [
          "ffmpeg",
          "-hide_banner",
          "-init_hw_device",
          "vaapi=va:/dev/dri/renderD128",
          "-filter_hw_device",
          "va",
          "-f",
          "lavfi",
          "-i",
          "testsrc2=size=128x128:rate=30:duration=1",
          "-vf",
          "format=nv12,hwupload",
          "-c:v",
          "h264_vaapi",
          "-f",
          "null",
          "-",
        ],
        6000
      );
      vaapiProof = !vaResult.timedOut && !vaResult.error && vaResult.code === 0;
      if (!vaapiProof) {
        const reason = vaResult.timedOut
          ? "timed out"
          : vaResult.code != null
            ? `exit ${vaResult.code}`
            : "failed";
        probeErrors.push(`vaapi probe failed (${reason})`);
      }
    }
  }

  const backend: HardwareBackend = qsvProof ? "qsv" : vaapiProof ? "vaapi" : "none";
  const available = backend !== "none";

  const result: HardwareProbeResult = {
    available,
    backend,
    details,
  };

  return result;
}

function logProbeResult(result: HardwareProbeResult): void {
  if (hasLoggedResult) return;
  hasLoggedResult = true;
  const { backend, available } = result;
  console.info("Hardware encoding probe", {
    available,
    backend,
    hasDri: result.details.hasDri,
    hasRenderD128: result.details.hasRenderD128,
    hasCard0: result.details.hasCard0,
    ffmpegHasHwaccel: result.details.ffmpegHasHwaccel,
    ffmpegHasEncoder: result.details.ffmpegHasEncoder,
    probeErrors: result.details.probeErrors,
  });
}

export async function startHardwareProbe(options?: { force?: boolean; runner?: CommandRunner }): Promise<HardwareProbeResult> {
  if (cachedResult && !options?.force) {
    return cachedResult;
  }
  if (probePromise && !options?.force) {
    return probePromise;
  }

  const promise = runProbe({ runner: options?.runner });
  const tracked = promise.then((result) => {
    cachedResult = result;
    probePromise = null;
    if (!options?.force) {
      logProbeResult(result);
    }
    return result;
  });

  if (!options?.force) {
    probePromise = tracked;
  }

  return tracked;
}

export async function ensureHardwareProbe(): Promise<HardwareProbeResult> {
  if (cachedResult) return cachedResult;
  return startHardwareProbe();
}

export function getHardwareProbeSnapshot(): HardwareProbeSnapshot {
  return {
    result: cachedResult ?? DEFAULT_RESULT,
    probing: Boolean(probePromise),
  };
}

export function resetHardwareProbeForTests(): void {
  cachedResult = null;
  probePromise = null;
  hasLoggedResult = false;
}
