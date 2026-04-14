import { useEffect, useMemo, useRef, useState } from "react";
import { fetchQuery, graphql, useMutation, useRelayEnvironment } from "react-relay";
import { useNavigate } from "react-router-dom";
import { extractAlphaTimingImportSource } from "../../../shared/alphaTimingUrl.js";
import type { ImportSessionModalDaytonaBulkImportJobQuery } from "../../__generated__/ImportSessionModalDaytonaBulkImportJobQuery.graphql.js";
import type { ImportSessionModalFetchDaytonaClubspeedSessionsMutation } from "../../__generated__/ImportSessionModalFetchDaytonaClubspeedSessionsMutation.graphql.js";
import type { ImportSessionModalFetchTrackSessionWeatherMutation } from "../../__generated__/ImportSessionModalFetchTrackSessionWeatherMutation.graphql.js";
import type { ImportSessionModalImportTrackSessionFromUrlMutation } from "../../__generated__/ImportSessionModalImportTrackSessionFromUrlMutation.graphql.js";
import type { ImportSessionModalResolveTrackSessionImportSourceMutation } from "../../__generated__/ImportSessionModalResolveTrackSessionImportSourceMutation.graphql.js";
import type { ImportSessionModalStartDaytonaClubspeedBulkImportMutation } from "../../__generated__/ImportSessionModalStartDaytonaClubspeedBulkImportMutation.graphql.js";
import {
  guessKartIdFromImport,
  guessTrackIdFromImport,
  guessTrackLayoutIdFromImport,
} from "../../utils/guessTrackFromImport.js";
import { parseSessionEmail } from "../../utils/parseSessionEmail.js";
import { type ParsedSessionEmail, type SessionImportSelection } from "../../utils/sessionImportTypes.js";
import { AlphaTimingSessionStep } from "./importWizard/AlphaTimingSessionStep.js";
import { DaytonaBulkImportProgressStep } from "./importWizard/DaytonaBulkImportProgressStep.js";
import { DaytonaSessionStep } from "./importWizard/DaytonaSessionStep.js";
import { EmailStep } from "./importWizard/EmailStep.js";
import {
  buildAlphaTimingSessionLabel,
  getDefaultSelectedDriver,
  getResolvedSelectedDriver,
  getSelectedClassification,
  getSelectedDriverLaps,
  getSelectedKartNumber,
  hasDriverRows,
  inferDaytonaKartTypeName,
  mapImportedPayloadToParsed,
  type AlphaTimingSessionOption,
  type DaytonaClubspeedSessionOption,
} from "./importWizard/helpers.js";
import { PreviewStep } from "./importWizard/PreviewStep.js";
import { SourceStep } from "./importWizard/SourceStep.js";
import {
  buttonGroupStyles,
  modalBodyStyles,
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
    karts: ReadonlyArray<{ id: string; name: string }>;
    trackLayouts: ReadonlyArray<{ id: string; name: string }>;
  }>;
}

type WeatherStatus = "idle" | "loading" | "loaded" | "error" | "unavailable";
type WizardStep = "source" | "email" | "daytona-session" | "daytona-progress" | "alpha-session" | "preview";
type ImportSource = "email" | "daytona" | null;
type DaytonaBulkImportJob = NonNullable<
  ImportSessionModalDaytonaBulkImportJobQuery["response"]["daytonaClubspeedBulkImportJob"]
>;

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
        lapEvents {
          offset
          event
          value
        }
      }
      drivers {
        name
        classification
        kartNumber
        laps {
          lapNumber
          timeSeconds
          displayTime
          lapEvents {
            offset
            event
            value
          }
        }
      }
    }
  }
`;

const ResolveTrackSessionImportSourceMutation = graphql`
  mutation ImportSessionModalResolveTrackSessionImportSourceMutation(
    $input: ResolveTrackSessionImportSourceInput!
  ) {
    resolveTrackSessionImportSource(input: $input) {
      provider
      sessionUrl
      alphaTimingSessions {
        sessionUrl
        title
        sessionDate
        sessionTime
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
        alreadyImported
      }
    }
  }
`;

const StartDaytonaClubspeedBulkImportMutation = graphql`
  mutation ImportSessionModalStartDaytonaClubspeedBulkImportMutation(
    $input: StartDaytonaClubspeedBulkImportInput!
  ) {
    startDaytonaClubspeedBulkImport(input: $input) {
      job {
        id
        status
        totalCount
        processedCount
        createdCount
        skippedCount
        failedCount
        errorMessage
        results {
          heatNo
          status
          errorMessage
          trackSession {
            id
            date
            format
          }
        }
      }
    }
  }
`;

const DaytonaBulkImportJobQuery = graphql`
  query ImportSessionModalDaytonaBulkImportJobQuery($id: ID!) {
    daytonaClubspeedBulkImportJob(id: $id) {
      id
      status
      totalCount
      processedCount
      createdCount
      skippedCount
      failedCount
      errorMessage
      results {
        heatNo
        status
        errorMessage
        trackSession {
          id
          date
          format
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
  const navigate = useNavigate();
  const relayEnvironment = useRelayEnvironment();
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
  const [selectedDaytonaHeatNos, setSelectedDaytonaHeatNos] = useState<string[]>([]);
  const [selectedDaytonaTrackLayoutId, setSelectedDaytonaTrackLayoutId] = useState("");
  const [daytonaKartTypeSelections, setDaytonaKartTypeSelections] = useState<Record<string, string>>({});
  const [daytonaBulkImportJob, setDaytonaBulkImportJob] = useState<DaytonaBulkImportJob | null>(null);
  const [alphaTimingSessions, setAlphaTimingSessions] = useState<AlphaTimingSessionOption[]>([]);
  const [selectedAlphaTimingSessionUrl, setSelectedAlphaTimingSessionUrl] = useState("");
  const weatherRequestId = useRef(0);
  const [commitFetchWeather, isFetchingWeather] =
    useMutation<ImportSessionModalFetchTrackSessionWeatherMutation>(FetchSessionWeatherMutation);
  const [commitResolveTrackSessionImportSource, isResolvingTrackSessionImportSource] =
    useMutation<ImportSessionModalResolveTrackSessionImportSourceMutation>(
      ResolveTrackSessionImportSourceMutation
    );
  const [commitImportTrackSessionFromUrl, isImportingFromUrl] =
    useMutation<ImportSessionModalImportTrackSessionFromUrlMutation>(ImportTrackSessionFromUrlMutation);
  const [commitFetchDaytonaSessions, isFetchingDaytonaSessions] =
    useMutation<ImportSessionModalFetchDaytonaClubspeedSessionsMutation>(
      FetchDaytonaClubspeedSessionsMutation
    );
  const [commitStartDaytonaBulkImport, isStartingDaytonaBulkImport] =
    useMutation<ImportSessionModalStartDaytonaClubspeedBulkImportMutation>(
      StartDaytonaClubspeedBulkImportMutation
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
    setSelectedDaytonaHeatNos([]);
    setSelectedDaytonaTrackLayoutId("");
    setDaytonaKartTypeSelections({});
    setDaytonaBulkImportJob(null);
    setAlphaTimingSessions([]);
    setSelectedAlphaTimingSessionUrl("");
    weatherRequestId.current += 1;
  };

  const createdDaytonaTrackSessionIds = useMemo(
    () =>
      daytonaBulkImportJob?.results
        .map((result) => result.trackSession?.id)
        .filter((id): id is string => Boolean(id)) ?? [],
    [daytonaBulkImportJob]
  );
  const isDaytonaImportFinished =
    step === "daytona-progress" &&
    (daytonaBulkImportJob?.status === "COMPLETED" || daytonaBulkImportJob?.status === "FAILED");

  const handleViewImportedSessions = () => {
    const query = createdDaytonaTrackSessionIds.map(encodeURIComponent).join(",");
    resetState();
    onClose();
    navigate(query ? `/session?sessionId=${query}` : "/session");
  };

  const handleClose = () => {
    if (
      step === "daytona-progress" &&
      (daytonaBulkImportJob?.status === "QUEUED" || daytonaBulkImportJob?.status === "RUNNING") &&
      !window.confirm("Import is still running. Closing this window hides progress but does not cancel it.")
    ) {
      return;
    }
    resetState();
    onClose();
  };

  const localParsed = useMemo(() => parseSessionEmail(emailContent), [emailContent]);
  const parsed = importedParsed ?? localParsed;
  const daytonaCredentialsConfigured = daytonaCredentialStatus?.configured ?? false;
  const daytonaValidationError = daytonaCredentialStatus?.lastValidationError ?? null;
  const sourceTextForGuessing = emailContent;
  const guessedTrackId = useMemo(() => {
    if (!parsed) return null;
    return guessTrackIdFromImport(tracks, {
      provider: parsed.provider,
      sourceText: sourceTextForGuessing,
    });
  }, [parsed, sourceTextForGuessing, tracks]);
  const selectedDaytonaHeatNoSet = useMemo(
    () => new Set(selectedDaytonaHeatNos),
    [selectedDaytonaHeatNos]
  );
  const availableDaytonaSessions = useMemo(
    () => daytonaSessions.filter((session) => !session.alreadyImported),
    [daytonaSessions]
  );
  const selectedDaytonaSessions = useMemo(
    () => availableDaytonaSessions.filter((session) => selectedDaytonaHeatNoSet.has(session.heatNo)),
    [availableDaytonaSessions, selectedDaytonaHeatNoSet]
  );
  const selectedDaytonaTrack = useMemo(
    () =>
      tracks.find((track) => {
        const normalizedName = track.name.toLowerCase();
        return normalizedName.includes("daytona") && normalizedName.includes("sandown");
      }) ?? null,
    [tracks]
  );
  const selectedDaytonaTrackLayout =
    selectedDaytonaTrack?.trackLayouts.find((layout) => layout.id === selectedDaytonaTrackLayoutId) ?? null;
  const selectedDaytonaKartTypes = useMemo(
    () =>
      Array.from(
        new Set(selectedDaytonaSessions.map((session) => inferDaytonaKartTypeName(session.activityType)))
      ),
    [selectedDaytonaSessions]
  );
  const daytonaMappingError =
    selectedDaytonaSessions.length === 0
      ? "Select at least one unimported Daytona Club Speed session."
      : !selectedDaytonaTrack
        ? "Daytona Sandown Park is not configured as a track."
        : !selectedDaytonaTrackLayout
          ? "Select a track layout for the selected sessions."
          : selectedDaytonaKartTypes.some((kartType) => {
              const selectedKartId = daytonaKartTypeSelections[kartType] ?? "";
              return !selectedDaytonaTrack.karts.some((kart) => kart.id === selectedKartId);
            })
            ? "Select a kart type for every detected Daytona kart."
            : null;
  const canStartDaytonaBulkImport =
    daytonaStatus === "loaded" &&
    selectedDaytonaSessions.length > 0 &&
    daytonaMappingError == null &&
    !isStartingDaytonaBulkImport;

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
      guessedTrackId ??
      (tracks.length === 1 ? tracks[0]?.id ?? "" : "");
    if (selectedTrackId.trim()) return;
    if (fallbackTrackId) {
      setSelectedTrackId(fallbackTrackId);
    }
  }, [guessedTrackId, selectedTrackId, step, tracks]);

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
    selectedTrack?.name ?? "Not found";

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
        const mappedSessions = sessions.map((session) => ({
            heatNo: session.heatNo,
            activityType: session.activityType,
            sessionDate: session.sessionDate ?? null,
            sessionTime: session.sessionTime ?? null,
            kartNumber: session.kartNumber ?? null,
            classification: session.classification ?? null,
            alreadyImported: session.alreadyImported ?? false,
          }));
        setDaytonaSessions(mappedSessions);
        setSelectedDaytonaHeatNos(
          mappedSessions.filter((session) => !session.alreadyImported).map((session) => session.heatNo)
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
    if (step !== "daytona-session") return;
    if (!selectedDaytonaTrack) {
      if (selectedDaytonaTrackLayoutId) setSelectedDaytonaTrackLayoutId("");
      setDaytonaKartTypeSelections({});
      return;
    }

    if (
      selectedDaytonaTrackLayoutId &&
      selectedDaytonaTrack.trackLayouts.some((layout) => layout.id === selectedDaytonaTrackLayoutId)
    ) {
      return;
    }
    setSelectedDaytonaTrackLayoutId(selectedDaytonaTrack.trackLayouts[0]?.id ?? "");
  }, [selectedDaytonaTrack, selectedDaytonaTrackLayoutId, step]);

  useEffect(() => {
    if (step !== "daytona-session" || !selectedDaytonaTrack) return;
    setDaytonaKartTypeSelections((current) => {
      const next: Record<string, string> = {};
      for (const kartType of selectedDaytonaKartTypes) {
        const currentKartId = current[kartType] ?? "";
        const currentStillValid = selectedDaytonaTrack.karts.some((kart) => kart.id === currentKartId);
        next[kartType] =
          currentStillValid
            ? currentKartId
            : guessKartIdFromImport(selectedDaytonaTrack.karts, kartType) ?? "";
      }
      return next;
    });
  }, [selectedDaytonaKartTypes, selectedDaytonaTrack, step]);

  useEffect(() => {
    if (!daytonaBulkImportJob?.id) return;
    if (step !== "daytona-progress") return;
    if (daytonaBulkImportJob.status !== "QUEUED" && daytonaBulkImportJob.status !== "RUNNING") {
      return;
    }

    const timer = window.setTimeout(() => {
      fetchQuery<ImportSessionModalDaytonaBulkImportJobQuery>(
        relayEnvironment,
        DaytonaBulkImportJobQuery,
        { id: daytonaBulkImportJob.id },
        { fetchPolicy: "network-only" }
      ).subscribe({
        next: (response) => {
          if (response.daytonaClubspeedBulkImportJob) {
            setDaytonaBulkImportJob(response.daytonaClubspeedBulkImportJob);
          }
        },
        error: (error: Error) => {
          setDaytonaError(error.message || "Unable to refresh Daytona bulk import progress.");
        },
      });
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [daytonaBulkImportJob, relayEnvironment, step]);

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

  const alphaImportSource = extractAlphaTimingImportSource(emailContent);
  const hasInput = emailContent.trim().length > 0;
  const localPreviewLaps = localParsed ? getSelectedDriverLaps(localParsed, selectedDriver) : [];
  const canProceedFromEmail = hasInput && (alphaImportSource ? true : localPreviewLaps.length > 0);
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

  const importResolvedAlphaTimingSession = (sessionUrl: string) => {
    commitImportTrackSessionFromUrl({
      variables: { input: { source: sessionUrl } },
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
  };

  const handleNextFromEmail = () => {
    if (!canProceedFromEmail) return;
    setImportError(null);

    if (alphaImportSource) {
      commitResolveTrackSessionImportSource({
        variables: { input: { source: alphaImportSource.normalizedSource } },
        onCompleted: (response) => {
          const payload = response.resolveTrackSessionImportSource;
          if (!payload || payload.provider !== "alphatiming") {
            setImportError("No import data was returned for that Alpha Timing URL.");
            return;
          }

          const resolvedSessionUrl = payload.sessionUrl?.trim() ?? "";
          if (resolvedSessionUrl) {
            setAlphaTimingSessions([]);
            setSelectedAlphaTimingSessionUrl("");
            importResolvedAlphaTimingSession(resolvedSessionUrl);
            return;
          }

          const sessions =
            payload.alphaTimingSessions?.map((session) => ({
              sessionUrl: session.sessionUrl,
              title: session.title ?? null,
              sessionDate: session.sessionDate ?? null,
              sessionTime: session.sessionTime ?? null,
            })) ?? [];
          if (sessions.length === 0) {
            setImportError("No import data was returned for that Alpha Timing URL.");
            return;
          }

          setAlphaTimingSessions(sessions);
          setSelectedAlphaTimingSessionUrl("");
          setStep("alpha-session");
        },
        onError: (error) => {
          setImportError(error.message || "Unable to resolve Alpha Timing URL.");
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

  const handleToggleDaytonaHeatNo = (heatNo: string) => {
    setSelectedDaytonaHeatNos((current) =>
      current.includes(heatNo)
        ? current.filter((currentHeatNo) => currentHeatNo !== heatNo)
        : [...current, heatNo]
    );
  };

  const handleSelectAllDaytonaSessions = () => {
    setSelectedDaytonaHeatNos(availableDaytonaSessions.map((session) => session.heatNo));
  };

  const handleSelectLatestDaytonaDate = () => {
    const latestDate = availableDaytonaSessions.find((session) => session.sessionDate)?.sessionDate ?? null;
    if (!latestDate) {
      handleSelectAllDaytonaSessions();
      return;
    }
    setSelectedDaytonaHeatNos(
      availableDaytonaSessions
        .filter((session) => session.sessionDate === latestDate)
        .map((session) => session.heatNo)
    );
  };

  const handleStartDaytonaBulkImport = () => {
    if (!canStartDaytonaBulkImport || !selectedDaytonaTrack || !selectedDaytonaTrackLayout) return;
    setImportError(null);
    setDaytonaError(null);
    commitStartDaytonaBulkImport({
      variables: {
        input: {
          sessions: selectedDaytonaSessions.map((session) => ({
            heatNo: session.heatNo,
            trackId: selectedDaytonaTrack.id,
            trackLayoutId: selectedDaytonaTrackLayout.id,
            kartId: daytonaKartTypeSelections[inferDaytonaKartTypeName(session.activityType)] ?? "",
          })),
        },
      },
      onCompleted: (response) => {
        const job = response.startDaytonaClubspeedBulkImport?.job ?? null;
        if (!job) {
          setImportError("No Daytona Club Speed bulk import job was returned.");
          return;
        }
        setDaytonaBulkImportJob(job);
        setStep("daytona-progress");
      },
      onError: (error) => {
        setImportError(error.message || "Unable to start Daytona Club Speed bulk import.");
      },
    });
  };

  const handleNextFromAlphaTiming = () => {
    if (!selectedAlphaTimingSessionUrl) return;
    setImportError(null);
    importResolvedAlphaTimingSession(selectedAlphaTimingSessionUrl);
  };

  const handleBack = () => {
    setImportError(null);
    if (step === "preview") {
      setImportedParsed(null);
      setWeatherStatus("idle");
      setWeatherData({ temperature: null, conditions: null });
      weatherRequestId.current += 1;
      setStep(
        alphaTimingSessions.length > 0
            ? "alpha-session"
            : "email"
      );
      return;
    }
    if (step === "alpha-session") {
      setAlphaTimingSessions([]);
      setSelectedAlphaTimingSessionUrl("");
      setStep("email");
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
        selectedSource === "email" && alphaTimingSessions.length > 0 && selectedAlphaTimingSessionUrl
            ? buildAlphaTimingSessionLabel(
                alphaTimingSessions.find(
                  (session) => session.sessionUrl === selectedAlphaTimingSessionUrl
                ) ?? {
                  sessionUrl: selectedAlphaTimingSessionUrl,
                  title: null,
                  sessionDate: parsed.sessionDate,
                  sessionTime: parsed.sessionTime,
                }
              )
          : emailContent.trim(),
      externalImportProvider: null,
      externalImportId: null,
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
          ? "Choose Daytona Club Speed sessions and confirm the mappings before importing."
          : step === "daytona-progress"
            ? "Daytona Club Speed sessions are being imported in the background."
          : step === "alpha-session"
            ? "Choose the Alpha Timing session you want to import from this event."
          : "Review the parsed session details before importing.";

  const primaryDisabled =
    step === "source"
      ? !selectedSource
      : step === "email"
        ? isResolvingTrackSessionImportSource || isImportingFromUrl || !canProceedFromEmail
        : step === "daytona-session"
          ? !canStartDaytonaBulkImport
          : step === "daytona-progress"
            ? true
          : step === "alpha-session"
            ? isImportingFromUrl || !selectedAlphaTimingSessionUrl
          : previewLaps.length === 0;

  const primaryLabel =
    step === "source"
      ? "Continue"
      : step === "email"
        ? isResolvingTrackSessionImportSource || isImportingFromUrl
          ? "Loading..."
          : "Next"
        : step === "daytona-session"
          ? isStartingDaytonaBulkImport
            ? "Starting..."
            : `Import ${selectedDaytonaSessions.length || ""}`.trim()
          : step === "daytona-progress"
            ? "Importing..."
          : step === "alpha-session"
            ? isImportingFromUrl
              ? "Importing..."
              : "Next"
          : "Import";

  return (
    <div css={modalOverlayStyles} onClick={handleClose}>
      <div css={modalContentStyles} onClick={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        <p css={stepIntroStyles}>{intro}</p>

        <div css={modalBodyStyles}>
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
              selectedHeatNos={selectedDaytonaHeatNos}
              selectedTrackLayoutId={selectedDaytonaTrackLayoutId}
              kartTypeSelections={daytonaKartTypeSelections}
              mappingError={daytonaMappingError}
              selectedTrack={selectedDaytonaTrack}
              onRetry={handleRetryDaytonaSessions}
              onToggleHeatNo={handleToggleDaytonaHeatNo}
              onSelectAll={handleSelectAllDaytonaSessions}
              onSelectNone={() => setSelectedDaytonaHeatNos([])}
              onSelectLatestDate={handleSelectLatestDaytonaDate}
              onSelectTrackLayoutId={setSelectedDaytonaTrackLayoutId}
              onSelectKartType={(kartType, kartId) =>
                setDaytonaKartTypeSelections((current) => ({ ...current, [kartType]: kartId }))
              }
            />
          ) : null}
          {step === "daytona-progress" ? (
            <DaytonaBulkImportProgressStep
              job={daytonaBulkImportJob}
              sessions={daytonaSessions}
            />
          ) : null}
          {step === "alpha-session" ? (
            <AlphaTimingSessionStep
              sessions={alphaTimingSessions}
              selectedSessionUrl={selectedAlphaTimingSessionUrl}
              errorMessage={importError}
              onSelectSessionUrl={setSelectedAlphaTimingSessionUrl}
            />
          ) : null}
          {step === "preview" ? (
            <PreviewStep
              parsed={parsed}
              selectedDriver={selectedDriver}
              selectedTrackId={selectedTrackId}
              selectedTrackLayoutId={selectedTrackLayoutId}
              resolvedTrackName={resolvedTrackName}
              lockTrackSelection={false}
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
        </div>

        <div css={buttonGroupStyles}>
          {!isDaytonaImportFinished ? (
            <button type="button" css={secondaryButtonStyles} onClick={handleClose}>
              Cancel
            </button>
          ) : null}
          {step !== "source" && step !== "daytona-progress" ? (
            <button type="button" css={secondaryButtonStyles} onClick={handleBack}>
              Back
            </button>
          ) : null}
          {isDaytonaImportFinished ? (
            <button type="button" css={primaryButtonStyles} onClick={handleViewImportedSessions}>
              View sessions
            </button>
          ) : null}
          {step !== "daytona-progress" ? (
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
                      ? handleStartDaytonaBulkImport
                      : step === "alpha-session"
                        ? handleNextFromAlphaTiming
                        : handleSubmitImport
              }
            >
              {primaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
