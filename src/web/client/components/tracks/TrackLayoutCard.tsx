import { useEffect, useState } from "react";
import { graphql, useFragment, useMutation } from "react-relay";
import type { TrackLayoutCardRemoveTrackLayoutFromTrackMutation } from "src/web/client/__generated__/TrackLayoutCardRemoveTrackLayoutFromTrackMutation.graphql.ts";
import type { TrackLayoutCardUpdateTrackLayoutMutation } from "src/web/client/__generated__/TrackLayoutCardUpdateTrackLayoutMutation.graphql.ts";
import type { TrackLayoutCard_track$key } from "src/web/client/__generated__/TrackLayoutCard_track.graphql.ts";
import { Card } from "../Card.tsx";
import { IconButton } from "../IconButton.tsx";
import { dangerInlineActionButtonStyles, inlineActionButtonStyles, kartListStyles, kartRowStyles, largeInlineActionButtonStyles } from "../inlineActionButtons.ts";
import { TrackLayoutEditModal } from "./TrackLayoutEditModal.js";
import { actionsRowStyles, primaryButtonStyles } from "../session/sessionOverviewStyles.ts";

const TrackLayoutsFragment = graphql`
  fragment TrackLayoutCard_track on Track {
    id
    name
    trackLayouts {
      id
      name
    }
  }
`;

const UpdateTrackLayoutMutation = graphql`
  mutation TrackLayoutCardUpdateTrackLayoutMutation($input: UpdateTrackLayoutInput!) {
    updateTrackLayout(input: $input) {
      trackLayout {
        id
        name
        track {
          id
        }
      }
    }
  }
`;

const RemoveTrackLayoutFromTrackMutation = graphql`
  mutation TrackLayoutCardRemoveTrackLayoutFromTrackMutation(
    $trackId: ID!
    $trackLayoutId: ID!
  ) {
    removeTrackLayoutFromTrack(trackId: $trackId, trackLayoutId: $trackLayoutId) {
      track {
        id
        trackLayouts {
          id
          name
        }
      }
      trackLayout {
        id
        name
      }
    }
  }
`;

type Props = {
  track: TrackLayoutCard_track$key;
};

export function TrackLayoutCard({ track: trackKey }: Props) {
  const track = useFragment(TrackLayoutsFragment, trackKey);
  const [isEditing, setIsEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editableLayoutNames, setEditableLayoutNames] = useState<Map<string, string>>(
    () => new Map()
  );
  const [showAddLayoutModal, setShowAddLayoutModal] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      const names = new Map<string, string>();
      track.trackLayouts.forEach((layout) => names.set(layout.id, layout.name));
      setEditableLayoutNames(names);
    }
  }, [track.trackLayouts, isEditing]);

  const [commitUpdateLayout, isUpdatingLayout] =
    useMutation<TrackLayoutCardUpdateTrackLayoutMutation>(UpdateTrackLayoutMutation);
  const [commitRemoveLayout, isRemovingLayout] =
    useMutation<TrackLayoutCardRemoveTrackLayoutFromTrackMutation>(RemoveTrackLayoutFromTrackMutation);

  const isSaving = isUpdatingLayout || isRemovingLayout;
  const formId = "track-layouts-form";

  function handleEdit() {
    setIsEditing(true);
    setActionError(null);
  }

  function handleCancel() {
    setIsEditing(false);
    setActionError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setActionError(null);

    const pending: Promise<void>[] = [];
    for (const layout of track.trackLayouts) {
      const editedName = editableLayoutNames.get(layout.id);
      if (editedName != null && editedName !== layout.name) {
        const trimmed = editedName.trim();
        if (!trimmed) {
          setActionError(`Track layout name cannot be empty for "${layout.name}".`);
          return;
        }

        pending.push(
          new Promise<void>((resolve, reject) => {
            commitUpdateLayout({
              variables: { input: { id: layout.id, name: trimmed } },
              optimisticResponse: {
                updateTrackLayout: {
                  trackLayout: {
                    id: layout.id,
                    name: trimmed,
                    track: { id: track.id, __typename: "Track" },
                    __typename: "TrackLayout",
                  },
                  __typename: "UpdateTrackLayoutPayload",
                },
              },
              onCompleted: () => resolve(),
              onError: (error) => reject(error),
            });
          })
        );
      }
    }

    try {
      if (pending.length > 0) {
        await Promise.all(pending);
      }
      setIsEditing(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to update track layouts.");
    }
  }

  function handleAddLayout() {
    setShowAddLayoutModal(true);
  }

  function handleCloseModal() {
    setShowAddLayoutModal(false);
    setActionError(null);
  }

  function handleLayoutCreated(newLayoutId: string, newLayoutName: string) {
    setEditableLayoutNames((current) => new Map(current).set(newLayoutId, newLayoutName));
    setShowAddLayoutModal(false);
  }

  function handleDeleteLayout(trackLayoutId: string) {
    if (isSaving) return;
    setActionError(null);

    commitRemoveLayout({
      variables: { trackId: track.id, trackLayoutId },
      optimisticResponse: {
        removeTrackLayoutFromTrack: {
          track: {
            id: track.id,
            trackLayouts: track.trackLayouts
              .filter((layout) => layout.id !== trackLayoutId)
              .map((layout) => ({ id: layout.id, name: layout.name, __typename: "TrackLayout" })),
            __typename: "Track",
          },
          trackLayout: {
            id: trackLayoutId,
            name: editableLayoutNames.get(trackLayoutId) ?? "",
            __typename: "TrackLayout",
          },
          __typename: "RemoveTrackLayoutFromTrackPayload",
        },
      },
      onError: (error) => setActionError(error.message),
    });
  }

  return (
    <Card
      title="Track Layouts"
      rightHeaderContent={
        <div css={actionsRowStyles}>
          {isEditing ? (
            <>
              <button type="button" css={inlineActionButtonStyles} onClick={handleCancel} disabled={isSaving}>
                Cancel
              </button>
              <button type="submit" form={formId} css={primaryButtonStyles} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <IconButton
              type="button"
              css={inlineActionButtonStyles}
              onClick={handleEdit}
              icon="✏️"
              disabled={isSaving}
            >
              Edit
            </IconButton>
          )}
        </div>
      }
    >
      {actionError ? <p css={{ color: "red" }}>{actionError}</p> : null}
      <form id={formId} onSubmit={handleSubmit}>
        {track.trackLayouts.length === 0 ? (
          <p>No track layouts added to this track yet.</p>
        ) : (
          <ul css={kartListStyles}>
            {track.trackLayouts.map((layout) => (
              <li key={layout.id} css={kartRowStyles}>
                {isEditing ? (
                  <input
                    type="text"
                    css={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "6px 10px",
                      fontSize: "1rem",
                      fontWeight: "700",
                      color: "#0b132b",
                      flexGrow: 1,
                    }}
                    value={editableLayoutNames.get(layout.id) || ""}
                    onChange={(e) =>
                      setEditableLayoutNames((current) => new Map(current).set(layout.id, e.target.value))
                    }
                    disabled={isSaving}
                  />
                ) : (
                  <div className="kart-name">{layout.name}</div>
                )}
                {isEditing && (
                  <div className="actions">
                    <button
                      css={dangerInlineActionButtonStyles}
                      onClick={() => handleDeleteLayout(layout.id)}
                      disabled={isSaving}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {isEditing && (
          <div css={{ marginTop: "14px", display: "flex", justifyContent: "flex-end" }}>
            <IconButton
              type="button"
              css={largeInlineActionButtonStyles}
              onClick={handleAddLayout}
              icon="+"
              disabled={isSaving}
            >
              Add Layout
            </IconButton>
          </div>
        )}
      </form>

      {showAddLayoutModal && (
        <TrackLayoutEditModal
          trackId={track.id}
          onClose={handleCloseModal}
          onTrackLayoutCreated={handleLayoutCreated}
        />
      )}
    </Card>
  );
}
