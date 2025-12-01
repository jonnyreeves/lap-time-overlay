import { type SessionFormat } from "./sessionImportTypes.js";

const FORMAT_MATCHERS: { token: string; value: SessionFormat }[] = [
  { token: "practice", value: "Practice" },
  { token: "qualifying", value: "Qualifying" },
  { token: "race", value: "Race" },
];

export function parseSessionFormat(text: string): SessionFormat | null {
  const lower = text.toLowerCase();
  const match = FORMAT_MATCHERS.find(({ token }) => lower.includes(token));
  return match?.value ?? null;
}
