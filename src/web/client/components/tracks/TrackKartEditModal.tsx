import { useState, useEffect } from "react";
import { graphql, useMutation } from "react-relay";
import { css } from "@emotion/react";
import { Modal } from "../Modal.tsx";
import { inputStyles, primaryButtonStyles } from "../session/sessionOverviewStyles.ts";
import { inlineActionButtonStyles } from "../inlineActionButtons.ts";
import type { TrackKartEditModalCreateKartMutation } from "src/web/client/__generated__/TrackKartEditModalCreateKartMutation.graphql.ts";
import type { TrackKartEditModalUpdateKartMutation } from "src/web/client/__generated__/TrackKartEditModalUpdateKartMutation.graphql.ts";

type Props = {
  trackId: string;
  kart?: { id: string; name: string } | null;
  onClose: () => void;
  onKartCreated?: (kartId: string, kartName: string) => void;
};

const CreateKartMutation = graphql`
  mutation TrackKartEditModalCreateKartMutation($input: CreateKartInput!) {
    createKart(input: $input) {
      kart {
        id
        name
      }
    }
  }
`;

const UpdateKartMutation = graphql`
  mutation TrackKartEditModalUpdateKartMutation($input: UpdateKartInput!) {
    updateKart(input: $input) {
      kart {
        id
        name
      }
    }
  }
`;

const modalContentStyles = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const modalActionsStyles = css`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

export function TrackKartEditModal({ trackId: _trackId, kart, onClose, onKartCreated }: Props) {
  const [kartName, setKartName] = useState(kart?.name || "");
  const [actionError, setActionError] = useState<string | null>(null);

  const [commitCreateKart, isCreatingKart] =
    useMutation<TrackKartEditModalCreateKartMutation>(CreateKartMutation);
  const [commitUpdateKart, isUpdatingKart] =
    useMutation<TrackKartEditModalUpdateKartMutation>(UpdateKartMutation);

  const isSaving = isCreatingKart || isUpdatingKart;

  useEffect(() => {
    if (kart) {
      setKartName(kart.name);
    } else {
      setKartName("");
    }
  }, [kart]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);

    if (!kartName.trim()) {
      setActionError("Kart name cannot be empty.");
      return;
    }

    if (kart) {
      // Update existing kart
      commitUpdateKart({
        variables: {
          input: { id: kart.id, name: kartName.trim() },
        },
        optimisticResponse: {
          updateKart: {
            kart: { id: kart.id, name: kartName.trim(), __typename: "Kart" },
            __typename: "UpdateKartPayload",
          },
        },
        onCompleted: () => {
  // TODO: Add kart to track if it's not already
  onClose();
        },
        onError: (error) => {
          setActionError(error.message);
        },
      });
    } else {
      // Create new kart
      commitCreateKart({
        variables: {
          input: { name: kartName.trim() },
        },
        optimisticResponse: {
          createKart: {
            kart: {
              id: "client:new-kart", // Temporary client ID
              name: kartName.trim(),
              __typename: "Kart",
            },
            __typename: "CreateKartPayload",
          },
        },
        onCompleted: (response) => {
          if (response.createKart?.kart) {
            // Now add this new kart to the current track
            onKartCreated?.(response.createKart.kart.id, kartName.trim());
          }
          onClose();
        },
        onError: (error) => {
          setActionError(error.message);
        },
      });
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={kart ? "Edit Kart" : "Add New Kart"}>
      <div css={modalContentStyles}>
        {actionError ? <p css={{ color: "red" }}>{actionError}</p> : null}
        <form onSubmit={handleSubmit}>
          <label>
            Kart Name:
            <input
              type="text"
              css={inputStyles}
              value={kartName}
              onChange={(e) => setKartName(e.target.value)}
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
