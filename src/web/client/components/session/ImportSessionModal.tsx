import { css } from "@emotion/react";
import { useEffect, useMemo, useState } from "react";
import { formatLapTimeSeconds } from "../../utils/lapTime.js";
import { parseSessionEmail } from "../../utils/parseSessionEmail.js";
import {
  type ParsedSessionEmail,
  type SessionImportSelection,
} from "../../utils/sessionImportTypes.js";

interface ImportSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (result: SessionImportSelection) => void;
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

const selectStyles = css`
  margin-top: 10px;

  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
  }

  select {
    width: 100%;
    padding: 10px;
    border: 1px solid #e2e8f4;
    border-radius: 8px;
    font-size: 1rem;
    background: #fff;
  }
`;

const inputPreviewGridStyles = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

function getSelectedDriverLaps(parsed: ParsedSessionEmail, selectedDriver: string) {
  if (parsed.provider !== "teamsport") return parsed.laps;
  const driver =
    parsed.drivers.find((d) => d.name === selectedDriver) ?? parsed.drivers[0] ?? null;
  return driver?.laps ?? [];
}

function getSelectedClassification(parsed: ParsedSessionEmail, selectedDriver: string) {
  if (parsed.provider !== "teamsport") return parsed.classification ?? null;
  const driver =
    parsed.drivers.find((d) => d.name === selectedDriver) ?? parsed.drivers[0] ?? null;
  return driver?.classification ?? null;
}

export function ImportSessionModal({ isOpen, onClose, onImport }: ImportSessionModalProps) {
  const [emailContent, setEmailContent] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");

  const handleClose = () => {
    setEmailContent("");
    setSelectedDriver("");
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = parseSessionEmail(emailContent);
    if (!parsed) return;

    const laps =
      parsed.provider === "teamsport"
        ? getSelectedDriverLaps(parsed, selectedDriver)
        : parsed.laps;

    if (!laps.length) return;

    onImport({
      provider: parsed.provider,
      sourceText: emailContent.trim(),
      sessionFormat: parsed.sessionFormat,
      sessionDate: parsed.sessionDate,
      sessionTime: parsed.sessionTime,
      classification: getSelectedClassification(parsed, selectedDriver),
      kartNumber: parsed.provider === "daytona" ? parsed.kartNumber : null,
      laps,
      driverName: parsed.provider === "teamsport" ? selectedDriver || parsed.drivers[0]?.name : undefined,
      sessionFastestLapSeconds: parsed.sessionFastestLapSeconds ?? null,
    });
    handleClose();
  };

  const parsed = useMemo<ParsedSessionEmail | null>(
    () => parseSessionEmail(emailContent),
    [emailContent]
  );

  useEffect(() => {
    if (parsed?.provider === "teamsport") {
      const defaultDriver = parsed.drivers[0]?.name ?? "";
      setSelectedDriver((current) =>
        current && parsed.drivers.some((driver) => driver.name === current)
          ? current
          : defaultDriver
      );
    } else {
      setSelectedDriver("");
    }
  }, [parsed]);

  const previewLaps =
    parsed?.provider === "teamsport"
      ? getSelectedDriverLaps(parsed, selectedDriver)
      : parsed?.laps ?? [];
  const previewClassification = parsed
    ? getSelectedClassification(parsed, selectedDriver)
    : null;
  const previewFastestLap = parsed?.sessionFastestLapSeconds ?? null;
  const previewKartNumber = parsed?.provider === "daytona" ? parsed.kartNumber : null;

  const importDisabled = !emailContent.trim() || !(previewLaps?.length ?? 0);

  if (!isOpen) return null;

  return (
    <div css={modalOverlayStyles} onClick={handleClose}>
      <div css={modalContentStyles} onClick={(e) => e.stopPropagation()}>
        <h2>Import Session Email</h2>
        <p>Paste the email that describes your session and we&apos;ll crunch it soon.</p>
        <form onSubmit={handleSubmit}>
          <div css={inputPreviewGridStyles}>
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
              {parsed ? (
                <>
                  <div>
                    <strong>Source:</strong> {parsed.provider}
                  </div>
                  <div>
                    <strong>Session date:</strong>{" "}
                    {parsed.sessionDate ?? "Not found"}
                  </div>
                  <div>
                    <strong>Session time:</strong>{" "}
                    {parsed.sessionTime ?? "Not found"}
                  </div>
                  <div>
                    <strong>Session format:</strong>{" "}
                    {parsed.sessionFormat ?? "Not found"}
                  </div>
                  <div>
                    <strong>Classification:</strong>{" "}
                    {previewClassification ?? "Not found"}
                  </div>
                  <div>
                    <strong>Kart number:</strong>{" "}
                    {previewKartNumber ? previewKartNumber : "Not found"}
                  </div>
                  <div>
                    <strong>Session fastest lap:</strong>{" "}
                    {previewFastestLap != null
                      ? `${formatLapTimeSeconds(previewFastestLap)}s`
                      : "Not found"}
                  </div>
                  {parsed.provider === "teamsport" ? (
                    <div css={selectStyles}>
                      <label htmlFor="session-import-driver">Choose your driver</label>
                      <select
                        id="session-import-driver"
                        value={selectedDriver}
                        onChange={(e) => setSelectedDriver(e.target.value)}
                      >
                        {parsed.drivers.map((driver) => (
                          <option key={driver.name} value={driver.name}>
                            {driver.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  <div>
                    <strong>Lap timings:</strong>{" "}
                    {previewLaps.length ? `${previewLaps.length} found` : "None found"}
                    {previewLaps.length ? (
                      <div css={lapListStyles}>
                        {previewLaps.slice(0, 15).map((lap) => (
                          <div key={lap.lapNumber}>
                            Lap {lap.lapNumber.toString().padStart(2, "0")} —{" "}
                            {formatLapTimeSeconds(lap.timeSeconds)}s
                          </div>
                        ))}
                        {previewLaps.length > 15 ? (
                          <div>…and {previewLaps.length - 15} more</div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <div>No importable data detected yet.</div>
              )}
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
