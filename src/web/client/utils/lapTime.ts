export function formatLapTimeSeconds(durationSeconds: number): string {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return "";

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds - minutes * 60;

  if (minutes > 0) {
    const secondsStr = seconds.toFixed(3).padStart(6, "0"); // ensure 00.000 style
    return `${minutes}:${secondsStr}`;
  }

  return seconds.toFixed(3);
}

export function parseLapTimeString(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const colonCount = (trimmed.match(/:/g) || []).length;

  if (colonCount === 2) {
    // Daytona-style 0:57:755 (m:ss:ms)
    const parts = trimmed.split(":");
    if (parts.length !== 3) return null;
    const [minutesRaw, secondsRaw, millisRaw] = parts;
    const minutes = Number(minutesRaw);
    const seconds = Number(secondsRaw);
    const millis = Number(millisRaw);
    if (![minutes, seconds, millis].every(Number.isFinite)) return null;
    const totalSeconds = minutes * 60 + seconds + millis / 1000;
    return totalSeconds > 0 ? totalSeconds : null;
  }

  if (colonCount === 1) {
    // Teamsport-style 1:03.065 (m:ss.mmm)
    const [minutesRaw, secondsRaw] = trimmed.split(":");
    const minutes = Number(minutesRaw);
    const seconds = Number(secondsRaw);
    if (![minutes, seconds].every(Number.isFinite)) return null;
    const totalSeconds = minutes * 60 + seconds;
    return totalSeconds > 0 ? totalSeconds : null;
  }

  const seconds = Number(trimmed);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return seconds;
}
