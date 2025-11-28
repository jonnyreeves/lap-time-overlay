import { css } from "@emotion/react";
import { Card } from "../../components/Card.js";

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
  input[type="text"] {
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

export default function CreateSessionRoute() {
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

  return (
    <div css={formLayoutStyles}>
      <Card title="Session Details">
        <div css={inputFieldStyles}>
          <label htmlFor="session-date">Date</label>
          <input type="date" id="session-date" defaultValue={today} />
        </div>
        <div css={inputFieldStyles}>
          <label htmlFor="session-circuit">Circuit</label>
          <input type="text" id="session-circuit" placeholder="e.g., Silverstone" />
        </div>
        <div css={inputFieldStyles}>
          <label htmlFor="session-format">Format</label>
          <input type="text" id="session-format" placeholder="e.g., Teamsport Endurance" />
        </div>
      </Card>

      <div css={videoUploadPlaceholderStyles}>
        Upload session footage
      </div>
    </div>
  );
}
