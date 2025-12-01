import { parseDaytonaEmail } from "./parseDaytonaEmail.js";
import { parseTeamsportEmail } from "./parseTeamsportEmail.js";
import { type ParsedSessionEmail } from "./sessionImportTypes.js";

type Parser = {
  run: (text: string) => ParsedSessionEmail | null;
  isValid: (result: ParsedSessionEmail | null) => result is ParsedSessionEmail;
};

const PARSERS: Parser[] = [
  {
    run: parseTeamsportEmail,
    isValid: (result): result is ParsedSessionEmail =>
      result?.provider === "teamsport" && result.drivers.length > 0,
  },
  {
    run: parseDaytonaEmail,
    isValid: (result): result is ParsedSessionEmail =>
      result?.provider === "daytona" && result.laps.length > 0,
  },
];

export function parseSessionEmail(text: string): ParsedSessionEmail | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  for (const parser of PARSERS) {
    const result = parser.run(trimmed);
    if (parser.isValid(result)) {
      return result;
    }
  }

  return null;
}
