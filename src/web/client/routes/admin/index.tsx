import { css } from "@emotion/react";
import { useEffect, useMemo, useState } from "react";
import { graphql, useFragment, useLazyLoadQuery, useMutation } from "react-relay";
import { useNavigate, useOutletContext } from "react-router-dom";
import type { adminAdminToolsRoute_viewer$key } from "../../__generated__/adminAdminToolsRoute_viewer.graphql.js";
import type { adminDeleteOrphanedMediaMutation } from "../../__generated__/adminDeleteOrphanedMediaMutation.graphql.js";
import type { adminEmptyTempDirMutation } from "../../__generated__/adminEmptyTempDirMutation.graphql.js";
import type { adminRebuildMediaLibraryProjectionAllMutation } from "../../__generated__/adminRebuildMediaLibraryProjectionAllMutation.graphql.js";
import type { adminRunTempCleanupMutation } from "../../__generated__/adminRunTempCleanupMutation.graphql.js";
import type { adminToolsQuery } from "../../__generated__/adminToolsQuery.graphql.js";
import type { adminUpdateTempCleanupScheduleMutation } from "../../__generated__/adminUpdateTempCleanupScheduleMutation.graphql.js";
import type { adminUpdateUserAdminStatusMutation } from "../../__generated__/adminUpdateUserAdminStatusMutation.graphql.js";
import type { adminCancelRenderJobMutation } from "../../__generated__/adminCancelRenderJobMutation.graphql.js";
import type { adminUpdateVideoAccelerationPreferenceMutation } from "../../__generated__/adminUpdateVideoAccelerationPreferenceMutation.graphql.js";
import type { RequireAuthViewerQuery } from "../../__generated__/RequireAuthViewerQuery.graphql.js";
import { Card } from "../../components/Card.js";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs.js";

const AdminToolsPageQuery = graphql`
  query adminToolsQuery {
    adminOrphanedMedia {
      mediaId
      sizeBytes
      modifiedAt
    }
    adminTempDirs {
      name
      path
      sizeBytes
      fileCount
    }
    adminRecordingHealth {
      status
      count
    }
    adminRenderJobs {
      recordingId
      sessionId
      description
      userId
      username
      type
      progress
      startedAt
    }
    adminUserMediaLibraries {
      userId
      username
      sizeBytes
      recordingCount
    }
    adminUsers {
      id
      username
      createdAt
      isAdmin
    }
    adminTempCleanupSchedule {
      hour
      days
      enabled
      lastRunAt
      nextRunAt
    }
    adminVideoAcceleration {
      available
      backend
      effectiveBackend
      preferHardwareEncoding
      probing
      circuitBreakerActive
      circuitResetAt
      details {
        hasDri
        hasRenderD128
        hasCard0
        ffmpegHasHwaccel {
          qsv
          vaapi
        }
        ffmpegHasEncoder {
          h264_qsv
          h264_vaapi
          hevc_qsv
          hevc_vaapi
        }
        probeErrors
      }
    }
  }
`;

const AdminViewerFragment = graphql`
  fragment adminAdminToolsRoute_viewer on User {
    id
    isAdmin
  }
`;

const AdminDeleteOrphanedMediaMutation = graphql`
  mutation adminDeleteOrphanedMediaMutation($input: DeleteOrphanedMediaInput!) {
    deleteOrphanedMedia(input: $input) {
      deleted
    }
  }
`;

const AdminEmptyTempDirMutation = graphql`
  mutation adminEmptyTempDirMutation($input: EmptyTempDirInput!) {
    emptyTempDir(input: $input) {
      name
    }
  }
`;

const AdminRebuildMediaLibraryProjectionAllMutation = graphql`
  mutation adminRebuildMediaLibraryProjectionAllMutation {
    rebuildMediaLibraryProjectionAll {
      rebuiltSessions
    }
  }
`;

const AdminUpdateTempCleanupScheduleMutation = graphql`
  mutation adminUpdateTempCleanupScheduleMutation($input: UpdateTempCleanupScheduleInput!) {
    updateTempCleanupSchedule(input: $input) {
      schedule {
        hour
        days
        enabled
        lastRunAt
        nextRunAt
      }
    }
  }
`;

const AdminRunTempCleanupMutation = graphql`
  mutation adminRunTempCleanupMutation {
    runTempCleanup {
      started
      schedule {
        hour
        days
        enabled
        lastRunAt
        nextRunAt
      }
    }
  }
`;

const AdminUpdateVideoAccelerationPreferenceMutation = graphql`
  mutation adminUpdateVideoAccelerationPreferenceMutation(
    $input: UpdateVideoAccelerationPreferenceInput!
  ) {
    updateVideoAccelerationPreference(input: $input) {
      status {
        available
        backend
        effectiveBackend
        preferHardwareEncoding
        probing
        circuitBreakerActive
        circuitResetAt
        details {
          hasDri
          hasRenderD128
          hasCard0
          ffmpegHasHwaccel {
            qsv
            vaapi
          }
          ffmpegHasEncoder {
            h264_qsv
            h264_vaapi
            hevc_qsv
            hevc_vaapi
          }
          probeErrors
        }
      }
    }
  }
`;

const AdminUpdateUserAdminStatusMutation = graphql`
  mutation adminUpdateUserAdminStatusMutation($input: UpdateUserAdminStatusInput!) {
    updateUserAdminStatus(input: $input) {
      user {
        id
        username
        createdAt
        isAdmin
      }
    }
  }
`;

const AdminCancelRenderJobMutation = graphql`
  mutation adminCancelRenderJobMutation($recordingId: ID!) {
    cancelRenderJob(recordingId: $recordingId) {
      success
    }
  }
`;

type AdminTempDirName = adminToolsQuery["response"]["adminTempDirs"][number]["name"];

type AdminViewerContext = {
  viewer: NonNullable<RequireAuthViewerQuery["response"]["viewer"]>;
};

const pageGridStyles = css`
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 20px;
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const columnStyles = css`
  display: grid;
  gap: 20px;
`;

const tableStyles = css`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    text-align: left;
    padding: 8px 0;
    border-bottom: 1px solid #e2e8f4;
  }

  th {
    font-size: 0.85rem;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: #667084;
  }

  td button {
    font-size: 0.85rem;
  }
`;

const buttonRowStyles = css`
  display: flex;
  gap: 10px;
  margin-top: 8px;
`;

const scheduleGridStyles = css`
  display: grid;
  gap: 12px;
`;

const dayGridStyles = css`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;
const TB = GB * 1024;

function formatBytes(bytes: number): string {
  if (bytes < KB) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / KB).toFixed(1)} KB`;
  if (bytes < GB) return `${(bytes / MB).toFixed(1)} MB`;
  if (bytes < TB) return `${(bytes / GB).toFixed(2)} GB`;
  return `${(bytes / TB).toFixed(2)} TB`;
}

function friendlyStatus(status: string): string {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function friendlyRenderJobType(type: string): string {
  if (type === "COMBINE") return "Combine";
  if (type === "OVERLAY") return "Overlay";
  return type
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function backendLabel(backend?: string | null): string {
  if (backend === "QSV") return "QSV";
  if (backend === "VAAPI") return "VA-API";
  return "CPU";
}

function boolLabel(value?: boolean | null): string {
  return value ? "Yes" : "No";
}

const renderJobListStyles = css`
  display: grid;
  gap: 10px;
  margin-top: 12px;
`;

const renderJobStyles = css`
  border: 1px solid #e2e8f4;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
`;

const renderJobHeaderStyles = css`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
`;

const renderJobProgressBarStyles = css`
  background: #e2e8f4;
  border-radius: 999px;
  height: 6px;
  overflow: hidden;
  margin-top: 6px;
`;

const renderJobMetaStyles = css`
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #475569;
  margin-top: 6px;
`;

const renderJobProgressFill = (percent: number) => css`
  background: linear-gradient(90deg, #2563eb, #60a5fa);
  width: ${percent}%;
  height: 100%;
  transition: width 0.2s ease;
`;

const statusBadge = (tone: "success" | "warning" | "muted") => css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.9rem;
  background: ${tone === "success" ? "#e8f5e9" : tone === "warning" ? "#fff4e5" : "#f3f4f6"};
  color: ${tone === "success" ? "#166534" : tone === "warning" ? "#92400e" : "#1f2937"};
`;

const detailListStyles = css`
  display: grid;
  gap: 6px;
  margin: 8px 0 0;
`;

const detailRowStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: #1f2937;
`;

const dayOptions = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export default function AdminToolsRoute() {
  const [refreshKey, setRefreshKey] = useState(0);
  const data = useLazyLoadQuery<adminToolsQuery>(
    AdminToolsPageQuery,
    {},
    { fetchPolicy: "store-and-network", fetchKey: refreshKey }
  );
  const { viewer } = useOutletContext<AdminViewerContext>();
  const adminViewer = useFragment(AdminViewerFragment, viewer as adminAdminToolsRoute_viewer$key);
  const navigate = useNavigate();
  useEffect(() => {
    if (!adminViewer?.isAdmin) {
      navigate("/", { replace: true });
    }
  }, [navigate, adminViewer?.isAdmin]);
  if (!adminViewer?.isAdmin) {
    return (
      <Card title="Admin access">
        <p css={css`margin: 0; color: #1f2a44;`}>
          You must be an administrator to view this page.
        </p>
      </Card>
    );
  }
  const { setBreadcrumbs } = useBreadcrumbs();
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [clearingDirs, setClearingDirs] = useState<AdminTempDirName[]>([]);
  const [cancellingRenderIds, setCancellingRenderIds] = useState<string[]>([]);
  const [isFullRebuildRunning, setIsFullRebuildRunning] = useState(false);
  const [fullRebuildMessage, setFullRebuildMessage] = useState<string | null>(null);
  const [fullRebuildError, setFullRebuildError] = useState<string | null>(null);
  const [scheduleHour, setScheduleHour] = useState<string>(() => String(data.adminTempCleanupSchedule.hour));
  const [scheduleDays, setScheduleDays] = useState<Set<number>>(
    () => new Set(data.adminTempCleanupSchedule.days ?? [])
  );
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isRunningCleanup, setIsRunningCleanup] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [updatingUserIds, setUpdatingUserIds] = useState<string[]>([]);
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [videoAcceleration, setVideoAcceleration] = useState(data.adminVideoAcceleration);
  const [videoAccelError, setVideoAccelError] = useState<string | null>(null);
  const [videoAccelMessage, setVideoAccelMessage] = useState<string | null>(null);
  const [showVideoDetails, setShowVideoDetails] = useState(false);

  useEffect(() => {
    setBreadcrumbs([{ label: "Admin" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    setScheduleHour(String(data.adminTempCleanupSchedule.hour));
    setScheduleDays(new Set(data.adminTempCleanupSchedule.days ?? []));
  }, [data.adminTempCleanupSchedule.days, data.adminTempCleanupSchedule.hour]);

  useEffect(() => {
    setVideoAcceleration(data.adminVideoAcceleration);
  }, [data.adminVideoAcceleration]);

  const [commitDelete] = useMutation<adminDeleteOrphanedMediaMutation>(AdminDeleteOrphanedMediaMutation);
  const [commitEmpty] = useMutation<adminEmptyTempDirMutation>(AdminEmptyTempDirMutation);
  const [commitRebuildAll] = useMutation<adminRebuildMediaLibraryProjectionAllMutation>(
    AdminRebuildMediaLibraryProjectionAllMutation
  );
  const [commitUpdateCleanup] = useMutation<adminUpdateTempCleanupScheduleMutation>(
    AdminUpdateTempCleanupScheduleMutation
  );
  const [commitRunCleanup] = useMutation<adminRunTempCleanupMutation>(AdminRunTempCleanupMutation);
  const [commitUpdateUserAdminStatus] = useMutation<adminUpdateUserAdminStatusMutation>(
    AdminUpdateUserAdminStatusMutation
  );
  const [commitCancelRenderJob] = useMutation<adminCancelRenderJobMutation>(AdminCancelRenderJobMutation);
  const [commitUpdateVideoAccelerationPreference, isUpdatingVideoPreference] =
    useMutation<adminUpdateVideoAccelerationPreferenceMutation>(AdminUpdateVideoAccelerationPreferenceMutation);

  const orphanedMedia = data.adminOrphanedMedia ?? [];
  const adminUsers = data.adminUsers ?? [];

  const handleDelete = (mediaId: string) => {
    if (!window.confirm(`Delete orphaned media ${mediaId}?`)) return;
    setDeletingIds((prev) => [...prev, mediaId]);
    commitDelete({
      variables: { input: { mediaIds: [mediaId] } },
      onCompleted: () => {
        setDeletingIds((prev) => prev.filter((id) => id !== mediaId));
        setRefreshKey((key) => key + 1);
      },
      onError: () => {
        setDeletingIds((prev) => prev.filter((id) => id !== mediaId));
      },
    });
  };

  const handleRebuildAll = () => {
    setIsFullRebuildRunning(true);
    setFullRebuildError(null);
    setFullRebuildMessage(null);
    commitRebuildAll({
      variables: {},
      onCompleted: (response) => {
        setIsFullRebuildRunning(false);
        const sessions = response.rebuildMediaLibraryProjectionAll?.rebuiltSessions ?? 0;
        const label = sessions === 1 ? "session" : "sessions";
        setFullRebuildMessage(`Rebuilt ${sessions} ${label}.`);
        setRefreshKey((key) => key + 1);
      },
      onError: (error) => {
        setIsFullRebuildRunning(false);
        setFullRebuildError(error.message);
      },
    });
  };

  const handleEmpty = (name: AdminTempDirName) => {
    setClearingDirs((prev) => [...prev, name]);
    commitEmpty({
      variables: { input: { name } },
      onCompleted: () => {
        setClearingDirs((prev) => prev.filter((value) => value !== name));
        setRefreshKey((key) => key + 1);
      },
      onError: () => {
        setClearingDirs((prev) => prev.filter((value) => value !== name));
      },
    });
  };

  const handleToggleUserAdmin = (userId: string, currentValue: boolean) => {
    setUserError(null);
    setUserMessage(null);
    setUpdatingUserIds((prev) => [...prev, userId]);
    commitUpdateUserAdminStatus({
      variables: { input: { userId, isAdmin: !currentValue } },
      onCompleted: () => {
        setUpdatingUserIds((prev) => prev.filter((value) => value !== userId));
        setUserMessage("Admin status updated.");
        setRefreshKey((key) => key + 1);
      },
      onError: (error) => {
        setUpdatingUserIds((prev) => prev.filter((value) => value !== userId));
        setUserError(error.message);
      },
    });
  };

  const handleUpdateVideoPreference = (nextValue: boolean) => {
    if (!videoAcceleration) return;
    setVideoAccelError(null);
    setVideoAccelMessage(null);
    const previous = videoAcceleration;
    setVideoAcceleration({ ...videoAcceleration, preferHardwareEncoding: nextValue });
    commitUpdateVideoAccelerationPreference({
      variables: { input: { preferHardwareEncoding: nextValue } },
      onCompleted: (response) => {
        const status = response.updateVideoAccelerationPreference?.status;
        if (status) {
          setVideoAcceleration(status);
          setVideoAccelMessage("Preference updated.");
        } else {
          setVideoAcceleration(previous);
        }
      },
      onError: (error) => {
        setVideoAcceleration(previous);
        setVideoAccelError(error.message);
      },
    });
  };

  const cleanupSchedule = data.adminTempCleanupSchedule;
  const scheduleEnabled = scheduleDays.size > 0;
  const videoStatus = videoAcceleration ?? data.adminVideoAcceleration;
  const hardwareToggleDisabled = !videoStatus?.available || isUpdatingVideoPreference;

  const toggleDay = (value: number) => {
    setScheduleDays((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const formatRunTime = (value?: string | null) => {
    if (!value) return "Never";
    return new Date(value).toLocaleString();
  };

  const handleSaveSchedule = () => {
    setScheduleError(null);
    setScheduleMessage(null);
    const parsedHour = Number(scheduleHour);
    if (!Number.isInteger(parsedHour) || parsedHour < 0 || parsedHour > 23) {
      setScheduleError("Hour must be between 0 and 23.");
      return;
    }
    const days = Array.from(scheduleDays).sort((a, b) => a - b);
    setIsSavingSchedule(true);
    commitUpdateCleanup({
      variables: { input: { hour: parsedHour, days } },
      onCompleted: (response) => {
        setIsSavingSchedule(false);
        const nextSchedule = response.updateTempCleanupSchedule?.schedule;
        if (nextSchedule) {
          setScheduleHour(String(nextSchedule.hour));
          setScheduleDays(new Set(nextSchedule.days ?? []));
        }
        setScheduleMessage(days.length ? "Schedule saved." : "Schedule disabled (no days selected).");
        setRefreshKey((key) => key + 1);
      },
      onError: (error) => {
        setIsSavingSchedule(false);
        setScheduleError(error.message);
      },
    });
  };

  const handleRunCleanup = () => {
    setScheduleError(null);
    setScheduleMessage(null);
    setIsRunningCleanup(true);
    commitRunCleanup({
      variables: {},
      onCompleted: (response) => {
        setIsRunningCleanup(false);
        const payload = response.runTempCleanup;
        if (payload?.schedule) {
          setScheduleHour(String(payload.schedule.hour));
          setScheduleDays(new Set(payload.schedule.days ?? []));
        }
        if (payload?.started) {
          setScheduleMessage("Cleanup started.");
        } else {
          setScheduleMessage("Cleanup is already running.");
        }
        setRefreshKey((key) => key + 1);
      },
      onError: (error) => {
        setIsRunningCleanup(false);
        setScheduleError(error.message);
      },
    });
  };

  const handleCancelRenderJob = (recordingId: string) => {
    if (cancellingRenderIds.includes(recordingId)) return;
    setCancellingRenderIds((prev) => [...prev, recordingId]);
    commitCancelRenderJob({
      variables: { recordingId },
      onCompleted: () => {
        setCancellingRenderIds((prev) => prev.filter((id) => id !== recordingId));
        setRefreshKey((key) => key + 1);
      },
      onError: () => {
        setCancellingRenderIds((prev) => prev.filter((id) => id !== recordingId));
      },
    });
  };

  const tempDirs = data.adminTempDirs ?? [];
  const recordingHealth = data.adminRecordingHealth ?? [];
  const renderJobs = data.adminRenderJobs ?? [];
  const mediaLibraries = data.adminUserMediaLibraries ?? [];

  const recordingsByStatus = useMemo(
    () => recordingHealth.slice().sort((a, b) => b.count - a.count),
    [recordingHealth]
  );

  const mediaLibrariesSorted = useMemo(
    () =>
      mediaLibraries
        .slice()
        .sort((a, b) => (b.sizeBytes !== a.sizeBytes ? b.sizeBytes - a.sizeBytes : a.username.localeCompare(b.username))),
    [mediaLibraries]
  );

  return (
    <div css={pageGridStyles}>
      <div css={columnStyles}>
        <Card title="Users">
          {adminUsers.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <table css={tableStyles}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Created</th>
                  <th>Admin</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((user) => {
                  const isCurrentUser = adminViewer?.id === user.id;
                  const isUpdating = updatingUserIds.includes(user.id);
                  return (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{new Date(user.createdAt).toLocaleString()}</td>
                      <td>
                        <label css={css`display: flex; align-items: center; gap: 6px;`}>
                          <input
                            type="checkbox"
                            checked={user.isAdmin}
                            disabled={isUpdating || isCurrentUser}
                            onChange={() => handleToggleUserAdmin(user.id, user.isAdmin)}
                          />
                          <span>{isCurrentUser ? "Admin (you)" : "Admin"}</span>
                          {isUpdating ? (
                            <span css={css`font-size: 0.78rem; color: #667084;`}>
                              Saving…
                            </span>
                          ) : null}
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {userError ? <p className="lede">{userError}</p> : null}
          {userMessage ? <p>{userMessage}</p> : null}
        </Card>

        <Card title="Orphaned media">
          {orphanedMedia.length === 0 ? (
            <p>No orphaned media detected.</p>
          ) : (
            <table css={tableStyles}>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Size</th>
                  <th>Modified</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orphanedMedia.map((entry) => (
                  <tr key={entry.mediaId}>
                    <td>{entry.mediaId}</td>
                    <td>{formatBytes(entry.sizeBytes)}</td>
                    <td>{new Date(entry.modifiedAt).toLocaleString()}</td>
                    <td>
                      <button
                        type="button"
                        disabled={deletingIds.includes(entry.mediaId)}
                        onClick={() => handleDelete(entry.mediaId)}
                      >
                        {deletingIds.includes(entry.mediaId) ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card
          title="User media libraries"
          rightHeaderContent={
            <button type="button" disabled={isFullRebuildRunning} onClick={handleRebuildAll}>
              {isFullRebuildRunning ? "Rebuilding Media Library index…" : "Rebuild Media Library index"}
            </button>
          }
        >
          {fullRebuildMessage ? <p>{fullRebuildMessage}</p> : null}
          {fullRebuildError ? <p className="lede">{fullRebuildError}</p> : null}
          {mediaLibrariesSorted.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <table css={tableStyles}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Recordings</th>
                  <th>Size</th>
                </tr>
              </thead>
              <tbody>
                {mediaLibrariesSorted.map((entry) => (
                  <tr key={entry.userId}>
                    <td>{entry.username}</td>
                    <td>{entry.recordingCount}</td>
                    <td>{formatBytes(entry.sizeBytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div css={columnStyles}>
        <Card title="Video acceleration">
          {!videoStatus ? (
            <p>Loading status…</p>
          ) : (
            <div css={css`display: grid; gap: 12px;`}>
              <div css={css`display: grid; gap: 6px;`}>
                <span
                  css={statusBadge(
                    videoStatus.available ? "success" : videoStatus.probing ? "muted" : "warning"
                  )}
                >
                  {videoStatus.probing
                    ? "Hardware encoding: Probing…"
                    : videoStatus.available
                      ? `Hardware encoding: Available (${backendLabel(videoStatus.backend)})`
                      : "Hardware encoding: Unavailable"}
                </span>
                <div css={css`color: #475569; font-size: 0.95rem;`}>
                  <div>
                    Effective:{" "}
                    {videoStatus.effectiveBackend === "NONE"
                      ? "CPU (fallback)"
                      : backendLabel(videoStatus.effectiveBackend)}
                  </div>
                  {videoStatus.circuitBreakerActive && videoStatus.circuitResetAt ? (
                    <div>
                      GPU temporarily disabled after failures until{" "}
                      {new Date(videoStatus.circuitResetAt).toLocaleString()}
                    </div>
                  ) : null}
                </div>
              </div>

              <label css={css`display: grid; gap: 6px;`}>
                <span>Prefer hardware encoding (GPU) when available</span>
                <div css={css`display: flex; gap: 10px; align-items: center;`}>
                  <input
                    type="checkbox"
                    checked={videoStatus.preferHardwareEncoding}
                    disabled={hardwareToggleDisabled}
                    onChange={(event) => handleUpdateVideoPreference(event.target.checked)}
                  />
                  <span css={css`color: #4b5563; font-size: 0.95rem;`}>
                    Uses Intel/AMD hardware encoders when detected; automatically falls back to CPU if unavailable or if encoding fails.
                  </span>
                </div>
                {!videoStatus.available ? (
                  <span css={css`color: #b45309; font-size: 0.9rem;`}>GPU not detected; encoding will use CPU.</span>
                ) : null}
                {videoAccelMessage ? <span css={css`color: #166534;`}>{videoAccelMessage}</span> : null}
                {videoAccelError ? <span className="lede">{videoAccelError}</span> : null}
              </label>

              <button type="button" onClick={() => setShowVideoDetails((prev) => !prev)}>
                {showVideoDetails ? "Hide probe details" : "Show probe details"}
              </button>

              {showVideoDetails ? (
                <div css={detailListStyles}>
                  <div css={detailRowStyles}>
                    <span>/dev/dri present</span>
                    <strong>{boolLabel(videoStatus.details.hasDri)}</strong>
                  </div>
                  <div css={detailRowStyles}>
                    <span>renderD128 readable</span>
                    <strong>{boolLabel(videoStatus.details.hasRenderD128)}</strong>
                  </div>
                  <div css={detailRowStyles}>
                    <span>card0 readable</span>
                    <strong>{boolLabel(videoStatus.details.hasCard0)}</strong>
                  </div>
                  <div css={detailRowStyles}>
                    <span>ffmpeg hwaccels</span>
                    <strong>{`qsv ${boolLabel(videoStatus.details.ffmpegHasHwaccel.qsv)} · vaapi ${boolLabel(videoStatus.details.ffmpegHasHwaccel.vaapi)}`}</strong>
                  </div>
                  <div css={detailRowStyles}>
                    <span>Encoders</span>
                    <strong>{`h264_qsv ${boolLabel(videoStatus.details.ffmpegHasEncoder.h264_qsv)} · h264_vaapi ${boolLabel(videoStatus.details.ffmpegHasEncoder.h264_vaapi)}`}</strong>
                  </div>
                  <div css={detailRowStyles}>
                    <span>HEVC encoders</span>
                    <strong>{`hevc_qsv ${boolLabel(videoStatus.details.ffmpegHasEncoder.hevc_qsv)} · hevc_vaapi ${boolLabel(videoStatus.details.ffmpegHasEncoder.hevc_vaapi)}`}</strong>
                  </div>
                  {videoStatus.details.probeErrors.length ? (
                    <div css={css`font-size: 0.9rem; color: #b91c1c;`}>
                      <strong>Probe errors</strong>
                      <ul css={css`margin: 6px 0 0 14px; padding: 0;`}>
                        {videoStatus.details.probeErrors.map((err, idx) => (
                          <li key={`${err}-${idx}`}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </Card>

        <Card title="Temp cleanup schedule">
          <div css={scheduleGridStyles}>
            <p css={css`color: #3e4b6d; margin: 0;`}>
              Automatically deletes temp uploads/renders/previews older than 1 day.
            </p>
            <div css={css`display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.95rem;`}>
              <span>
                <strong>Last run:</strong> {formatRunTime(cleanupSchedule.lastRunAt)}
              </span>
              <span>
                <strong>Next run:</strong> {cleanupSchedule.nextRunAt ? formatRunTime(cleanupSchedule.nextRunAt) : "Not scheduled"}
              </span>
            </div>
            <label css={css`display: grid; gap: 4px; max-width: 200px;`}>
              <span>Hour (server local)</span>
              <input
                type="number"
                min={0}
                max={23}
                value={scheduleHour}
                onChange={(event) => setScheduleHour(event.target.value)}
              />
            </label>
            <div>
              <span>Days of week</span>
              <div css={dayGridStyles}>
                {dayOptions.map((day) => (
                  <label key={day.value} css={css`display: flex; align-items: center; gap: 6px;`}>
                    <input
                      type="checkbox"
                      checked={scheduleDays.has(day.value)}
                      onChange={() => toggleDay(day.value)}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>
            <div css={css`font-size: 0.9rem; color: #667084;`}>
              {scheduleEnabled ? "Enabled" : "Disabled (select days to enable)."}
            </div>
            {scheduleError ? <p className="lede">{scheduleError}</p> : null}
            {scheduleMessage ? <p>{scheduleMessage}</p> : null}
            <div css={buttonRowStyles}>
              <button type="button" disabled={isSavingSchedule} onClick={handleSaveSchedule}>
                {isSavingSchedule ? "Saving…" : scheduleEnabled ? "Save schedule" : "Disable schedule"}
              </button>
              <button type="button" disabled={isRunningCleanup} onClick={handleRunCleanup}>
                {isRunningCleanup ? "Running…" : "Run now"}
              </button>
            </div>
          </div>
        </Card>

        <Card title="Temp directories">
          <div css={css`display: grid; gap: 12px;`}>
            {tempDirs.map((dir) => (
              <div key={dir.name} css={css`display: flex; justify-content: space-between; align-items: center;`}>
                <div>
                  <strong>{dir.name.toLowerCase()}:</strong> {formatBytes(dir.sizeBytes)} · {dir.fileCount} files
                  <div css={css`font-size: 0.85rem; color: #667084;`}>{dir.path}</div>
                </div>
                <button
                  type="button"
                  disabled={clearingDirs.includes(dir.name)}
                  onClick={() => handleEmpty(dir.name)}
                >
                  {clearingDirs.includes(dir.name) ? "Clearing…" : "Empty"}
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recording pipeline health">
          {recordingsByStatus.length === 0 ? (
            <p>No recordings found.</p>
          ) : (
            <ul css={css`list-style: none; padding: 0; margin: 0; display: grid; gap: 8px;`}>
              {recordingsByStatus.map((entry) => (
                <li key={entry.status} css={css`display: flex; justify-content: space-between;`}>
                  <span>{friendlyStatus(entry.status)}</span>
                  <strong>{entry.count}</strong>
                </li>
              ))}
            </ul>
          )}
          <div css={css`margin-top: 18px;`}>
            <strong>Active renders</strong>
            {renderJobs.length === 0 ? (
              <p css={css`margin: 6px 0 0; color: #475569;`}>No render jobs in flight.</p>
            ) : (
              <div css={renderJobListStyles}>
                {renderJobs.map((job) => {
                  const progressPercent = Math.min(100, Math.max(0, Math.round((job.progress ?? 0) * 100)));
                  const jobDescription = job.description ?? `Recording ${job.recordingId}`;
                  const recordingIdLabel = job.sessionId ?? job.recordingId;
                  const isCancelling = cancellingRenderIds.includes(job.recordingId);
                  return (
                    <div key={job.recordingId} css={renderJobStyles}>
                      <div css={renderJobHeaderStyles}>
                        <div>
                          <strong>{friendlyRenderJobType(job.type)} render</strong>
                          <div css={css`font-size: 0.85rem; color: #475569; margin-top: 4px;`}>
                            {jobDescription}
                          </div>
                          <div css={css`font-size: 0.78rem; color: #667084; margin-top: 4px;`}>
                            Started by {job.username ?? job.userId} · {recordingIdLabel}
                          </div>
                        </div>
                        <button type="button" disabled={isCancelling} onClick={() => handleCancelRenderJob(job.recordingId)}>
                          {isCancelling ? "Cancelling…" : "Cancel render"}
                        </button>
                      </div>
                      <div css={renderJobProgressBarStyles}>
                        <div css={renderJobProgressFill(progressPercent)} />
                      </div>
                      <div css={renderJobMetaStyles}>
                        <span>{progressPercent}% complete</span>
                        <span>{new Date(job.startedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
