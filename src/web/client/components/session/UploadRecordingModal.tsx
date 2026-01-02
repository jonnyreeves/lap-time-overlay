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
type VideoItem = {
  id: string;
  file: File;
  objectUrl: string;
  durationMs: number | null;
  startOffsetMs: number | null;
  endOffsetMs: number | null;
};

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

const hiddenFileInputStyles = css`
  position: fixed;
  left: 0;
  bottom: 0;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
`;

const fixedWidthButtonStyles = css`
  ${recordingButtonStyles};
  min-width: 130px;
  text-align: center;
`;

const frameButtonStyles = css`
  ${recordingButtonStyles};
  width: 80px;
  min-width: 60px;
  text-align: center;
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

const FRAME_STEP_MS = Math.round(1000 / 30);

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
  const [lapOneOffsetMs, setLapOneOffsetMs] = useState<number | null>(null);
  const [lapOneReferenceId, setLapOneReferenceId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const allObjectUrls = useRef<string[]>([]);
  const [startUpload, isStartInFlight] =
    useMutation<UploadRecordingModalStartUploadMutation>(StartUploadMutation);

  // New state for video preview
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPreviewMuted, setIsPreviewMuted] = useState(true);
  const [playheadMs, setPlayheadMs] = useState(0);

  const currentVideo = videoItems[currentVideoIndex] ?? null;
  const videoPlayerSrc = currentVideo?.objectUrl ?? null;

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = true;
    setIsPreviewMuted(true);
    setPlayheadMs(0);
  }, [videoPlayerSrc]);

  const uploadSources = useMemo(
    () => [
      ...videoItems.map((item) => ({
        file: item.file,
        trimStartMs: item.startOffsetMs,
        trimEndMs: item.endOffsetMs,
      })),
      ...fileEntries.map((file) => ({ file, trimStartMs: null, trimEndMs: null })),
    ],
    [fileEntries, videoItems]
  );

  const allFiles = useMemo(() => uploadSources.map((source) => source.file), [uploadSources]);

  const shouldShowBusyState = useMemo(
    () => isStartInFlight || isUploading,
    [isStartInFlight, isUploading]
  );

  const trimValidationError = useMemo(() => {
    if (!videoItems.length) return null;
    const first = videoItems[0];
    const last = videoItems[videoItems.length - 1];
    const startMs = first.startOffsetMs;
    const endMs = last.endOffsetMs;
    const startForComparison = startMs ?? 0;

    if (startMs != null && startMs < 0) {
      return "Start offset must be zero or greater.";
    }
    if (endMs != null && endMs < 0) {
      return "End offset must be zero or greater.";
    }
    if (first.durationMs != null && startMs != null && startMs >= first.durationMs) {
      return "Start offset must be before the end of the first clip.";
    }
    if (last.durationMs != null && endMs != null && endMs > last.durationMs) {
      return "End offset must be within the last clip.";
    }
    if (videoItems.length === 1 && endMs != null && startForComparison >= endMs) {
      return "Start offset must be before the end offset.";
    }

    return null;
  }, [videoItems]);

  const uploadWindow = useMemo(() => {
    if (!videoItems.length) return null;
    const startMs = videoItems[0]?.startOffsetMs ?? 0;
    const endMs =
      videoItems.length === 1
        ? videoItems[0]?.endOffsetMs ?? null
        : videoItems[videoItems.length - 1]?.endOffsetMs ?? null;
    return { startMs, endMs };
  }, [videoItems]);

  const errorMessage = trimValidationError ?? uploadError;

  const canMarkStart = videoItems.length > 0 && currentVideoIndex === 0;
  const canMarkEnd = videoItems.length > 0 && currentVideoIndex === videoItems.length - 1;
  const startOffsetForLapOne = Math.max(0, videoItems[0]?.startOffsetMs ?? 0);
  const lapOneOffsetLabel =
    lapOneOffsetMs != null ? formatMs(lapOneOffsetMs) : "Not set";
  const endOffsetForLapOne = videoItems[videoItems.length - 1]?.endOffsetMs ?? null;
  const lapOneCannotExceedEnd = endOffsetForLapOne != null && playheadMs > endOffsetForLapOne;
  const isLapOneButtonDisabled =
    shouldShowBusyState ||
    (lapOneOffsetMs == null &&
      (!canMarkStart || playheadMs < startOffsetForLapOne || lapOneCannotExceedEnd));
  const hasStartOffset = videoItems[0]?.startOffsetMs != null;
  const hasEndOffset = videoItems[videoItems.length - 1]?.endOffsetMs != null;
  const startButtonLabel = hasStartOffset ? "Clear start offset" : "Mark start from playhead";
  const endButtonLabel = hasEndOffset ? "Clear end offset" : "Mark end from playhead";
  const startButtonDisabled = shouldShowBusyState || (!hasStartOffset && !canMarkStart);
  const requiredEndPlayheadMs = Math.max(startOffsetForLapOne, lapOneOffsetMs ?? startOffsetForLapOne);
  const endButtonDisabled =
    shouldShowBusyState ||
    (!hasEndOffset && (!canMarkEnd || playheadMs <= requiredEndPlayheadMs));

  useEffect(() => {
    const shouldWarn = isUploading || isStartInFlight || fileEntries.length > 0 || videoItems.length > 0;
    if (!shouldWarn) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [fileEntries.length, isStartInFlight, isUploading, videoItems.length]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setFileEntries([]);
      setDescription("");
      setUploadError(null);
      setIsUploading(false);
      setIsDragging(false);
      setVideoItems([]);
      setCurrentVideoIndex(0);
      allObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      allObjectUrls.current = [];
      setLapOneOffsetMs(null);
      setLapOneReferenceId(null);
      setPlayheadMs(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!lapOneReferenceId) return;
    const firstId = videoItems[0]?.id ?? null;
    if (!firstId || firstId !== lapOneReferenceId) {
      setLapOneOffsetMs(null);
      setLapOneReferenceId(null);
    }
  }, [videoItems, lapOneReferenceId]);

  function normalizeTrimOffsets(items: VideoItem[]): VideoItem[] {
    return items.map((item, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === items.length - 1;
      return {
        ...item,
        startOffsetMs: isFirst ? item.startOffsetMs : null,
        endOffsetMs: isLast ? item.endOffsetMs : null,
      };
    });
  }

  function loadDurationMetadata(item: Pick<VideoItem, "id" | "objectUrl">) {
    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";

    const cleanup = () => {
      videoEl.onloadedmetadata = null;
      videoEl.onerror = null;
      videoEl.src = "";
    };

    videoEl.onloadedmetadata = () => {
      const durationMs =
        typeof videoEl.duration === "number" && Number.isFinite(videoEl.duration)
          ? videoEl.duration * 1000
          : null;
      setVideoItems((current) =>
        current.map((existing) =>
          existing.id === item.id ? { ...existing, durationMs } : existing
        )
      );
      cleanup();
    };

    videoEl.onerror = () => {
      cleanup();
    };

    videoEl.src = item.objectUrl;
    videoEl.load();
  }

  function addVideoItems(files: File[]) {
    if (!files.length) return;
    const additions: VideoItem[] = files.map((file) => {
      const objectUrl = URL.createObjectURL(file);
      allObjectUrls.current.push(objectUrl);
      const item: VideoItem = {
        id: nextId(),
        file,
        objectUrl,
        durationMs: null,
        startOffsetMs: null,
        endOffsetMs: null,
      };
      loadDurationMetadata(item);
      return item;
    });

    setVideoItems((current) => normalizeTrimOffsets([...current, ...additions]));
    setCurrentVideoIndex(0);
  }

  function updateVideoItem(itemId: string, updates: Partial<VideoItem>) {
    setVideoItems((current) =>
      normalizeTrimOffsets(
        current.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
      )
    );
  }

  function formatMs(ms: number | null | undefined): string {
    if (ms == null) return "0:00.0";
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds - minutes * 60;
    const secondsStr = remainingSeconds < 10 ? `0${remainingSeconds.toFixed(1)}` : remainingSeconds.toFixed(1);
    return `${minutes}:${secondsStr}`;
  }

  function stepPlayhead(direction: -1 | 1) {
    if (!videoRef.current) return;
    const videoEl = videoRef.current;
    const duration = Number.isFinite(videoEl.duration) ? videoEl.duration : null;
    const deltaSeconds = FRAME_STEP_MS / 1000;
    let nextTime = videoEl.currentTime + direction * deltaSeconds;
    nextTime = Math.max(0, nextTime);
    if (duration != null) {
      nextTime = Math.min(nextTime, duration);
    }
    videoEl.currentTime = nextTime;
  }

  function setOffsetFromPlayer(kind: "start" | "end") {
    if (!videoRef.current) return;
    if (!videoItems.length) return;

    const ms = Math.max(0, Math.round(videoRef.current.currentTime * 1000));
    if (kind === "start") {
      const target = videoItems[0];
      if (!target) return;
      if (videoItems.length > 1 && currentVideoIndex !== 0) {
        setUploadError("Play the first clip to mark the start offset.");
        return;
      }
      setUploadError(null);
      updateVideoItem(target.id, { startOffsetMs: ms });
    } else {
      const target = videoItems[videoItems.length - 1];
      if (!target) return;
      if (videoItems.length > 1 && currentVideoIndex !== videoItems.length - 1) {
        setUploadError("Play the last clip to mark the end offset.");
        return;
      }
      setUploadError(null);
      updateVideoItem(target.id, { endOffsetMs: ms });
    }
  }

  function markLapOneOffsetFromPlayhead() {
    if (!videoRef.current) return;
    if (!videoItems.length) return;
    const target = videoItems[0];
    if (!target) return;
    if (videoItems.length > 1 && currentVideoIndex !== 0) {
      setUploadError("Play the first clip to mark the Lap 1 offset.");
      return;
    }
    const ms = Math.max(0, Math.round(videoRef.current.currentTime * 1000));
    if (endOffsetForLapOne != null && ms > endOffsetForLapOne) {
      setUploadError("Lap 1 offset cannot be after the end offset.");
      return;
    }
    setLapOneReferenceId(target.id);
    setLapOneOffsetMs(ms);
    setUploadError(null);
  }

  function clearOffset(kind: "start" | "end") {
    if (!videoItems.length) return;
    if (kind === "start") {
      const target = videoItems[0];
      if (!target) return;
      updateVideoItem(target.id, { startOffsetMs: null });
    } else {
      const target = videoItems[videoItems.length - 1];
      if (!target) return;
      updateVideoItem(target.id, { endOffsetMs: null });
    }
    setUploadError(null);
  }

  function onFilesSelected(list: FileList | null) {
    if (!list || shouldShowBusyState) return;
    setUploadError(null);

    const newVideoFiles: File[] = [];
    const newOtherFiles: File[] = [];

    for (const file of Array.from(list)) {
      if (file.type.startsWith("video/")) {
        newVideoFiles.push(file);
      } else {
        newOtherFiles.push(file);
      }
    }

    if (newOtherFiles.length > 0) {
      setUploadError("Only video files are supported for recording uploads.");
    }

    if (newVideoFiles.length > 0) {
      addVideoItems(newVideoFiles);
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
    const input = fileInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
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
    setVideoItems((current) => {
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[idx], next[target]] = [next[target], next[idx]];
      setCurrentVideoIndex((prev) => {
        if (prev === idx) return target;
        if (prev === target) return idx;
        return prev;
      });
      return normalizeTrimOffsets(next);
    });
  }

  function removeFileEntry(fileToRemove: File) {
    setFileEntries((current) => current.filter((file) => file !== fileToRemove));
  }

  function removeVideoFile(fileToRemove: VideoItem) {
    setVideoItems((current) => {
      const filtered = current.filter((file) => file.id !== fileToRemove.id);
      const normalized = normalizeTrimOffsets(filtered);
      setCurrentVideoIndex((prev) => Math.min(prev, Math.max(0, normalized.length - 1)));
      return normalized;
    });
    URL.revokeObjectURL(fileToRemove.objectUrl);
    allObjectUrls.current = allObjectUrls.current.filter((url) => url !== fileToRemove.objectUrl);
  }

  useEffect(() => {
    return () => {
      allObjectUrls.current.forEach(URL.revokeObjectURL);
      allObjectUrls.current = [];
    };
  }, []);

  function beginUpload() {
    setUploadError(null);
    if (allFiles.length === 0) {
      setUploadError("Select at least one file to upload.");
      return;
    }
    if (trimValidationError) {
      return;
    }
    if (shouldShowBusyState) return;
    const selectedSources = uploadSources;
    const startOffsetMs = videoItems[0]?.startOffsetMs ?? 0;
    const lapOneOffsetSeconds =
      lapOneOffsetMs != null ? Math.max(0, lapOneOffsetMs - startOffsetMs) / 1000 : null;
    setFileEntries([]);
    setVideoItems([]); // Clear video files as well
    setCurrentVideoIndex(0);
    setUploadError(null);
    setIsUploading(true);
    onClose();

    startUpload({
      variables: {
        input: {
          sessionId,
          description: description.trim() || null,
          sources: selectedSources.map((entry) => ({
            fileName: entry.file.name,
            sizeBytes: entry.file.size,
            trimStartMs: entry.trimStartMs ?? null,
            trimEndMs: entry.trimEndMs ?? null,
          })),
          ...(lapOneOffsetSeconds != null ? { lapOneOffset: lapOneOffsetSeconds } : {}),
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
            await uploadToTargets(
              targets as UploadTarget[],
              selectedSources.map((source) => source.file)
            );
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
      maxWidth={videoItems.length > 0 ? "1200px" : undefined}
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
              accept="video/*"
              onChange={(e) => onFilesSelected(e.target.files)}
              disabled={shouldShowBusyState}
              css={hiddenFileInputStyles}
            />

            {videoItems.length > 0 ? (
              <div css={css`display: grid; grid-template-columns: 2fr 1fr; gap: 20px;`}>
                <div css={css`display: flex; flex-direction: column; gap: 12px;`}>
                  <div css={css`position: relative; width: 100%; padding-bottom: 62.5%; background: black; border-radius: 8px; overflow: hidden;`}>
                    {videoPlayerSrc && (
                      <video
                        key={videoPlayerSrc} // Key helps re-render video element when src changes
                        src={videoPlayerSrc}
                        controls
                        muted={isPreviewMuted}
                        ref={videoRef}
                        onTimeUpdate={(event) =>
                          setPlayheadMs(Math.max(0, Math.round(event.currentTarget.currentTime * 1000)))
                        }
                        onVolumeChange={() =>
                          setIsPreviewMuted(Boolean(videoRef.current?.muted))
                        }
                        onEnded={() => {
                          setCurrentVideoIndex((idx) =>
                            idx < videoItems.length - 1 ? idx + 1 : idx
                          );
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

                  <div
                    css={css`
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 10px 12px;
                        border: 1px solid #e2e8f4;
                        border-radius: 10px;
                        background: #f8fafc;
                      `}
                  >
                    <div>
                      <strong>Upload window</strong>
                      <div css={css`color: #475569;`}>
                        {uploadWindow ? (
                          <>
                            Start: {formatMs(uploadWindow.startMs ?? 0)}
                            {uploadWindow.endMs != null
                              ? ` • End: ${formatMs(uploadWindow.endMs)}`
                              : " • End: full last clip"}
                          </>
                        ) : (
                          "No clips selected"
                        )}
                      </div>
                    </div>
                    <div css={css`color: #475569;`}>Offsets trimmed after upload</div>
                    <div
                      css={css`
                          color: #475569;
                          display: flex;
                          align-items: center;
                          gap: 4px;
                          font-size: 0.9rem;
                        `}
                    >
                      Lap 1 offset:
                      <strong>{lapOneOffsetLabel}</strong>
                    </div>
                  </div>

                  <div
                    css={css`
                      display: flex;
                      gap: 8px;
                      flex-wrap: wrap;
                      justify-content: center;
                      align-items: center;
                    `}
                  >
                    <button
                      css={frameButtonStyles}
                      type="button"
                      onClick={() => stepPlayhead(-1)}
                      disabled={!videoPlayerSrc || shouldShowBusyState}
                      aria-label="Step playhead back by one frame"
                    >
                      -1 frame
                    </button>
                    <button
                      css={fixedWidthButtonStyles}
                      type="button"
                      onClick={() => {
                        if (hasStartOffset) {
                          clearOffset("start");
                        } else {
                          setOffsetFromPlayer("start");
                        }
                      }}
                      disabled={startButtonDisabled}
                    >
                      {startButtonLabel}
                    </button>
                    <button
                      css={fixedWidthButtonStyles}
                      type="button"
                      onClick={() => {
                        if (lapOneOffsetMs != null) {
                          setLapOneOffsetMs(null);
                          setLapOneReferenceId(null);
                        } else {
                          markLapOneOffsetFromPlayhead();
                        }
                      }}
                      disabled={isLapOneButtonDisabled}
                    >
                      {lapOneOffsetMs != null ? "Clear lap 1 offset" : "Mark lap 1 from playhead"}
                    </button>
                    <button
                      css={fixedWidthButtonStyles}
                      type="button"
                      onClick={() => {
                        if (hasEndOffset) {
                          clearOffset("end");
                        } else {
                          setOffsetFromPlayer("end");
                        }
                      }}
                      disabled={endButtonDisabled}
                    >
                      {endButtonLabel}
                    </button>
                    <button
                      css={frameButtonStyles}
                      type="button"
                      onClick={() => stepPlayhead(1)}
                      disabled={!videoPlayerSrc || shouldShowBusyState}
                      aria-label="Step playhead forward by one frame"
                    >
                      +1 frame
                    </button>
                  </div>
                </div>

                <div css={rightColumnStyles}>
                  <div css={css`display: flex; flex-direction: column; gap: 10px;`}>
                    <h4>Video Files ({videoItems.length})</h4>
                    <p css={css`margin: 0; color: #475569; font-size: 0.9rem;`}>
                      Set the start offset on the first clip and the end offset on the last clip. Single-clip uploads can set both.
                    </p>
                    <div css={fileListStyles}>
                      {videoItems.map((video, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === videoItems.length - 1;
                        return (
                          <div
                            key={video.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setCurrentVideoIndex(idx)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setCurrentVideoIndex(idx);
                              }
                            }}
                            css={[
                              fileRowStyles,
                              css`
                                cursor: pointer;
                              `,
                              idx === currentVideoIndex && css`background: #eef2ff; border-color: #6366f1;`,
                            ]}
                          >
                            <div className="meta">
                              <strong>
                                {idx + 1}. {video.file.name}
                              </strong>
                              <span>
                                {formatBytes(video.file.size)}
                                {video.durationMs != null ? ` • ${formatMs(video.durationMs)}` : ""}
                              </span>
                              {(isFirst || isLast) && (
                                <div css={css`display: grid; grid-template-columns: 1fr; gap: 4px; margin-top: 6px;`}>
                                  {isFirst && (
                                    <div css={css`color: #475569; font-size: 0.9rem;`}>
                                      Start offset: <strong>{formatMs(video.startOffsetMs ?? 0)}</strong>
                                    </div>
                                  )}
                                  {isFirst && (
                                    <div css={css`color: #475569; font-size: 0.9rem;`}>
                                      Lap 1 offset: <strong>{lapOneOffsetLabel}</strong>
                                    </div>
                                  )}
                                  {isLast && (
                                    <div css={css`color: #475569; font-size: 0.9rem;`}>
                                      End offset:{" "}
                                      <strong>
                                        {video.endOffsetMs != null
                                          ? formatMs(video.endOffsetMs)
                                          : "Full clip"}
                                      </strong>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="actions">
                              <button
                                css={recordingButtonStyles}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  moveVideoFile(idx, -1);
                                }}
                                disabled={idx === 0 || shouldShowBusyState}
                                type="button"
                              >
                                ↑
                              </button>
                              <button
                                css={recordingButtonStyles}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  moveVideoFile(idx, 1);
                                }}
                                disabled={idx === videoItems.length - 1 || shouldShowBusyState}
                                type="button"
                              >
                                ↓
                              </button>
                              <button
                                css={recordingButtonStyles}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  removeVideoFile(video);
                                }}
                                disabled={shouldShowBusyState}
                                type="button"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
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
              </div>
            )}
          </>
        )}
        {errorMessage && <div css={css`color: #b91c1c;`}>{errorMessage}</div>}
      </div>
      <div css={footerStyles}>
        <button css={recordingButtonStyles} onClick={onClose} disabled={shouldShowBusyState}>
          Cancel
        </button>
        <button
          css={primaryButtonStyles}
          onClick={beginUpload}
          disabled={shouldShowBusyState || allFiles.length === 0 || Boolean(trimValidationError)}
          type="button"
        >
          {shouldShowBusyState ? "Uploading…" : "Upload footage"}
        </button>
      </div>
    </Modal>
  );
}
