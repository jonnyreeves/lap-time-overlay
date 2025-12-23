import { describe, expect, it } from "vitest";
import { buildChapterMetadataFile, buildChapterMarkers, type ChapterMarker } from "../../../src/web/recordings/chapterMetadata.js";
import type { Lap } from "../../../src/ffmpeg/lapTypes.js";

describe("buildChapterMetadataFile", () => {
  it("emits only the FFMetadata header when no chapters are provided", () => {
    expect(buildChapterMetadataFile([])).toBe(";FFMETADATA1\n");
  });

  it("applies the default offset so chapters start one second early", () => {
    const chapters: ChapterMarker[] = [
      { startMs: 1000, endMs: 2500, title: "Lap 1 Start" },
    ];

    const metadata = buildChapterMetadataFile(chapters);

    expect(metadata).toContain("[CHAPTER]\nTIMEBASE=1/1000\nSTART=0\nEND=1500\ntitle=Lap 1 Start");
  });

  it("honors a custom offset for each chapter", () => {
    const chapters: ChapterMarker[] = [
      { startMs: 2000, endMs: 4000, title: "Lap 1 Start" },
      { startMs: 4000, endMs: 6000, title: "Lap 2 Start" },
    ];

    const metadata = buildChapterMetadataFile(chapters, 2000);

    expect(metadata).toContain("[CHAPTER]\nTIMEBASE=1/1000\nSTART=4000\nEND=6000\ntitle=Lap 1 Start");
    expect(metadata).toContain("[CHAPTER]\nTIMEBASE=1/1000\nSTART=6000\nEND=8000\ntitle=Lap 2 Start");
    const sections = metadata.split("\n\n").filter(Boolean);
    expect(sections).toHaveLength(2);
  });

  it("allows overriding the metadata offset per chapter", () => {
    const chapters: ChapterMarker[] = [
      { startMs: 0, endMs: 2000, title: "Warm Up", metadataOffsetMs: 0 },
      { startMs: 2000, endMs: 4000, title: "Lap 1 Start" },
    ];

    const metadata = buildChapterMetadataFile(chapters);

    expect(metadata).toContain("[CHAPTER]\nTIMEBASE=1/1000\nSTART=0\nEND=2000\ntitle=Warm Up");
    expect(metadata).toContain("[CHAPTER]\nTIMEBASE=1/1000\nSTART=1000\nEND=3000\ntitle=Lap 1 Start");
  });
});

describe("buildChapterMarkers", () => {
  it("wraps laps with warm-up and cooldown when footage allows", () => {
    const laps: Lap[] = [
      { number: 1, durationS: 5, position: 0, positionChanges: [], startS: 0 },
      { number: 2, durationS: 4, position: 0, positionChanges: [], startS: 5 },
    ];

    const markers = buildChapterMarkers({
      laps,
      lapOneOffsetS: 2,
      videoDurationMs: 13_000,
    });

    expect(markers).toHaveLength(4);
    expect(markers[0]).toMatchObject({ title: "Warm Up", startMs: 0, endMs: 2_000 });
    expect(markers[1]).toMatchObject({ title: "Lap 1 Start", startMs: 2_000, endMs: 7_000 });
    expect(markers[2]).toMatchObject({ title: "Lap 2 Start", startMs: 7_000, endMs: 10_000 });
    expect(markers[3]).toMatchObject({ title: "Cooldown", startMs: 10_000, endMs: 13_000 });
  });

  it("skips the cooldown chapter when the recording ends before the final lap start", () => {
    const laps: Lap[] = [
      { number: 1, durationS: 60, position: 0, positionChanges: [], startS: 0 },
      { number: 2, durationS: 60, position: 0, positionChanges: [], startS: 60 },
    ];

    const markers = buildChapterMarkers({
      laps,
      lapOneOffsetS: 0,
      videoDurationMs: 50_000,
    });

    expect(markers).toHaveLength(2);
    expect(markers.some((marker) => marker.title === "Cooldown")).toBe(false);
    expect(markers[1]?.endMs).toBe(Math.max(60_000 + 1, 50_000));
  });
});
