import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildEncoderPlansFromProbe,
  resetHardwareEncodingForTests,
  runEncodingAttempts,
  type VideoEncoderPlan,
} from "../../../src/web/video/hardwareEncoding.js";
import type { HardwareProbeResult } from "../../../src/video/hwProbe.js";

const baseDetails = {
  hasDri: true,
  hasRenderD128: true,
  hasCard0: false,
  ffmpegHasHwaccel: { qsv: true, vaapi: true },
  ffmpegHasEncoder: { h264_qsv: true, hevc_qsv: true, h264_vaapi: true, hevc_vaapi: true },
  probeErrors: [] as string[],
};

describe("hardwareEncoding plans", () => {
  afterEach(() => {
    resetHardwareEncodingForTests();
    vi.restoreAllMocks();
  });

  it("prefers qsv plan when available and preferred", () => {
    const probe: HardwareProbeResult = {
      available: true,
      backend: "qsv",
      details: baseDetails,
    };
    const plans = buildEncoderPlansFromProbe({
      probe,
      preferHardwareEncoding: true,
      settings: { codec: "h264", preset: "medium", crf: 23 },
    });
    expect(plans.attemptedHardware).toBe(true);
    expect(plans.primary.videoCodec).toBe("h264_qsv");
  });

  it("uses CPU plan when preference is disabled", () => {
    const probe: HardwareProbeResult = {
      available: true,
      backend: "qsv",
      details: baseDetails,
    };
    const plans = buildEncoderPlansFromProbe({
      probe,
      preferHardwareEncoding: false,
      settings: { codec: "h264", preset: "medium", crf: 23 },
    });
    expect(plans.attemptedHardware).toBe(false);
    expect(plans.primary.videoCodec).toBe("libx264");
  });

  it("falls back to CPU and logs when hardware encode fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const gpuPlan: VideoEncoderPlan = {
      label: "gpu",
      backend: "qsv",
      isHardware: true,
      videoCodec: "h264_qsv",
      videoQualityOptions: [],
      extraOutputOptions: [],
    };
    const cpuPlan: VideoEncoderPlan = {
      label: "cpu",
      backend: "none",
      isHardware: false,
      videoCodec: "libx264",
      videoQualityOptions: [],
      extraOutputOptions: [],
    };
    const executed: string[] = [];

    await runEncodingAttempts({
      attempts: [
        { plan: gpuPlan, isHardware: true, backend: "qsv", collectStderr: () => "stderr" },
        { plan: cpuPlan, isHardware: false, backend: "none" },
      ],
      execute: async (attempt) => {
        executed.push(attempt.plan.label);
        if (attempt.isHardware) {
          throw new Error("gpu failed");
        }
      },
    });

    expect(executed).toEqual(["gpu", "cpu"]);
    expect(warnSpy).toHaveBeenCalled();
  });
});
