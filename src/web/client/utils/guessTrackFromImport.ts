import { type SessionImportSelection } from "./sessionImportTypes.js";

const PROVIDER_TRACK_HINTS: Record<SessionImportSelection["provider"], string[]> = {
  alphatiming: [
    "buckmore",
    "buckmoore",
    "buckmore park",
    "buckmoore park",
    "alpha timing",
  ],
  daytona: ["daytona"],
  teamsport: ["teamsport", "team sport"],
};

type TrackMetadata = {
  readonly id: string;
  readonly name: string;
};

type TrackLayoutMetadata = {
  readonly id: string;
  readonly name: string;
};

type KartMetadata = {
  readonly id: string;
  readonly name: string;
};

function normalizeMatchValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

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

export function guessTrackLayoutIdFromImport(
  layouts: ReadonlyArray<TrackLayoutMetadata>,
  trackLayoutName: string | null | undefined
): string | null {
  if (!layouts.length || !trackLayoutName) {
    return null;
  }

  const normalizedTarget = normalizeMatchValue(trackLayoutName);
  if (!normalizedTarget) {
    return null;
  }

  let bestMatchId: string | null = null;
  let bestScore = 0;
  const targetWords = normalizedTarget.split(" ").filter(Boolean);
  const targetCompact = targetWords.join("");

  for (const layout of layouts) {
    const normalizedCandidate = normalizeMatchValue(layout.name);
    if (!normalizedCandidate) continue;

    let score = 0;
    if (normalizedCandidate === normalizedTarget) {
      score += 100;
    }
    if (normalizedCandidate.includes(normalizedTarget)) {
      score += normalizedTarget.length + 20;
    }
    if (normalizedTarget.includes(normalizedCandidate)) {
      score += normalizedCandidate.length + 10;
    }

    const candidateWords = normalizedCandidate.split(" ").filter(Boolean);
    for (const word of targetWords) {
      if (candidateWords.includes(word)) {
        score += 4;
      }
    }

    const candidateInitials = candidateWords.map((word) => word[0]).join("");
    if (candidateInitials === targetCompact) {
      score += 15;
    } else if (
      (candidateInitials && targetCompact.startsWith(candidateInitials)) ||
      (targetCompact && candidateInitials.startsWith(targetCompact))
    ) {
      score += 8;
    }
    for (const word of targetWords) {
      if (word.length <= 3 && candidateInitials.includes(word)) {
        score += 4;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatchId = layout.id;
    }
  }

  return bestScore > 0 ? bestMatchId : null;
}

export function guessKartIdFromImport(
  karts: ReadonlyArray<KartMetadata>,
  kartTypeName: string | null | undefined
): string | null {
  if (!karts.length || !kartTypeName) {
    return null;
  }

  const normalizedTarget = normalizeMatchValue(kartTypeName);
  if (!normalizedTarget) {
    return null;
  }

  let bestMatchId: string | null = null;
  let bestScore = 0;
  const targetWords = normalizedTarget.split(" ").filter(Boolean);

  for (const kart of karts) {
    const normalizedCandidate = normalizeMatchValue(kart.name);
    if (!normalizedCandidate) continue;

    let score = 0;
    if (normalizedCandidate === normalizedTarget) {
      score += 100;
    }
    if (normalizedCandidate.includes(normalizedTarget)) {
      score += normalizedTarget.length + 20;
    }
    if (normalizedTarget.includes(normalizedCandidate)) {
      score += normalizedCandidate.length + 10;
    }

    const candidateWords = normalizedCandidate.split(" ").filter(Boolean);
    for (const word of targetWords) {
      if (candidateWords.includes(word)) {
        score += 4;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatchId = kart.id;
    }
  }

  return bestScore > 0 ? bestMatchId : null;
}
