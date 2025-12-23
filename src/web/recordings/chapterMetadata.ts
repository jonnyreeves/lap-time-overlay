import type { Lap } from "../../ffmpeg/lapTypes.js";

export type ChapterMarker = {
  startMs: number;
  endMs: number;
  title: string;
  metadataOffsetMs?: number;
};

const FINAL_CHAPTER_END_SENTINEL_MS = 9_999_999;
// Shift lap chapters 1 second earlier by default so viewers can see the kart cross the line.
const DEFAULT_CHAPTER_OFFSET_MS = -1_000;
const MIN_WARMUP_MS = 1_000;
const COOLDOWN_PRE_START_MS = 1_000;
const MIN_CHAPTER_DURATION_MS = 1;

export function buildChapterMarkers({
  laps,
  lapOneOffsetS,
  videoDurationMs,
}: {
  laps: Lap[];
  lapOneOffsetS: number;
  videoDurationMs?: number;
}): ChapterMarker[] {
  if (!laps.length) return [];

  const offsetMs = Math.max(0, Math.round(lapOneOffsetS * 1000));
  const sorted = [...laps].sort((a, b) => {
    if (a.startS === b.startS) return a.number - b.number;
    return a.startS - b.startS;
  });

  const safeVideoDurationMs =
    typeof videoDurationMs === "number" && Number.isFinite(videoDurationMs) && videoDurationMs >= 0
      ? Math.round(videoDurationMs)
      : null;
  const fallbackVideoDurationMs = safeVideoDurationMs ?? FINAL_CHAPTER_END_SENTINEL_MS;

  const lapStartMsList = sorted.map((lap) => offsetMs + Math.max(0, Math.round(lap.startS * 1000)));
  const firstLapStartMs = lapStartMsList[0];
  const lastLapIndex = lapStartMsList.length - 1;
  const lastLap = sorted[lastLapIndex];
  const lastLapStartMs = lapStartMsList[lastLapIndex];
  const lastLapDurationMs = Math.max(0, Math.round(lastLap.durationS * 1000));
  const finishTimeMs = lastLapStartMs + lastLapDurationMs;
  const finalVideoEndMs = safeVideoDurationMs ?? fallbackVideoDurationMs;

  const rawCooldownStartMs = Math.max(
    lastLapStartMs + MIN_CHAPTER_DURATION_MS,
    finishTimeMs - COOLDOWN_PRE_START_MS
  );
  const cooldownUpperBoundMs = Math.max(
    lastLapStartMs + MIN_CHAPTER_DURATION_MS,
    finalVideoEndMs - MIN_CHAPTER_DURATION_MS
  );
  const cooldownStartMs = Math.min(rawCooldownStartMs, cooldownUpperBoundMs);
  const hasCooldownChapter = finalVideoEndMs - cooldownStartMs >= MIN_CHAPTER_DURATION_MS;
  const finalLapEndBoundaryMs = Math.max(
    lastLapStartMs + MIN_CHAPTER_DURATION_MS,
    hasCooldownChapter ? Math.min(cooldownStartMs, fallbackVideoDurationMs) : fallbackVideoDurationMs
  );

  const lapChapters = sorted.map((lap, idx) => {
    const startMs = lapStartMsList[idx];
    const isLastLap = idx === lastLapIndex;
    const nextLapStartMs = idx < lastLapIndex ? lapStartMsList[idx + 1] : null;
    const endBoundaryMs = isLastLap ? finalLapEndBoundaryMs : nextLapStartMs ?? fallbackVideoDurationMs;
    const endMs = Math.max(startMs + MIN_CHAPTER_DURATION_MS, endBoundaryMs);

    return { startMs, endMs, title: `Lap ${lap.number} Start` };
  });

  const chapters: ChapterMarker[] = [];
  if (firstLapStartMs >= MIN_WARMUP_MS) {
    chapters.push({
      startMs: 0,
      endMs: firstLapStartMs,
      title: "Warm Up",
      metadataOffsetMs: 0,
    });
  }

  chapters.push(...lapChapters);

  if (hasCooldownChapter) {
    chapters.push({
      startMs: cooldownStartMs,
      endMs: finalVideoEndMs,
      title: "Cooldown",
      metadataOffsetMs: 0,
    });
  }

  return chapters;
}

export function buildChapterMetadataFile(
  chapters: ChapterMarker[],
  offsetMs = DEFAULT_CHAPTER_OFFSET_MS
): string {
  const header = ";FFMETADATA1";
  const body = chapters
    .map((chapter) => {
      const chapterOffsetMs = chapter.metadataOffsetMs ?? offsetMs;
      const adjustedStart = Math.max(0, chapter.startMs + chapterOffsetMs);
      const adjustedEnd = Math.max(adjustedStart + 1, chapter.endMs + chapterOffsetMs);

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
