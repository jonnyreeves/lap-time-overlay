import { alphaTimingUrlProvider } from "./providers/alphaTiming.js";
import {
  fetchDaytonaClubspeedSessions as fetchDaytonaClubspeedSessionsFromProvider,
  importDaytonaClubspeedSession as importDaytonaClubspeedSessionFromProvider,
} from "./providers/daytonaClubspeed.js";
import {
  type DaytonaClubspeedCredentials,
  type DaytonaClubspeedSessionSummary,
  type ImportedSessionData,
  SessionImportError,
  type UrlImportProvider,
} from "./types.js";

const URL_IMPORT_PROVIDERS: UrlImportProvider[] = [alphaTimingUrlProvider];

function normalizeSourceInput(source: string | null | undefined): string {
  return source?.trim() ?? "";
}

export function isUrlImportSource(source: string | null | undefined): boolean {
  const trimmed = normalizeSourceInput(source);
  if (!trimmed) return false;
  return URL_IMPORT_PROVIDERS.some((provider) => provider.canHandle(trimmed) != null);
}

export async function importTrackSessionFromSource(
  source: string | null | undefined
): Promise<ImportedSessionData> {
  const trimmed = normalizeSourceInput(source);
  if (!trimmed) {
    throw new SessionImportError("source is required", "UNSUPPORTED_SOURCE");
  }

  for (const provider of URL_IMPORT_PROVIDERS) {
    const match = provider.canHandle(trimmed);
    if (!match) continue;
    return provider.importFromUrl(match);
  }

  throw new SessionImportError("Unsupported import source URL", "UNSUPPORTED_SOURCE");
}

export async function fetchDaytonaClubspeedSessions(
  credentials: DaytonaClubspeedCredentials
): Promise<DaytonaClubspeedSessionSummary[]> {
  return fetchDaytonaClubspeedSessionsFromProvider(credentials);
}

export async function importDaytonaClubspeedSession(
  heatNo: string | null | undefined,
  credentials: DaytonaClubspeedCredentials
): Promise<ImportedSessionData> {
  const trimmed = normalizeSourceInput(heatNo);
  if (!trimmed) {
    throw new SessionImportError("heatNo is required", "UNSUPPORTED_SOURCE");
  }
  return importDaytonaClubspeedSessionFromProvider(trimmed, credentials);
}
