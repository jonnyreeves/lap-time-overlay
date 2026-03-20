import {
  type ParsedAlphaTimingEmail,
  type ParsedDaytonaClubspeedImport,
  type ParsedLap,
  type ParsedSessionEmail,
  type ParsedTeamsportEmail,
} from "../../../utils/sessionImportTypes.js";

export type DaytonaClubspeedSessionOption = {
  heatNo: string;
  activityType: string;
  sessionDate: string | null | undefined;
  sessionTime: string | null | undefined;
  kartNumber: string | null | undefined;
  classification: number | null | undefined;
};

type ImportedPayloadDriver = {
  name: string;
  classification: number | null | undefined;
  kartNumber: string | null | undefined;
  laps:
    | ReadonlyArray<{
        lapNumber: number;
        timeSeconds: number;
        displayTime: string;
      }>
    | null
    | undefined;
};

type ImportedPayload = {
  provider: string;
  sessionFormat: string | null | undefined;
  sessionDate: string | null | undefined;
  sessionTime: string | null | undefined;
  classification: number | null | undefined;
  sessionFastestLapSeconds: number | null | undefined;
  kartNumber: string | null | undefined;
  trackLayoutName: string | null | undefined;
  selfDriverName?: string | null | undefined;
  kartTypeName?: string | null | undefined;
  drivers?: ReadonlyArray<ImportedPayloadDriver> | null | undefined;
};

type ParsedWithDrivers =
  | ParsedTeamsportEmail
  | ParsedAlphaTimingEmail
  | ParsedDaytonaClubspeedImport;

function driverHasKartNumber(
  driver: ParsedWithDrivers["drivers"][number]
): driver is ParsedAlphaTimingEmail["drivers"][number] | ParsedDaytonaClubspeedImport["drivers"][number] {
  return "kartNumber" in driver && (driver.kartNumber == null || typeof driver.kartNumber === "string");
}

function normalizeSessionFormat(value: string | null | undefined) {
  return value === "Practice" || value === "Qualifying" || value === "Race" ? value : null;
}

function normalizeLaps(
  laps:
    | ReadonlyArray<{
        lapNumber: number;
        timeSeconds: number;
        displayTime: string;
      }>
    | null
    | undefined
): ParsedLap[] {
  return (
    laps?.map((lap) => ({
      lapNumber: lap.lapNumber,
      timeSeconds: lap.timeSeconds,
      displayTime: lap.displayTime,
    })) ?? []
  );
}

export function buildDaytonaSessionLabel(session: DaytonaClubspeedSessionOption): string {
  const parts = [
    session.sessionDate ?? "Unknown date",
    session.sessionTime ?? "Unknown time",
    session.activityType,
  ].filter(Boolean);
  return parts.join(" • ");
}

export function hasDriverRows(parsed: ParsedSessionEmail): parsed is ParsedWithDrivers {
  return "drivers" in parsed && Array.isArray(parsed.drivers) && parsed.drivers.length > 0;
}

export function getResolvedSelectedDriver(
  parsed: ParsedSessionEmail,
  selectedDriver: string
) {
  if (!hasDriverRows(parsed)) return null;
  return parsed.drivers.find((driver) => driver.name === selectedDriver) ?? parsed.drivers[0] ?? null;
}

export function getSelectedDriverLaps(parsed: ParsedSessionEmail, selectedDriver: string) {
  if (!hasDriverRows(parsed)) return parsed.laps;
  return getResolvedSelectedDriver(parsed, selectedDriver)?.laps ?? [];
}

export function getSelectedClassification(parsed: ParsedSessionEmail, selectedDriver: string) {
  if (!hasDriverRows(parsed)) return parsed.classification ?? null;
  return getResolvedSelectedDriver(parsed, selectedDriver)?.classification ?? null;
}

export function getSelectedKartNumber(
  parsed: ParsedSessionEmail,
  selectedDriver: string
): string | null {
  if (!hasDriverRows(parsed)) {
    return "kartNumber" in parsed ? parsed.kartNumber : null;
  }
  const resolvedDriver = getResolvedSelectedDriver(parsed, selectedDriver);
  if (!resolvedDriver) return null;
  if (parsed.provider === "daytona") {
    if ("selfDriverName" in parsed && parsed.selfDriverName && resolvedDriver.name !== parsed.selfDriverName) {
      return driverHasKartNumber(resolvedDriver) ? resolvedDriver.kartNumber ?? null : null;
    }
    return parsed.kartNumber ?? (driverHasKartNumber(resolvedDriver) ? resolvedDriver.kartNumber ?? null : null);
  }
  return driverHasKartNumber(resolvedDriver) ? resolvedDriver.kartNumber ?? null : null;
}

export function getDefaultSelectedDriver(parsed: ParsedSessionEmail): string {
  if (!hasDriverRows(parsed)) return "";
  if ("selfDriverName" in parsed && parsed.selfDriverName) {
    const selfDriver = parsed.drivers.find((driver) => driver.name === parsed.selfDriverName);
    if (selfDriver) return selfDriver.name;
  }
  return parsed.drivers[0]?.name ?? "";
}

export function mapImportedPayloadToParsed(payload: ImportedPayload): ParsedSessionEmail | null {
  if (payload.provider === "alphatiming") {
    return {
      provider: "alphatiming",
      sessionFormat: normalizeSessionFormat(payload.sessionFormat),
      sessionDate: payload.sessionDate ?? null,
      sessionTime: payload.sessionTime ?? null,
      sessionFastestLapSeconds: payload.sessionFastestLapSeconds ?? null,
      drivers:
        payload.drivers?.map((driver) => ({
          name: driver.name,
          classification: driver.classification ?? null,
          kartNumber: driver.kartNumber ?? null,
          laps: normalizeLaps(driver.laps),
        })) ?? [],
    };
  }

  if (payload.provider === "daytona") {
    return {
      provider: "daytona",
      sessionFormat: normalizeSessionFormat(payload.sessionFormat),
      sessionDate: payload.sessionDate ?? null,
      sessionTime: payload.sessionTime ?? null,
      classification: payload.classification ?? null,
      sessionFastestLapSeconds: payload.sessionFastestLapSeconds ?? null,
      kartNumber: payload.kartNumber ?? null,
      trackLayoutName: payload.trackLayoutName ?? null,
      selfDriverName: payload.selfDriverName ?? null,
      kartTypeName: payload.kartTypeName ?? null,
      laps:
        normalizeLaps(
          payload.drivers?.find((driver) => driver.name === payload.selfDriverName)?.laps
        ) ?? [],
      drivers:
        payload.drivers?.map((driver) => ({
          name: driver.name,
          classification: driver.classification ?? null,
          kartNumber: driver.kartNumber ?? null,
          laps: normalizeLaps(driver.laps),
        })) ?? [],
    };
  }

  return null;
}
