import { useState } from "react";
import { graphql, useMutation } from "react-relay";
import { css } from "@emotion/react";
import { Modal } from "./Modal.tsx";
import { inputStyles, primaryButtonStyles } from "./session/sessionOverviewStyles.ts";
import { inlineActionButtonStyles } from "./inlineActionButtons.ts";
import type { TrackLayoutEditModalAddTrackLayoutToCircuitMutation } from "src/web/client/__generated__/TrackLayoutEditModalAddTrackLayoutToCircuitMutation.graphql.ts";

type Props = {
  circuitId: string;
  onClose: () => void;
  onTrackLayoutCreated?: (trackLayoutId: string, trackLayoutName: string) => void;
};

const AddTrackLayoutToCircuitMutation = graphql`
  mutation TrackLayoutEditModalAddTrackLayoutToCircuitMutation(
    $circuitId: ID!
    $input: CreateTrackLayoutInput!
  ) {
    addTrackLayoutToCircuit(circuitId: $circuitId, input: $input) {
      circuit {
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

export function TrackLayoutEditModal({ circuitId, onClose, onTrackLayoutCreated }: Props) {
  const [layoutName, setLayoutName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const [commitAddTrackLayout, isAddingTrackLayout] =
    useMutation<TrackLayoutEditModalAddTrackLayoutToCircuitMutation>(AddTrackLayoutToCircuitMutation);

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
      variables: { circuitId, input: { name: trimmedName } },
      optimisticResponse: {
        addTrackLayoutToCircuit: {
          circuit: {
            id: circuitId,
            trackLayouts: [
              { id: tempId, name: trimmedName, __typename: "TrackLayout" },
            ],
            __typename: "Circuit",
          },
          trackLayout: { id: tempId, name: trimmedName, __typename: "TrackLayout" },
          __typename: "AddTrackLayoutToCircuitPayload",
        },
      },
      onCompleted: (response) => {
        const createdLayout = response.addTrackLayoutToCircuit?.trackLayout;
        if (createdLayout?.id && createdLayout.name) {
          onTrackLayoutCreated?.(createdLayout.id, createdLayout.name);
        }
        onClose();
      },
      onError: (error) => setActionError(error.message),
      updater: (store) => {
        const payload = store.getRootField("addTrackLayoutToCircuit");
        const circuitRecord = payload?.getLinkedRecord("circuit");
        if (!circuitRecord) return;

        const existingCircuit = store.get(circuitId);
        if (!existingCircuit) return;

        existingCircuit.setLinkedRecords(
          circuitRecord.getLinkedRecords("trackLayouts") ?? [],
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
