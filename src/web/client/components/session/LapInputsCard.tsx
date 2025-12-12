import { css, type SerializedStyles } from "@emotion/react";
import type { LapFormRow } from "../../hooks/useLapRows.js";
import { Card } from "../Card.js";

type Props = {
  laps: LapFormRow[];
  disabled: boolean;
  renderCard?: boolean;
  title?: string;
  onAddLap: () => void;
  onChangeLap: (id: string, field: "lapNumber" | "time", value: string) => void;
  onRemoveLap: (id: string) => void;
  onAddLapEvent: (lapId: string) => void;
  onChangeLapEvent: (
    lapId: string,
    eventId: string,
    field: "offset" | "event" | "value",
    value: string
  ) => void;
  onRemoveLapEvent: (lapId: string, eventId: string) => void;
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

const lapHeaderRowStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const addLapFooterStyles = css`
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
`;

const addLapButtonStyles = css`
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

const lapRowsStyles = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const lapRowStyles = css`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #e2e8f4;
  background: #f8fafc;
`;

const lapInputsRowStyles = css`
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

const lapEventsHeaderStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  h4 {
    margin: 0;
    font-size: 0.95rem;
    color: #1f2937;
  }
`;

const addLapEventFooterStyles = css`
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
`;

const addLapEventButtonStyles = css`
  padding: 7px 12px;
  border-radius: 10px;
  border: 1px solid #0ea5e9;
  background: #e0f2fe;
  color: #0369a1;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out;

  &:hover {
    background: #bae6fd;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #f1f5f9;
    color: #94a3b8;
    border-color: #cbd5e1;
    cursor: not-allowed;
    transform: none;
  }
`;

const lapEventsListStyles = css`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const lapEventRowStyles = css`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  gap: 10px;
  align-items: end;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const lapEventFieldStyles = css`
  margin-bottom: 0;
`;

const removeLapEventButtonStyles = css`
  padding: 8px 12px;
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

const lapEventsEmptyStateStyles = css`
  padding: 10px 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #fff;
  color: #475569;
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
  renderCard = true,
  title = "Lap times",
  onAddLap,
  onChangeLap,
  onRemoveLap,
  onAddLapEvent,
  onChangeLapEvent,
  onRemoveLapEvent,
  fieldStyles,
}: Props) {
  const content = (
    <>
      {laps.length === 0 ? (
        <div css={lapEmptyStateStyles}>
          <p>No laps recorded.</p>
        </div>
      ) : (
        <div css={lapRowsStyles}>
          {laps.map((lap) => (
            <div key={lap.id} css={lapRowStyles}>
              <div css={lapInputsRowStyles}>
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
                  aria-label="Remove lap"
                >
                  🗑️
                </button>
              </div>
              <div>
                <div css={lapEventsHeaderStyles}>
                  <h4>Lap events</h4>
                </div>
                {lap.events.length === 0 ? (
                  <div css={lapEventsEmptyStateStyles}>
                    <p>No lap events</p>
                  </div>
                ) : (
                  <div css={lapEventsListStyles}>
                    {lap.events.map((event) => (
                      <div key={event.id} css={lapEventRowStyles}>
                        <div css={[fieldStyles, lapEventFieldStyles]}>
                          <label htmlFor={`lap-${lap.id}-event-${event.id}-type`}>Event</label>
                          <select
                            id={`lap-${lap.id}-event-${event.id}-type`}
                            value={event.event}
                            onChange={(e) =>
                              onChangeLapEvent(lap.id, event.id, "event", e.target.value)
                            }
                            disabled={disabled}
                          >
                            <option value="position">position</option>
                          </select>
                        </div>
                        <div css={[fieldStyles, lapEventFieldStyles]}>
                          <label htmlFor={`lap-${lap.id}-event-${event.id}-value`}>Value</label>
                          <input
                            type="text"
                            id={`lap-${lap.id}-event-${event.id}-value`}
                            placeholder="e.g. P1"
                            value={event.value}
                            onChange={(e) =>
                              onChangeLapEvent(lap.id, event.id, "value", e.target.value)
                            }
                            disabled={disabled}
                          />
                        </div>
                        <div css={[fieldStyles, lapEventFieldStyles]}>
                          <label htmlFor={`lap-${lap.id}-event-${event.id}-offset`}>
                            Offset (s)
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            id={`lap-${lap.id}-event-${event.id}-offset`}
                            placeholder="0.000"
                            value={event.offset}
                            onChange={(e) =>
                              onChangeLapEvent(lap.id, event.id, "offset", e.target.value)
                            }
                            disabled={disabled}
                          />
                        </div>
                        <button
                          type="button"
                          css={removeLapEventButtonStyles}
                          onClick={() => onRemoveLapEvent(lap.id, event.id)}
                          disabled={disabled}
                          aria-label="Remove event"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div css={addLapEventFooterStyles}>
                  <button
                    type="button"
                    css={addLapEventButtonStyles}
                    onClick={() => onAddLapEvent(lap.id)}
                    disabled={disabled}
                  >
                    + Add lap event
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div css={addLapFooterStyles}>
        <button
          type="button"
          css={addLapButtonStyles}
          onClick={onAddLap}
          disabled={disabled}
        >
          + Add lap
        </button>
      </div>
    </>
  );

  if (!renderCard) {
    return content;
  }

  return (
    <Card
      title={title}
    >
      {content}
    </Card>
  );
}
