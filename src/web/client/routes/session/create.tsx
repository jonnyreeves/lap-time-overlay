import { css } from "@emotion/react";
import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
import { useNavigate } from "react-router-dom";
import { type CreateTrackSessionMutation as CreateTrackSessionMutationType } from "../../__generated__/CreateTrackSessionMutation.graphql.ts";
import { type create_tsxCircuitsQuery } from "../__generated__/create_tsxCircuitsQuery.graphql.ts";
import { Card } from "../../components/Card.js";
import { useState } from "react"; // Import useState
import { CreateCircuitModal } from "../../components/CreateCircuitModal.js"; // Import CreateCircuitModal

const formLayoutStyles = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
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
  input[type="text"],
  select {
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
`;

const videoUploadPlaceholderStyles = css`
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px dashed #a0aec0; /* A light grey dashed border */
  border-radius: 12px;
  background-color: #edf2f7; /* A very light grey background */
  min-height: 250px; /* Make it large */
  text-align: center;
  color: #4a5568; /* Darker grey text */
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: #6366f1; /* Example hover color */
    color: #6366f1;
    background-color: #e0e7ff; /* Lighter blue on hover */
  }
`;

const AddCircuitButtonStyles = css`
  margin-left: 10px;
  padding: 8px 12px;
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: #4f46e5;
  }
`;

const CreateSessionRouteCircuitsQuery = graphql`
  query create_tsxCircuitsQuery {
    circuits {
      id
      name
    }
  }
`;

const CreateTrackSessionMutation = graphql`
  mutation createTrackSessionMutation($input: CreateTrackSessionInput!) {
    createTrackSession(input: $input) {
      trackSession {
        id
        date
        format
        circuit {
          id
          name
        }
      }
    }
  }
`;

export default function CreateSessionRoute() {
  const [showCreateCircuitModal, setShowCreateCircuitModal] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0); // Key to force refetch
  const [sessionFormat, setSessionFormat] = useState("Practice");
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
  const [date, setDate] = useState(today);
  const [circuitId, setCircuitId] = useState("");

  const navigate = useNavigate();

  const [commitMutation, isInFlight] = useMutation<CreateTrackSessionMutationType>(
    CreateTrackSessionMutation,
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

  // Set default circuitId once data is loaded, if not already set
  useState(() => {
    if (data.circuits.length > 0 && circuitId === "") {
      setCircuitId(data.circuits[0].id);
    }
  });

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

    commitMutation({
      variables: {
        input: {
          date,
          format: sessionFormat,
          circuitId,
        },
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

  return (
    <div css={formLayoutStyles}>
      <Card title="Session Details">
        <form onSubmit={handleSubmit}>
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
            <label htmlFor="session-circuit">Circuit</label>
            <div css={css`display: flex; align-items: center;`}>
              <select
                id="session-circuit"
                value={circuitId}
                onChange={(e) => setCircuitId(e.target.value)}
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
          <button type="submit" disabled={isInFlight}>
            {isInFlight ? "Creating..." : "Create Session"}
          </button>
        </form>
      </Card>

      <div css={videoUploadPlaceholderStyles}>
        Upload session footage
      </div>

      <CreateCircuitModal
        isOpen={showCreateCircuitModal}
        onClose={() => setShowCreateCircuitModal(false)}
        onCircuitCreated={handleCircuitCreated}
      />
    </div>
  );
}
