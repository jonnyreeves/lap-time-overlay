import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchDaytonaClubspeedSessions,
  importDaytonaClubspeedSession,
} from "../../../src/web/sessionImport/service.js";
import type { DaytonaClubspeedCredentials } from "../../../src/web/sessionImport/types.js";

const signInUrl = "https://daytonasp.clubspeedtiming.com/sp_center/SignIn.aspx";
const historyUrl = "https://daytonasp.clubspeedtiming.com/sp_center/RacerHistory.aspx?CustID=MTI5MDkxMA==";
const detailUrl = "https://daytonasp.clubspeedtiming.com/sp_center/HeatDetails.aspx?HeatNo=81389";
const credentials: DaytonaClubspeedCredentials = {
  username: "clubspeed-user",
  password: "clubspeed-pass",
};

const signInHtml = `
<form>
  <input type="hidden" id="__VIEWSTATE" value="/wEPDwU" />
  <input type="hidden" id="__VIEWSTATEGENERATOR" value="8A2E3C17" />
  <input type="hidden" id="__EVENTVALIDATION" value="/wEdAASLk" />
</form>
`;

const historyHtml = `
<table id="dg">
  <tr class="ItemTitle"><td>Activity Type</td></tr>
  <tr class="Normal">
    <td align="left" style="width:20%;"><a href="HeatDetails.aspx?HeatNo=81389">DMAX Sprint - Kart 149</a></td>
    <td align="center">11/03/2026 19:40</td>
    <td align="center" style="width:10%;">1435 (5)</td>
    <td align="center" style="width:10%;">49.411</td>
    <td align="center">3rd</td>
  </tr>
  <tr class="Normal">
    <td align="left" style="width:20%;"><a href="HeatDetails.aspx?HeatNo=81388">DMAX Practice 20mins - Kart 149</a></td>
    <td align="center">11/03/2026 19:30</td>
    <td align="center" style="width:10%;">1430 (5)</td>
    <td align="center" style="width:10%;">49.999</td>
    <td align="center">4th</td>
  </tr>
</table>
`;

const detailHtml = `
<table class="RaceResults">
  <tr class='Top3WinnersRow'><td class='Position' rowspan='3' colspan='2'>Heat Winner:</td><td class='Racername' colspan='5'>Racer<span><a href='RacerHistory.aspx?CustID=1'>Anonymous</a></span></td></tr>
  <tr class='Top3WinnersRow'><td class='BestLap'>Best Lap<span>46.952</span></td><td class='Laps'># of Laps<span>24</span></td></tr>
  <tr class='Top3WinnersRow'><td class='RPM'>ProSkill SCORE<span>1535</span></td></tr>
  <tr class='Top3WinnersRowAlt'><td class='Position' rowspan='3' colspan='2'>2nd Place:</td><td class='Racername' colspan='5'>Racer<span><a href='RacerHistory.aspx?CustID=2'>Anonymous</a></span></td></tr>
  <tr class='Top3WinnersRowAlt'><td class='BestLap'>Best Lap<span>47.139</span></td><td class='Laps'># of Laps<span>24</span></td></tr>
  <tr class='Top3WinnersRowAlt'><td class='RPM'>ProSkill SCORE<span>1275</span></td></tr>
  <tr class='Top3WinnersRow'><td class='Position' rowspan='3' colspan='2'>3rd Place:</td><td class='Racername' colspan='5'>Racer<span><a href='RacerHistory.aspx?CustID=3'>L - Jonny R</a></span></td></tr>
  <tr class='Top3WinnersRow'><td class='BestLap'>Best Lap<span>49.411</span></td><td class='Laps'># of Laps<span>22</span></td></tr>
  <tr class='Top3WinnersRow'><td class='RPM'>ProSkill SCORE<span>1435</span></td></tr>
  <tr class='RegularRow'><td class='Position'><span>4</span></td><td class='Racername'><span><a href='RacerHistory.aspx?CustID=4'>Anonymous</a></span></td><td class='BestLap'><span>50.001</span></td></tr>
</table>
<table class='LapTimesContainer'><tbody><tr>
  <td><table class='LapTimes'><thead><tr><th colspan='2'>Anonymous</th></tr></thead><tbody><tr class='LapTimesRow'><td>1</td><td>47.100 [1]</td></tr><tr class='LapTimesRowAlt'><td>2</td><td>46.952 [1]</td></tr></tbody></table></td>
  <td><table class='LapTimes'><thead><tr><th colspan='2'>L - Jonny R</th></tr></thead><tbody><tr class='LapTimesRow'><td>1</td><td>50.000 [3]</td></tr><tr class='LapTimesRowAlt'><td>2</td><td>49.411 [3]</td></tr></tbody></table></td>
  <td><table class='LapTimes'><thead><tr><th colspan='2'>Anonymous</th></tr></thead><tbody><tr class='LapTimesRow'><td>1</td><td>50.500 [4]</td></tr><tr class='LapTimesRowAlt'><td>2</td><td>50.001 [4]</td></tr></tbody></table></td>
</tr></tbody></table>
`;

const march17HistoryHtml = `
<table id="dg">
  <tr class="Normal">
    <td align="left" style="width:20%;"><a href="HeatDetails.aspx?HeatNo=81463">DMAX Sprint Race - Kart 143</a></td>
    <td align="center">17/03/2026 20:10</td>
    <td align="center" style="width:10%;">1450 (5)</td>
    <td align="center" style="width:10%;">47.464</td>
    <td align="center">7th</td>
  </tr>
  <tr class="Normal">
    <td align="left" style="width:20%;"><a href="HeatDetails.aspx?HeatNo=81462">DMAX Sprint - Kart 143</a></td>
    <td align="center">17/03/2026 20:00</td>
    <td align="center" style="width:10%;">1445 (5)</td>
    <td align="center" style="width:10%;">48.031</td>
    <td align="center">7th</td>
  </tr>
  <tr class="Normal">
    <td align="left" style="width:20%;"><a href="HeatDetails.aspx?HeatNo=81391">DMAX Sprint Race - Kart 134</a></td>
    <td align="center">11/03/2026 20:10</td>
    <td align="center" style="width:10%;">1440 (5)</td>
    <td align="center" style="width:10%;">47.668</td>
    <td align="center">4th</td>
  </tr>
</table>
`;

const fallbackHistoryHtml = `
<table id="dg">
  <tr class="Normal">
    <td align="left" style="width:20%;"><a href="HeatDetails.aspx?HeatNo=90001">Sodi Sprint - Kart 11</a></td>
    <td align="center">12/03/2026 18:00</td>
    <td align="center" style="width:10%;">1400 (5)</td>
    <td align="center" style="width:10%;">51.000</td>
    <td align="center">2nd</td>
  </tr>
</table>
`;

function makeMockResponse(
  url: string,
  body: string,
  options: { status?: number; headers?: Record<string, string>; setCookies?: string[] } = {}
): Response {
  const status = options.status ?? 200;
  const headers = options.headers ?? {};
  const setCookies = options.setCookies ?? [];
  return {
    ok: status >= 200 && status < 300,
    status,
    url,
    headers: {
      getSetCookie: () => setCookies,
      get: (name: string) => {
        if (name.toLowerCase() === "set-cookie") {
          return setCookies.length ? setCookies.join(", ") : null;
        }
        return headers[name.toLowerCase()] ?? headers[name] ?? null;
      },
    } as unknown as Headers,
    text: async () => body,
  } as Response;
}

describe("daytona clubspeed import service", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetches Daytona Club Speed sessions after logging in", async () => {
    const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === signInUrl && (!init?.method || init.method === "GET")) {
        return makeMockResponse(url, signInHtml, {
          setCookies: ["ASP.NET_SessionId=session123; Path=/; HttpOnly"],
        });
      }
      if (url === signInUrl && init?.method === "POST") {
        return makeMockResponse(url, "", {
          status: 302,
          headers: { location: historyUrl },
          setCookies: [".ASPXAUTH=auth123; Path=/; HttpOnly"],
        });
      }
      if (url === historyUrl) {
        return makeMockResponse(url, historyHtml);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const sessions = await fetchDaytonaClubspeedSessions(credentials);

    expect(sessions).toHaveLength(2);
    expect(sessions[0]).toMatchObject({
      activityType: "DMAX Sprint - Kart 149",
      sessionDate: "2026-03-11",
      sessionTime: "19:40",
      kartNumber: "149",
      classification: 3,
    });
  });

  it("imports Daytona heat details and falls back to practice when no later same-day session exists", async () => {
    const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === signInUrl && (!init?.method || init.method === "GET")) {
        return makeMockResponse(url, signInHtml, {
          setCookies: ["ASP.NET_SessionId=session123; Path=/; HttpOnly"],
        });
      }
      if (url === signInUrl && init?.method === "POST") {
        return makeMockResponse(url, "", {
          status: 302,
          headers: { location: historyUrl },
          setCookies: [".ASPXAUTH=auth123; Path=/; HttpOnly"],
        });
      }
      if (url === historyUrl) {
        return makeMockResponse(url, historyHtml);
      }
      if (url === detailUrl) {
        return makeMockResponse(url, detailHtml);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const sessions = await fetchDaytonaClubspeedSessions(credentials);
    const imported = await importDaytonaClubspeedSession(sessions[0]?.heatNo ?? "", credentials);

    expect(imported.provider).toBe("daytona");
    expect(imported.sessionFormat).toBe("Practice");
    expect(imported.kartNumber).toBe("149");
    expect(imported.kartTypeName).toBe("DMAX");
    expect(imported.selfDriverName).toBe("L - Jonny R");
    expect(imported.classification).toBe(3);
    expect(imported.drivers).toHaveLength(3);
    expect(imported.laps).toEqual([
      { lapNumber: 1, timeSeconds: 50, displayTime: "50.000" },
      { lapNumber: 2, timeSeconds: 49.411, displayTime: "49.411" },
    ]);
  });

  it("marks the 2026-03-17 20:00 DMAX Sprint session as qualifying when a 20:10 session follows", async () => {
    const march17DetailUrl = "https://daytonasp.clubspeedtiming.com/sp_center/HeatDetails.aspx?HeatNo=81462";
    const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === signInUrl && (!init?.method || init.method === "GET")) {
        return makeMockResponse(url, signInHtml, {
          setCookies: ["ASP.NET_SessionId=session123; Path=/; HttpOnly"],
        });
      }
      if (url === signInUrl && init?.method === "POST") {
        return makeMockResponse(url, "", {
          status: 302,
          headers: { location: historyUrl },
          setCookies: [".ASPXAUTH=auth123; Path=/; HttpOnly"],
        });
      }
      if (url === historyUrl) {
        return makeMockResponse(url, march17HistoryHtml);
      }
      if (url === march17DetailUrl) {
        return makeMockResponse(
          url,
          detailHtml
            .replace(/81389/g, "81462")
            .replace(/49\.411/g, "48.031")
            .replace(/1435/g, "1445")
        );
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const sessions = await fetchDaytonaClubspeedSessions(credentials);
    const sprintSession = sessions.find((session) => session.activityType === "DMAX Sprint - Kart 143");
    const imported = await importDaytonaClubspeedSession(
      sprintSession?.heatNo ?? "",
      credentials
    );

    expect(imported.sessionDate).toBe("2026-03-17");
    expect(imported.sessionTime).toBe("20:00");
    expect(imported.sessionFormat).toBe("Qualifying");
  });

  it("falls back to practice when the activity title is ambiguous and no preceding session exists", async () => {
    const fallbackDetailUrl = "https://daytonasp.clubspeedtiming.com/sp_center/HeatDetails.aspx?HeatNo=90001";
    const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === signInUrl && (!init?.method || init.method === "GET")) {
        return makeMockResponse(url, signInHtml, {
          setCookies: ["ASP.NET_SessionId=session123; Path=/; HttpOnly"],
        });
      }
      if (url === signInUrl && init?.method === "POST") {
        return makeMockResponse(url, "", {
          status: 302,
          headers: { location: historyUrl },
          setCookies: [".ASPXAUTH=auth123; Path=/; HttpOnly"],
        });
      }
      if (url === historyUrl) {
        return makeMockResponse(url, fallbackHistoryHtml);
      }
      if (url === fallbackDetailUrl) {
        return makeMockResponse(
          url,
          detailHtml
            .replace(/81389/g, "90001")
            .replace(/L - Jonny R/g, "Sodi Driver")
            .replace(/49\.411/g, "51.000")
        );
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const sessions = await fetchDaytonaClubspeedSessions(credentials);
    const imported = await importDaytonaClubspeedSession(sessions[0]?.heatNo ?? "", credentials);

    expect(imported.sessionFormat).toBe("Practice");
    expect(imported.kartTypeName).toBe("Sodi");
  });
});
