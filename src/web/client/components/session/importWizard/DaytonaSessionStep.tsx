import { errorTextStyles, loadingRowStyles, selectStyles, spinnerStyles } from "./styles.js";
import {
  buildDaytonaSessionLabel,
  type DaytonaClubspeedSessionOption,
} from "./helpers.js";

interface DaytonaSessionStepProps {
  sessions: ReadonlyArray<DaytonaClubspeedSessionOption>;
  status: "idle" | "loading" | "loaded" | "error";
  errorMessage: string | null;
  selectedHeatNo: string;
  onRetry: () => void;
  onSelectHeatNo: (heatNo: string) => void;
}

export function DaytonaSessionStep({
  sessions,
  status,
  errorMessage,
  selectedHeatNo,
  onRetry,
  onSelectHeatNo,
}: DaytonaSessionStepProps) {
  if (status === "loading" || status === "idle") {
    return (
      <p css={loadingRowStyles}>
        <span css={spinnerStyles} aria-hidden="true" />
        <span>Loading Daytona Club Speed sessions…</span>
      </p>
    );
  }

  if (status === "error") {
    return (
      <div>
        <p css={errorTextStyles}>{errorMessage ?? "Unable to fetch Daytona Club Speed sessions."}</p>
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return <p>No Daytona Club Speed sessions were available for this account.</p>;
  }

  return (
    <div css={selectStyles}>
      <label htmlFor="daytona-session-select">Choose a session</label>
      <select
        id="daytona-session-select"
        value={selectedHeatNo}
        onChange={(event) => onSelectHeatNo(event.target.value)}
      >
        <option value="">Select a session</option>
        {sessions.map((session) => (
          <option key={session.heatNo} value={session.heatNo}>
            {buildDaytonaSessionLabel(session)}
          </option>
        ))}
      </select>
    </div>
  );
}
