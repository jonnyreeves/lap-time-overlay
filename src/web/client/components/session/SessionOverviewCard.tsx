import { css } from "@emotion/react";
import { useEffect, useState } from "react";
import { graphql, useMutation } from "react-relay";
import { Link } from "react-router-dom";
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
  sessionCardLayoutStyles,
  sessionInfoGridStyles,
  textareaStyles,
} from "./sessionOverviewStyles.js";
import { inlineActionButtonStyles } from "../inlineActionButtons.ts";
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
  fastestLap?: number | null;
  conditions?: string | null;
  notes?: string | null;
  track: { id: string; name: string };
  kart?: { id: string; name: string } | null;
  trackLayout: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  session: SessionDetails;
  laps: LapWithEvents[];
  tracks: readonly {
    id: string;
    name: string;
    karts: readonly { id: string; name: string }[];
    trackLayouts: readonly { id: string; name: string }[];
  }[];
};

const trackLinkStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: inherit;
  text-decoration: none;

  &:hover {
    color: #4338ca;
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid #6366f1;
    outline-offset: 2px;
    border-radius: 6px;
  }
`;

const UpdateTrackSessionMutation = graphql`
  mutation SessionOverviewCardUpdateTrackSessionMutation($input: UpdateTrackSessionInput!) {
    updateTrackSession(input: $input) {
      trackSession {
        id
        date
        format
        classification
        fastestLap
        conditions
        notes
        track {
          id
          name
        }
        kart {
          id
          name
        }
        trackLayout {
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
    trackId: session.track.id,
    trackLayoutId: session.trackLayout?.id ?? "",
    kartId: session.kart?.id ?? "",
    format: session.format || "Practice",
    date,
    time,
    conditions: session.conditions ?? "Dry",
    classification:
      session.classification != null && session.classification !== ""
        ? String(session.classification)
        : "",
    fastestLap:
      session.fastestLap != null && session.fastestLap > 0
        ? formatLapTimeSeconds(session.fastestLap)
        : "",
    notes: session.notes ?? "",
  };
}

export function SessionOverviewCard({ session, laps, tracks }: Props) {
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
    session.track.id,
    session.classification,
    session.fastestLap,
    session.conditions,
    session.date,
    session.format,
    session.id,
    session.notes,
    session.trackLayout?.id,
    session.kart?.id,
  ]);

  const { date: sessionDate, time: sessionTime } = splitDateTime(session.date);
  const conditionsLabel = (isEditing ? formValues.conditions : session.conditions) ?? "Not set";
  const classificationValue = session.classification;
  const classificationLabel =
    classificationValue != null && classificationValue !== ""
      ? `P${classificationValue}`
      : "Not classified";
  const sessionFastestLapValue = session.fastestLap;
  const sessionFastestLapLabel =
    sessionFastestLapValue != null && sessionFastestLapValue > 0
      ? `${formatLapTimeSeconds(sessionFastestLapValue)}s`
      : "Not set";
  const lapsCount = laps.length;
  const fastestLap = laps.find((lap) => lap.isFastest);
  const fastestLapTime =
    fastestLap && Number.isFinite(fastestLap.time) && fastestLap.time > 0
      ? `${formatLapTimeSeconds(fastestLap.time)}s`
      : null;
  const kartName = session.kart?.name ?? "Not set";
  const trackLayoutName = session.trackLayout?.name ?? "Not set";
  const notesText = (isEditing ? formValues.notes : session.notes)?.trim() ?? "";
  const conditionsIcon = /wet/i.test(conditionsLabel) ? "🌧️" : "☀️";
  const trackOptions =
    tracks.length > 0
      ? [...tracks]
      : [
          {
            id: session.track.id,
            name: session.track.name,
            trackLayouts: session.trackLayout ? [session.trackLayout] : [],
            karts: session.kart ? [session.kart] : [],
          },
        ];
  const selectedTrack = trackOptions.find((option) => option.id === formValues.trackId);
  const selectedTrackLayouts =
    selectedTrack?.trackLayouts ??
    (session.trackLayout ? [session.trackLayout] : []);
  const selectedTrackKarts = selectedTrack?.karts ?? (session.kart ? [session.kart] : []);

  function handleEdit() {
    setActionError(null);
    setFormValues(toFormState(session));
    setIsEditing(true);
  }

  useEffect(() => {
    if (!isEditing) return;
    const availableLayouts = selectedTrackLayouts;
    if (availableLayouts.length === 0) return;
    if (!availableLayouts.some((layout) => layout.id === formValues.trackLayoutId)) {
      setFormValues((current) => ({ ...current, trackLayoutId: availableLayouts[0].id }));
    }
  }, [isEditing, selectedTrackLayouts, formValues.trackLayoutId]);

  useEffect(() => {
    if (!isEditing) return;
    const availableKarts = selectedTrackKarts;
    if (availableKarts.length === 0) {
      if (formValues.kartId !== "") {
        setFormValues((current) => ({ ...current, kartId: "" }));
      }
      return;
    }
    if (!availableKarts.some((kart) => kart.id === formValues.kartId)) {
      setFormValues((current) => ({ ...current, kartId: availableKarts[0].id }));
    }
  }, [isEditing, selectedTrackKarts, formValues.kartId]);

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
    const nextTrackName = selectedTrack?.name ?? session.track.name;
    const nextLayout =
      selectedTrackLayouts.find((layout) => layout.id === payload.trackLayoutId) ??
      (session.trackLayout ? { id: session.trackLayout.id, name: session.trackLayout.name } : null);
    const nextKart =
      selectedTrackKarts.find((kart) => kart.id === payload.kartId) ??
      (session.kart ? { id: session.kart.id, name: session.kart.name } : null);

    commitUpdate({
      variables: {
        input: {
          id: session.id,
          trackId: payload.trackId,
          trackLayoutId: payload.trackLayoutId,
          kartId: payload.kartId,
          format: payload.format,
          date: payload.date,
          classification: payload.classification,
          fastestLap: payload.fastestLap,
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
            track: {
              id: payload.trackId,
              name: nextTrackName,
              __typename: "Track",
            },
            kart: nextKart
              ? { id: nextKart.id, name: nextKart.name, __typename: "Kart" }
              : null,
            trackLayout: nextLayout
              ? { id: nextLayout.id, name: nextLayout.name, __typename: "TrackLayout" }
              : null,
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
                css={inlineActionButtonStyles}
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
      <form id={formId} onSubmit={handleSubmit} css={sessionCardLayoutStyles}>
        {actionError ? <p css={inlineHelpStyles}>{actionError}</p> : null}
        <div css={sessionInfoGridStyles}>
          <div css={infoTileStyles}>
            <p className="label">Track</p>
            {isEditing ? (
              <select
                css={inputStyles}
                value={formValues.trackId}
                onChange={(e) => {
                  const nextTrackId = e.target.value;
                  const nextTrack = trackOptions.find((track) => track.id === nextTrackId);
                  const nextKartId = nextTrack?.karts[0]?.id ?? "";
                  setFormValues((current) => ({
                    ...current,
                    trackId: nextTrackId,
                    trackLayoutId: "",
                    kartId: nextKartId,
                  }));
                }}
                disabled={isSaving}
              >
                {trackOptions.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
            ) : (
              <Link
                to={`/tracks/view/${session.track.id}`}
                className="value"
                css={trackLinkStyles}
              >
                {session.track.name}
              </Link>
            )}
          </div>
          <div css={infoTileStyles}>
            <p className="label">Track layout</p>
            {isEditing ? (
              <select
                css={inputStyles}
                value={formValues.trackLayoutId}
                onChange={(e) =>
                  setFormValues((current) => ({ ...current, trackLayoutId: e.target.value }))
                }
                disabled={isSaving || selectedTrackLayouts.length === 0}
              >
                {selectedTrackLayouts.map((layout) => (
                  <option key={layout.id} value={layout.id}>
                    {layout.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="value">{trackLayoutName}</p>
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
            <p className="label">Kart</p>
            {isEditing ? (
              <select
                css={inputStyles}
                value={formValues.kartId}
                onChange={(e) =>
                  setFormValues((current) => ({ ...current, kartId: e.target.value }))
                }
                disabled={isSaving || selectedTrackKarts.length === 0}
              >
                {selectedTrackKarts.length === 0 ? (
                  <option value="">No karts available</option>
                ) : null}
                {selectedTrackKarts.map((kart) => (
                  <option key={kart.id} value={kart.id}>
                    {kart.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="value">{kartName}</p>
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
            {fastestLapTime ? <p className="note">Fastest recorded lap {fastestLapTime}</p> : null}
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
          <div css={infoTileStyles}>
            <p className="label">Session fastest lap</p>
            {isEditing ? (
              <input
                type="text"
                css={inputStyles}
                value={formValues.fastestLap}
                onChange={(e) =>
                  setFormValues((current) => ({ ...current, fastestLap: e.target.value }))
                }
                placeholder="e.g. 1:03.076"
                disabled={isSaving}
              />
            ) : (
              <p className="value">{sessionFastestLapLabel}</p>
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
