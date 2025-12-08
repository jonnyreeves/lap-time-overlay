import { useEffect, useState } from "react";
import { graphql, useMutation } from "react-relay";
import type { SessionOverviewCardUpdateTrackSessionMutation } from "../../__generated__/SessionOverviewCardUpdateTrackSessionMutation.graphql.js";
import { formatLapTimeSeconds } from "../../utils/lapTime.js";
import { Card } from "../Card.js";
import { IconButton } from "../IconButton.js";
import type { LapWithEvents } from "./LapsCard.js";
import {
  actionsRowStyles,
  infoTileStyles,
  inlineHelpStyles,
  inputStyles,
  notesStyles,
  primaryButtonStyles,
  secondaryButtonStyles,
  sessionCardLayoutStyles,
  sessionInfoGridStyles,
  textareaStyles,
} from "./sessionOverviewStyles.js";
import {
  conditionsOptions,
  formatOptions,
  SessionOverviewFormState,
  splitDateTime,
  validateSessionOverviewForm,
} from "./sessionOverviewForm.js";

type SessionDetails = {
  id: string;
  date: string;
  format: string;
  classification?: number | string | null;
  conditions?: string | null;
  notes?: string | null;
  circuit: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

type Props = {
  session: SessionDetails;
  laps: LapWithEvents[];
  circuits: readonly { id: string; name: string }[];
};

const UpdateTrackSessionMutation = graphql`
  mutation SessionOverviewCardUpdateTrackSessionMutation($input: UpdateTrackSessionInput!) {
    updateTrackSession(input: $input) {
      trackSession {
        id
        date
        format
        classification
        conditions
        notes
        circuit {
          id
          name
        }
        updatedAt
      }
    }
  }
`;

type FormState = SessionOverviewFormState;

function toFormState(session: SessionDetails): FormState {
  const { date, time } = splitDateTime(session.date);
  return {
    circuitId: session.circuit.id,
    format: session.format || "Practice",
    date,
    time,
    conditions: session.conditions ?? "Dry",
    classification:
      session.classification != null && session.classification !== ""
        ? String(session.classification)
        : "",
    notes: session.notes ?? "",
  };
}

export function SessionOverviewCard({ session, laps, circuits }: Props) {
  const formId = `session-overview-${session.id}`;
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState<FormState>(() => toFormState(session));
  const [actionError, setActionError] = useState<string | null>(null);
  const [commitUpdate, isSaving] =
    useMutation<SessionOverviewCardUpdateTrackSessionMutation>(UpdateTrackSessionMutation);

  useEffect(() => {
    if (isEditing) return;
    setFormValues(toFormState(session));
  }, [
    isEditing,
    session.circuit.id,
    session.classification,
    session.conditions,
    session.date,
    session.format,
    session.id,
    session.notes,
  ]);

  const { date: sessionDate, time: sessionTime } = splitDateTime(session.date);
  const conditionsLabel = (isEditing ? formValues.conditions : session.conditions) ?? "Not set";
  const classificationValue = session.classification;
  const classificationLabel =
    classificationValue != null && classificationValue !== ""
      ? `P${classificationValue}`
      : "Not classified";
  const lapsCount = laps.length;
  const fastestLap = laps.find((lap) => lap.isFastest);
  const fastestLapTime =
    fastestLap && Number.isFinite(fastestLap.time) && fastestLap.time > 0
      ? `${formatLapTimeSeconds(fastestLap.time)}s`
      : null;
  const notesText = (isEditing ? formValues.notes : session.notes)?.trim() ?? "";
  const conditionsIcon = /wet/i.test(conditionsLabel) ? "🌧️" : "☀️";
  const circuitOptions =
    circuits.length > 0 ? [...circuits] : [{ id: session.circuit.id, name: session.circuit.name }];
  const selectedCircuit = circuitOptions.find((option) => option.id === formValues.circuitId);

  function handleEdit() {
    setActionError(null);
    setFormValues(toFormState(session));
    setIsEditing(true);
  }

  function handleCancel() {
    setActionError(null);
    setFormValues(toFormState(session));
    setIsEditing(false);
  }

  function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!isEditing || isSaving) return;
    setActionError(null);

    const validation = validateSessionOverviewForm(formValues);
    if (validation.error) {
      setActionError(validation.error);
      return;
    }

    const payload = validation.payload;
    if (!payload) return;
    const nextCircuitName = selectedCircuit?.name ?? session.circuit.name;

    commitUpdate({
      variables: {
        input: {
          id: session.id,
          circuitId: payload.circuitId,
          format: payload.format,
          date: payload.date,
          classification: payload.classification,
          conditions: payload.conditions,
          notes: payload.notes,
        },
      },
      optimisticResponse: {
        updateTrackSession: {
          trackSession: {
            id: session.id,
            date: payload.date,
            format: payload.format,
            classification: payload.classification,
            conditions: payload.conditions,
            notes: payload.notes,
            circuit: {
              id: payload.circuitId,
              name: nextCircuitName,
              __typename: "Circuit",
            },
            updatedAt: new Date().toISOString(),
            __typename: "TrackSession",
          },
          __typename: "UpdateTrackSessionPayload",
        },
      },
      onCompleted: () => {
        setIsEditing(false);
        setActionError(null);
      },
      onError: (error) => {
        setActionError(error.message);
      },
    });
  }

  return (
    <Card
      title="Session Overview"
      rightHeaderContent={
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
      <form id={formId} onSubmit={handleSubmit} css={sessionCardLayoutStyles}>
        {actionError ? <p css={inlineHelpStyles}>{actionError}</p> : null}
        <div css={sessionInfoGridStyles}>
          <div css={infoTileStyles}>
            <p className="label">Circuit</p>
            {isEditing ? (
              <select
                css={inputStyles}
                value={formValues.circuitId}
                onChange={(e) =>
                  setFormValues((current) => ({ ...current, circuitId: e.target.value }))
                }
                disabled={isSaving}
              >
                {circuitOptions.map((circuit) => (
                  <option key={circuit.id} value={circuit.id}>
                    {circuit.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="value">{session.circuit.name}</p>
            )}
          </div>
          <div css={infoTileStyles}>
            <p className="label">Format</p>
            {isEditing ? (
              <select
                css={inputStyles}
                value={formValues.format}
                onChange={(e) =>
                  setFormValues((current) => ({ ...current, format: e.target.value }))
                }
                disabled={isSaving}
              >
                {formatOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <p className="value">{session.format || "—"}</p>
            )}
          </div>
          <div css={infoTileStyles}>
            <p className="label">Session date</p>
            {isEditing ? (
              <input
                type="date"
                css={inputStyles}
                value={formValues.date}
                onChange={(e) =>
                  setFormValues((current) => ({ ...current, date: e.target.value }))
                }
                disabled={isSaving}
              />
            ) : (
              <p className="value">{sessionDate || "—"}</p>
            )}
          </div>
          <div css={infoTileStyles}>
            <p className="label">Start time</p>
            {isEditing ? (
              <input
                type="time"
                css={inputStyles}
                value={formValues.time}
                onChange={(e) =>
                  setFormValues((current) => ({ ...current, time: e.target.value }))
                }
                disabled={isSaving}
              />
            ) : (
              <p className="value">{sessionTime || "—"}</p>
            )}
          </div>
          <div css={infoTileStyles}>
            <p className="label">Laps completed</p>
            <p className="value">{lapsCount}</p>
            {fastestLapTime ? <p className="note">Fastest lap {fastestLapTime}</p> : null}
          </div>
          <div css={infoTileStyles}>
            <p className="label">Conditions</p>
            {isEditing ? (
              <select
                css={inputStyles}
                value={formValues.conditions}
                onChange={(e) =>
                  setFormValues((current) => ({ ...current, conditions: e.target.value }))
                }
                disabled={isSaving}
              >
                {conditionsOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <p className="value">
                {conditionsIcon} {conditionsLabel}
              </p>
            )}
          </div>
          <div css={infoTileStyles}>
            <p className="label">Classification</p>
            {isEditing ? (
              <input
                type="number"
                min={1}
                css={inputStyles}
                value={formValues.classification}
                onChange={(e) =>
                  setFormValues((current) => ({ ...current, classification: e.target.value }))
                }
                disabled={isSaving}
              />
            ) : (
              <p className="value">{classificationLabel}</p>
            )}
          </div>
        </div>

        <div css={notesStyles}>
          <p className="label">Notes</p>
          {isEditing ? (
            <textarea
              css={textareaStyles}
              value={formValues.notes}
              onChange={(e) =>
                setFormValues((current) => ({ ...current, notes: e.target.value }))
              }
              disabled={isSaving}
              placeholder="Add notes about this session"
            />
          ) : (
            <p className={notesText ? "body" : "body empty"}>
              {notesText || "No notes recorded for this session."}
            </p>
          )}
        </div>
      </form>
    </Card>
  );
}
