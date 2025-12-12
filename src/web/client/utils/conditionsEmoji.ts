export function getConditionsEmoji(conditions: string | null | undefined) {
  if (conditions === "Dry") return "☀️";
  if (conditions === "Wet") return "🌧️";
  return "⛅️";
}
