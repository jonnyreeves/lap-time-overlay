import { describe, expect, it } from "vitest";
import { guessTrackIdFromImport } from "../../../../src/web/client/utils/guessTrackFromImport.js";

const tracks = [
  { id: "track:daytona", name: "Daytona Sandown Park" },
  { id: "track:teamsport", name: "TeamSport Rushmoor" },
];

describe("guessTrackIdFromImport", () => {
  it("prefers the track whose name appears in the import text", () => {
    const selection = {
      provider: "daytona" as const,
      sourceText: "An email mentioning Daytona Sandown Park in the body",
    };
    expect(guessTrackIdFromImport(tracks, selection)).toBe("track:daytona");
  });

  it("falls back to provider hints when the text does not include the track name", () => {
    const selection = {
      provider: "daytona" as const,
      sourceText: "A Daytona report with no specific track mention",
    };
    expect(guessTrackIdFromImport(tracks, selection)).toBe("track:daytona");
  });

  it("returns null when nothing in the text or provider hints match", () => {
    const selection = {
      provider: "daytona" as const,
      sourceText: "A mysterious venue with no match",
    };
    const otherTracks = [{ id: "track:ocean", name: "Ocean Circuit" }];
    expect(guessTrackIdFromImport(otherTracks, selection)).toBeNull();
  });
});
