import { afterEach, describe, expect, it, vi } from "vitest";
import { importTrackSessionFromSource, isUrlImportSource } from "../../../src/web/sessionImport/service.js";
import { SessionImportError } from "../../../src/web/sessionImport/types.js";

const resultPageFixture = `
Alpha Timing
Buckmore Park Karting  30 Minute Karting Session (16+)  Practice
30 Minute Karting Session (16+) 14 March 2026
Best Lap
51.179 Robert Seaman (lap 18)
Info
Start
18:23
Pos No Name Laps Time Avg Speed Gap Best On Best S1 Best S2 Best S3 Ultimate
1 6 7 Robert Seaman 34 30:20.982 41.77 MPH 51.179 18 21.037 14.887 14.997 50.921
2 6 16 John Reeves 34 30:21.433 41.76 MPH 0.117 51.296 30 21.157 15.051 15.080 51.288
Notifications
`;

const laptimesPageFixture = `
<table class="at-lap-chart-legend-table">
  <tbody>
    <tr>
      <td>
        <div class="at-lap-chart-legend-table-competitor">
          <span class='at-number-plate'>7</span>
          <span>Robert Seaman</span>
        </div>
      </td>
      <td class="at-lap-chart-legend-table-laptime"><div class="">51.620</div></td>
      <td class="at-lap-chart-legend-table-laptime"><div class="">51.440</div></td>
    </tr>
    <tr>
      <td>
        <div class="at-lap-chart-legend-table-competitor">
          <span class='at-number-plate'>16</span>
          <span>John Reeves</span>
        </div>
      </td>
      <td class="at-lap-chart-legend-table-laptime"><div class="">52.111</div></td>
      <td class="at-lap-chart-legend-table-laptime"><div class="">51.900</div></td>
    </tr>
  </tbody>
</table>
`;

function makeMockResponse(url: string, body: string, setCookies: string[] = []): Response {
  return {
    ok: true,
    status: 200,
    url,
    headers: {
      getSetCookie: () => setCookies,
      get: (name: string) => {
        if (name.toLowerCase() !== "set-cookie") return null;
        if (setCookies.length === 0) return null;
        return setCookies.join(", ");
      },
    } as unknown as Headers,
    text: async () => body,
  } as Response;
}

describe("session import service", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("detects supported Alpha Timing session URLs", () => {
    expect(
      isUrlImportSource("https://results.alphatiming.co.uk/buckmore/e/360655/s/745987")
    ).toBe(true);
    expect(
      isUrlImportSource("https://results.alphatiming.co.uk/buckmore/e/360655/s/745987/result")
    ).toBe(true);
    expect(
      isUrlImportSource("Import this please: https://results.alphatiming.co.uk/buckmore/e/360655/s/745987/result")
    ).toBe(true);
    expect(
      isUrlImportSource("https://results.alphatiming.co.uk/buckmore/e/360655/s\n/745987/result")
    ).toBe(true);
    expect(isUrlImportSource("https://example.com/somewhere")).toBe(false);
  });

  it("rejects unsupported sources", async () => {
    await expect(importTrackSessionFromSource("https://example.com/somewhere")).rejects.toThrow(
      SessionImportError
    );
  });

  it("imports and parses Alpha Timing result/laptimes pages", async () => {
    const base = "https://results.alphatiming.co.uk/buckmore/e/360655/s/745987";
    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url === "https://results.alphatiming.co.uk/") {
        return makeMockResponse(url, "<html>home</html>", ["__dt=token123; Path=/; HttpOnly"]);
      }
      if (url === base) {
        return makeMockResponse(url, "<html>session</html>", ["__dt=token123; Path=/; HttpOnly"]);
      }
      if (url.endsWith("/result")) {
        return makeMockResponse(url, resultPageFixture);
      }
      if (url.endsWith("/laptimes")) {
        return makeMockResponse(url, laptimesPageFixture);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const imported = await importTrackSessionFromSource(
      base
    );

    expect(imported.provider).toBe("alphatiming");
    expect(imported.sessionFormat).toBe("Practice");
    expect(imported.sessionDate).toBe("2026-03-14");
    expect(imported.sessionTime).toBe("18:23");
    expect(imported.sessionFastestLapSeconds).toBeCloseTo(51.179, 3);
    expect(imported.drivers).toHaveLength(2);

    const john = imported.drivers.find((driver) => driver.name === "John Reeves");
    expect(john?.classification).toBe(2);
    expect(john?.kartNumber).toBe("16");
    expect(john?.laps).toHaveLength(2);
    expect(john?.laps[0]).toMatchObject({
      lapNumber: 1,
      timeSeconds: 52.111,
    });
    expect(fetchMock).toHaveBeenCalledWith("https://results.alphatiming.co.uk/", expect.anything());
    expect(fetchMock).toHaveBeenCalledWith(base, expect.anything());
  });
});
