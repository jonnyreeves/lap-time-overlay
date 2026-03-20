import { useEffect, useMemo, useRef, useState } from "react";
import { graphql, useMutation } from "react-relay";
import { extractAlphaTimingSessionUrl } from "../../../shared/alphaTimingUrl.js";
import type { ImportSessionModalFetchDaytonaClubspeedSessionsMutation } from "../../__generated__/ImportSessionModalFetchDaytonaClubspeedSessionsMutation.graphql.js";
import type { ImportSessionModalFetchTrackSessionWeatherMutation } from "../../__generated__/ImportSessionModalFetchTrackSessionWeatherMutation.graphql.js";
import type { ImportSessionModalImportDaytonaClubspeedSessionMutation } from "../../__generated__/ImportSessionModalImportDaytonaClubspeedSessionMutation.graphql.js";
import type { ImportSessionModalImportTrackSessionFromUrlMutation } from "../../__generated__/ImportSessionModalImportTrackSessionFromUrlMutation.graphql.js";
import {
  guessTrackIdFromImport,
  guessTrackLayoutIdFromImport,
} from "../../utils/guessTrackFromImport.js";
import { parseSessionEmail } from "../../utils/parseSessionEmail.js";
import { type ParsedSessionEmail, type SessionImportSelection } from "../../utils/sessionImportTypes.js";
import { DaytonaSessionStep } from "./importWizard/DaytonaSessionStep.js";
import { EmailStep } from "./importWizard/EmailStep.js";
import {
  buildDaytonaSessionLabel,
  getDefaultSelectedDriver,
  getResolvedSelectedDriver,
  getSelectedClassification,
  getSelectedDriverLaps,
  getSelectedKartNumber,
  hasDriverRows,
  mapImportedPayloadToParsed,
  type DaytonaClubspeedSessionOption,
} from "./importWizard/helpers.js";
import { PreviewStep } from "./importWizard/PreviewStep.js";
import { SourceStep } from "./importWizard/SourceStep.js";
import {
  buttonGroupStyles,
  modalContentStyles,
  modalOverlayStyles,
  primaryButtonStyles,
  secondaryButtonStyles,
  stepIntroStyles,
} from "./importWizard/styles.js";

interface ImportSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (result: SessionImportSelection) => void;
  daytonaCredentialStatus: {
    configured: boolean;
    lastValidationError: string | null;
  } | null;
  tracks: ReadonlyArray<{
    id: string;
    name: string;
    isIndoors: boolean;
    trackLayouts: ReadonlyArray<{ id: string; name: string }>;
  }>;
}

type WeatherStatus = "idle" | "loading" | "loaded" | "error" | "unavailable";
type WizardStep = "source" | "email" | "daytona-session" | "preview";
type ImportSource = "email" | "daytona" | null;

const FetchSessionWeatherMutation = graphql`
  mutation ImportSessionModalFetchTrackSessionWeatherMutation(
    $input: FetchTrackSessionTemperatureInput!
  ) {
    fetchTrackSessionTemperature(input: $input) {
      temperature
      conditions
    }
  }
`;

const ImportTrackSessionFromUrlMutation = graphql`
  mutation ImportSessionModalImportTrackSessionFromUrlMutation(
    $input: ImportTrackSessionFromUrlInput!
  ) {
    importTrackSessionFromUrl(input: $input) {
      provider
      sessionFormat
      sessionDate
      sessionTime
      classification
      sessionFastestLapSeconds
      kartNumber
      trackLayoutName
      selfDriverName
      kartTypeName
      laps {
        lapNumber
        timeSeconds
        displayTime
      }
      drivers {
        name
        classification
        kartNumber
        laps {
          lapNumber
          timeSeconds
          displayTime
        }
      }
    }
  }
`;

const FetchDaytonaClubspeedSessionsMutation = graphql`
  mutation ImportSessionModalFetchDaytonaClubspeedSessionsMutation {
    fetchDaytonaClubspeedSessions {
      sessions {
        heatNo
        activityType
        sessionDate
        sessionTime
        kartNumber
        classification
      }
    }
  }
`;

const ImportDaytonaClubspeedSessionMutation = graphql`
  mutation ImportSessionModalImportDaytonaClubspeedSessionMutation(
    $input: ImportDaytonaClubspeedSessionInput!
  ) {
    importDaytonaClubspeedSession(input: $input) {
      provider
      sessionFormat
      sessionDate
      sessionTime
      classification
      sessionFastestLapSeconds
      kartNumber
      trackLayoutName
      selfDriverName
      kartTypeName
      laps {
        lapNumber
        timeSeconds
        displayTime
      }
      drivers {
        name
        classification
        kartNumber
        laps {
          lapNumber
          timeSeconds
          displayTime
        }
      }
    }
  }
`;

export function ImportSessionModal({
  isOpen,
  onClose,
  onImport,
  daytonaCredentialStatus,
  tracks,
}: ImportSessionModalProps) {
  const [step, setStep] = useState<WizardStep>("source");
  const [selectedSource, setSelectedSource] = useState<ImportSource>(null);
  const [emailContent, setEmailContent] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [importedParsed, setImportedParsed] = useState<ParsedSessionEmail | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedTrackLayoutId, setSelectedTrackLayoutId] = useState("");
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>("idle");
  const [weatherData, setWeatherData] = useState<{
    temperature: string | null;
    conditions: "Dry" | "Wet" | null;
  }>({ temperature: null, conditions: null });
  const [daytonaSessions, setDaytonaSessions] = useState<DaytonaClubspeedSessionOption[]>([]);
  const [daytonaStatus, setDaytonaStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [daytonaError, setDaytonaError] = useState<string | null>(null);
  const [selectedDaytonaHeatNo, setSelectedDaytonaHeatNo] = useState("");
  const weatherRequestId = useRef(0);
  const [commitFetchWeather, isFetchingWeather] =
    useMutation<ImportSessionModalFetchTrackSessionWeatherMutation>(FetchSessionWeatherMutation);
  const [commitImportTrackSessionFromUrl, isImportingFromUrl] =
    useMutation<ImportSessionModalImportTrackSessionFromUrlMutation>(ImportTrackSessionFromUrlMutation);
  const [commitFetchDaytonaSessions, isFetchingDaytonaSessions] =
    useMutation<ImportSessionModalFetchDaytonaClubspeedSessionsMutation>(
      FetchDaytonaClubspeedSessionsMutation
    );
  const [commitImportDaytonaSession, isImportingDaytonaSession] =
    useMutation<ImportSessionModalImportDaytonaClubspeedSessionMutation>(
      ImportDaytonaClubspeedSessionMutation
    );

  const resetState = () => {
    setStep("source");
    setSelectedSource(null);
    setEmailContent("");
    setSelectedDriver("");
    setImportedParsed(null);
    setImportError(null);
    setSelectedTrackId("");
    setSelectedTrackLayoutId("");
    setWeatherStatus("idle");
    setWeatherData({ temperature: null, conditions: null });
    setDaytonaSessions([]);
    setDaytonaStatus("idle");
    setDaytonaError(null);
    setSelectedDaytonaHeatNo("");
    weatherRequestId.current += 1;
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const localParsed = useMemo(() => parseSessionEmail(emailContent), [emailContent]);
  const parsed = importedParsed ?? localParsed;
  const selectedDaytonaSession = daytonaSessions.find((session) => session.heatNo === selectedDaytonaHeatNo) ?? null;
  const daytonaCredentialsConfigured = daytonaCredentialStatus?.configured ?? false;
  const daytonaValidationError = daytonaCredentialStatus?.lastValidationError ?? null;
  const sourceTextForGuessing =
    selectedSource === "daytona" ? buildDaytonaSessionLabel(selectedDaytonaSession ?? { heatNo: "", activityType: "", sessionDate: null, sessionTime: null, kartNumber: null, classification: null }) : emailContent;
  const guessedTrackId = useMemo(() => {
    if (!parsed) return null;
    return guessTrackIdFromImport(tracks, {
      provider: parsed.provider,
      sourceText: sourceTextForGuessing,
    });
  }, [parsed, sourceTextForGuessing, tracks]);
  const isClubspeedDaytonaImport = selectedSource === "daytona" && parsed?.provider === "daytona";
  const fixedClubspeedTrackId = useMemo(() => {
    if (!isClubspeedDaytonaImport) return null;
    const explicitMatch =
      tracks.find((track) => {
        const normalizedName = track.name.toLowerCase();
        return normalizedName.includes("daytona") && normalizedName.includes("sandown");
      })?.id ?? null;
    return explicitMatch ?? guessedTrackId;
  }, [guessedTrackId, isClubspeedDaytonaImport, tracks]);

  useEffect(() => {
    if (!parsed || !hasDriverRows(parsed)) {
      setSelectedDriver("");
      return;
    }
    const defaultDriver = getDefaultSelectedDriver(parsed);
    setSelectedDriver((current) =>
      current && parsed.drivers.some((driver) => driver.name === current) ? current : defaultDriver
    );
  }, [parsed]);

  useEffect(() => {
    if (step !== "preview") return;
    const fallbackTrackId =
      fixedClubspeedTrackId ??
      guessedTrackId ??
      (tracks.length === 1 ? tracks[0]?.id ?? "" : "");
    if (isClubspeedDaytonaImport) {
      if (fallbackTrackId && selectedTrackId !== fallbackTrackId) {
        setSelectedTrackId(fallbackTrackId);
      }
      return;
    }
    if (selectedTrackId.trim()) return;
    if (fallbackTrackId) {
      setSelectedTrackId(fallbackTrackId);
    }
  }, [fixedClubspeedTrackId, guessedTrackId, isClubspeedDaytonaImport, selectedTrackId, step, tracks]);

  const selectedTrack = tracks.find((track) => track.id === selectedTrackId);
  const selectedTrackIsIndoors = selectedTrack?.isIndoors ?? false;
  const layoutTrack =
    selectedTrack ??
    (guessedTrackId ? tracks.find((track) => track.id === guessedTrackId) : undefined);
  const layoutOptions = layoutTrack?.trackLayouts ?? [];
  const guessedTrackLayoutId = guessTrackLayoutIdFromImport(
    layoutOptions,
    parsed?.provider === "daytona" ? parsed.trackLayoutName : null
  );
  const fallbackTrackLayoutId = guessedTrackLayoutId ?? layoutOptions[0]?.id ?? "";
  const shouldShowTrackLayoutSelection =
    step === "preview" && layoutOptions.length > 1 && guessedTrackLayoutId == null;
  const resolvedTrackLayoutId =
    layoutOptions.find((layout) => layout.id === selectedTrackLayoutId)?.id ?? fallbackTrackLayoutId;
  const resolvedTrackLayout =
    layoutOptions.find((layout) => layout.id === resolvedTrackLayoutId) ?? layoutOptions[0] ?? null;
  const resolvedTrackLayoutName = resolvedTrackLayout?.name ?? "Not found";
  const resolvedTrackName =
    selectedTrack?.name ??
    (fixedClubspeedTrackId
      ? tracks.find((track) => track.id === fixedClubspeedTrackId)?.name ?? "Daytona Sandown Park"
      : "Not found");

  const previewLaps = parsed ? getSelectedDriverLaps(parsed, selectedDriver) : [];
  const sessionDateTime = parsed?.sessionDate
    ? parsed.sessionTime
      ? `${parsed.sessionDate}T${parsed.sessionTime}`
      : parsed.sessionDate
    : null;

  useEffect(() => {
    if (!isOpen || step !== "daytona-session" || daytonaStatus !== "idle") return;
    if (!daytonaCredentialsConfigured) return;
    setDaytonaStatus("loading");
    setDaytonaError(null);
    commitFetchDaytonaSessions({
      variables: {},
      onCompleted: (response) => {
        const sessions = response.fetchDaytonaClubspeedSessions?.sessions ?? [];
        setDaytonaSessions(
          sessions.map((session) => ({
            heatNo: session.heatNo,
            activityType: session.activityType,
            sessionDate: session.sessionDate ?? null,
            sessionTime: session.sessionTime ?? null,
            kartNumber: session.kartNumber ?? null,
            classification: session.classification ?? null,
          }))
        );
        setDaytonaStatus("loaded");
      },
      onError: (error) => {
        setDaytonaStatus("error");
        setDaytonaError(error.message || "Unable to fetch Daytona Club Speed sessions.");
      },
    });
  }, [commitFetchDaytonaSessions, daytonaCredentialsConfigured, daytonaStatus, isOpen, step]);

  useEffect(() => {
    if (step !== "preview") return;
    const trimmedTrackId = selectedTrackId.trim();
    if (!trimmedTrackId || !sessionDateTime) {
      setWeatherStatus("unavailable");
      setWeatherData({ temperature: null, conditions: null });
      weatherRequestId.current += 1;
      return;
    }

    const requestId = weatherRequestId.current + 1;
    weatherRequestId.current = requestId;
    setWeatherStatus("loading");
    setWeatherData({ temperature: null, conditions: null });
    commitFetchWeather({
      variables: { input: { trackId: trimmedTrackId, date: sessionDateTime } },
      onCompleted: (response) => {
        if (weatherRequestId.current !== requestId) return;
        const payload = response.fetchTrackSessionTemperature;
        setWeatherData({
          temperature: payload?.temperature ?? null,
          conditions: selectedTrackIsIndoors
            ? "Dry"
            : payload?.conditions === "Dry" || payload?.conditions === "Wet"
              ? payload.conditions
              : null,
        });
        setWeatherStatus("loaded");
      },
      onError: () => {
        if (weatherRequestId.current !== requestId) return;
        setWeatherStatus("error");
        setWeatherData({ temperature: null, conditions: null });
      },
    });
  }, [commitFetchWeather, selectedTrackId, selectedTrackIsIndoors, sessionDateTime, step]);

  useEffect(() => {
    if (step !== "preview") return;
    if (!layoutOptions.length) {
      if (selectedTrackLayoutId !== "") {
        setSelectedTrackLayoutId("");
      }
      return;
    }

    if (selectedTrackLayoutId && layoutOptions.some((layout) => layout.id === selectedTrackLayoutId)) {
      return;
    }

    if (fallbackTrackLayoutId) {
      setSelectedTrackLayoutId(fallbackTrackLayoutId);
    }
  }, [fallbackTrackLayoutId, layoutOptions, selectedTrackLayoutId, step]);

  const alphaSessionUrl = extractAlphaTimingSessionUrl(emailContent);
  const hasInput = emailContent.trim().length > 0;
  const localPreviewLaps = localParsed ? getSelectedDriverLaps(localParsed, selectedDriver) : [];
  const canProceedFromEmail = hasInput && (alphaSessionUrl ? true : localPreviewLaps.length > 0);
  const weatherLoading = weatherStatus === "loading" || isFetchingWeather;
  const weatherUnavailableReason = !selectedTrackId.trim()
    ? "Select a track"
    : sessionDateTime
      ? "Not available"
      : "Missing session date";
  const weatherConditionsLabel = selectedTrackIsIndoors
    ? "Dry"
    : weatherLoading
      ? "Fetching..."
      : weatherStatus === "error"
        ? "Unable to fetch"
        : weatherStatus === "unavailable" || weatherStatus === "idle"
          ? weatherUnavailableReason
          : weatherData.conditions ?? "Not found";
  const weatherTemperatureLabel = weatherLoading
    ? "Fetching..."
    : weatherStatus === "error"
      ? "Unable to fetch"
      : weatherStatus === "unavailable" || weatherStatus === "idle"
        ? weatherUnavailableReason
        : weatherData.temperature
          ? `${weatherData.temperature} C`
          : "Not found";

  const handleContinueFromSource = () => {
    if (!selectedSource) return;
    setImportError(null);
    setStep(selectedSource === "daytona" ? "daytona-session" : "email");
  };

  const handleRetryDaytonaSessions = () => {
    if (!daytonaCredentialsConfigured) return;
    setDaytonaStatus("idle");
    setDaytonaError(null);
  };

  const handleNextFromEmail = () => {
    if (!canProceedFromEmail) return;
    setImportError(null);

    if (alphaSessionUrl) {
      commitImportTrackSessionFromUrl({
        variables: { input: { source: alphaSessionUrl } },
        onCompleted: (response) => {
          const parsedPayload = response.importTrackSessionFromUrl
            ? mapImportedPayloadToParsed(response.importTrackSessionFromUrl)
            : null;
          if (!parsedPayload || parsedPayload.provider !== "alphatiming") {
            setImportError("No import data was returned for that Alpha Timing URL.");
            return;
          }
          setImportedParsed(parsedPayload);
          setStep("preview");
        },
        onError: (error) => {
          setImportError(error.message || "Unable to import from URL.");
        },
      });
      return;
    }

    if (!localParsed || localPreviewLaps.length === 0) {
      setImportError(
        "No importable data found. Paste a supported session email or a full Alpha Timing URL."
      );
      return;
    }

    setImportedParsed(null);
    setStep("preview");
  };

  const handleNextFromDaytona = () => {
    if (!selectedDaytonaHeatNo) return;
    setImportError(null);
    commitImportDaytonaSession({
      variables: { input: { heatNo: selectedDaytonaHeatNo } },
      onCompleted: (response) => {
        const parsedPayload = response.importDaytonaClubspeedSession
          ? mapImportedPayloadToParsed(response.importDaytonaClubspeedSession)
          : null;
        if (!parsedPayload || parsedPayload.provider !== "daytona") {
          setImportError("No Daytona Club Speed session data was returned.");
          return;
        }
        setImportedParsed(parsedPayload);
        setStep("preview");
      },
      onError: (error) => {
        setImportError(error.message || "Unable to import Daytona Club Speed session.");
      },
    });
  };

  const handleBack = () => {
    setImportError(null);
    if (step === "preview") {
      setImportedParsed(null);
      setWeatherStatus("idle");
      setWeatherData({ temperature: null, conditions: null });
      weatherRequestId.current += 1;
      setStep(selectedSource === "daytona" ? "daytona-session" : "email");
      return;
    }
    if (step === "email" || step === "daytona-session") {
      setStep("source");
    }
  };

  const handleSubmitImport = () => {
    if (step !== "preview" || !parsed) return;
    const resolvedDriver = getResolvedSelectedDriver(parsed, selectedDriver);
    const laps = getSelectedDriverLaps(parsed, selectedDriver);
    if (!laps.length) return;

    onImport({
      provider: parsed.provider,
      sourceText:
        selectedSource === "daytona" && selectedDaytonaSession
          ? buildDaytonaSessionLabel(selectedDaytonaSession)
          : emailContent.trim(),
      sessionFormat: parsed.sessionFormat,
      sessionDate: parsed.sessionDate,
      sessionTime: parsed.sessionTime,
      classification: getSelectedClassification(parsed, selectedDriver),
      kartNumber: getSelectedKartNumber(parsed, selectedDriver),
      kartTypeName:
        parsed.provider === "daytona" &&
        "kartTypeName" in parsed &&
        typeof parsed.kartTypeName === "string"
          ? parsed.kartTypeName
          : null,
      trackLayoutId: resolvedTrackLayoutId || null,
      trackLayoutName:
        resolvedTrackLayout?.name ??
        ("trackLayoutName" in parsed ? parsed.trackLayoutName ?? null : null),
      laps,
      trackId: selectedTrackId.trim() ? selectedTrackId.trim() : null,
      temperature: weatherData.temperature,
      conditions: selectedTrackIsIndoors ? "Dry" : weatherData.conditions,
      driverName: hasDriverRows(parsed) ? selectedDriver || parsed.drivers[0]?.name : undefined,
      participants: hasDriverRows(parsed)
        ? parsed.drivers.map((driver) => ({
            name: driver.name,
            classification: driver.classification ?? null,
            kartNumber: "kartNumber" in driver ? driver.kartNumber ?? null : null,
            isSelf: resolvedDriver != null && driver.name === resolvedDriver.name,
            laps: driver.laps,
          }))
        : undefined,
      sessionFastestLapSeconds: parsed.sessionFastestLapSeconds ?? null,
    });
    handleClose();
  };

  if (!isOpen) return null;

  const title = step === "source" ? "Import Session" : "Import Session";
  const intro =
    step === "source"
      ? "Choose how you want to import session data."
      : step === "email"
        ? "Paste the email that describes your session and we'll preview what we found."
        : step === "daytona-session"
          ? "Choose one Daytona Club Speed session to review before importing."
          : "Review the parsed session details before importing.";

  const primaryDisabled =
    step === "source"
      ? !selectedSource
      : step === "email"
        ? isImportingFromUrl || !canProceedFromEmail
        : step === "daytona-session"
          ? isImportingDaytonaSession || !selectedDaytonaHeatNo
          : previewLaps.length === 0;

  const primaryLabel =
    step === "source"
      ? "Continue"
      : step === "email"
        ? isImportingFromUrl
          ? "Importing..."
          : "Next"
        : step === "daytona-session"
          ? isImportingDaytonaSession
            ? "Importing..."
            : "Next"
          : "Import";

  return (
    <div css={modalOverlayStyles} onClick={handleClose}>
      <div css={modalContentStyles} onClick={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        <p css={stepIntroStyles}>{intro}</p>

        {step === "source" ? (
          <SourceStep selectedSource={selectedSource} onSelectSource={setSelectedSource} />
        ) : null}
        {step === "email" ? (
          <EmailStep
            emailContent={emailContent}
            importError={importError}
            onEmailContentChange={setEmailContent}
          />
        ) : null}
        {step === "daytona-session" ? (
          <DaytonaSessionStep
            credentialsConfigured={daytonaCredentialsConfigured}
            storedValidationError={daytonaValidationError}
            sessions={daytonaSessions}
            status={isFetchingDaytonaSessions && daytonaStatus === "loading" ? "loading" : daytonaStatus}
            errorMessage={daytonaError ?? importError}
            selectedHeatNo={selectedDaytonaHeatNo}
            onRetry={handleRetryDaytonaSessions}
            onSelectHeatNo={setSelectedDaytonaHeatNo}
          />
        ) : null}
        {step === "preview" ? (
        <PreviewStep
          parsed={parsed}
          selectedDriver={selectedDriver}
          selectedTrackId={selectedTrackId}
          selectedTrackLayoutId={selectedTrackLayoutId}
          resolvedTrackName={resolvedTrackName}
          lockTrackSelection={isClubspeedDaytonaImport}
          tracks={tracks}
          trackLayouts={layoutOptions}
          resolvedTrackLayoutName={resolvedTrackLayoutName}
          showTrackLayoutSelection={shouldShowTrackLayoutSelection}
          weatherConditionsLabel={weatherConditionsLabel}
          weatherTemperatureLabel={weatherTemperatureLabel}
          onSelectTrackId={setSelectedTrackId}
          onSelectTrackLayoutId={setSelectedTrackLayoutId}
          onSelectDriver={setSelectedDriver}
        />
        ) : null}

        <div css={buttonGroupStyles}>
          <button type="button" css={secondaryButtonStyles} onClick={handleClose}>
            Cancel
          </button>
          {step !== "source" ? (
            <button type="button" css={secondaryButtonStyles} onClick={handleBack}>
              Back
            </button>
          ) : null}
          <button
            type="button"
            css={primaryButtonStyles}
            disabled={primaryDisabled}
            onClick={
              step === "source"
                ? handleContinueFromSource
                : step === "email"
                  ? handleNextFromEmail
                  : step === "daytona-session"
                    ? handleNextFromDaytona
                    : handleSubmitImport
            }
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
