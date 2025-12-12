import type { TrackPersonalBestEntry } from "./TrackPersonalBestPill.js";

export type PersonalBestGroup = {
  key: string;
  fastestEntry: TrackPersonalBestEntry;
  topEntries: TrackPersonalBestEntry[];
};

function getLapTimeValue(lapTime: number | null | undefined) {
  return typeof lapTime === "number" ? lapTime : Number.POSITIVE_INFINITY;
}

function groupKey(entry: TrackPersonalBestEntry) {
  return `${entry.trackLayout.id}:${entry.kart.id}:${entry.conditions}`;
}

function compareGroups(a: PersonalBestGroup, b: PersonalBestGroup) {
  const entryA = a.fastestEntry;
  const entryB = b.fastestEntry;

  if (entryA.trackLayout.name !== entryB.trackLayout.name) {
    return entryA.trackLayout.name.localeCompare(entryB.trackLayout.name);
  }
  if (entryA.kart.name !== entryB.kart.name) {
    return entryA.kart.name.localeCompare(entryB.kart.name);
  }
  if (entryA.conditions !== entryB.conditions) {
    return entryA.conditions.localeCompare(entryB.conditions);
  }
  return getLapTimeValue(entryA.lapTime) - getLapTimeValue(entryB.lapTime);
}

export function groupPersonalBestEntries(
  entries: ReadonlyArray<TrackPersonalBestEntry>,
  topCount = 3
): PersonalBestGroup[] {
  const grouped = new Map<string, TrackPersonalBestEntry[]>();

  for (const entry of entries) {
    const key = groupKey(entry);
    const current = grouped.get(key);
    if (current) {
      current.push(entry);
    } else {
      grouped.set(key, [entry]);
    }
  }

  const clampedTopCount = Math.max(1, topCount);

  return Array.from(grouped.entries())
    .map(([key, groupEntries]) => {
      const sortedEntries = [...groupEntries].sort(
        (a, b) => getLapTimeValue(a.lapTime) - getLapTimeValue(b.lapTime)
      );
      const fastestEntry = sortedEntries[0];

      if (!fastestEntry) {
        return null;
      }

      return {
        key,
        fastestEntry,
        topEntries: sortedEntries.slice(0, clampedTopCount),
      };
    })
    .filter((group): group is PersonalBestGroup => Boolean(group?.fastestEntry))
    .sort(compareGroups);
}
