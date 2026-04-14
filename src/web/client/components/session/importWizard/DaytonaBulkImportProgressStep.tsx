import { Link } from "react-router-dom";
import {
  errorTextStyles,
  progressBarInnerStyles,
  progressBarOuterStyles,
  resultListStyles,
  resultRowStyles,
} from "./styles.js";
import {
  buildDaytonaSessionLabel,
  type DaytonaClubspeedSessionOption,
} from "./helpers.js";

type BulkImportJob = {
  id: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "%future added value";
  totalCount: number;
  processedCount: number;
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  errorMessage: string | null | undefined;
  results: ReadonlyArray<{
    heatNo: string;
    status: "CREATED" | "SKIPPED" | "FAILED" | "%future added value";
    errorMessage: string | null | undefined;
    trackSession: { id: string; date: string; format: string } | null | undefined;
  }>;
};

interface DaytonaBulkImportProgressStepProps {
  job: BulkImportJob | null;
  sessions: ReadonlyArray<DaytonaClubspeedSessionOption>;
}

function statusLabel(status: BulkImportJob["status"], processed: number, total: number) {
  if (status === "QUEUED") return "Starting Daytona import...";
  if (status === "RUNNING") return `Importing ${processed} of ${total}...`;
  if (status === "FAILED") return "Import failed";
  return "Import complete";
}

export function DaytonaBulkImportProgressStep({
  job,
  sessions,
}: DaytonaBulkImportProgressStepProps) {
  if (!job) {
    return <p>Starting Daytona import...</p>;
  }

  const percent =
    job.totalCount > 0 ? Math.round((job.processedCount / job.totalCount) * 100) : 0;
  const sessionByHeatNo = new Map(sessions.map((session) => [session.heatNo, session]));

  return (
    <div>
      <p>
        <strong>{statusLabel(job.status, job.processedCount, job.totalCount)}</strong>
      </p>
      <div css={progressBarOuterStyles} aria-label="Daytona bulk import progress">
        <div css={progressBarInnerStyles(percent)} />
      </div>
      <p>
        Created {job.createdCount} · Skipped {job.skippedCount} · Failed {job.failedCount}
      </p>
      {job.errorMessage ? <p css={errorTextStyles}>{job.errorMessage}</p> : null}
      {job.results.length > 0 ? (
        <div css={resultListStyles}>
          {job.results.map((result) => {
            const session = sessionByHeatNo.get(result.heatNo);
            return (
              <div key={result.heatNo} css={resultRowStyles}>
                <span>{session ? buildDaytonaSessionLabel(session) : result.heatNo}</span>
                <span>
                  {result.trackSession ? (
                    <Link to={`/session/${result.trackSession.id}`}>
                      Created {result.trackSession.format}
                    </Link>
                  ) : result.status === "SKIPPED" ? (
                    "Skipped"
                  ) : (
                    result.errorMessage ?? "Failed"
                  )}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
