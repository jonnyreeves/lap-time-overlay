import { describe, expect, it } from "vitest";
import { parseDaytonaEmail } from "../../../../src/web/client/utils/parseDaytonaEmail.js";

describe("parseDaytonaEmail", () => {
  it("parses lap lines with positions", () => {
    const text = `
    Driver
    Jonny R(John Reeves)

    Time Started: 15/02/2024 19:30

    (By Best Lap Time)
    01 0:57:755 [11]
    02 0:52:798 [10]
    03 0:51:258 [11]
    `;

    const result = parseDaytonaEmail(text);
    expect(result.provider).toBe("daytona");
    expect(result.laps).toHaveLength(3);
    expect(result.sessionDate).toBe("2024-02-15");
    expect(result.laps[0]).toMatchObject({
      lapNumber: 1,
      timeSeconds: 57.755,
      lapEvents: [{ offset: 0, event: "position", value: "11" }],
    });
    expect(result.laps[2]).toMatchObject({ lapNumber: 3, timeSeconds: 51.258 });
  });

  it("parses time started date when separated by tabs", () => {
    const text = `
    Club Speed Event
    Time Started\t23/11/2025 13:28

    (By Best Lap Time)
    01 0:57:755 [11]
    02 0:52:798 [10]
    03 0:51:258 [11]
    `;

    const result = parseDaytonaEmail(text);
    expect(result.sessionDate).toBe("2025-11-23");
    expect(result.sessionTime).toBe("13:28");
  });
});
