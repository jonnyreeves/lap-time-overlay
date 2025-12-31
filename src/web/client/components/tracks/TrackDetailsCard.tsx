import { useEffect, useState } from "react";
import { css } from "@emotion/react";
import { graphql, useFragment, useMutation } from "react-relay";
import type { TrackDetailsCardUpdateTrackMutation } from "../../__generated__/TrackDetailsCardUpdateTrackMutation.graphql.js";
import type { TrackDetailsCard_track$key } from "../../__generated__/TrackDetailsCard_track.graphql.js";
import { Card } from "../Card.js";
import { IconButton } from "../IconButton.js";
import { inlineActionButtonStyles } from "../inlineActionButtons.ts";
import { actionsRowStyles, inlineHelpStyles, inputStyles, infoTileStyles, primaryButtonStyles } from "../session/sessionOverviewStyles.ts";

const TrackDetailsFragment = graphql`
  fragment TrackDetailsCard_track on Track {
    id
    name
    postcode
  }
`;

const UpdateTrackMutation = graphql`
  mutation TrackDetailsCardUpdateTrackMutation($input: UpdateTrackInput!) {
    updateTrack(input: $input) {
      track {
        id
        name
        postcode
      }
    }
  }
`;

const detailsGridStyles = css`
  display: grid;
  gap: 12px;
`;

type Props = {
  track: TrackDetailsCard_track$key;
};

export function TrackDetailsCard({ track: trackKey }: Props) {
  const track = useFragment(TrackDetailsFragment, trackKey);
  const [isEditing, setIsEditing] = useState(false);
  const [postcode, setPostcode] = useState(track.postcode ?? "");
  const [actionError, setActionError] = useState<string | null>(null);
  const [commitUpdate, isUpdating] =
    useMutation<TrackDetailsCardUpdateTrackMutation>(UpdateTrackMutation);

  useEffect(() => {
    if (!isEditing) {
      setPostcode(track.postcode ?? "");
    }
  }, [isEditing, track.postcode]);

  const isSaving = isUpdating;
  const postcodeLabel = track.postcode?.trim() ? track.postcode.trim() : "Not set";

  function handleEdit() {
    setActionError(null);
    setIsEditing(true);
  }

  function handleCancel() {
    setActionError(null);
    setIsEditing(false);
    setPostcode(track.postcode ?? "");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setActionError(null);

    const trimmedPostcode = postcode.trim();
    const normalizedPostcode = trimmedPostcode ? trimmedPostcode : null;

    commitUpdate({
      variables: {
        input: {
          id: track.id,
          postcode: normalizedPostcode,
        },
      },
      optimisticResponse: {
        updateTrack: {
          track: {
            id: track.id,
            name: track.name,
            postcode: normalizedPostcode,
            __typename: "Track",
          },
          __typename: "UpdateTrackPayload",
        },
      },
      onCompleted: () => {
        setIsEditing(false);
      },
      onError: (error) => {
        setActionError(error.message);
      },
    });
  }

  return (
    <Card
      title="Track Details"
      rightHeaderContent={
        <div css={actionsRowStyles}>
          {isEditing ? (
            <>
              <button type="button" css={inlineActionButtonStyles} onClick={handleCancel} disabled={isSaving}>
                Cancel
              </button>
              <button type="submit" form="track-details-form" css={primaryButtonStyles} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <IconButton
              type="button"
              css={inlineActionButtonStyles}
              onClick={handleEdit}
              icon="✏️"
            >
              Edit
            </IconButton>
          )}
        </div>
      }
    >
      {actionError ? <p css={inlineHelpStyles}>{actionError}</p> : null}
      <form id="track-details-form" onSubmit={handleSubmit} css={detailsGridStyles}>
        <div css={infoTileStyles}>
          <p className="label">Postcode</p>
          {isEditing ? (
            <input
              type="text"
              css={inputStyles}
              value={postcode}
              onChange={(event) => setPostcode(event.target.value)}
              placeholder="e.g. KT14 6GB"
              disabled={isSaving}
            />
          ) : (
            <p className="value">{postcodeLabel}</p>
          )}
        </div>
      </form>
    </Card>
  );
}
