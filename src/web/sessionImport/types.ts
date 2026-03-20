export type ImportedSessionFormat = "Practice" | "Qualifying" | "Race";

export type ImportedSessionLap = {
  lapNumber: number;
  timeSeconds: number;
  displayTime: string;
};

export type ImportedSessionDriver = {
  name: string;
  classification: number | null;
  kartNumber: string | null;
  laps: ImportedSessionLap[];
};

export type DaytonaClubspeedSessionSummary = {
  heatNo: string;
  activityType: string;
  sessionDate: string | null;
  sessionTime: string | null;
  kartNumber: string | null;
  classification: number | null;
};

export type ImportedSessionData = {
  provider: string;
  sessionFormat: ImportedSessionFormat | null;
  sessionDate: string | null;
  sessionTime: string | null;
  classification: number | null;
  sessionFastestLapSeconds: number | null;
  kartNumber: string | null;
  trackLayoutName: string | null;
  selfDriverName: string | null;
  kartTypeName: string | null;
  laps: ImportedSessionLap[];
  drivers: ImportedSessionDriver[];
};

export type UrlImportProviderMatch = {
  normalizedSource: string;
};

export interface UrlImportProvider {
  id: string;
  canHandle: (source: string) => UrlImportProviderMatch | null;
  importFromUrl: (match: UrlImportProviderMatch) => Promise<ImportedSessionData>;
}

export class SessionImportError extends Error {
  code: "UNSUPPORTED_SOURCE" | "FETCH_FAILED" | "PARSE_FAILED" | "AUTH_REQUIRED";

  constructor(
    message: string,
    code: "UNSUPPORTED_SOURCE" | "FETCH_FAILED" | "PARSE_FAILED" | "AUTH_REQUIRED"
  ) {
    super(message);
    this.name = "SessionImportError";
    this.code = code;
  }
}
