import { type SessionImportSelection } from "./sessionImportTypes.js";

const PROVIDER_TRACK_HINTS: Record<SessionImportSelection["provider"], string[]> = {
  daytona: ["daytona"],
  teamsport: ["teamsport", "team sport"],
};

type TrackMetadata = {
  readonly id: string;
  readonly name: string;
};

export function guessTrackIdFromImport(
  tracks: ReadonlyArray<TrackMetadata>,
  importSelection: Pick<SessionImportSelection, "provider" | "sourceText">
): string | null {
  const { provider, sourceText } = importSelection;
  if (!tracks.length) {
    return null;
  }

  const normalizedText = sourceText.trim().toLowerCase();
  let bestMatchId: string | null = null;
  let bestScore = 0;

  for (const track of tracks) {
    const trackName = track.name.toLowerCase();
    if (!trackName) continue;

    let score = 0;

    if (normalizedText) {
      if (normalizedText.includes(trackName)) {
        score += trackName.length + 10;
      }
      const words = trackName.split(/\s+/).filter(Boolean);
      for (const word of words) {
        if (normalizedText.includes(word)) {
          score += 1;
        }
      }
    }

    for (const hint of PROVIDER_TRACK_HINTS[provider] ?? []) {
      if (trackName.includes(hint)) {
        score += 5;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatchId = track.id;
    }
  }

  return bestScore > 0 ? bestMatchId : null;
}
