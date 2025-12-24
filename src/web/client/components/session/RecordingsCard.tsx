import { css } from "@emotion/react";
import { useEffect, useMemo, useState } from "react";
import { graphql, useMutation } from "react-relay";
import type { RecordingsCardDeleteRecordingMutation } from "../../__generated__/RecordingsCardDeleteRecordingMutation.graphql.js";
import type { RecordingsCardMarkPrimaryRecordingMutation } from "../../__generated__/RecordingsCardMarkPrimaryRecordingMutation.graphql.js";
import type { RecordingsCardUpdateRecordingVisibilityMutation } from "../../__generated__/RecordingsCardUpdateRecordingVisibilityMutation.graphql.js";
import { getOverlayMediaId } from "../../utils/overlayMedia.js";
import { Card } from "../Card.js";
import { IconButton } from "../IconButton.js";
import { inlineActionButtonStyles } from "../inlineActionButtons.ts";
import type { RecordingSummary } from "../renderedOverlay/RenderedOverlayPreview";
import { RenderedOverlayPreview } from "../renderedOverlay/RenderedOverlayPreview.js";
import type { LapWithEvents } from "./LapsCard.js";
import { UploadRecordingModal } from "./UploadRecordingModal.js";
import {
  formatBytes,
  recordingButtonStyles,
  uploadToTargets,
  type UploadTarget,
} from "./recordingShared.js";
import { actionsRowStyles } from "./sessionOverviewStyles";

type Recording = {
  id: string;
  description: string | null;
  mediaId: string;
  sizeBytes: number | null;
  isPrimary: boolean;
  showInMediaLibrary: boolean;
  overlayBurned: boolean;
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

type LapForPreview = Pick<LapWithEvents, "id" | "lapNumber" | "time" | "start">;

type Props = {
  sessionId: string; // Add sessionId prop
  laps: LapForPreview[];
  recordings: readonly Recording[];
  onRefresh: () => void;
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

  .burned {
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 0.85rem;
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
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

const visibilityRowStyles = css`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  color: #475569;
`;

const visibilityLabelStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
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

const UpdateRecordingVisibilityMutation = graphql`
  mutation RecordingsCardUpdateRecordingVisibilityMutation($input: UpdateTrackRecordingInput!) {
    updateTrackRecording(input: $input) {
      recording {
        id
        showInMediaLibrary
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
  sessionId, // Destructure sessionId
  laps,
  recordings,
  onRefresh,
}: Props) {
  const [resumeSelections, setResumeSelections] = useState<Record<string, File[]>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [isResuming, setIsResuming] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); // State for modal visibility
  const [previewRecordingId, setPreviewRecordingId] = useState<string | null>(null);
  const previewRecording = useMemo(
    () => recordings.find((rec) => rec.id === previewRecordingId) ?? null,
    [previewRecordingId, recordings]
  );
  const previewRecordingSummary = useMemo<RecordingSummary | null>(() => {
    if (!previewRecording) return null;
    return {
      id: previewRecording.id,
      description: previewRecording.description,
      lapOneOffset: previewRecording.lapOneOffset,
      status: previewRecording.status,
      combineProgress: previewRecording.combineProgress,
      createdAt: previewRecording.createdAt,
      overlayBurned: previewRecording.overlayBurned,
    };
  }, [previewRecording]);
  const overlayRecordingSummary = useMemo<RecordingSummary | null>(() => {
    if (!previewRecording?.mediaId) return null;
    const overlayMediaId = getOverlayMediaId(previewRecording.mediaId);
    const overlayRecording = recordings.find((rec) => rec.mediaId === overlayMediaId);
    if (!overlayRecording) return null;
    return {
      id: overlayRecording.id,
      description: overlayRecording.description,
      lapOneOffset: overlayRecording.lapOneOffset,
      status: overlayRecording.status,
      combineProgress: overlayRecording.combineProgress,
      createdAt: overlayRecording.createdAt,
      overlayBurned: overlayRecording.overlayBurned,
    };
  }, [previewRecording, recordings]);
  const [isOverlayPreviewOpen, setIsOverlayPreviewOpen] = useState(false);
  const [deleteRecording, isDeleteInFlight] =
    useMutation<RecordingsCardDeleteRecordingMutation>(DeleteRecordingMutation);
  const [markPrimary, isMarkPrimaryInFlight] =
    useMutation<RecordingsCardMarkPrimaryRecordingMutation>(MarkPrimaryRecordingMutation);
  const [updateVisibility, isUpdateVisibilityInFlight] =
    useMutation<RecordingsCardUpdateRecordingVisibilityMutation>(UpdateRecordingVisibilityMutation);
  const [visibilityUpdateId, setVisibilityUpdateId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!isOverlayPreviewOpen) return;
    if (previewRecordingId && !previewRecording) {
      setIsOverlayPreviewOpen(false);
      setPreviewRecordingId(null);
    }
  }, [isOverlayPreviewOpen, previewRecording, previewRecordingId]);

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
    if (pendingTargets.length === 0 || isResuming) return;
    const selected = resumeSelections[recording.id] ?? [];
    if (selected.length !== pendingTargets.length) {
      setActionError(
        "Please select the same number of files (in the original order) to resume this upload."
      );
      return;
    }
    setActionError(null);
    setIsResuming(true);
    try {
      await uploadToTargets(pendingTargets as UploadTarget[], selected);
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsResuming(false);
    }
  }

  function openOverlayPreview(recording: Recording) {
    setPreviewRecordingId(recording.id);
    setIsOverlayPreviewOpen(true);
  }

  function closeOverlayPreview() {
    setIsOverlayPreviewOpen(false);
    setPreviewRecordingId(null);
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

  function toggleMediaLibraryVisibility(recording: Recording, visible: boolean) {
    if (isUpdateVisibilityInFlight || recording.showInMediaLibrary === visible) return;
    setActionError(null);
    setVisibilityUpdateId(recording.id);
    updateVisibility({
      variables: { input: { id: recording.id, showInMediaLibrary: visible } },
      onCompleted: () => {
        setVisibilityUpdateId(null);
        onRefresh();
      },
      onError: (err) => {
        setVisibilityUpdateId(null);
        setActionError(err.message);
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
      onError: (err) => setActionError(err.message),
    });
  }

  return (
    <Card
      title="Video Attachments"
      rightHeaderContent={
        <div css={actionsRowStyles}>
          <IconButton
            icon="+"
            css={inlineActionButtonStyles}
            onClick={() => setIsUploadModalOpen(true)}
            disabled={hasPendingRecording}
          >
            Upload
          </IconButton>
        </div>
      }
    >
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
            const isCombining = recording.status === "COMBINING";
            const isOverlayEncoding = isCombining && !recording.overlayBurned && recording.sizeBytes != null;
            const showUploadProgress = !isFinished && !isOverlayEncoding;
            const showCombineProgress = !isFinished && isCombining && !isOverlayEncoding;
            const showOverlayProgress = !isFinished && isOverlayEncoding;
            const hasLapOneOffset = (recording.lapOneOffset ?? 0) > 0;
            const canRenderOverlay = laps.length > 0 && hasLapOneOffset;
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
                    {recording.overlayBurned && <span className="burned">Overlay burned</span>}
                    {recording.isPrimary && <span className="primary">Primary</span>}
                    <div className="status">{recording.status.toLowerCase()}</div>
                  </div>
                </div>
                <div css={visibilityRowStyles}>
                  <label css={visibilityLabelStyles}>
                    <input
                      type="checkbox"
                      checked={recording.showInMediaLibrary}
                      onChange={(event) =>
                        toggleMediaLibraryVisibility(recording, event.target.checked)
                      }
                      disabled={isUpdateVisibilityInFlight}
                      aria-label="Show recording in media library"
                    />
                    Show in media library
                  </label>
                  {visibilityUpdateId === recording.id && (
                    <span css={css`font-size: 0.75rem; color: #475569;`}>Updating…</span>
                  )}
                </div>
                {recording.error && <div className="error">{recording.error}</div>}
                {!isFinished && (
                  <>
                    {showUploadProgress && (
                      <div>
                        <div>Upload progress: {formatBytes(uploaded)} / {formatBytes(total)}</div>
                        <div css={progressBarStyles}>
                          <div className="fill" style={{ width: `${uploadPercent}%` }} />
                        </div>
                      </div>
                    )}
                    {showCombineProgress && (
                      <div>
                        <div>Combine progress: {combinePercent}%</div>
                        <div css={progressBarStyles}>
                          <div className="fill" style={{ width: `${combinePercent}%` }} />
                        </div>
                      </div>
                    )}
                    {showOverlayProgress && (
                      <div>
                        <div>Recording with overlay: {combinePercent}%</div>
                        <div css={progressBarStyles}>
                          <div className="fill" style={{ width: `${combinePercent}%` }} />
                        </div>
                      </div>
                    )}
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
                      Download
                    </a>
                  )}
                  {isFinished && !recording.overlayBurned && (
                    <button
                      css={recordingButtonStyles}
                      type="button"
                      onClick={() => openOverlayPreview(recording)}
                      disabled={!canRenderOverlay}
                      title={
                        recording.lapOneOffset <= 0
                          ? "Set the Lap 1 start time on this recording to enable overlay previews"
                          : laps.length === 0
                            ? "Add lap times to enable overlay previews"
                            : undefined
                      }
                    >
                      Render with Overlay
                    </button>
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
                    {isFinished ? "Delete" : "Cancel"}
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
                          disabled={hasPendingRecording || isResuming}
                        />
                        <button
                          css={recordingButtonStyles}
                          onClick={() => resumeRecordingUpload(recording)}
                          disabled={hasPendingRecording || isResuming}
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
              </div>
            );
          })
        )}
      </div>

      <UploadRecordingModal
        sessionId={sessionId}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onRefresh={onRefresh}
      />
      {previewRecordingSummary && (
        <RenderedOverlayPreview
          recording={previewRecordingSummary}
          overlayRecording={overlayRecordingSummary}
          laps={laps}
          isOpen={isOverlayPreviewOpen}
          onClose={closeOverlayPreview}
          onRefresh={onRefresh}
          onBurned={onRefresh}
        />
      )}
    </Card>
  );
}
