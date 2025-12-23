import type { Lap } from "../../ffmpeg/lapTypes.js";

export type ChapterMarker = { startMs: number; endMs: number; title: string };

const FINAL_CHAPTER_END_SENTINEL_MS = 9_999_999;
// Shift chapters 1 second earlier by default so viewers can see the kart cross the line.
const DEFAULT_CHAPTER_OFFSET_MS = -1_000;

export function buildChapterMarkers({
  laps,
  lapOneOffsetS,
  videoDurationMs,
}: {
  laps: Lap[];
  lapOneOffsetS: number;
  videoDurationMs?: number;
}): ChapterMarker[] {
  const offsetMs = Math.max(0, Math.round(lapOneOffsetS * 1000));
  const sorted = [...laps].sort((a, b) => {
    if (a.startS === b.startS) return a.number - b.number;
    return a.startS - b.startS;
  });

  return sorted.map((lap, idx) => {
    const startMs = offsetMs + Math.max(0, Math.round(lap.startS * 1000));
    const nextLap = sorted[idx + 1];
    const nextStartMs = nextLap ? offsetMs + Math.max(0, Math.round(nextLap.startS * 1000)) : null;
    const defaultEnd = Math.max(
      Math.round(videoDurationMs ?? FINAL_CHAPTER_END_SENTINEL_MS),
      FINAL_CHAPTER_END_SENTINEL_MS
    );
    const endMs = Math.max(startMs + 1, nextStartMs ?? defaultEnd);

    return { startMs, endMs, title: `Lap ${lap.number} Start` };
  });
}

export function buildChapterMetadataFile(chapters: ChapterMarker[], offsetMs = DEFAULT_CHAPTER_OFFSET_MS): string {
  const header = ";FFMETADATA1";
  const body = chapters
    .map((chapter) => {
      const adjustedStart = Math.max(0, chapter.startMs + offsetMs);
      const adjustedEnd = Math.max(adjustedStart + 1, chapter.endMs + offsetMs);

      return [
        "[CHAPTER]",
        "TIMEBASE=1/1000",
        `START=${adjustedStart}`,
        `END=${adjustedEnd}`,
        `title=${chapter.title}`,
        "",
      ].join("\n");
    })
    .join("\n");

  return [header, body].join("\n");
}
