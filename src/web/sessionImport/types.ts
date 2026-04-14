export type ImportedSessionFormat = "Practice" | "Qualifying" | "Race";

export type ImportedSessionLapEvent = {
  offset: number;
  event: string;
  value: string;
};

export type ImportedSessionLap = {
  lapNumber: number;
  timeSeconds: number;
  displayTime: string;
  lapEvents?: ImportedSessionLapEvent[];
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
  alreadyImported?: boolean;
};

export type DaytonaClubspeedCredentials = {
  username: string;
  password: string;
};

export type DaytonaClubspeedSessionImportResult = {
  heatNo: string;
  importedSession: ImportedSessionData | null;
  errorMessage: string | null;
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

export type AlphaTimingSessionOption = {
  sessionUrl: string;
  title: string | null;
  sessionDate: string | null;
  sessionTime: string | null;
};

export type ResolvedImportSource = {
  provider: string;
  sessionUrl: string | null;
  alphaTimingSessions: AlphaTimingSessionOption[];
};

export type UrlImportProviderMatch = {
  normalizedSource: string;
  sourceKind: "event" | "session";
  venue: string;
  eventId: string;
  sessionId?: string;
};

export interface UrlImportProvider {
  id: string;
  canHandle: (source: string) => UrlImportProviderMatch | null;
  resolveFromUrl: (match: UrlImportProviderMatch) => Promise<ResolvedImportSource>;
  importFromUrl: (match: UrlImportProviderMatch) => Promise<ImportedSessionData>;
}

export class SessionImportError extends Error {
  code:
    | "UNSUPPORTED_SOURCE"
    | "FETCH_FAILED"
    | "PARSE_FAILED"
    | "AUTH_REQUIRED"
    | "CONFIG_REQUIRED"
    | "INVALID_CREDENTIALS";

  constructor(
    message: string,
    code:
      | "UNSUPPORTED_SOURCE"
      | "FETCH_FAILED"
      | "PARSE_FAILED"
      | "AUTH_REQUIRED"
      | "CONFIG_REQUIRED"
      | "INVALID_CREDENTIALS"
  ) {
    super(message);
    this.name = "SessionImportError";
    this.code = code;
  }
}
