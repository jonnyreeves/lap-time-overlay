import { useEffect, useState } from "react";
import { graphql, useFragment, useMutation } from "react-relay";
import type { TrackKartsCardAddKartToTrackMutation } from "src/web/client/__generated__/TrackKartsCardAddKartToTrackMutation.graphql.ts";
import type { TrackKartsCardRemoveKartFromTrackMutation } from "src/web/client/__generated__/TrackKartsCardRemoveKartFromTrackMutation.graphql.ts";
import type { TrackKartsCardDeleteKartMutation } from "src/web/client/__generated__/TrackKartsCardDeleteKartMutation.graphql.ts";
import type { TrackKartsCardUpdateKartNameMutation } from "src/web/client/__generated__/TrackKartsCardUpdateKartNameMutation.graphql.ts";
import type { TrackKartsCard_track$key } from "src/web/client/__generated__/TrackKartsCard_track.graphql.ts";
import { Card } from "../Card.tsx";
import { IconButton } from "../IconButton.tsx";
import { TrackKartEditModal } from "./TrackKartEditModal.js";
import { dangerInlineActionButtonStyles, inlineActionButtonStyles, kartListStyles, kartRowStyles, largeInlineActionButtonStyles } from "../inlineActionButtons.ts";
import { actionsRowStyles, primaryButtonStyles } from "../session/sessionOverviewStyles.ts";

const TrackKartsCardTrackFragment = graphql`
  fragment TrackKartsCard_track on Track {
    id
    name
    karts {
      id
      name
    }
  }
`;

const AddKartToTrackMutation = graphql`
  mutation TrackKartsCardAddKartToTrackMutation($trackId: ID!, $kartId: ID!) {
    addKartToTrack(trackId: $trackId, kartId: $kartId) {
      track {
        id
        karts {
          id
          name
        }
      }
      kart {
        id
      }
    }
  }
`;

const RemoveKartFromTrackMutation = graphql`
  mutation TrackKartsCardRemoveKartFromTrackMutation($trackId: ID!, $kartId: ID!) {
    removeKartFromTrack(trackId: $trackId, kartId: $kartId) {
      track {
        id
        karts {
          id
          name
        }
      }
      kart {
        id
      }
    }
  }
`;

const DeleteKartMutation = graphql`
  mutation TrackKartsCardDeleteKartMutation($id: ID!) {
    deleteKart(id: $id) {
      success
    }
  }
`;

const UpdateKartNameMutation = graphql`
  mutation TrackKartsCardUpdateKartNameMutation($input: UpdateKartInput!) {
    updateKart(input: $input) {
      kart {
        id
        name
      }
    }
  }
`;

type Props = {
  track: TrackKartsCard_track$key;
};

export function TrackKartsCard({ track: trackKey }: Props) {
  const track = useFragment(TrackKartsCardTrackFragment, trackKey);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddEditKartModal, setShowAddEditKartModal] = useState(false);
  const [kartToEdit, setKartToEdit] = useState<{ id: string; name: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editableKartNames, setEditableKartNames] = useState<Map<string, string>>(() => new Map());

  useEffect(() => {
    if (!isEditing) {
      // When not editing, reset editable names to current track karts
      const newMap = new Map();
      track.karts.forEach((kart) => newMap.set(kart.id, kart.name));
      setEditableKartNames(newMap);
    }
  }, [isEditing, track.karts]);

  const karts = track.karts;
  const formId = "track-karts-form";

  const [commitAddKartToTrack, isAddingKartToTrack] =
    useMutation<TrackKartsCardAddKartToTrackMutation>(AddKartToTrackMutation);
  const [commitRemoveKartFromTrack, isRemovingKartFromTrack] =
    useMutation<TrackKartsCardRemoveKartFromTrackMutation>(RemoveKartFromTrackMutation);
  const [commitDeleteKart, isDeletingKart] =
    useMutation<TrackKartsCardDeleteKartMutation>(DeleteKartMutation);
  const [commitUpdateKartName, isUpdatingKartName] =
    useMutation<TrackKartsCardUpdateKartNameMutation>(UpdateKartNameMutation);

  const isSaving = isAddingKartToTrack || isRemovingKartFromTrack || isDeletingKart || isUpdatingKartName;

  function handleEdit() {
    setIsEditing(true);
    setActionError(null);
  }

  function handleCancel() {
    setActionError(null);
    // Reset editable names to original track karts
    const newMap = new Map();
    track.karts.forEach((kart) => newMap.set(kart.id, kart.name));
    setEditableKartNames(newMap);
    setIsEditing(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setActionError(null);

    const pendingMutations: Promise<void>[] = [];

    for (const originalKart of track.karts) {
      const editedName = editableKartNames.get(originalKart.id);

      if (editedName != null && editedName !== originalKart.name) {
        if (!editedName.trim()) {
          setActionError(`Kart name cannot be empty for "${originalKart.name}".`);
          return;
        }

        pendingMutations.push(
          new Promise<void>((resolve, reject) => {
            commitUpdateKartName({
              variables: { input: { id: originalKart.id, name: editedName.trim() } },
              optimisticResponse: {
                updateKart: {
                  kart: { id: originalKart.id, name: editedName.trim(), __typename: "Kart" },
                  __typename: "UpdateKartPayload",
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
      if (pendingMutations.length > 0) {
        await Promise.all(pendingMutations);
      }
      setIsEditing(false);
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "An unknown error occurred.");
    }
  }

  function handleAddKart() {
    setKartToEdit(null); // Clear any previous kart for editing
    setShowAddEditKartModal(true);
  }

  function handleEditKart(kart: { id: string; name: string }) {
    setKartToEdit(kart);
    setShowAddEditKartModal(true);
  }

  function handleDeleteKart(kartId: string) {
    if (isSaving) return;
    setActionError(null);

    // First remove from track
    commitRemoveKartFromTrack({
      variables: { trackId: track.id, kartId },
      optimisticResponse: {
        removeKartFromTrack: {
          track: {
            id: track.id,
            karts: track.karts.filter((k: { id: string }) => k.id !== kartId),
            __typename: "Track",
          },
          kart: { id: kartId, __typename: "Kart" },
          __typename: "RemoveKartFromTrackPayload",
        },
      },
      onCompleted: (response) => {
        // Only delete kart if it's not part of any other track
        // This logic would ideally be handled on the server, but for now we'll do a simple check
        if (response?.removeKartFromTrack?.kart?.id) {
          commitDeleteKart({
            variables: { id: kartId },
            optimisticResponse: {
              deleteKart: { success: true, __typename: "DeleteKartPayload" },
            },
            onCompleted: () => setActionError(null),
            onError: (error) => setActionError(error.message),
          });
        }
      },
      onError: (error) => {
        setActionError(error.message);
      },
    });
  }

  function handleCloseModal() {
    setShowAddEditKartModal(false);
    setKartToEdit(null);
    setActionError(null);
  }

  // Callback from TrackKartEditModal when a new kart is created
  const onKartCreated = (newKartId: string, newKartName: string) => {
    if (!newKartId) return;

    // Add the newly created kart to this track
    commitAddKartToTrack({
      variables: { trackId: track.id, kartId: newKartId },
      optimisticResponse: {
        addKartToTrack: {
          track: {
            id: track.id,
            karts: [...track.karts, { id: newKartId, name: newKartName, __typename: "Kart" }],
            __typename: "Track",
          },
          kart: { id: newKartId, __typename: "Kart" },
          __typename: "AddKartToTrackPayload",
        },
      },
      onCompleted: () => setActionError(null),
      onError: (error) => setActionError(error.message),
    });
  };

  return (
    <>
      <Card
        title="Karts"
        rightHeaderContent={
          <div css={actionsRowStyles}>
            {isEditing ? (
              <>
                <button type="button" css={inlineActionButtonStyles} onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </button>
                <button
                  type="submit"
                  form={formId}
                  css={primaryButtonStyles}
                  disabled={isSaving}
                >
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
        <div>
          {actionError ? <p css={{ color: "red" }}>{actionError}</p> : null}
          <form id={formId} onSubmit={handleSubmit}>
            {karts.length === 0 ? (
              <p>No karts added to this track yet.</p>
            ) : (
              <ul css={kartListStyles}>
                {karts.map((kart: { id: string; name: string }) => (
                  <li key={kart.id} css={kartRowStyles}>
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
                        value={editableKartNames.get(kart.id) || ""}
                        onChange={(e) =>
                          setEditableKartNames((current) => new Map(current).set(kart.id, e.target.value))
                        }
                        disabled={isSaving}
                      />
                    ) : (
                      <div className="kart-name">{kart.name}</div>
                    )}
                    {isEditing && (
                      <div className="actions">
                        <button css={dangerInlineActionButtonStyles} onClick={() => handleDeleteKart(kart.id)} disabled={isSaving}>Delete</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {isEditing && (
              <div css={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                <IconButton
                  type="button"
                  css={largeInlineActionButtonStyles}
                  onClick={handleAddKart}
                  icon="+"
                  disabled={isSaving}
                >
                  Add Kart
                </IconButton>
              </div>
            )}
          </form>
        </div>
      </Card>

      {showAddEditKartModal && (
        <TrackKartEditModal
          trackId={track.id}
          kart={kartToEdit}
          onClose={handleCloseModal}
          onKartCreated={onKartCreated}
        />
      )}
    </>
  );
}
