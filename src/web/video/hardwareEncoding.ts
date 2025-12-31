import {
  ensureHardwareProbe,
  getHardwareProbeSnapshot,
  startHardwareProbe,
  type HardwareBackend,
  type HardwareProbeDetails,
  type HardwareProbeResult,
} from "../../video/hwProbe.js";
import {
  getPreferHardwareEncoding,
  setPreferHardwareEncoding,
} from "../settings/videoEncoding.js";

type TargetCodec = "h264" | "h265";
type BackendEnum = "QSV" | "VAAPI" | "NONE";

export interface EncoderSettings {
  codec: TargetCodec;
  preset: string;
  crf: number;
}

export interface VideoEncoderPlan {
  label: string;
  backend: HardwareBackend;
  isHardware: boolean;
  videoCodec: string;
  videoQualityOptions: string[];
  inputOptions?: string[];
  extraOutputOptions?: string[];
  transformFilterGraph?: (
    filterGraph: string[],
    outputLabel: string
  ) => { filterGraph: string[]; outputLabel: string };
}

export interface EncoderPlanResult {
  primary: VideoEncoderPlan;
  fallback: VideoEncoderPlan;
  attemptedHardware: boolean;
  backend: HardwareBackend;
  circuitBreakerActive: boolean;
  disabledUntil: number | null;
  preferHardwareEncoding: boolean;
}

export interface VideoAccelerationStatus {
  available: boolean;
  backend: BackendEnum;
  effectiveBackend: BackendEnum;
  preferHardwareEncoding: boolean;
  probing: boolean;
  circuitBreakerActive: boolean;
  circuitResetAt: string | null;
  details: HardwareProbeDetails;
}

const FAILURE_THRESHOLD = 2;
const CIRCUIT_COOLDOWN_MS = 10 * 60 * 1000;

let consecutiveHardwareFailures = 0;
let hardwareDisabledUntil: number | null = null;

function truncate(stderr: string | undefined, limit = 800): string | undefined {
  if (!stderr) return stderr;
  if (stderr.length <= limit) return stderr;
  return `${stderr.slice(-limit)}`;
}

function resetCircuit(now = Date.now()): void {
  if (hardwareDisabledUntil && hardwareDisabledUntil <= now) {
    hardwareDisabledUntil = null;
    consecutiveHardwareFailures = 0;
  }
}

function markHardwareFailure(
  backend: HardwareBackend,
  error: unknown,
  stderr?: string,
  now = Date.now()
): void {
  consecutiveHardwareFailures += 1;
  const stderrExcerpt = truncate(stderr);
  const errorMessage =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";

  if (consecutiveHardwareFailures >= FAILURE_THRESHOLD) {
    hardwareDisabledUntil = now + CIRCUIT_COOLDOWN_MS;
    consecutiveHardwareFailures = 0;
  }

  console.warn("Hardware encode failed, falling back to CPU", {
    backend,
    error: errorMessage,
    stderr: stderrExcerpt,
    disabledUntil: hardwareDisabledUntil,
  });
}

function markHardwareSuccess(): void {
  consecutiveHardwareFailures = 0;
  hardwareDisabledUntil = null;
}

function getCircuitState(now = Date.now()): { circuitBreakerActive: boolean; resetAt: number | null } {
  resetCircuit(now);
  return {
    circuitBreakerActive: Boolean(hardwareDisabledUntil) && (hardwareDisabledUntil as number) > now,
    resetAt: hardwareDisabledUntil && hardwareDisabledUntil > now ? hardwareDisabledUntil : null,
  };
}

function cloneDetails(details: HardwareProbeDetails): HardwareProbeDetails {
  return {
    ...details,
    ffmpegHasHwaccel: { ...details.ffmpegHasHwaccel },
    ffmpegHasEncoder: { ...details.ffmpegHasEncoder },
    probeErrors: [...details.probeErrors],
  };
}

function encoderAvailableForCodec(backend: HardwareBackend, codec: TargetCodec, details: HardwareProbeDetails): boolean {
  if (backend === "qsv") {
    return codec === "h265" ? details.ffmpegHasEncoder.hevc_qsv : details.ffmpegHasEncoder.h264_qsv;
  }
  if (backend === "vaapi") {
    if (codec === "h265") return details.ffmpegHasEncoder.hevc_vaapi && details.hasRenderD128;
    return details.ffmpegHasEncoder.h264_vaapi && details.hasRenderD128;
  }
  return false;
}

function mapQsvPreset(preset: string): string {
  if (preset === "ultrafast") return "veryfast";
  return preset;
}

function buildCpuPlan({ codec, preset, crf }: EncoderSettings): VideoEncoderPlan {
  const videoCodec = codec === "h265" ? "libx265" : "libx264";
  return {
    label: "cpu",
    backend: "none",
    isHardware: false,
    videoCodec,
    videoQualityOptions: ["-preset", preset, "-crf", String(crf)],
    extraOutputOptions: [],
  };
}

function buildHardwarePlan(
  backend: HardwareBackend,
  settings: EncoderSettings,
  details: HardwareProbeDetails
): VideoEncoderPlan | null {
  if (!encoderAvailableForCodec(backend, settings.codec, details)) return null;

  if (backend === "qsv") {
    const codec = settings.codec === "h265" ? "hevc_qsv" : "h264_qsv";
    return {
      label: "qsv",
      backend: "qsv",
      isHardware: true,
      videoCodec: codec,
      videoQualityOptions: ["-preset", mapQsvPreset(settings.preset), "-global_quality", String(settings.crf)],
      extraOutputOptions: [],
    };
  }

  if (backend === "vaapi") {
    const codec = settings.codec === "h265" ? "hevc_vaapi" : "h264_vaapi";
    const transformFilterGraph = (
      filterGraph: string[],
      outputLabel: string
    ): { filterGraph: string[]; outputLabel: string } => {
      const source = outputLabel.startsWith("[") ? outputLabel : `[${outputLabel}]`;
      const nextLabel = `${outputLabel}_vaapi`;
      return {
        filterGraph: [...filterGraph, `${source} format=nv12,hwupload [${nextLabel}]`],
        outputLabel: nextLabel,
      };
    };

    return {
      label: "vaapi",
      backend: "vaapi",
      isHardware: true,
      videoCodec: codec,
      inputOptions: ["-init_hw_device", "vaapi=va:/dev/dri/renderD128", "-filter_hw_device", "va"],
      videoQualityOptions: ["-qp", String(settings.crf)],
      extraOutputOptions: [],
      transformFilterGraph,
    };
  }

  return null;
}

export function buildEncoderPlansFromProbe({
  probe,
  preferHardwareEncoding,
  settings,
  now = Date.now(),
}: {
  probe: HardwareProbeResult;
  preferHardwareEncoding: boolean;
  settings: EncoderSettings;
  now?: number;
}): EncoderPlanResult {
  const circuit = getCircuitState(now);
  const cpuPlan = buildCpuPlan(settings);
  const canUseHardware = preferHardwareEncoding && probe.available && !circuit.circuitBreakerActive;

  const hardwarePlan = canUseHardware ? buildHardwarePlan(probe.backend, settings, probe.details) : null;
  const attemptedHardware = Boolean(hardwarePlan);
  const primary = hardwarePlan ?? cpuPlan;
  const fallback = hardwarePlan ? cpuPlan : cpuPlan;

  return {
    primary,
    fallback,
    attemptedHardware,
    backend: hardwarePlan?.backend ?? "none",
    circuitBreakerActive: circuit.circuitBreakerActive,
    disabledUntil: circuit.resetAt,
    preferHardwareEncoding,
  };
}

function toGraphQLBackend(backend: HardwareBackend): BackendEnum {
  if (backend === "qsv") return "QSV";
  if (backend === "vaapi") return "VAAPI";
  return "NONE";
}

export async function prepareEncoderPlans(settings: EncoderSettings): Promise<EncoderPlanResult> {
  const [probe, preferHardwareEncoding] = await Promise.all([ensureHardwareProbe(), Promise.resolve(getPreferHardwareEncoding())]);
  return buildEncoderPlansFromProbe({ probe, preferHardwareEncoding, settings });
}

export async function runEncodingAttempts({
  attempts,
  execute,
  now = Date.now(),
}: {
  attempts: { plan: VideoEncoderPlan; isHardware: boolean; backend: HardwareBackend; collectStderr?: () => string }[];
  execute: (attempt: { plan: VideoEncoderPlan; isHardware: boolean; backend: HardwareBackend }) => Promise<void>;
  now?: number;
}): Promise<void> {
  for (const attempt of attempts) {
    try {
      await execute(attempt);
      if (attempt.isHardware) {
        markHardwareSuccess();
      }
      return;
    } catch (err) {
      if (attempt.isHardware) {
        markHardwareFailure(attempt.backend, err, attempt.collectStderr?.(), now);
        continue;
      }
      throw err;
    }
  }
}

export async function getVideoAccelerationStatus(): Promise<VideoAccelerationStatus> {
  startHardwareProbe().catch((err) => {
    console.warn("Hardware probe failed to start", err);
  });
  const snapshot = getHardwareProbeSnapshot();
  const circuit = getCircuitState();
  const preferHardwareEncoding = getPreferHardwareEncoding();
  const backend = toGraphQLBackend(snapshot.result.backend);
  const effectiveBackend =
    preferHardwareEncoding && snapshot.result.available && !circuit.circuitBreakerActive
      ? backend
      : "NONE";
  const circuitResetAt = circuit.resetAt ? new Date(circuit.resetAt).toISOString() : null;
  return {
    available: snapshot.result.available,
    backend,
    effectiveBackend,
    preferHardwareEncoding,
    probing: snapshot.probing,
    circuitBreakerActive: circuit.circuitBreakerActive,
    circuitResetAt,
    details: cloneDetails(snapshot.result.details),
  };
}

export async function updateVideoAccelerationPreference(preferHardwareEncoding: boolean): Promise<VideoAccelerationStatus> {
  setPreferHardwareEncoding(preferHardwareEncoding);
  await startHardwareProbe();
  return getVideoAccelerationStatus();
}

export function resetHardwareEncodingForTests(): void {
  consecutiveHardwareFailures = 0;
  hardwareDisabledUntil = null;
}
