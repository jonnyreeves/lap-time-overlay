import { describe, expect, it } from "vitest";
import { parseDaytonaEmail } from "../../../../src/web/client/utils/parseDaytonaEmail.js";

describe("parseDaytonaEmail", () => {
  it("parses lap lines with positions", () => {
    const text = `
    Driver
    Jonny R(John Reeves)

    Time Started: 15/02/2024 19:30

    Fastest Driver\t01:03:076 by Mark Khametov

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
      lapEvents: [{ offset: 57.755, event: "position", value: "11" }],
    });
    expect(result.laps[2]).toMatchObject({ lapNumber: 3, timeSeconds: 51.258 });
    expect(result.sessionFastestLapSeconds).toBeCloseTo(63.076, 3);
    expect(result.classification).toBe(11);
    expect(result.kartNumber).toBeNull();
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

  it("prefers the race position over the final lap position", () => {
    const text = `
    Club Speed Event

    Driver
    Jonny R(John Reeves)

    Race Position
    2nd Place

    Kart No:
    143

    Heat Type (DMAX Sprint)
    Time Printed 30/12/2025 18:53
    Time Started 30/12/2025 18:40
    Laps Completed 11
    Best Laptime 00:47:528
    Average Laptime 00:50:383
    Top Average Speed 68.27 km/hr
    Average Speed 64.31 km/hr
    Fastest Driver 00:47:461 by JB
    Track Layout
    GP Circuit

    Track Length 900 meter
    Track Lap Record 00:44:861 by James Baldwin
    Best Laptime Today Best Lap of the Day: 47.147 seconds by Thomas Mcmurray
    Pos Kart Racer Best Lap #Lap Avg. Gap
    1 55 JB 00:47:461 12 00:51:582 -
    2 143 Jonny R 00:47:528 11 00:50:383 0.067
    3 141 Alex Read 00:47:586 11 00:50:216 0.125
    4 146 Stephanie Walt... 00:47:994 12 00:49:533 0.533
    5 140 Jamie French 00:48:029 12 00:50:533 0.568
    6 148 Spencer Roest 00:48:073 12 00:49:646 0.612
    7 132 Robert Seaman 00:48:336 11 00:50:552 0.875
    8 51 Michael Weekes 00:48:549 11 00:50:780 1.088
    9 144 Berke Nart Aca... 00:48:594 12 00:52:081 1.133
    10 131 Eric Walker 00:48:971 11 00:50:772 1.510
    11 133 Ricky Bobby 00:49:243 11 00:54:419 1.782
    12 54 Marc Jones 00:49:555 11 00:54:048 2.094
    13 145 H -Dave Cowan 00:49:768 10 00:55:254 2.307
    14 57 Steven Long 00:50:209 10 00:53:690 2.748
    15 149 Jake Ford 00:50:332 11 00:54:230 2.871
    16 59 Harvey Packman 00:50:932 9 01:05:376 3.471
    17 150 Younes Lachaal 00:51:324 11 00:56:271 3.863
    18 138 Harry Payne 00:53:609 11 00:58:109 6.148
    19 130 Jacob M 00:54:591 10 01:02:635 7.130

    (By Best Lap Time)
    01 0:49:328 [2]
    02 0:50:435 [2]
    03 0:47:528 [1]
    04 0:48:242 [1]
    05 0:54:798 [1]
    06 0:55:115 [1]
    07 0:49:123 [1]
    08 0:48:287 [1]
    09 0:48:501 [1]
    10 0:53:244 [1]
    11 0:48:557 [1]
    `;

    const result = parseDaytonaEmail(text);

    expect(result.laps).toHaveLength(11);
    expect(result.classification).toBe(2);
    expect(result.kartNumber).toBe("143");
  });

  it("parses lap lines that wrap into multiple columns", () => {
    const text = `
    Club Speed Event
    Driver Jonny R(John Reeves)

    Time Started 12/07/2025 16:13

    (By Position)
    01 0:52:737 [12]    25 0:50:604 [11]
    02 0:50:434 [11]    26 0:50:545 [11]
    03 0:50:671 [11]    27 0:52:383 [11]
    04 0:50:537 [10]    28 0:50:034 [11]
    05 0:49:999 [10]    29 0:50:424 [11]
    06 0:49:972 [10]    30 0:51:541 [11]
    07 0:51:259 [10]    31 0:50:427 [11]
    08 0:50:126 [11]    32 0:55:890 [11]
    09 0:49:785 [11]    33 0:50:611 [11]
    10 0:49:945 [11]    34 0:50:249 [11]
    11 0:49:793 [11]    35 0:50:779 [11]
    12 0:50:123 [11]    36 0:51:919 [11]
    13 0:50:389 [11]    37 0:50:635 [11]
    14 0:49:973 [11]    38 0:51:229 [11]
    15 0:50:507 [11]    39 0:51:877 [11]
    16 0:50:879 [11]    40 0:56:639 [11]
    17 0:50:363 [11]    41 1:30:506 [10]
    18 0:53:462 [10]    42 0:55:108 [10]
    19 0:50:918 [10]    43 0:51:156 [10]
    20 0:51:985 [11]    44 0:50:083 [10]
    21 0:50:751 [11]    45 0:50:286 [10]
    22 0:50:691 [10]    46 0:50:209 [10]
    23 0:52:050 [10]    47 0:50:338 [10]
    24 0:53:428 [11]
    `;

    const result = parseDaytonaEmail(text);

    expect(result.laps).toHaveLength(47);
    expect(result.classification).toBe(10);
    expect(result.sessionDate).toBe("2025-07-12");
    expect(result.sessionTime).toBe("16:13");

    const lap25 = result.laps.find((lap) => lap.lapNumber === 25);
    expect(lap25).toMatchObject({
      timeSeconds: 50.604,
      lapEvents: [{ offset: 50.604, event: "position", value: "11" }],
    });

    const lap41 = result.laps.find((lap) => lap.lapNumber === 41);
    expect(lap41?.timeSeconds).toBeCloseTo(90.506, 3);
    expect(lap41?.lapEvents?.[0]?.value).toBe("10");

    expect(result.laps[0]?.lapNumber).toBe(1);
    expect(result.laps[result.laps.length - 1]?.lapNumber).toBe(47);
  });
});
