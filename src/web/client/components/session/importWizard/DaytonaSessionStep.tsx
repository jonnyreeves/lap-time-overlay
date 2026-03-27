import { Link } from "react-router-dom";
import { errorTextStyles, loadingRowStyles, selectStyles, spinnerStyles } from "./styles.js";
import {
  buildDaytonaSessionLabel,
  type DaytonaClubspeedSessionOption,
} from "./helpers.js";

interface DaytonaSessionStepProps {
  credentialsConfigured: boolean;
  storedValidationError: string | null;
  sessions: ReadonlyArray<DaytonaClubspeedSessionOption>;
  status: "idle" | "loading" | "loaded" | "error";
  errorMessage: string | null;
  selectedHeatNo: string;
  onRetry: () => void;
  onSelectHeatNo: (heatNo: string) => void;
}

export function DaytonaSessionStep({
  credentialsConfigured,
  storedValidationError,
  sessions,
  status,
  errorMessage,
  selectedHeatNo,
  onRetry,
  onSelectHeatNo,
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

  return (
    <div css={selectStyles}>
      <label htmlFor="daytona-session-select">Choose a session</label>
      <select
        id="daytona-session-select"
        value={selectedHeatNo}
        onChange={(event) => onSelectHeatNo(event.target.value)}
      >
        <option value="">
          {availableSessions.length > 0 ? "Select a session" : "No new sessions available"}
        </option>
        {sessions.map((session) => (
          <option key={session.heatNo} value={session.heatNo} disabled={session.alreadyImported}>
            {buildDaytonaSessionLabel(session)}
          </option>
        ))}
      </select>
      {availableSessions.length === 0 ? (
        <p>All available Daytona Club Speed sessions for this account have already been imported.</p>
      ) : null}
    </div>
  );
}
