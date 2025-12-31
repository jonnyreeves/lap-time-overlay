import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseEncoderList,
  parseHwaccelList,
  resetHardwareProbeForTests,
  startHardwareProbe,
} from "../../src/video/hwProbe.js";

const { accessMock } = vi.hoisted(() => ({
  accessMock: vi.fn(),
}));

const baseCommandResult = { stdout: "", stderr: "", code: 0, timedOut: false as const };

vi.mock("node:fs/promises", () => ({
  __esModule: true,
  default: { access: accessMock },
  access: accessMock,
}));

describe("hwProbe parsing", () => {
  afterEach(() => {
    resetHardwareProbeForTests();
    accessMock.mockReset();
    vi.restoreAllMocks();
  });

  it("parses hwaccel output", () => {
    expect(parseHwaccelList("Hardware acceleration methods:\nqsv\nvaapi\nother\n")).toEqual({
      qsv: true,
      vaapi: true,
    });
  });

  it("parses encoder output", () => {
    expect(
      parseEncoderList(
        `
          V..... h264_qsv
          V..... hevc_qsv
          V..... h264_vaapi
          V..... something_else
        `
      )
    ).toEqual({
      h264_qsv: true,
      hevc_qsv: true,
      h264_vaapi: true,
      hevc_vaapi: false,
    });
  });
});

describe("hwProbe integration", () => {
  afterEach(() => {
    resetHardwareProbeForTests();
    vi.restoreAllMocks();
  });

  it("prefers qsv when vaapi fails", async () => {
    accessMock.mockResolvedValue(undefined);
    const runner = vi.fn(async (args: string[]) => {
      if (args.includes("-hwaccels")) {
        return { ...baseCommandResult, stdout: "qsv\nvaapi\n" };
      }
      if (args.includes("-encoders")) {
        return {
          ...baseCommandResult,
          stdout: " V..... h264_qsv\n V..... h264_vaapi\n",
        };
      }
      if (args.includes("h264_qsv")) {
        return baseCommandResult;
      }
      if (args.includes("h264_vaapi")) {
        return { ...baseCommandResult, code: 1, stderr: "vaapi failed" };
      }
      return baseCommandResult;
    });

    const result = await startHardwareProbe({ runner, force: true });
    expect(result.backend).toBe("qsv");
    expect(result.available).toBe(true);
  });

  it("marks unavailable when devices are missing", async () => {
    accessMock.mockRejectedValue(new Error("missing"));
    const runner = vi.fn(async (args: string[]) => {
      if (args.includes("-hwaccels")) {
        return { ...baseCommandResult, stdout: "vaapi\n" };
      }
      if (args.includes("-encoders")) {
        return { ...baseCommandResult, stdout: " V..... h264_vaapi\n" };
      }
      if (args.includes("h264_vaapi")) {
        return { ...baseCommandResult, code: 1, stderr: "no device" };
      }
      return { ...baseCommandResult, code: 1 };
    });

    const result = await startHardwareProbe({ runner, force: true });
    expect(result.available).toBe(false);
    expect(result.details.hasRenderD128).toBe(false);
  });
});
