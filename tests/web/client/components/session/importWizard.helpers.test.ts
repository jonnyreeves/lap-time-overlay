import { describe, expect, it } from "vitest";
import {
  buildAlphaTimingSessionLabel,
  buildDaytonaSessionLabel,
  inferDaytonaKartTypeName,
} from "../../../../../src/web/client/components/session/importWizard/helpers.js";

describe("importWizard helpers", () => {
  it("builds Alpha Timing session labels from parsed session options", () => {
    expect(
      buildAlphaTimingSessionLabel({
        sessionUrl: "https://results.alphatiming.co.uk/buckmore/e/363264/s/751500",
        title: "30 Minute Karting Session (16+)",
        sessionDate: "2026-03-14",
        sessionTime: "18:23",
      })
    ).toBe("2026-03-14 • 18:23 • 30 Minute Karting Session (16+)");
  });

  it("keeps the Daytona imported marker in labels", () => {
    expect(
      buildDaytonaSessionLabel({
        heatNo: "81389",
        activityType: "DMAX Practice 20mins - Kart 149",
        sessionDate: "2026-03-11",
        sessionTime: "19:30",
        kartNumber: "149",
        classification: 3,
        alreadyImported: true,
      })
    ).toContain("Already imported");
  });

  it("infers Daytona kart type names from activity labels", () => {
    expect(inferDaytonaKartTypeName("DMAX Practice 20mins - Kart 149")).toBe("DMAX");
    expect(inferDaytonaKartTypeName("Sodi Sprint Race - Kart 12")).toBe("Sodi");
  });
});
