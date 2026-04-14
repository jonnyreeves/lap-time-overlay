import { selectStyles } from "./styles.js";
import {
  buildAlphaTimingSessionLabel,
  type AlphaTimingSessionOption,
} from "./helpers.js";

interface AlphaTimingSessionStepProps {
  sessions: ReadonlyArray<AlphaTimingSessionOption>;
  selectedSessionUrl: string;
  errorMessage: string | null;
  onSelectSessionUrl: (sessionUrl: string) => void;
}

export function AlphaTimingSessionStep({
  sessions,
  selectedSessionUrl,
  errorMessage,
  onSelectSessionUrl,
}: AlphaTimingSessionStepProps) {
  if (sessions.length === 0) {
    return <p>No Alpha Timing sessions were found for this event.</p>;
  }

  return (
    <div css={selectStyles}>
      <label htmlFor="alphatiming-session-select">Choose a session</label>
      <select
        id="alphatiming-session-select"
        value={selectedSessionUrl}
        onChange={(event) => onSelectSessionUrl(event.target.value)}
      >
        <option value="">Select a session</option>
        {sessions.map((session) => (
          <option key={session.sessionUrl} value={session.sessionUrl}>
            {buildAlphaTimingSessionLabel(session)}
          </option>
        ))}
      </select>
      {errorMessage ? <p>{errorMessage}</p> : null}
    </div>
  );
}
