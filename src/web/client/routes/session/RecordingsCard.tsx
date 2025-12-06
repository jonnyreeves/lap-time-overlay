import { css } from "@emotion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { graphql, useMutation } from "react-relay";
import type { RecordingsCardStartUploadMutation } from "../../__generated__/RecordingsCardStartUploadMutation.graphql.js";
import type { RecordingsCardDeleteRecordingMutation } from "../../__generated__/RecordingsCardDeleteRecordingMutation.graphql.js";
import { Card } from "../../components/Card.js";

type UploadTarget = {
  id: string;
  fileName: string;
  sizeBytes: number | null | undefined;
  uploadedBytes: number;
  status: string;
  ordinal: number;
  uploadUrl?: string | null;
};

type Recording = {
  id: string;
  description: string | null;
  sizeBytes: number | null;
  createdAt: string;
  status: string;
  error: string | null;
  combineProgress: number | null;
  uploadProgress: { uploadedBytes: number; totalBytes: number | null };
  uploadTargets: UploadTarget[];
};

type Props = {
  sessionId: string;
  recordings: readonly Recording[];
  onRefresh: () => void;
};

const uploadControlsStyles = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
`;

const fileListStyles = css`
  display: grid;
  gap: 8px;
`;

const fileRowStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e2e8f4;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f8fafc;
  gap: 10px;

  .meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .actions {
    display: flex;
    gap: 6px;
  }
`;

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

const dropZoneStyles = css`
  width: 100%;
  margin-top: 10px;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 16px;
  background: #f8fafc;
  color: #0f172a;
  display: grid;
  gap: 6px;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.1s ease;

  &:hover {
    border-color: #6366f1;
    background: #eef2ff;
    transform: translateY(-1px);
  }
`;

const previewStyles = css`
  margin-top: 8px;
  width: 100%;
  max-width: 360px;
  border-radius: 12px;
  border: 1px solid #e2e8f4;
  overflow: hidden;
  background: #0b1021;

  video {
    width: 100%;
    display: block;
    max-height: 220px;
    object-fit: cover;
    background: #0f172a;
  }
`;

const buttonStyles = css`
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #d7deed;
  background: #fff;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  &:disabled {
    background: #e2e8f4;
    color: #94a3b8;
    cursor: not-allowed;
  }
`;

const primaryButtonStyles = css`
  padding: 10px 14px;
  border-radius: 10px;
  background: linear-gradient(90deg, #4f46e5, #6366f1);
  color: white;
  font-weight: 600;
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.25);
  transition: transform 0.15s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 32px rgba(79, 70, 229, 0.25);
  }

  &:disabled {
    background: #a5b4fc;
    box-shadow: none;
    cursor: not-allowed;
  }
`;

const StartUploadMutation = graphql`
  mutation RecordingsCardStartUploadMutation($input: StartTrackRecordingUploadInput!) {
    startTrackRecordingUpload(input: $input) {
      recording {
        id
        status
        combineProgress
        uploadProgress {
          uploadedBytes
          totalBytes
        }
      }
      uploadTargets {
        id
        fileName
        sizeBytes
        uploadedBytes
        status
        ordinal
        uploadUrl
      }
    }
  }
`;

const DeleteRecordingMutation = graphql`
  mutation RecordingsCardDeleteRecordingMutation($id: ID!) {
    deleteTrackRecording(id: $id) {
      success
    }
  }
`;

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let val = bytes / 1024;
  let unit = units[0];
  for (let i = 0; i < units.length; i++) {
    if (val < 1024 || i === units.length - 1) {
      unit = units[i];
      break;
    }
    val /= 1024;
  }
  return `${val.toFixed(1)} ${unit}`;
}

function percent(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function nextId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

type FileEntry = { id: string; file: File };

export function RecordingsCard({ sessionId, recordings, onRefresh }: Props) {
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [description, setDescription] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeSelections, setResumeSelections] = useState<Record<string, File[]>>({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [startUpload, isStartInFlight] = useMutation<RecordingsCardStartUploadMutation>(
    StartUploadMutation
  );
  const [deleteRecording, isDeleteInFlight] = useMutation<RecordingsCardDeleteRecordingMutation>(
    DeleteRecordingMutation
  );

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
    const shouldWarn = isUploading || isStartInFlight || fileEntries.length > 0 || hasResumeFiles;
    if (!shouldWarn) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [fileEntries.length, isStartInFlight, isUploading, resumeSelections]);

  function onFilesSelected(list: FileList | null) {
    if (!list) return;
    const next: FileEntry[] = [...fileEntries];
    for (const file of Array.from(list)) {
      next.push({ id: nextId(), file });
    }
    setFileEntries(next);
  }

  function onDropFiles(event: React.DragEvent) {
    event.preventDefault();
    if (isUploading || isStartInFlight) return;
    setIsDragging(false);
    onFilesSelected(event.dataTransfer?.files ?? null);
  }

  function onDragOver(event: React.DragEvent) {
    event.preventDefault();
    if (isUploading || isStartInFlight) return;
    setIsDragging(true);
  }

  function onDragLeave() {
    setIsDragging(false);
  }

  function triggerFilePicker() {
    if (isUploading || isStartInFlight) return;
    fileInputRef.current?.click();
  }

  function moveFile(idx: number, direction: -1 | 1) {
    const target = idx + direction;
    if (target < 0 || target >= fileEntries.length) return;
    const next = [...fileEntries];
    [next[idx], next[target]] = [next[target], next[idx]];
    setFileEntries(next);
  }

  function removeFile(id: string) {
    setFileEntries((current) => current.filter((entry) => entry.id !== id));
  }

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
    if (pendingTargets.length === 0) return;
    const selected = resumeSelections[recording.id] ?? [];
    if (selected.length !== pendingTargets.length) {
      setUploadError(
        "Please select the same number of files (in the original order) to resume this upload."
      );
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      await uploadToTargets(pendingTargets as UploadTarget[], selected);
      onRefresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function uploadToTargets(targets: UploadTarget[], sources: File[]) {
    const orderedTargets = [...targets].sort((a, b) => a.ordinal - b.ordinal);
    for (const target of orderedTargets) {
      const file = sources[target.ordinal - 1];
      if (!file || !target.uploadUrl) {
        throw new Error("Upload target is missing");
      }
      const response = await fetch(target.uploadUrl, {
        method: "PUT",
        body: file,
        credentials: "same-origin",
        headers: { "Content-Type": "application/octet-stream" },
      });
      if (!response.ok) {
        throw new Error(`Upload failed with ${response.status}`);
      }
    }
  }

  function beginUpload() {
    if (fileEntries.length === 0) {
      setUploadError("Select at least one file to upload.");
      return;
    }
    const selectedFiles = fileEntries.map((entry) => entry.file);
    setFileEntries([]);
    setUploadError(null);
    setIsUploading(true);

    startUpload({
      variables: {
        input: {
          sessionId,
          description: description.trim() || null,
          sources: selectedFiles.map((entry) => ({
            fileName: entry.name,
            sizeBytes: entry.size,
          })),
        },
      },
      onCompleted: (payload) => {
        void (async () => {
          try {
            const session = payload.startTrackRecordingUpload;
            if (!session) {
              throw new Error("Upload session was not created");
            }
            // Kick off a refresh immediately so the new recording shows up and polling can track progress.
            onRefresh();
            const targets = (session.uploadTargets ?? []).map((target) => ({ ...target }));
            await uploadToTargets(targets, selectedFiles);
            setDescription("");
            onRefresh();
          } catch (err) {
            setUploadError(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setIsUploading(false);
          }
        })();
      },
      onError: (err) => {
        setUploadError(err.message);
        setIsUploading(false);
      },
    });
  }

  function handleDelete(id: string) {
    if (isDeleteInFlight) return;
    const confirmed = window.confirm("Delete this recording and its file?");
    if (!confirmed) return;
    deleteRecording({
      variables: { id },
      onCompleted: () => onRefresh(),
      onError: (err) => setUploadError(err.message),
    });
  }

  return (
    <Card
      title="Video"
      rightComponent={
        !isUploading && !isStartInFlight ? (
          <button css={primaryButtonStyles} onClick={beginUpload}>
            Upload footage
          </button>
        ) : undefined
      }
    >
      <div css={uploadControlsStyles}>
        {isUploading || isStartInFlight ? (
          <div
            css={css`
              padding: 12px;
              border: 1px solid #d7deed;
              border-radius: 10px;
              background: #eef2ff;
            `}
          >
            <strong>Upload in progress…</strong>
            <p css={css`margin: 6px 0 0; color: #475569;`}>
              Sit tight while your files are streaming. This card will update as we receive progress.
            </p>
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*"
              onChange={(e) => onFilesSelected(e.target.files)}
              disabled={isUploading || isStartInFlight}
              css={css`
                display: none;
              `}
            />
            <div
              css={[
                dropZoneStyles,
                isDragging &&
                  css`
                    border-color: #4f46e5;
                    background: #eef2ff;
                  `,
              ]}
              onClick={triggerFilePicker}
              onDrop={onDropFiles}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
            >
              <strong>Drag & drop video files</strong>
              <span>…or click to choose files to attach to this session.</span>
              <button
                css={buttonStyles}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFilePicker();
                }}
              >
                Choose files
              </button>
            </div>
            <label>
              <span>Description</span>
              <input
                type="text"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isUploading || isStartInFlight}
                css={css`
                  width: 100%;
                  padding: 10px 12px;
                  border-radius: 8px;
                  border: 1px solid #e2e8f4;
                  margin-top: 6px;
                `}
              />
            </label>
            {fileEntries.length > 0 && (
              <div css={fileListStyles}>
                {fileEntries.map((entry, idx) => (
                  <div key={entry.id} css={fileRowStyles}>
                    <div className="meta">
                      <strong>
                        {idx + 1}. {entry.file.name}
                      </strong>
                      <span>{formatBytes(entry.file.size)}</span>
                    </div>
                    <div className="actions">
                      <button css={buttonStyles} onClick={() => moveFile(idx, -1)} disabled={idx === 0}>
                        ↑
                      </button>
                      <button
                        css={buttonStyles}
                        onClick={() => moveFile(idx, 1)}
                        disabled={idx === fileEntries.length - 1}
                      >
                        ↓
                      </button>
                      <button css={buttonStyles} onClick={() => removeFile(entry.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {uploadError && <div css={css`color: #b91c1c;`}>{uploadError}</div>}
      </div>

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
                  <div className="status">{recording.status.toLowerCase()}</div>
                </div>
                {isFinished && (
                  <div css={previewStyles}>
                    <video
                      src={`/recordings/${recording.id}`}
                      preload="metadata"
                      muted
                      playsInline
                      controls
                      aria-label="Recording preview"
                    />
                  </div>
                )}
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
                      css={buttonStyles}
                      href={`/recordings/${recording.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download / View
                    </a>
                  )}
                  <button
                    css={buttonStyles}
                    onClick={() => handleDelete(recording.id)}
                    disabled={isDeleteInFlight}
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
                        disabled={isUploading || isStartInFlight}
                      />
                      <button
                        css={buttonStyles}
                        onClick={() => resumeRecordingUpload(recording)}
                        disabled={isUploading || isStartInFlight}
                      >
                        Resume
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
