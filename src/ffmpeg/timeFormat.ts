export function formatLapTime(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const totalMs = Math.round(seconds * 1000);
  const ms = totalMs % 1000;
  const totalS = Math.floor(totalMs / 1000);
  const m = Math.floor(totalS / 60);
  const s = totalS % 60;
  return `${m}:${s.toString().padStart(2, "0")}:${ms
    .toString()
    .padStart(3, "0")}`;
}
