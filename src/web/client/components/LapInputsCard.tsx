import { css, type SerializedStyles } from "@emotion/react";
import type { LapFormRow } from "../hooks/useLapRows.js";
import { Card } from "./Card.js";

type Props = {
  laps: LapFormRow[];
  disabled: boolean;
  onAddLap: () => void;
  onChangeLap: (id: string, field: "lapNumber" | "time", value: string) => void;
  onRemoveLap: (id: string) => void;
  fieldStyles: SerializedStyles;
};

const lapHeaderStyles = css`
  margin-bottom: 12px;

  p {
    margin: 0;
    color: #4a5568;
    line-height: 1.5;
  }
`;

const addLapButtonStyles = css`
  padding: 8px 12px;
  background-color: #0ea5e9;
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 700;
  transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out;

  &:hover {
    background-color: #0284c7;
    transform: translateY(-1px);
  }

  &:disabled {
    background-color: #bae6fd;
    cursor: not-allowed;
    transform: none;
  }
`;

const lapRowsStyles = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const lapRowStyles = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
  align-items: end;
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const lapFieldStyles = css`
  margin-bottom: 0;
`;

const removeLapButtonStyles = css`
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid #fecdd3;
  background: #fff1f2;
  color: #9f1239;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background: #ffe4e6;
  }

  &:disabled {
    background: #f5f5f5;
    color: #9ca3af;
    border-color: #e5e7eb;
    cursor: not-allowed;
  }
`;

const lapEmptyStateStyles = css`
  padding: 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #475569;
  background: #f8fafc;
`;

export function LapInputsCard({
  laps,
  disabled,
  onAddLap,
  onChangeLap,
  onRemoveLap,
  fieldStyles,
}: Props) {
  return (
    <Card
      title="Lap times"
      rightComponent={
        <button
          type="button"
          css={addLapButtonStyles}
          onClick={onAddLap}
          disabled={disabled}
        >
          Add lap
        </button>
      }
    >
      <div css={lapHeaderStyles}>
        <p>Optional: log lap numbers and times now so we can surface PBs later.</p>
      </div>
      {laps.length === 0 ? (
        <div css={lapEmptyStateStyles}>
          <p>No laps yet. Hit "Add lap" to drop your first one.</p>
        </div>
      ) : (
        <div css={lapRowsStyles}>
          {laps.map((lap) => (
            <div key={lap.id} css={lapRowStyles}>
              <div css={[fieldStyles, lapFieldStyles]}>
                <label htmlFor={`lap-${lap.id}-number`}>Lap #</label>
                <input
                  type="number"
                  min="1"
                  id={`lap-${lap.id}-number`}
                  value={lap.lapNumber}
                  onChange={(event) =>
                    onChangeLap(lap.id, "lapNumber", event.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div css={[fieldStyles, lapFieldStyles]}>
                <label htmlFor={`lap-${lap.id}-time`}>Lap time (s or mm:ss)</label>
                <input
                  type="text"
                  id={`lap-${lap.id}-time`}
                  placeholder="75.123 or 1:15.123"
                  value={lap.time}
                  onChange={(event) =>
                    onChangeLap(lap.id, "time", event.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <button
                type="button"
                css={removeLapButtonStyles}
                onClick={() => onRemoveLap(lap.id)}
                disabled={disabled}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
