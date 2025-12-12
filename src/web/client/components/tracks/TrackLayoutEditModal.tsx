import { useState } from "react";
import { graphql, useMutation } from "react-relay";
import { css } from "@emotion/react";
import { Modal } from "../Modal.tsx";
import { inlineActionButtonStyles } from "../inlineActionButtons.ts";
import type { TrackLayoutEditModalAddTrackLayoutToTrackMutation } from "src/web/client/__generated__/TrackLayoutEditModalAddTrackLayoutToTrackMutation.graphql.ts";
import { inputStyles, primaryButtonStyles } from "../session/sessionOverviewStyles.ts";

type Props = {
  trackId: string;
  onClose: () => void;
  onTrackLayoutCreated?: (trackLayoutId: string, trackLayoutName: string) => void;
};

const AddTrackLayoutToTrackMutation = graphql`
  mutation TrackLayoutEditModalAddTrackLayoutToTrackMutation(
    $trackId: ID!
    $input: CreateTrackLayoutInput!
  ) {
    addTrackLayoutToTrack(trackId: $trackId, input: $input) {
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

const modalContentStyles = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const modalActionsStyles = css`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
`;

export function TrackLayoutEditModal({ trackId, onClose, onTrackLayoutCreated }: Props) {
  const [layoutName, setLayoutName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const [commitAddTrackLayout, isAddingTrackLayout] =
    useMutation<TrackLayoutEditModalAddTrackLayoutToTrackMutation>(AddTrackLayoutToTrackMutation);

  const isSaving = isAddingTrackLayout;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);

    if (!layoutName.trim()) {
      setActionError("Track layout name cannot be empty.");
      return;
    }

    const trimmedName = layoutName.trim();
    const tempId = `client:newTrackLayout:${Date.now()}`;

    commitAddTrackLayout({
      variables: { trackId, input: { name: trimmedName } },
      optimisticResponse: {
        addTrackLayoutToTrack: {
          track: {
            id: trackId,
            trackLayouts: [
              { id: tempId, name: trimmedName, __typename: "TrackLayout" },
            ],
            __typename: "Track",
          },
          trackLayout: { id: tempId, name: trimmedName, __typename: "TrackLayout" },
          __typename: "AddTrackLayoutToTrackPayload",
        },
      },
      onCompleted: (response) => {
        const createdLayout = response.addTrackLayoutToTrack?.trackLayout;
        if (createdLayout?.id && createdLayout.name) {
          onTrackLayoutCreated?.(createdLayout.id, createdLayout.name);
        }
        onClose();
      },
      onError: (error) => setActionError(error.message),
      updater: (store) => {
        const payload = store.getRootField("addTrackLayoutToTrack");
        const trackRecord = payload?.getLinkedRecord("track");
        if (!trackRecord) return;

        const existingTrack = store.get(trackId);
        if (!existingTrack) return;

        existingTrack.setLinkedRecords(
          trackRecord.getLinkedRecords("trackLayouts") ?? [],
          "trackLayouts"
        );
      },
    });
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Add Track Layout" maxWidth="500px">
      <div css={modalContentStyles}>
        {actionError ? <p css={{ color: "red" }}>{actionError}</p> : null}
        <form onSubmit={handleSubmit}>
          <label>
            Track Layout Name:
            <input
              type="text"
              css={inputStyles}
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              disabled={isSaving}
            />
          </label>
          <div css={modalActionsStyles}>
            <button
              type="button"
              css={inlineActionButtonStyles}
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button type="submit" css={primaryButtonStyles} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
