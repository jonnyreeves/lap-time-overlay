export type SessionFormat = "Practice" | "Qualifying" | "Race";

export type ParsedLap = {
  lapNumber: number;
  timeSeconds: number;
  displayTime: string;
  lapEvents?: LapEventImport[];
};

export type ParsedDaytonaEmail = {
  provider: "daytona";
  sessionFormat: SessionFormat | null;
  sessionDate: string | null;
  sessionTime: string | null;
  classification: number | null;
  sessionFastestLapSeconds: number | null;
  kartNumber: string | null;
  trackLayoutName: string | null;
  laps: ParsedLap[];
};

export type LapEventImport = {
  offset: number;
  event: string;
  value: string;
};

export type ParsedTeamsportEmail = {
  provider: "teamsport";
  sessionFormat: SessionFormat | null;
  sessionDate: string | null;
  sessionTime: string | null;
  sessionFastestLapSeconds: number | null;
  drivers: { name: string; laps: ParsedLap[]; classification: number | null }[];
};

export type ParsedAlphaTimingEmail = {
  provider: "alphatiming";
  sessionFormat: SessionFormat | null;
  sessionDate: string | null;
  sessionTime: string | null;
  sessionFastestLapSeconds: number | null;
  drivers: {
    name: string;
    laps: ParsedLap[];
    classification: number | null;
    kartNumber: string | null;
  }[];
};

export type ParsedSessionEmail =
  | ParsedDaytonaEmail
  | ParsedTeamsportEmail
  | ParsedAlphaTimingEmail;

export type SessionImportSelection = {
  provider: ParsedSessionEmail["provider"];
  sourceText: string;
  sessionFormat: SessionFormat | null;
  sessionDate: string | null;
  sessionTime: string | null;
  classification: number | null;
  laps: ParsedLap[];
  trackId?: string | null;
  trackLayoutName?: string | null;
  temperature?: string | null;
  conditions?: "Dry" | "Wet" | null;
  driverName?: string;
  participants?: {
    name: string;
    classification: number | null;
    kartNumber: string | null;
    isSelf: boolean;
    laps: ParsedLap[];
  }[];
  sessionFastestLapSeconds: number | null;
  kartNumber?: string | null;
};
