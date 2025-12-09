import { css } from "@emotion/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { graphql, useMutation } from "react-relay";
import type { UploadRecordingModalStartUploadMutation } from "../../__generated__/UploadRecordingModalStartUploadMutation.graphql.js";

import { Modal } from "../Modal"; // Assuming a Modal component exists or will be created
import {
  formatBytes,
  recordingButtonStyles,
  uploadToTargets,
  type UploadTarget,
} from "./recordingShared.js";

type FileEntry = File;

type Props = {
  sessionId: string;
  onRefresh: () => void;
  isOpen: boolean;
  onClose: () => void;
};

const uploadControlsStyles = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const rightColumnStyles = css`
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  gap: 10px;
`;

const StartUploadMutation = graphql`
  mutation UploadRecordingModalStartUploadMutation($input: StartTrackRecordingUploadInput!) {
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

export function UploadRecordingModal({
  sessionId,
  onRefresh,
  isOpen,
  onClose,
}: Props) {
  const [fileEntries, setFileEntries] = useState<File[]>([]);

  const [description, setDescription] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const allObjectUrls = useRef<string[]>([]);
  const [startUpload, isStartInFlight] =
    useMutation<UploadRecordingModalStartUploadMutation>(StartUploadMutation);

  // New state for video preview
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoPlayerSrc, setVideoPlayerSrc] = useState<string | null>(null);

  // Combine fileEntries (non-video) and videoFiles for upload
  const allFiles = useMemo(
    () => [...fileEntries.map((entry) => entry), ...videoFiles],
    [fileEntries, videoFiles]
  );

  const shouldShowBusyState = useMemo(
    () => isStartInFlight || isUploading,
    [isStartInFlight, isUploading]
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

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setFileEntries([]);
      setDescription("");
      setUploadError(null);
      setIsUploading(false);
      setIsDragging(false);
      setVideoFiles([]);
      setCurrentVideoIndex(0);
      if (videoPlayerSrc) {
        URL.revokeObjectURL(videoPlayerSrc);
        setVideoPlayerSrc(null);
      }
    }
  }, [isOpen, videoPlayerSrc]);

  useEffect(() => {
    if (videoPlayerSrc) {
      URL.revokeObjectURL(videoPlayerSrc);
    }

    if (videoFiles.length > 0 && currentVideoIndex >= 0 && currentVideoIndex < videoFiles.length) {
      const file = videoFiles[currentVideoIndex];
      const url = URL.createObjectURL(file);
      setVideoPlayerSrc(url);
      allObjectUrls.current.push(url);
    } else {
      setVideoPlayerSrc(null);
    }
  }, [videoFiles, currentVideoIndex]);

  // Effect for component unmount cleanup
  useEffect(() => {
    return () => {
      allObjectUrls.current.forEach(URL.revokeObjectURL);
      allObjectUrls.current = []; // Clear the ref
    };
  }, []);

  function onFilesSelected(list: FileList | null) {
    if (!list || shouldShowBusyState) return;

    const newVideoFiles: File[] = [];
    const newOtherFiles: File[] = [];

    for (const file of Array.from(list)) {
      if (file.type.startsWith("video/")) {
        newVideoFiles.push(file);
      } else {
        newOtherFiles.push(file);
      }
    }

    if (newVideoFiles.length > 0) {
      setVideoFiles((current) => [...current, ...newVideoFiles]);
      setCurrentVideoIndex(0); // Reset to the first video when new ones are added
    }
    if (newOtherFiles.length > 0) {
      setFileEntries((current) => [...current, ...newOtherFiles]);
    }
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

  function moveFileEntry(idx: number, direction: -1 | 1) {
    const target = idx + direction;
    if (target < 0 || target >= fileEntries.length) return;
    const next = [...fileEntries];
    [next[idx], next[target]] = [next[target], next[idx]];
    setFileEntries(next);
  }

  function moveVideoFile(idx: number, direction: -1 | 1) {
    const target = idx + direction;
    if (target < 0 || target >= videoFiles.length) return;
    const next = [...videoFiles];
    [next[idx], next[target]] = [next[target], next[idx]];
    setVideoFiles(next);
  }

  function removeFileEntry(fileToRemove: File) {
    setFileEntries((current) => current.filter((file) => file !== fileToRemove));
  }

  function removeVideoFile(fileToRemove: File) {
    setVideoFiles((current) => current.filter((file) => file !== fileToRemove));
    setCurrentVideoIndex(0); // Reset to the first video when a video is removed
  }

  useEffect(() => {
    if (videoFiles.length > 0 && currentVideoIndex >= 0 && currentVideoIndex < videoFiles.length) {
      const file = videoFiles[currentVideoIndex];
      const url = URL.createObjectURL(file);
      allObjectUrls.current.push(url); // Store all created URLs for cleanup
      setVideoPlayerSrc(url);
    } else {
      setVideoPlayerSrc(null);
    }

    // Cleanup function for this specific effect
    return () => {
      // If videoPlayerSrc is still pointing to a valid URL, revoke it.
      // This handles cases where currentVideoIndex or videoFiles change.
      if (videoPlayerSrc) {
        URL.revokeObjectURL(videoPlayerSrc);
      }
    };
  }, [videoFiles, currentVideoIndex]); // Depend on videoFiles and currentVideoIndex

  // Effect for component unmount cleanup
  useEffect(() => {
    return () => {
      allObjectUrls.current.forEach(URL.revokeObjectURL);
      allObjectUrls.current = []; // Clear the ref
    };
  }, []);

  function beginUpload() {
    if (allFiles.length === 0) {
      setUploadError("Select at least one file to upload.");
      return;
    }
    if (shouldShowBusyState) return;
    const selectedFiles = allFiles; // Use allFiles
    setFileEntries([]);
    setVideoFiles([]); // Clear video files as well
    setUploadError(null);
    setIsUploading(true);
    onClose();

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
            const targets = (session.uploadTargets ?? []).map((target: UploadTarget) => ({ ...target }));
            await uploadToTargets(targets as UploadTarget[], selectedFiles);
            setDescription("");
            onRefresh();
            onClose(); // Close modal on successful upload
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Footage"
      maxWidth={videoFiles.length > 0 ? "1200px" : undefined}
    >
      <div>
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
              accept="video/*,image/*,audio/*"
              onChange={(e) => onFilesSelected(e.target.files)}
              disabled={shouldShowBusyState}
              css={css`
                display: none;
              `}
            />

            {videoFiles.length > 0 ? (
              <div css={css`display: grid; grid-template-columns: 2fr 1fr; gap: 20px;`}>
                <div css={css`position: relative; width: 100%; padding-bottom: 62.5%; background: black; border-radius: 8px; overflow: hidden;`}>
                  {videoPlayerSrc && (
                    <video
                      key={videoPlayerSrc} // Key helps re-render video element when src changes
                      src={videoPlayerSrc}
                      controls
                      autoPlay
                      onEnded={() => {
                        if (currentVideoIndex < videoFiles.length - 1) {
                          setCurrentVideoIndex(currentVideoIndex + 1);
                        }
                      }}
                      css={css`position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;`}
                    />
                  )}
                  {!videoPlayerSrc && (
                    <div css={css`position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; color: white; font-size: 1.2rem;`}>
                      No video selected or available.
                    </div>
                  )}
                </div>

                <div css={rightColumnStyles}>
                  <div css={css`display: flex; flex-direction: column; gap: 10px;`}>
                    <h4>Video Files ({videoFiles.length})</h4>
                    <div css={fileListStyles}>
                      {videoFiles.map((file, idx) => (
                        <div
                          key={idx}
                          css={[
                            fileRowStyles,
                            idx === currentVideoIndex && css`background: #eef2ff; border-color: #6366f1;`,
                          ]}
                        >
                          <div className="meta">
                            <strong>
                              {idx + 1}. {file.name}
                            </strong>
                            <span>{formatBytes(file.size)}</span>
                          </div>
                          <div className="actions">
                            <button
                              css={recordingButtonStyles}
                              onClick={() => moveVideoFile(idx, -1)}
                              disabled={idx === 0 || shouldShowBusyState}
                              type="button"
                            >
                              ↑
                            </button>
                            <button
                              css={recordingButtonStyles}
                              onClick={() => moveVideoFile(idx, 1)}
                              disabled={idx === videoFiles.length - 1 || shouldShowBusyState}
                              type="button"
                            >
                              ↓
                            </button>
                            <button
                              css={recordingButtonStyles}
                              onClick={() => setCurrentVideoIndex(idx)}
                              disabled={idx === currentVideoIndex || shouldShowBusyState}
                              type="button"
                            >
                              Play
                            </button>
                            <button
                              css={recordingButtonStyles}
                              onClick={() => removeVideoFile(file)}
                              disabled={shouldShowBusyState}
                              type="button"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {fileEntries.length > 0 && (
                    <div css={css`display: flex; flex-direction: column; gap: 10px;`}>
                      <h4>Other Files ({fileEntries.length})</h4>
                      <div css={fileListStyles}>
                        {fileEntries.map((file, idx) => (
                          <div key={idx} css={fileRowStyles}>
                            <div className="meta">
                              <strong>
                                {idx + 1}. {file.name}
                              </strong>
                              <span>{formatBytes(file.size)}</span>
                            </div>
                            <div className="actions">
                              <button
                                css={recordingButtonStyles}
                                onClick={() => moveFileEntry(idx, -1)}
                                disabled={idx === 0 || shouldShowBusyState}
                                type="button"
                              >
                                ↑
                              </button>
                              <button
                                css={recordingButtonStyles}
                                onClick={() => moveFileEntry(idx, 1)}
                                disabled={idx === fileEntries.length - 1 || shouldShowBusyState}
                                type="button"
                              >
                                ↓
                              </button>
                              <button
                                css={recordingButtonStyles}
                                onClick={() => removeFileEntry(file)}
                                disabled={shouldShowBusyState}
                                type="button"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div css={css`display: flex; justify-content: flex-end; width: 100%;`}>
                    <button
                      css={recordingButtonStyles}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerFilePicker();
                      }}
                      disabled={shouldShowBusyState}
                    >
                      Add files
                    </button>
                  </div>
                  <label>
                    <span>Footage Description</span>
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
                </div>
              </div>
            ) : (
              <div css={uploadControlsStyles}>
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
                  <span>Footage Description</span>
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
              </div>
            )}
          </>
        )}
        {uploadError && <div css={css`color: #b91c1c;`}>{uploadError}</div>}
      </div>
      <div css={footerStyles}>
        <button css={recordingButtonStyles} onClick={onClose} disabled={shouldShowBusyState}>
          Cancel
        </button>
        <button
          css={primaryButtonStyles}
          onClick={beginUpload}
          disabled={shouldShowBusyState || allFiles.length === 0}
          type="button"
        >
          {shouldShowBusyState ? "Uploading…" : "Upload footage"}
        </button>
      </div>
    </Modal>
  );
}