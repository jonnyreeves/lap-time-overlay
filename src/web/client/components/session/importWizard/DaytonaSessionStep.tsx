import { Link } from "react-router-dom";
import {
  compactActionRowStyles,
  daytonaBulkStepStyles,
  errorTextStyles,
  loadingRowStyles,
  mappingErrorStyles,
  mappingGridStyles,
  mappingRowStyles,
  sessionTableStyles,
  sessionTableViewportStyles,
  spinnerStyles,
} from "./styles.js";
import {
  buildDaytonaSessionLabel,
  inferDaytonaKartTypeName,
  type DaytonaClubspeedSessionOption,
} from "./helpers.js";

type DaytonaImportTrack = {
  id: string;
  name: string;
  karts: ReadonlyArray<{ id: string; name: string }>;
  trackLayouts: ReadonlyArray<{ id: string; name: string }>;
};

interface DaytonaSessionStepProps {
  credentialsConfigured: boolean;
  storedValidationError: string | null;
  sessions: ReadonlyArray<DaytonaClubspeedSessionOption>;
  status: "idle" | "loading" | "loaded" | "error";
  errorMessage: string | null;
  selectedHeatNos: ReadonlyArray<string>;
  selectedTrackLayoutId: string;
  kartTypeSelections: Record<string, string>;
  mappingError: string | null;
  selectedTrack: DaytonaImportTrack | null;
  onRetry: () => void;
  onToggleHeatNo: (heatNo: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onSelectLatestDate: () => void;
  onSelectTrackLayoutId: (trackLayoutId: string) => void;
  onSelectKartType: (kartType: string, kartId: string) => void;
}

export function DaytonaSessionStep({
  credentialsConfigured,
  storedValidationError,
  sessions,
  status,
  errorMessage,
  selectedHeatNos,
  selectedTrackLayoutId,
  kartTypeSelections,
  mappingError,
  selectedTrack,
  onRetry,
  onToggleHeatNo,
  onSelectAll,
  onSelectNone,
  onSelectLatestDate,
  onSelectTrackLayoutId,
  onSelectKartType,
}: DaytonaSessionStepProps) {
  if (!credentialsConfigured) {
    return (
      <p>
        Daytona Club Speed credentials are not configured. Add them in your{" "}
        <Link to="/profile">profile</Link> to use this importer.
      </p>
    );
  }

  if (status === "loading" || status === "idle") {
    return (
      <p css={loadingRowStyles}>
        <span css={spinnerStyles} aria-hidden="true" />
        <span>Loading Daytona Club Speed sessions…</span>
      </p>
    );
  }

  if (status === "error") {
    const isCredentialError = (errorMessage ?? "").toLowerCase().includes("credential");
    return (
      <div>
        <p css={errorTextStyles}>{errorMessage ?? "Unable to fetch Daytona Club Speed sessions."}</p>
        {isCredentialError ? (
          <p>
            Update your Daytona Club Speed credentials in your <Link to="/profile">profile</Link>.
          </p>
        ) : (
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    );
  }

  if (storedValidationError) {
    return (
      <div>
        <p css={errorTextStyles}>{storedValidationError}</p>
        <p>
          Update your Daytona Club Speed credentials in your <Link to="/profile">profile</Link>.
        </p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return <p>No Daytona Club Speed sessions were available for this account.</p>;
  }

  const availableSessions = sessions.filter((session) => !session.alreadyImported);
  const selectedHeatNoSet = new Set(selectedHeatNos);
  const selectedSessions = availableSessions.filter((session) => selectedHeatNoSet.has(session.heatNo));
  const kartTypes = Array.from(
    new Set(selectedSessions.map((session) => inferDaytonaKartTypeName(session.activityType)))
  );

  return (
    <div css={daytonaBulkStepStyles}>
      <div css={compactActionRowStyles}>
        <button type="button" onClick={onSelectAll} disabled={availableSessions.length === 0}>
          All unimported
        </button>
        <button type="button" onClick={onSelectLatestDate} disabled={availableSessions.length === 0}>
          Latest date
        </button>
        <button type="button" onClick={onSelectNone} disabled={selectedHeatNos.length === 0}>
          None
        </button>
      </div>
      <div css={sessionTableViewportStyles}>
        <table css={sessionTableStyles}>
          <thead>
            <tr>
              <th>Import</th>
              <th>Date</th>
              <th>Time</th>
              <th>Session</th>
              <th>Kart</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.heatNo} aria-disabled={session.alreadyImported ? "true" : "false"}>
                <td>
                  <input
                    type="checkbox"
                    checked={!session.alreadyImported && selectedHeatNoSet.has(session.heatNo)}
                    disabled={session.alreadyImported}
                    aria-label={`Import ${buildDaytonaSessionLabel(session)}`}
                    onChange={() => onToggleHeatNo(session.heatNo)}
                  />
                </td>
                <td>{session.sessionDate ?? "Unknown"}</td>
                <td>{session.sessionTime ?? "Unknown"}</td>
                <td>{session.activityType}</td>
                <td>{session.kartNumber ?? "Unknown"}</td>
                <td>
                  {session.alreadyImported
                    ? "Already imported"
                    : session.classification != null
                      ? `${session.classification}`
                      : "Unknown"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {availableSessions.length === 0 ? (
        <p>All available Daytona Club Speed sessions for this account have already been imported.</p>
      ) : null}
      {selectedSessions.length > 0 ? (
        <div css={mappingGridStyles}>
          <strong>Mappings for {selectedSessions.length} selected sessions</strong>
          <div css={mappingRowStyles}>
            <label htmlFor="daytona-bulk-layout">Track layout</label>
            <select
              id="daytona-bulk-layout"
              value={selectedTrackLayoutId}
              onChange={(event) => onSelectTrackLayoutId(event.target.value)}
              disabled={!selectedTrack}
            >
              <option value="">Select a layout</option>
              {selectedTrack?.trackLayouts.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.name}
                </option>
              ))}
            </select>
          </div>
          {kartTypes.map((kartType) => (
            <div key={kartType} css={mappingRowStyles}>
              <label htmlFor={`daytona-bulk-kart-${kartType}`}>{kartType} kart</label>
              <select
                id={`daytona-bulk-kart-${kartType}`}
                value={kartTypeSelections[kartType] ?? ""}
                onChange={(event) => onSelectKartType(kartType, event.target.value)}
                disabled={!selectedTrack}
              >
                <option value="">Select a kart type</option>
                {selectedTrack?.karts.map((kart) => (
                  <option key={kart.id} value={kart.id}>
                    {kart.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {mappingError ? <p css={mappingErrorStyles}>{mappingError}</p> : null}
        </div>
      ) : availableSessions.length > 0 ? (
        <p>Select at least one unimported Daytona Club Speed session.</p>
      ) : null}
    </div>
  );
}
