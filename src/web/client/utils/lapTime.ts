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
