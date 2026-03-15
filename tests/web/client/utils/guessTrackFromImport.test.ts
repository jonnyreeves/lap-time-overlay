import { describe, expect, it } from "vitest";
import {
  guessTrackIdFromImport,
  guessTrackLayoutIdFromImport,
} from "../../../../src/web/client/utils/guessTrackFromImport.js";

const tracks = [
  { id: "track:buckmore", name: "Buckmore Park Karting" },
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

  it("matches Buckmore from Alpha Timing imports by provider hint", () => {
    const selection = {
      provider: "alphatiming" as const,
      sourceText: "Session result exported from Alpha Timing.",
    };
    expect(guessTrackIdFromImport(tracks, selection)).toBe("track:buckmore");
  });

  it("does not match Buckmoor typo aliases in strict mode", () => {
    const typoTracks = [
      { id: "track:buckmoor", name: "Buckmoor Park" },
      { id: "track:other", name: "Somewhere Else" },
    ];
    const selection = {
      provider: "alphatiming" as const,
      sourceText: "Session result exported from Alpha Timing.",
    };
    expect(guessTrackIdFromImport(typoTracks, selection)).toBeNull();
  });
});

describe("guessTrackLayoutIdFromImport", () => {
  it("matches a layout name fuzzily", () => {
    const layouts = [
      { id: "layout:gp", name: "Grand Prix Circuit" },
      { id: "layout:indy", name: "Indy Circuit" },
    ];

    expect(guessTrackLayoutIdFromImport(layouts, "GP Circuit")).toBe("layout:gp");
  });

  it("returns null when the layout name is missing", () => {
    const layouts = [{ id: "layout:gp", name: "GP Circuit" }];
    expect(guessTrackLayoutIdFromImport(layouts, null)).toBeNull();
  });
});
