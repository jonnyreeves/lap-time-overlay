import { css } from "@emotion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { graphql, useMutation } from "react-relay";
import type { UploadRecordingCardStartUploadMutation } from "../../__generated__/UploadRecordingCardStartUploadMutation.graphql.js";
import { Card } from "../Card.js";
import {
  formatBytes,
  recordingButtonStyles,
  uploadToTargets,
  type UploadTarget,
} from "./recordingShared.js";

type FileEntry = { id: string; file: File };

type Props = {
  sessionId: string;
  onRefresh: () => void;
  uploadInProgress: boolean;
  onUploadStateChange?: (inProgress: boolean) => void;
};

const uploadControlsStyles = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
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

const footerStyles = css`
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
`;

const StartUploadMutation = graphql`
  mutation UploadRecordingCardStartUploadMutation($input: StartTrackRecordingUploadInput!) {
    startTrackRecordingUpload(input: $input) {
      recording {
        id
        isPrimary
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

function nextId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function UploadRecordingCard({
  sessionId,
  onRefresh,
  uploadInProgress,
  onUploadStateChange,
}: Props) {
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [description, setDescription] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [startUpload, isStartInFlight] =
    useMutation<UploadRecordingCardStartUploadMutation>(StartUploadMutation);

  const shouldShowBusyState = useMemo(
    () => uploadInProgress || isStartInFlight || isUploading,
    [isStartInFlight, isUploading, uploadInProgress]
  );

  useEffect(() => {
    const shouldWarn = isUploading || isStartInFlight || fileEntries.length > 0;
    if (!shouldWarn) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [fileEntries.length, isStartInFlight, isUploading]);

  function onFilesSelected(list: FileList | null) {
    if (!list || shouldShowBusyState) return;
    const next: FileEntry[] = [...fileEntries];
    for (const file of Array.from(list)) {
      next.push({ id: nextId(), file });
    }
    setFileEntries(next);
  }

  function onDropFiles(event: React.DragEvent) {
    event.preventDefault();
    if (shouldShowBusyState) return;
    setIsDragging(false);
    onFilesSelected(event.dataTransfer?.files ?? null);
  }

  function onDragOver(event: React.DragEvent) {
    event.preventDefault();
    if (shouldShowBusyState) return;
    setIsDragging(true);
  }

  function onDragLeave() {
    setIsDragging(false);
  }

  function triggerFilePicker() {
    if (shouldShowBusyState) return;
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

  function setBusy(next: boolean) {
    onUploadStateChange?.(next);
  }

  function beginUpload() {
    if (fileEntries.length === 0) {
      setUploadError("Select at least one file to upload.");
      return;
    }
    if (shouldShowBusyState) return;
    const selectedFiles = fileEntries.map((entry) => entry.file);
    setFileEntries([]);
    setUploadError(null);
    setIsUploading(true);
    setBusy(true);

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
            onRefresh();
            const targets = (session.uploadTargets ?? []).map((target) => ({ ...target }));
            await uploadToTargets(targets as UploadTarget[], selectedFiles);
            setDescription("");
            onRefresh();
          } catch (err) {
            setUploadError(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setIsUploading(false);
            setBusy(false);
          }
        })();
      },
      onError: (err) => {
        setUploadError(err.message);
        setIsUploading(false);
        setBusy(false);
      },
    });
  }

  return (
    <Card title="Upload Footage">
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
        ) : uploadInProgress ? (
          <div
            css={css`
              padding: 12px;
              border: 1px solid #d7deed;
              border-radius: 10px;
              background: #f8fafc;
              color: #475569;
            `}
          >
            Another upload is running. You can add more files once it finishes.
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*"
              onChange={(e) => onFilesSelected(e.target.files)}
              disabled={shouldShowBusyState}
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
                css={recordingButtonStyles}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFilePicker();
                }}
                disabled={shouldShowBusyState}
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
                disabled={shouldShowBusyState}
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
                      <button
                        css={recordingButtonStyles}
                        onClick={() => moveFile(idx, -1)}
                        disabled={idx === 0}
                        type="button"
                      >
                        ↑
                      </button>
                      <button
                        css={recordingButtonStyles}
                        onClick={() => moveFile(idx, 1)}
                        disabled={idx === fileEntries.length - 1}
                        type="button"
                      >
                        ↓
                      </button>
                      <button
                        css={recordingButtonStyles}
                        onClick={() => removeFile(entry.id)}
                        type="button"
                      >
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
      <div css={footerStyles}>
        <button
          css={primaryButtonStyles}
          onClick={beginUpload}
          disabled={shouldShowBusyState}
          type="button"
        >
          {shouldShowBusyState ? "Uploading…" : "Upload footage"}
        </button>
      </div>
    </Card>
  );
}
