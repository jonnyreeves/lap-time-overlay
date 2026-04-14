import { describe, expect, it } from "vitest";
import {
  extractAlphaTimingImportSource,
  extractAlphaTimingSessionUrl,
} from "../../../src/web/shared/alphaTimingUrl.js";

describe("alphaTimingUrl", () => {
  it("extracts direct session URLs", () => {
    expect(
      extractAlphaTimingImportSource("https://results.alphatiming.co.uk/buckmore/e/360655/s/745987")
    ).toEqual({
      kind: "session",
      normalizedSource: "https://results.alphatiming.co.uk/buckmore/e/360655/s/745987",
      venue: "buckmore",
      eventId: "360655",
      sessionId: "745987",
    });
  });

  it("normalizes session result URLs to the base session URL", () => {
    expect(
      extractAlphaTimingSessionUrl(
        "https://results.alphatiming.co.uk/buckmore/e/360655/s/745987/result"
      )
    ).toBe("https://results.alphatiming.co.uk/buckmore/e/360655/s/745987");
  });

  it("extracts direct event URLs", () => {
    expect(
      extractAlphaTimingImportSource("https://results.alphatiming.co.uk/buckmore/e/363264")
    ).toEqual({
      kind: "event",
      normalizedSource: "https://results.alphatiming.co.uk/buckmore/e/363264",
      venue: "buckmore",
      eventId: "363264",
    });
  });

  it("extracts event URLs embedded in text", () => {
    expect(
      extractAlphaTimingImportSource(
        "Import this please: https://results.alphatiming.co.uk/buckmore/e/363264"
      )
    ).toMatchObject({
      kind: "event",
      normalizedSource: "https://results.alphatiming.co.uk/buckmore/e/363264",
    });
  });

  it("extracts session URLs split across whitespace", () => {
    expect(
      extractAlphaTimingImportSource(
        "https://results.alphatiming.co.uk/buckmore/e/360655/s\n/745987/result"
      )
    ).toMatchObject({
      kind: "session",
      normalizedSource: "https://results.alphatiming.co.uk/buckmore/e/360655/s/745987",
    });
  });

  it("rejects unsupported hosts", () => {
    expect(
      extractAlphaTimingImportSource("https://example.com/buckmore/e/363264")
    ).toBeNull();
  });
});
