import { css } from "@emotion/react";
import { useState } from "react";
import { Card } from "../Card.js";
import { formatLapTimeSeconds } from "../../utils/lapTime.js";

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
  laps: LapWithEvents[];
  onJumpToStart: (lapStart: number) => void;
  jumpEnabled: boolean;
  jumpTitle: string;
  statusMessages?: string[];
};

const lapsListStyles = css`
  display: grid;
  gap: 10px;
  margin-top: 12px;
`;

const lapRowStyles = css`
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid #e2e8f4;
  border-radius: 12px;
  background: #f8fafc;
`;

const lapHeaderStyles = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
`;

const lapToggleStyles = css`
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-start;
  text-align: left;
  width: 100%;
  min-width: 0;
  background: none;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 6px 8px;
  margin: 0;
  cursor: pointer;
  color: inherit;

  &:hover {
    border-color: #d7deed;
    background: #fff;
  }
`;

const lapDetailsStyles = css`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
`;

const lapTitleRowStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 1.05rem;
  font-weight: 700;
`;

const lapTimeRowStyles = css`
  display: flex;
  align-items: baseline;
  gap: 8px;
  white-space: nowrap;
`;

const lapDeltaStyles = css`
  color: #475569;
  font-size: 0.9rem;
`;

const fastestLapPillStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 4px 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, #22d3ee, #0ea5e9);
  color: #0b1021;
  font-weight: 700;
  font-size: 0.85rem;
  box-shadow: 0 10px 30px rgba(14, 165, 233, 0.25);
`;

const fastestLapDotStyles = css`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #0b1021;
  opacity: 0.7;
`;

const lapEventsPillStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #e2e8f4;
  border: 1px solid #d7deed;
  font-weight: 700;
  color: #0f172a;
  font-size: 0.9rem;
`;

const chevronStyles = css`
  display: inline-block;
  transition: transform 0.18s ease;
  color: #475569;
  font-weight: 700;
`;

const chevronOpenStyles = css`
  transform: rotate(90deg);
`;

const lapActionButtonStyles = css`
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #d7deed;
  background: #fff;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  font-size: 0.95rem;

  &:hover {
    background: #eef2ff;
    border-color: #cbd5e1;
  }

  &:disabled {
    background: #e2e8f4;
    color: #94a3b8;
    cursor: not-allowed;
  }
`;

const lapEventsPanelStyles = css`
  border-top: 1px solid #e2e8f4;
  padding-top: 8px;
`;

const lapEventsListStyles = css`
  display: grid;
  gap: 8px;
  background: #fff;
  border: 1px dashed #d7deed;
  border-radius: 10px;
  padding: 10px;
`;

const lapEventRowStyles = css`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  font-size: 0.95rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    align-items: start;
  }
`;

const lapEventOffsetStyles = css`
  padding: 4px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  border: 1px solid #e2e8f4;
  font-variant-numeric: tabular-nums;
  color: #0f172a;
`;

const lapEventTypeStyles = css`
  font-weight: 700;
  color: #0f172a;
`;

const lapEventValueStyles = css`
  justify-self: end;
  color: #334155;
  font-weight: 600;

  @media (max-width: 640px) {
    justify-self: start;
  }
`;

const lapEventsEmptyStyles = css`
  margin: 0;
  color: #475569;
`;

const lapHelperTextStyles = css`
  margin: 8px 0 0;
  color: #475569;
`;

export function LapsCard({
  laps,
  onJumpToStart,
  jumpEnabled,
  jumpTitle,
  statusMessages = [],
}: Props) {
  const [openLapIds, setOpenLapIds] = useState<Set<string>>(new Set());

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

  if (laps.length === 0) {
    return (
      <Card title="Laps">
        <p>No laps recorded for this session.</p>
      </Card>
    );
  }

  return (
    <Card title="Laps">
      <div css={lapsListStyles}>
        {laps.map((lap) => {
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
        })}
      </div>
      {statusMessages.map((message, idx) => (
        <p key={`${message}-${idx}`} css={lapHelperTextStyles}>
          {message}
        </p>
      ))}
    </Card>
  );
}
