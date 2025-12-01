import { css } from "@emotion/react";
import { useMemo, useState } from "react";
import {
  parseDaytonaEmail,
  type ParsedDaytonaEmail,
} from "../utils/parseDaytonaEmail.js";
import { formatLapTimeSeconds } from "../utils/lapTime.js";

interface ImportSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (result: ParsedDaytonaEmail) => void;
}

const modalOverlayStyles = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const modalContentStyles = css`
  background: white;
  padding: 30px;
  border-radius: 10px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  position: relative;
`;

const inputFieldStyles = css`
  margin-top: 15px;

  label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #333;
  }

  textarea {
    width: 100%;
    min-height: 220px;
    padding: 12px;
    border: 1px solid #e2e8f4;
    border-radius: 8px;
    font-size: 1rem;
    color: #0b1021;
    background-color: #f7faff;
    resize: vertical;
    transition: border-color 0.2s ease-in-out;

    &:focus {
      border-color: #6366f1;
      outline: none;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }
  }
`;

const buttonGroupStyles = css`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const baseButtonStyles = css`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
`;

const primaryButtonStyles = css`
  ${baseButtonStyles}
  background-color: #6366f1;
  color: white;

  &:hover {
    background-color: #4f46e5;
  }

  &:disabled {
    background-color: #a5b4fc;
    cursor: not-allowed;
  }
`;

const secondaryButtonStyles = css`
  ${baseButtonStyles}
  background-color: #e2e8f4;
  color: #333;

  &:hover {
    background-color: #cbd5e1;
  }
`;

const previewStyles = css`
  margin-top: 20px;
  padding: 12px;
  border: 1px solid #e2e8f4;
  border-radius: 8px;
  background-color: #f8fafc;
  display: grid;
  gap: 10px;
`;

const lapListStyles = css`
  max-height: 160px;
  overflow: auto;
  padding: 10px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e2e8f4;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.9rem;
  line-height: 1.4;
`;

export function ImportSessionModal({ isOpen, onClose, onImport }: ImportSessionModalProps) {
  const [emailContent, setEmailContent] = useState("");

  const handleClose = () => {
    setEmailContent("");
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = parseDaytonaEmail(emailContent);
    onImport(parsed);
    handleClose();
  };

  const parsed = useMemo(() => parseDaytonaEmail(emailContent), [emailContent]);
  const hasLaps = parsed.laps.length > 0;
  const importDisabled = !emailContent.trim() || !hasLaps;

  if (!isOpen) return null;

  return (
    <div css={modalOverlayStyles} onClick={handleClose}>
      <div css={modalContentStyles} onClick={(e) => e.stopPropagation()}>
        <h2>Import Session Email</h2>
        <p>Paste the email that describes your session and we&apos;ll crunch it soon.</p>
        <form onSubmit={handleSubmit}>
          <div css={inputFieldStyles}>
            <label htmlFor="session-import-email">Email contents</label>
            <textarea
              id="session-import-email"
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Paste the raw email text here"
              required
            />
          </div>
          <div css={previewStyles}>
            <div>
              <strong>Session format:</strong>{" "}
              {parsed.sessionFormat ?? "Not found"}
            </div>
            <div>
              <strong>Lap timings:</strong>{" "}
              {parsed.laps.length ? `${parsed.laps.length} found` : "None found"}
              {parsed.laps.length ? (
                <div css={lapListStyles}>
                  {parsed.laps.slice(0, 15).map((lap) => (
                    <div key={lap.lapNumber}>
                      Lap {lap.lapNumber.toString().padStart(2, "0")} —{" "}
                      {formatLapTimeSeconds(lap.timeSeconds)}s
                    </div>
                  ))}
                  {parsed.laps.length > 15 ? (
                    <div>…and {parsed.laps.length - 15} more</div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          <div css={buttonGroupStyles}>
            <button type="button" css={secondaryButtonStyles} onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" css={primaryButtonStyles} disabled={importDisabled}>
              Import
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
