import { css } from "@emotion/react";
import { useEffect, useState } from "react"; // Import hooks
import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
import { ConnectionHandler } from "relay-runtime";
import { useNavigate, useOutletContext } from "react-router-dom";
import { type create_tsxCircuitsQuery } from "../../__generated__/create_tsxCircuitsQuery.graphql.js";
import { createTrackSessionMutation } from "../../__generated__/createTrackSessionMutation.graphql.js";
import { Card } from "../../components/Card.js";
import { CreateCircuitModal } from "../../components/CreateCircuitModal.js";
import { IconButton } from "../../components/IconButton.js";
import { ImportSessionModal } from "../../components/ImportSessionModal.js";
import { LapInputsCard } from "../../components/LapInputsCard.js";
import { type SessionImportSelection } from "../../utils/sessionImportTypes.js";
import { useLapRows, type LapInputPayload } from "../../hooks/useLapRows.js";
import { prependCircuitForCreatedSession, prependCreatedSessionToRecentSessions } from "./createUpdater.js";

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

const AddCircuitButtonStyles = css`
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

const CreateSessionRouteCircuitsQuery = graphql`
  query create_tsxCircuitsQuery {
    circuits {
      id
      name
      karts {
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
    $circuitConnections: [ID!]!
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
        kart {
          id
          name
        }
        circuit
          @prependNode(
            connections: $circuitConnections
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
  const [showCreateCircuitModal, setShowCreateCircuitModal] = useState(false);
  const [showImportSessionModal, setShowImportSessionModal] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0); // Key to force refetch
  const [sessionFormat, setSessionFormat] = useState("Practice");
  const [conditions, setConditions] = useState("Dry");
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [circuitId, setCircuitId] = useState("");
  const [kartId, setKartId] = useState("");
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
    isInFlight || !date || !sessionFormat || !circuitId || !kartId || classification.trim() === "";
  const viewerConnectionId = ConnectionHandler.getConnectionID(
    viewer.__id ?? viewer.id,
    "RecentSessionsCard_recentTrackSessions"
  );
  const viewerCircuitConnectionId = ConnectionHandler.getConnectionID(
    viewer.__id ?? viewer.id,
    "RecentCircuitsCard_recentCircuits"
  );

  const data = useLazyLoadQuery<create_tsxCircuitsQuery>(
    CreateSessionRouteCircuitsQuery,
    {},
    {
      fetchPolicy: "store-and-network",
      UNSTABLE_renderPolicy: "full",
      // Force refetch by changing the key
      fetchKey: refetchKey,
    }
  );

  const selectedCircuit = data.circuits.find((circuit) => circuit.id === circuitId);
  const selectedCircuitKarts = selectedCircuit?.karts ?? [];

  useEffect(() => {
    if (data.circuits.length === 0) {
      if (circuitId !== "") {
        setCircuitId("");
      }
      if (kartId !== "") {
        setKartId("");
      }
      return;
    }

    const selected = data.circuits.find((circuit) => circuit.id === circuitId) ?? data.circuits[0];
    if (selected.id !== circuitId) {
      setCircuitId(selected.id);
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
  }, [circuitId, kartId, data.circuits]);

  const handleCircuitCreated = () => {
    // Increment the key to force useLazyLoadQuery to refetch
    setRefetchKey((prevKey) => prevKey + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!circuitId) {
      alert("Please select a circuit.");
      return;
    }
    if (!kartId) {
      alert("Please select a kart.");
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
          circuitId,
          kartId,
          conditions,
          notes: notes.trim() ? notes.trim() : null,
          ...(lapInput.length ? { laps: lapInput } : {}),
        },
        connections: [viewerConnectionId],
        circuitConnections: [viewerCircuitConnectionId],
      },
      updater: (store) => {
        const viewerId = viewer.__id ?? viewer.id;
        prependCreatedSessionToRecentSessions(store, viewerId);
        prependCircuitForCreatedSession(store, viewerId);
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

  const handleCircuitChange = (newCircuitId: string) => {
    setCircuitId(newCircuitId);
    const circuit = data.circuits.find((c) => c.id === newCircuitId);
    if (circuit?.karts?.length) {
      setKartId(circuit.karts[0].id);
    } else {
      setKartId("");
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
            <label htmlFor="session-circuit">Circuit</label>
            <div css={css`display: flex; align-items: center;`}>
              <select
                id="session-circuit"
                value={circuitId}
                onChange={(e) => handleCircuitChange(e.target.value)}
                disabled={isInFlight}
              >
                {data.circuits.map((circuit) => (
                  <option key={circuit.id} value={circuit.id}>
                    {circuit.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                css={AddCircuitButtonStyles}
                onClick={() => setShowCreateCircuitModal(true)}
                disabled={isInFlight}
              >
                Add
              </button>
            </div>
          </div>
          <div css={inputFieldStyles}>
            <label htmlFor="session-kart">Kart</label>
            <select
              id="session-kart"
              value={kartId}
              onChange={(e) => setKartId(e.target.value)}
              disabled={isInFlight || selectedCircuitKarts.length === 0}
            >
              {selectedCircuitKarts.map((kart) => (
                <option key={kart.id} value={kart.id}>
                  {kart.name}
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

      <CreateCircuitModal
        isOpen={showCreateCircuitModal}
        onClose={() => setShowCreateCircuitModal(false)}
        onCircuitCreated={handleCircuitCreated}
      />
      <ImportSessionModal
        isOpen={showImportSessionModal}
        onClose={() => setShowImportSessionModal(false)}
        onImport={handleImportEmail}
      />
    </div>
  );
}
