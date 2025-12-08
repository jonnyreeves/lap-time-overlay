import { useEffect, useState } from "react";
import { graphql, useMutation } from "react-relay";
import type { LapsCardUpdateTrackSessionLapsMutation } from "../../__generated__/LapsCardUpdateTrackSessionLapsMutation.graphql.js";
import { useLapRows, type LapInputPayload } from "../../hooks/useLapRows.js";
import { formatLapTimeSeconds } from "../../utils/lapTime.js";
import { Card } from "../Card.js";
import { IconButton } from "../IconButton.js";
import { LapInputsCard } from "../LapInputsCard.js";
import {
  chevronOpenStyles,
  chevronStyles,
  errorStyles,
  fastestLapDotStyles,
  fastestLapPillStyles,
  inputFieldStyles,
  lapActionButtonStyles,
  lapDeltaStyles,
  lapDetailsStyles,
  lapEventOffsetStyles,
  lapEventRowStyles,
  lapEventTypeStyles,
  lapEventValueStyles,
  lapEventsEmptyStyles,
  lapEventsListStyles,
  lapEventsPanelStyles,
  lapEventsPillStyles,
  lapHeaderStyles,
  lapRowStyles,
  lapTimeRowStyles,
  lapTitleRowStyles,
  lapToggleStyles,
  lapsListStyles,
  lapHelperTextStyles,
} from "./lapsStyles.js";
import {
  actionsRowStyles,
  primaryButtonStyles,
  secondaryButtonStyles,
} from "./sessionOverviewStyles.js";

type LapEvent = {
  id: string;
  offset: number;
  event: string;
  value: string;
};

export type LapWithEvents = {
  id: string;
  lapNumber: number;
  time: number;
  start: number;
  isFastest: boolean;
  deltaToFastest: number | null;
  lapEvents: LapEvent[];
};

type Props = {
  sessionId: string;
  laps: LapWithEvents[];
  onJumpToStart: (lapStart: number) => void;
  jumpEnabled: boolean;
  jumpTitle: string;
  statusMessages?: string[];
  onRefresh?: () => void;
};

const UpdateTrackSessionLapsMutation = graphql`
  mutation LapsCardUpdateTrackSessionLapsMutation($input: UpdateTrackSessionLapsInput!) {
    updateTrackSessionLaps(input: $input) {
      trackSession {
        id
        updatedAt
        laps(first: 50) {
          id
          lapNumber
          time
          lapEvents(first: 50) {
            id
            offset
            event
            value
          }
        }
      }
    }
  }
`;

function lapsToLapInputs(laps: LapWithEvents[]): LapInputPayload[] {
  return laps.map((lap) => ({
    lapNumber: lap.lapNumber,
    time: lap.time,
    lapEvents:
      lap.lapEvents?.map((event) => ({
        offset: event.offset,
        event: event.event,
        value: event.value,
      })) ?? [],
  }));
}

export function LapsCard({
  sessionId,
  laps,
  onJumpToStart,
  jumpEnabled,
  jumpTitle,
  statusMessages = [],
  onRefresh,
}: Props) {
  const [openLapIds, setOpenLapIds] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const {
    laps: lapRows,
    addLapRow,
    addLapEventRow,
    updateLapRow,
    updateLapEventRow,
    removeLapRow,
    removeLapEventRow,
    buildLapPayload,
    setLapRowsFromImport,
  } = useLapRows();
  const [commitUpdate, isSaving] =
    useMutation<LapsCardUpdateTrackSessionLapsMutation>(UpdateTrackSessionLapsMutation);

  useEffect(() => {
    if (isEditing) return;
    setLapRowsFromImport(lapsToLapInputs(laps));
  }, [isEditing, laps, setLapRowsFromImport]);

  const toggleLap = (lapId: string) => {
    setOpenLapIds((current) => {
      if (current.has(lapId)) {
        const next = new Set(current);
        next.delete(lapId);
        return next;
      }
      return new Set([lapId]);
    });
  };

  const formatOffset = (offset: number) => {
    if (!Number.isFinite(offset) || offset <= 0) return "0.000";
    return formatLapTimeSeconds(offset);
  };

  function handleEdit() {
    setActionError(null);
    setLapRowsFromImport(lapsToLapInputs(laps));
    setIsEditing(true);
  }

  function handleCancel() {
    setActionError(null);
    setLapRowsFromImport(lapsToLapInputs(laps));
    setIsEditing(false);
  }

  function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!isEditing || isSaving) return;
    setActionError(null);

    let payload: LapInputPayload[];
    try {
      payload = buildLapPayload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please fix your laps.";
      setActionError(message);
      return;
    }

    commitUpdate({
      variables: { input: { id: sessionId, laps: payload } },
      onCompleted: () => {
        setIsEditing(false);
        setActionError(null);
        onRefresh?.();
      },
      onError: (error) => setActionError(error.message),
    });
  }

  return (
    <Card
      title="Laps"
      rightComponent={
        <div css={actionsRowStyles}>
          {isEditing ? (
            <>
              <button
                type="button"
                css={secondaryButtonStyles}
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                form={`laps-form-${sessionId}`}
                css={primaryButtonStyles}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <IconButton
              type="button"
              css={secondaryButtonStyles}
              onClick={handleEdit}
              icon="✏️"
            >
              Edit
            </IconButton>
          )}
        </div>
      }
    >
      {isEditing ? (
        <form id={`laps-form-${sessionId}`} onSubmit={handleSubmit}>
          {actionError ? <p css={errorStyles}>{actionError}</p> : null}
          <LapInputsCard
            laps={lapRows}
            disabled={isSaving}
            onAddLap={addLapRow}
            onChangeLap={updateLapRow}
            onRemoveLap={removeLapRow}
            onAddLapEvent={addLapEventRow}
            onChangeLapEvent={updateLapEventRow}
            onRemoveLapEvent={removeLapEventRow}
            fieldStyles={inputFieldStyles}
            renderCard={false}
          />
        </form>
      ) : (
        <>
          {statusMessages.map((message, idx) => (
            <p key={`${message}-${idx}`} css={lapHelperTextStyles}>
              <span>ℹ️</span>
              <span>{message}</span>
            </p>
          ))}
          <div css={lapsListStyles}>
            {laps.length === 0 ? (
              <p>No laps recorded for this session.</p>
            ) : (
              laps.map((lap) => {
                const isOpen = openLapIds.has(lap.id);
                const deltaToFastest =
                  typeof lap.deltaToFastest === "number" ? lap.deltaToFastest : null;
                const lapEvents = lap.lapEvents ?? [];
                return (
                  <div key={lap.id} css={lapRowStyles}>
                    <div css={lapHeaderStyles}>
                      <button
                        type="button"
                        css={lapToggleStyles}
                        onClick={() => toggleLap(lap.id)}
                        aria-expanded={isOpen}
                        aria-controls={`lap-${lap.id}-events`}
                      >
                        <span css={[chevronStyles, isOpen && chevronOpenStyles]} aria-hidden>
                          &gt;
                        </span>
                        <div css={lapDetailsStyles}>
                          <div css={lapTitleRowStyles}>Lap {lap.lapNumber}</div>
                          <div css={lapTimeRowStyles}>
                            <span>{formatLapTimeSeconds(lap.time)}s</span>
                            {deltaToFastest != null ? (
                              <span css={lapDeltaStyles}>[+{deltaToFastest.toFixed(3)}s]</span>
                            ) : null}
                            {lap.isFastest ? (
                              <span css={fastestLapPillStyles}>
                                <span css={fastestLapDotStyles} aria-hidden />
                                Fastest
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        css={lapActionButtonStyles}
                        disabled={!jumpEnabled}
                        onClick={() => onJumpToStart(lap.start)}
                        title={jumpTitle}
                      >
                        ▶ Goto
                      </button>
                      <span css={lapEventsPillStyles} aria-label={`Lap ${lap.lapNumber} events`}>
                        {lapEvents.length}
                      </span>
                    </div>
                    {isOpen && (
                      <div css={lapEventsPanelStyles} id={`lap-${lap.id}-events`}>
                        {lapEvents.length === 0 ? (
                          <p css={lapEventsEmptyStyles}>No lap events logged.</p>
                        ) : (
                          <div css={lapEventsListStyles}>
                            {lapEvents.map((event) => (
                              <div key={event.id} css={lapEventRowStyles}>
                                <span css={lapEventOffsetStyles}>+{formatOffset(event.offset)}s</span>
                                <span css={lapEventTypeStyles}>{event.event}</span>
                                <span css={lapEventValueStyles}>{event.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </Card>
  );
}
