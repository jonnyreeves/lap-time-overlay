import { css } from "@emotion/react";
import { useEffect, useState } from "react"; // Import hooks
import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
import { ConnectionHandler } from "relay-runtime";
import { useNavigate, useOutletContext } from "react-router-dom";
import { type create_tsxTracksQuery } from "../../__generated__/create_tsxTracksQuery.graphql.js";
import { createTrackSessionMutation } from "../../__generated__/createTrackSessionMutation.graphql.js";
import { Card } from "../../components/Card.js";
import { CreateTrackModal } from "../../components/CreateTrackModal.js";
import { IconButton } from "../../components/IconButton.js";
import { ImportSessionModal } from "../../components/ImportSessionModal.js";
import { LapInputsCard } from "../../components/LapInputsCard.js";
import { type SessionImportSelection } from "../../utils/sessionImportTypes.js";
import { useLapRows, type LapInputPayload } from "../../hooks/useLapRows.js";
import { prependCreatedSessionToRecentSessions, prependTrackForCreatedSession } from "./createUpdater.js";

const formLayoutStyles = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
`;

const inputFieldStyles = css`
  margin-bottom: 15px;

  label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #333;
  }

  input[type="date"],
  input[type="time"],
  input[type="text"],
  input[type="number"],
  select,
  textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #e2e8f4;
    border-radius: 8px;
    font-size: 1rem;
    color: #0b1021;
    background-color: #f7faff;
    transition: border-color 0.2s ease-in-out;

    &:focus {
      border-color: #6366f1; /* Example focus color */
      outline: none;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }
  }

  textarea {
    min-height: 96px;
    resize: vertical;
  }
`;

const twoColumnRowStyles = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const AddTrackButtonStyles = css`
  margin-left: 10px;
  padding: 8px 12px;
  background-color: #e2e8f4;
  color: #0b1021;
  border: 1px solid #d7deed;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: #cbd5e1;
    border-color: #cbd5e1;
  }

  &:disabled {
    background-color: #e2e8f4;
    color: #94a3b8;
    border-color: #d7deed;
    cursor: not-allowed;
  }
`;

const formActionsStyles = css`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const primaryButtonStyles = css`
  padding: 10px 18px;
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: #4f46e5;
  }

  &:disabled {
    background-color: #a5b4fc;
    cursor: not-allowed;
  }
`;

const secondaryButtonStyles = css`
  padding: 10px 18px;
  background-color: #e2e8f4;
  color: #0b1021;
  border: 1px solid #d7deed;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;

  &:hover {
    background-color: #cbd5e1;
    border-color: #cbd5e1;
  }

  &:disabled {
    background-color: #e2e8f4;
    color: #94a3b8;
    cursor: not-allowed;
  }
`;

const rightColumnStyles = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CreateSessionRouteTracksQuery = graphql`
  query create_tsxTracksQuery {
    tracks: circuits {
      id
      name
      karts {
        id
        name
      }
      trackLayouts {
        id
        name
      }
    }
  }
`;

const CreateTrackSessionMutation = graphql`
  mutation createTrackSessionMutation(
    $input: CreateTrackSessionInput!
    $connections: [ID!]!
    $trackConnections: [ID!]!
  ) {
    createTrackSession(input: $input) {
      trackSession
        @prependNode(
          connections: $connections
          edgeTypeName: "TrackSessionEdge"
        ) {
        id
        date
        format
        classification
        conditions
        trackLayout {
          id
          name
        }
        kart {
          id
          name
        }
        track: circuit
          @prependNode(
            connections: $trackConnections
            edgeTypeName: "CircuitEdge"
          ) {
          id
          name
          heroImage
          personalBest
          personalBestDry
          personalBestWet
        }
        notes
        laps(first: 1) {
          personalBest
          id
        }
      }
    }
  }
`;

type OutletContext = {
  viewer: { id: string; __id?: string };
};

export default function CreateSessionRoute() {
  const { viewer } = useOutletContext<OutletContext>();
  const [showCreateTrackModal, setShowCreateTrackModal] = useState(false);
  const [showImportSessionModal, setShowImportSessionModal] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0); // Key to force refetch
  const [sessionFormat, setSessionFormat] = useState("Practice");
  const [conditions, setConditions] = useState("Dry");
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [trackId, setTrackId] = useState("");
  const [kartId, setKartId] = useState("");
  const [trackLayoutId, setTrackLayoutId] = useState("");
  const [classification, setClassification] = useState("");
  const [notes, setNotes] = useState("");

  const navigate = useNavigate();
  const {
    laps,
    addLapRow,
    addLapEventRow,
    updateLapRow,
    updateLapEventRow,
    removeLapRow,
    removeLapEventRow,
    buildLapPayload,
    setLapRowsFromImport,
  } = useLapRows();

  const [commitMutation, isInFlight] = useMutation<createTrackSessionMutation>(
    CreateTrackSessionMutation,
  );
  const isCreateDisabled =
    isInFlight ||
    !date ||
    !sessionFormat ||
    !trackId ||
    !kartId ||
    !trackLayoutId ||
    classification.trim() === "";
  const viewerConnectionId = ConnectionHandler.getConnectionID(
    viewer.__id ?? viewer.id,
    "RecentSessionsCard_recentTrackSessions"
  );
  const viewerTrackConnectionId = ConnectionHandler.getConnectionID(
    viewer.__id ?? viewer.id,
    "RecentTracksCard_recentTracks"
  );

  const data = useLazyLoadQuery<create_tsxTracksQuery>(
    CreateSessionRouteTracksQuery,
    {},
    {
      fetchPolicy: "store-and-network",
      UNSTABLE_renderPolicy: "full",
      // Force refetch by changing the key
      fetchKey: refetchKey,
    }
  );

  const selectedTrack = data.tracks.find((track) => track.id === trackId);
  const selectedTrackKarts = selectedTrack?.karts ?? [];
  const selectedTrackLayouts = selectedTrack?.trackLayouts ?? [];

  useEffect(() => {
    if (data.tracks.length === 0) {
      if (trackId !== "") {
        setTrackId("");
      }
      if (kartId !== "") {
        setKartId("");
      }
      if (trackLayoutId !== "") {
        setTrackLayoutId("");
      }
      return;
    }

    const selected = data.tracks.find((track) => track.id === trackId) ?? data.tracks[0];
    if (selected.id !== trackId) {
      setTrackId(selected.id);
    }

    const availableKartIds = selected.karts.map((kart) => kart.id);
    if (availableKartIds.length === 0) {
      if (kartId !== "") {
        setKartId("");
      }
      return;
    }

    if (!availableKartIds.includes(kartId)) {
      setKartId(availableKartIds[0]);
    }
    const availableLayoutIds = selected.trackLayouts.map((layout) => layout.id);
    if (availableLayoutIds.length === 0) {
      if (trackLayoutId !== "") {
        setTrackLayoutId("");
      }
      return;
    }
    if (!availableLayoutIds.includes(trackLayoutId)) {
      setTrackLayoutId(availableLayoutIds[0]);
    }
  }, [trackId, kartId, trackLayoutId, data.tracks]);

  const handleTrackCreated = () => {
    // Increment the key to force useLazyLoadQuery to refetch
    setRefetchKey((prevKey) => prevKey + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!trackId) {
      alert("Please select a track.");
      return;
    }
    if (!kartId) {
      alert("Please select a kart.");
      return;
    }
    if (!trackLayoutId) {
      alert("Please select a track layout.");
      return;
    }

    const parsedClassification = Number.parseInt(classification, 10);
    if (!Number.isInteger(parsedClassification) || parsedClassification < 1) {
      alert("Please enter a classification of 1 or higher.");
      return;
    }

    let lapInput: LapInputPayload[] = [];
    try {
      lapInput = buildLapPayload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please fix your lap entries.";
      alert(message);
      return;
    }

    commitMutation({
      variables: {
        input: {
          date: time ? `${date}T${time}` : date,
          format: sessionFormat,
          classification: parsedClassification,
          trackId,
          trackLayoutId,
          kartId,
          conditions,
          notes: notes.trim() ? notes.trim() : null,
          ...(lapInput.length ? { laps: lapInput } : {}),
        },
        connections: [viewerConnectionId],
        trackConnections: [viewerTrackConnectionId],
      },
      updater: (store) => {
        const viewerId = viewer.__id ?? viewer.id;
        prependCreatedSessionToRecentSessions(store, viewerId);
        prependTrackForCreatedSession(store, viewerId);
      },
      onCompleted: (response) => {
        const newSessionId = response.createTrackSession?.trackSession?.id;
        if (newSessionId) {
          navigate(`/session/${newSessionId}`);
        } else {
          alert("Failed to create session.");
        }
      },
      onError: (error) => {
        alert(`Error creating session: ${error.message}`);
      },
    });
  };

  const handleTrackChange = (newTrackId: string) => {
    setTrackId(newTrackId);
    const track = data.tracks.find((t) => t.id === newTrackId);
    if (track?.karts?.length) {
      setKartId(track.karts[0].id);
    } else {
      setKartId("");
    }
    if (track?.trackLayouts?.length) {
      setTrackLayoutId(track.trackLayouts[0].id);
    } else {
      setTrackLayoutId("");
    }
  };

  const handleImportEmail = (importResult: SessionImportSelection) => {
    if (importResult.sessionFormat) {
      setSessionFormat(importResult.sessionFormat);
    }
    if (importResult.sessionDate) {
      setDate(importResult.sessionDate);
    }
    if (importResult.sessionTime) {
      setTime(importResult.sessionTime);
    }
    setClassification(
      importResult.classification != null ? String(importResult.classification) : ""
    );
    if (importResult.laps.length) {
      setLapRowsFromImport(
        importResult.laps.map((lap) => ({
          lapNumber: lap.lapNumber,
          time: lap.timeSeconds,
          lapEvents: lap.lapEvents,
        }))
      );
    }
  };

  return (
    <div css={formLayoutStyles}>
      <Card
        title="Session Details"
        rightHeaderContent={
          <div css={css`display: flex; gap: 8px;`}>
            <IconButton
              type="button"
              css={secondaryButtonStyles}
              onClick={() => setShowImportSessionModal(true)}
              disabled={isInFlight}
              icon="📥"
            >
              Import
            </IconButton>
            <IconButton
              type="submit"
              form="create-session-form"
              css={primaryButtonStyles}
              disabled={isCreateDisabled}
              icon="💾"
            >
              {isInFlight ? "Creating..." : "Create Session"}
            </IconButton>
          </div>
        }
      >
        <form id="create-session-form" onSubmit={handleSubmit}>
          <div css={twoColumnRowStyles}>
            <div css={inputFieldStyles}>
              <label htmlFor="session-date">Date</label>
              <input
                type="date"
                id="session-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isInFlight}
              />
            </div>
            <div css={inputFieldStyles}>
              <label htmlFor="session-time">Time (HH:mm)</label>
              <input
                type="time"
                id="session-time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={isInFlight}
              />
            </div>
          </div>
          <div css={inputFieldStyles}>
            <label htmlFor="session-track">Track</label>
            <div css={css`display: flex; align-items: center;`}>
              <select
                id="session-track"
                value={trackId}
                onChange={(e) => handleTrackChange(e.target.value)}
                disabled={isInFlight}
              >
                {data.tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                css={AddTrackButtonStyles}
                onClick={() => setShowCreateTrackModal(true)}
                disabled={isInFlight}
              >
                Add Track
              </button>
            </div>
          </div>
          <div css={inputFieldStyles}>
            <label htmlFor="session-kart">Kart</label>
            <select
              id="session-kart"
              value={kartId}
              onChange={(e) => setKartId(e.target.value)}
              disabled={isInFlight || selectedTrackKarts.length === 0}
            >
              {selectedTrackKarts.map((kart) => (
                <option key={kart.id} value={kart.id}>
                  {kart.name}
                </option>
              ))}
            </select>
          </div>
          <div css={inputFieldStyles}>
            <label htmlFor="session-track-layout">Track layout</label>
            <select
              id="session-track-layout"
              value={trackLayoutId}
              onChange={(e) => setTrackLayoutId(e.target.value)}
              disabled={isInFlight || selectedTrackLayouts.length === 0}
            >
              {selectedTrackLayouts.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.name}
                </option>
              ))}
            </select>
          </div>
          <div css={twoColumnRowStyles}>
            <div css={inputFieldStyles}>
              <label htmlFor="session-format">Format</label>
              <select
                id="session-format"
                value={sessionFormat}
                onChange={(e) => setSessionFormat(e.target.value)}
                disabled={isInFlight}
              >
                <option value="Practice">Practice</option>
                <option value="Qualifying">Qualifying</option>
                <option value="Race">Race</option>
              </select>
            </div>
            <div css={inputFieldStyles}>
              <label htmlFor="session-conditions">Conditions</label>
              <select
                id="session-conditions"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                disabled={isInFlight}
              >
                <option value="Dry">Dry</option>
                <option value="Wet">Wet</option>
              </select>
            </div>
          </div>
          <div css={inputFieldStyles}>
            <label htmlFor="session-classification">Classification (finishing position)</label>
            <input
              type="number"
              min={1}
              id="session-classification"
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              placeholder="e.g. 1 for P1"
              disabled={isInFlight}
            />
          </div>
          <div css={inputFieldStyles}>
            <label htmlFor="session-notes">Session Notes</label>
            <textarea
              id="session-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this session"
              disabled={isInFlight}
            />
          </div>
        </form>
      </Card>

      <div css={rightColumnStyles}>
        <div>
          <LapInputsCard
            laps={laps}
            disabled={isInFlight}
            onAddLap={addLapRow}
            onChangeLap={updateLapRow}
            onRemoveLap={removeLapRow}
            onAddLapEvent={addLapEventRow}
            onChangeLapEvent={updateLapEventRow}
            onRemoveLapEvent={removeLapEventRow}
            fieldStyles={inputFieldStyles}
          />
        </div>
        <div css={formActionsStyles}>
          <IconButton
            type="submit"
            form="create-session-form"
            css={primaryButtonStyles}
            disabled={isCreateDisabled}
            icon="💾"
          >
            {isInFlight ? "Creating..." : "Create Session"}
          </IconButton>
        </div>
      </div>

      <CreateTrackModal
        isOpen={showCreateTrackModal}
        onClose={() => setShowCreateTrackModal(false)}
        onTrackCreated={handleTrackCreated}
      />
      <ImportSessionModal
        isOpen={showImportSessionModal}
        onClose={() => setShowImportSessionModal(false)}
        onImport={handleImportEmail}
      />
    </div>
  );
}
