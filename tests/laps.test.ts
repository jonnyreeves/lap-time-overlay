import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import { describe, it } from "vitest";
import { parseLapFile } from "../src/laps.js";

function writeTempFile(contents: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lap-tests-"));
  const file = path.join(dir, "laps.txt");
  fs.writeFileSync(file, contents);
  return file;
}

function almostEqual(a: number, b: number, tol = 1e-6) {
  assert(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);
}

describe("parseLapFile", () => {
  it("parses daytona format", () => {
    const sample = `
  01 0:57:755 [11]
  02 0:58:123 [10]
  `;
    const file = writeTempFile(sample);
    const laps = parseLapFile(file, "daytona");
    assert.strictEqual(laps.length, 2);
    assert.strictEqual(laps[0].number, 1);
    almostEqual(laps[0].durationS, 57.755);
    assert.strictEqual(laps[0].position, 11);
    assert.deepStrictEqual(laps[0].positionChanges, [{ atS: 0, position: 11 }]);
    almostEqual(laps[0].startS, 0);

    assert.strictEqual(laps[1].number, 2);
    almostEqual(laps[1].durationS, 58.123);
    assert.strictEqual(laps[1].position, 10);
    assert.deepStrictEqual(laps[1].positionChanges, [{ atS: 0, position: 10 }]);
    almostEqual(laps[1].startS, 57.755);
  });

  it("parses teamsport format for a named driver", () => {
    const sample = `
    \tJonny\tCondog\tGavin Hawkins
    1\t1:08.917\t1:45.082\t1:45.443
    2\t49.379\t51.748\t50.610
    3\t46.538\t47.217\t48.757
    4\t45.465\t47.958\t1:01.073
    5\t47.902\t48.448\t51.923
    6\t59.527\t1:03.010\t1:02.660
    7\t52.755\t49.765\t48.582
    8\t47.942\t46.383\t51.032
    9\t45.516\t46.259\t47.431
    10\t47.099\t48.255\t49.759
    11\t59.161\t1:00.015\t1:14.211
    12\t50.953\t51.424\t1:06.011
    13\t1:01.843\t1:01.975\t51.403
  `;
    const file = writeTempFile(sample);
    const laps = parseLapFile(file, "teamsport", "Jonny");
    assert.strictEqual(laps.length, 13);
    almostEqual(laps[0].durationS, 68.917);
    almostEqual(laps[1].durationS, 49.379);
    almostEqual(laps[2].durationS, 46.538);
    almostEqual(laps[12].durationS, 61.843);
    almostEqual(laps[0].startS, 0);
    almostEqual(laps[1].startS, 68.917);
    almostEqual(laps[2].startS, 68.917 + 49.379);
    assert.strictEqual(laps[0].position, 0);
    assert.deepStrictEqual(laps[0].positionChanges, []);
  });

  it("requires driverName for teamsport format", () => {
    const sample = `\tJonny\n1\t1:00.000`;
    const file = writeTempFile(sample);
    assert.throws(
      () => parseLapFile(file, "teamsport"),
      /driverName is required/i
    );
  });

  it("errors when driver is not found", () => {
    const sample = `\tJonny\n1\t1:00.000`;
    const file = writeTempFile(sample);
    assert.throws(
      () => parseLapFile(file, "teamsport", "Alice"),
      /Driver "Alice" not found/i
    );
  });
});
