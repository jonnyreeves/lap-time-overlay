import { alphaTimingUrlProvider } from "./providers/alphaTiming.js";
import {
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
