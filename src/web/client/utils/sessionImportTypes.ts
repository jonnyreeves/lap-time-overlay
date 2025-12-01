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
  drivers: { name: string; laps: ParsedLap[] }[];
};

export type ParsedSessionEmail = ParsedDaytonaEmail | ParsedTeamsportEmail;

export type SessionImportSelection = {
  sessionFormat: SessionFormat | null;
  sessionDate: string | null;
  sessionTime: string | null;
  laps: ParsedLap[];
  driverName?: string;
};
