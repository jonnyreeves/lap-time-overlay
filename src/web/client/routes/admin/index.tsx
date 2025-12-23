import { css } from "@emotion/react";
import { useEffect, useMemo, useState } from "react";
import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
import type { adminToolsQuery } from "../../__generated__/adminToolsQuery.graphql.js";
import type { adminDeleteOrphanedMediaMutation } from "../../__generated__/adminDeleteOrphanedMediaMutation.graphql.js";
import type { adminEmptyTempDirMutation } from "../../__generated__/adminEmptyTempDirMutation.graphql.js";
import type { adminRebuildJellyfinProjectionAllMutation } from "../../__generated__/adminRebuildJellyfinProjectionAllMutation.graphql.js";
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

const AdminRebuildJellyfinProjectionAllMutation = graphql`
  mutation adminRebuildJellyfinProjectionAllMutation {
    rebuildJellyfinProjectionAll {
      rebuiltSessions
    }
  }
`;

type AdminTempDirName = adminToolsQuery["response"]["adminTempDirs"][number]["name"];

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function friendlyStatus(status: string): string {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export default function AdminToolsRoute() {
  const [refreshKey, setRefreshKey] = useState(0);
  const data = useLazyLoadQuery<adminToolsQuery>(
    AdminToolsPageQuery,
    {},
    { fetchPolicy: "store-and-network", fetchKey: refreshKey }
  );
  const { setBreadcrumbs } = useBreadcrumbs();
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [clearingDirs, setClearingDirs] = useState<AdminTempDirName[]>([]);
  const [isFullRebuildRunning, setIsFullRebuildRunning] = useState(false);
  const [fullRebuildMessage, setFullRebuildMessage] = useState<string | null>(null);
  const [fullRebuildError, setFullRebuildError] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ label: "Admin" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const [commitDelete] = useMutation<adminDeleteOrphanedMediaMutation>(AdminDeleteOrphanedMediaMutation);
  const [commitEmpty] = useMutation<adminEmptyTempDirMutation>(AdminEmptyTempDirMutation);
  const [commitRebuildAll] = useMutation<adminRebuildJellyfinProjectionAllMutation>(
    AdminRebuildJellyfinProjectionAllMutation
  );

  const orphanedMedia = data.adminOrphanedMedia ?? [];

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
        const sessions = response.rebuildJellyfinProjectionAll?.rebuiltSessions ?? 0;
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

  const tempDirs = data.adminTempDirs ?? [];
  const recordingHealth = data.adminRecordingHealth ?? [];

  const recordingsByStatus = useMemo(
    () => recordingHealth.slice().sort((a, b) => b.count - a.count),
    [recordingHealth]
  );

  return (
    <div css={pageGridStyles}>
      <div css={columnStyles}>
        <Card title="Jellyfin projection">
          <div css={buttonRowStyles}>
            <button type="button" disabled={isFullRebuildRunning} onClick={handleRebuildAll}>
              {isFullRebuildRunning ? "Rebuilding all…" : "Rebuild all sessions"}
            </button>
          </div>
          {fullRebuildMessage ? <p>{fullRebuildMessage}</p> : null}
          {fullRebuildError ? <p className="lede">{fullRebuildError}</p> : null}
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
      </div>

      <div css={columnStyles}>
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
        </Card>
      </div>
    </div>
  );
}
