import { describe, expect, it } from "vitest";
import { buildChapterMetadataFile, type ChapterMarker } from "../../../src/web/recordings/chapterMetadata.js";

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
});
