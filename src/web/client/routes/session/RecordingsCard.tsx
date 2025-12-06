import { css } from "@emotion/react";
import { useEffect, useMemo, useState } from "react";
import { graphql, useMutation } from "react-relay";
import type { RecordingsCardDeleteRecordingMutation } from "../../__generated__/RecordingsCardDeleteRecordingMutation.graphql.js";
import type { RecordingsCardMarkPrimaryRecordingMutation } from "../../__generated__/RecordingsCardMarkPrimaryRecordingMutation.graphql.js";
import { Card } from "../../components/Card.js";
import {
  formatBytes,
  recordingButtonStyles,
  uploadToTargets,
  type UploadTarget,
} from "./recordingShared.js";

type Recording = {
  id: string;
  description: string | null;
  sizeBytes: number | null;
  isPrimary: boolean;
  lapOneOffset: number;
  durationMs: number | null;
  fps: number | null;
  createdAt: string;
  status: string;
  error: string | null;
  combineProgress: number | null;
  uploadProgress: { uploadedBytes: number; totalBytes: number | null };
  uploadTargets: UploadTarget[];
};

type Props = {
  recordings: readonly Recording[];
  onRefresh: () => void;
  uploadInProgress: boolean;
  onUploadStateChange?: (inProgress: boolean) => void;
};

const recordingsListStyles = css`
  display: grid;
  gap: 12px;
`;

const recordingRowStyles = css`
  border: 1px solid #e2e8f4;
  border-radius: 12px;
  padding: 12px;
  background: #f9fbff;
  display: grid;
  gap: 8px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .status {
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 0.85rem;
    background: #e0e7ff;
    color: #312e81;
    text-transform: capitalize;
  }

  .primary {
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 0.85rem;
    background: #ecfdf3;
    color: #166534;
    border: 1px solid #bbf7d0;
  }

  .error {
    color: #b91c1c;
    font-weight: 600;
  }
`;

const progressBarStyles = css`
  height: 8px;
  border-radius: 6px;
  background: #e2e8f4;
  overflow: hidden;
  position: relative;

  .fill {
    background: linear-gradient(90deg, #4f46e5, #0ea5e9);
    height: 100%;
    transition: width 0.3s ease;
  }
`;

const controlsRowStyles = css`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const DeleteRecordingMutation = graphql`
  mutation RecordingsCardDeleteRecordingMutation($id: ID!) {
    deleteTrackRecording(id: $id) {
      success
    }
  }
`;

const MarkPrimaryRecordingMutation = graphql`
  mutation RecordingsCardMarkPrimaryRecordingMutation($id: ID!) {
    markPrimaryTrackRecording(id: $id) {
      recording {
        id
        isPrimary
        updatedAt
      }
    }
  }
`;

function percent(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

export function RecordingsCard({
  recordings,
  onRefresh,
  uploadInProgress,
  onUploadStateChange,
}: Props) {
  const [resumeSelections, setResumeSelections] = useState<Record<string, File[]>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [isResuming, setIsResuming] = useState(false);
  const [deleteRecording, isDeleteInFlight] =
    useMutation<RecordingsCardDeleteRecordingMutation>(DeleteRecordingMutation);
  const [markPrimary, isMarkPrimaryInFlight] =
    useMutation<RecordingsCardMarkPrimaryRecordingMutation>(MarkPrimaryRecordingMutation);

  const hasPendingRecording = useMemo(
    () => recordings.some((recording) => recording.status !== "READY"),
    [recordings]
  );

  const sortedRecordings = useMemo(
    () =>
      [...recordings].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [recordings]
  );

  useEffect(() => {
    const hasResumeFiles = Object.values(resumeSelections).some((files) => files.length > 0);
    const shouldWarn = isResuming || hasResumeFiles;
    if (!shouldWarn) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isResuming, resumeSelections]);

  function onResumeFilesSelected(recordingId: string, list: FileList | null) {
    if (!list) return;
    setResumeSelections((current) => ({
      ...current,
      [recordingId]: Array.from(list),
    }));
  }

  async function resumeRecordingUpload(recording: Recording) {
    const pendingTargets = recording.uploadTargets.filter(
      (target) => target.uploadUrl && target.status !== "UPLOADED"
    );
    if (pendingTargets.length === 0 || uploadInProgress || isResuming) return;
    const selected = resumeSelections[recording.id] ?? [];
    if (selected.length !== pendingTargets.length) {
      setActionError(
        "Please select the same number of files (in the original order) to resume this upload."
      );
      return;
    }
    setActionError(null);
    setIsResuming(true);
    onUploadStateChange?.(true);
    try {
      await uploadToTargets(pendingTargets as UploadTarget[], selected);
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsResuming(false);
      onUploadStateChange?.(false);
    }
  }

  function setPrimaryRecording(recording: Recording) {
    if (isMarkPrimaryInFlight) return;
    setActionError(null);
    markPrimary({
      variables: { id: recording.id },
      onCompleted: () => onRefresh(),
      onError: (err) => setActionError(err.message),
    });
  }

  function handleDelete(id: string) {
    if (isDeleteInFlight) return;
    const confirmed = window.confirm("Delete this recording and its file?");
    if (!confirmed) return;
    deleteRecording({
      variables: { id },
      onCompleted: () => onRefresh(),
      onError: (err) => setActionError(err.message),
    });
  }

  return (
    <Card title="Recordings">
      {actionError && <div css={css`color: #b91c1c; margin-bottom: 8px;`}>{actionError}</div>}

      <div css={recordingsListStyles}>
        {sortedRecordings.length === 0 ? (
          <p>No recordings attached yet.</p>
        ) : (
          sortedRecordings.map((recording) => {
            const total = recording.uploadProgress.totalBytes;
            const uploaded = recording.uploadProgress.uploadedBytes;
            const uploadPercent = total ? Math.min(100, Math.round((uploaded / total) * 100)) : 0;
            const combinePercent = percent(recording.combineProgress ?? 0);
            const isFinished = recording.status === "READY";
            return (
              <div key={recording.id} css={recordingRowStyles}>
                <div className="header">
                  <div>
                    <strong>{recording.description || "Recording"}</strong>
                    <div>{new Date(recording.createdAt).toLocaleString()}</div>
                    {isFinished && recording.sizeBytes != null && (
                      <div>Size: {formatBytes(recording.sizeBytes)}</div>
                    )}
                  </div>
                  <div css={css`display: flex; gap: 8px; align-items: center;`}>
                    {recording.isPrimary && <span className="primary">Primary</span>}
                    <div className="status">{recording.status.toLowerCase()}</div>
                  </div>
                </div>
                {recording.error && <div className="error">{recording.error}</div>}
                {!isFinished && (
                  <>
                    <div>
                      <div>Upload progress: {formatBytes(uploaded)} / {formatBytes(total)}</div>
                      <div css={progressBarStyles}>
                        <div className="fill" style={{ width: `${uploadPercent}%` }} />
                      </div>
                    </div>
                    <div>
                      <div>Combine progress: {combinePercent}%</div>
                      <div css={progressBarStyles}>
                        <div className="fill" style={{ width: `${combinePercent}%` }} />
                      </div>
                    </div>
                  </>
                )}
                <div css={controlsRowStyles}>
                  {isFinished && (
                    <a
                      css={recordingButtonStyles}
                      href={`/recordings/${recording.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download / View
                    </a>
                  )}
                  {isFinished && !recording.isPrimary && (
                    <button
                      css={recordingButtonStyles}
                      onClick={() => setPrimaryRecording(recording)}
                      disabled={isMarkPrimaryInFlight}
                      type="button"
                    >
                      {isMarkPrimaryInFlight ? "Updating…" : "Mark as primary"}
                    </button>
                  )}
                  <button
                    css={recordingButtonStyles}
                    onClick={() => handleDelete(recording.id)}
                    disabled={isDeleteInFlight}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
                {recording.status === "FAILED" &&
                  recording.uploadTargets.some((target) => target.uploadUrl) && (
                  <div>
                    <strong>Resume upload</strong>
                    <div css={controlsRowStyles}>
                      <input
                        type="file"
                        multiple
                        accept="video/*"
                        onChange={(e) => onResumeFilesSelected(recording.id, e.target.files)}
                        disabled={uploadInProgress || isResuming}
                      />
                      <button
                        css={recordingButtonStyles}
                        onClick={() => resumeRecordingUpload(recording)}
                        disabled={uploadInProgress || isResuming}
                        type="button"
                      >
                        {isResuming ? "Resuming…" : "Resume"}
                      </button>
                    </div>
                    <p css={css`margin: 6px 0 0; color: #475569;`}>
                      Select the original source files in order to continue uploading the pending parts.
                    </p>
                  </div>
                )}
                {recording.uploadTargets.length > 0 && !isFinished && (
                  <div>
                    <strong>Sources</strong>
                    <ul>
                      {recording.uploadTargets.map((target) => (
                        <li key={target.id}>
                          {target.ordinal}. {target.fileName} — {target.status.toLowerCase()} (
                          {formatBytes(target.uploadedBytes)} / {formatBytes(target.sizeBytes)})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {hasPendingRecording && (
        <p css={css`margin-top: 10px; color: #475569;`}>
          Uploads and combines run in the background. This view refreshes automatically.
        </p>
      )}
    </Card>
  );
}
