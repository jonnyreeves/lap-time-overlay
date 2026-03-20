import { errorTextStyles, inputFieldStyles } from "./styles.js";

interface EmailStepProps {
  emailContent: string;
  importError: string | null;
  onEmailContentChange: (value: string) => void;
}

export function EmailStep({ emailContent, importError, onEmailContentChange }: EmailStepProps) {
  return (
    <div css={inputFieldStyles}>
      <label htmlFor="session-import-email">Email contents</label>
      <textarea
        id="session-import-email"
        value={emailContent}
        onChange={(event) => onEmailContentChange(event.target.value)}
        placeholder="Paste the raw email text here"
        required
      />
      {importError ? <p css={errorTextStyles}>{importError}</p> : null}
    </div>
  );
}
