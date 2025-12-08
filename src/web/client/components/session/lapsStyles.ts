import { css } from "@emotion/react";

export const lapsListStyles = css`
  display: grid;
  gap: 10px;
  margin-top: 12px;
`;

export const lapRowStyles = css`
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid #e2e8f4;
  border-radius: 12px;
  background: #f8fafc;
`;

export const lapHeaderStyles = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
`;

export const lapToggleStyles = css`
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

export const lapDetailsStyles = css`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
`;

export const lapTitleRowStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 1.05rem;
  font-weight: 700;
`;

export const lapTimeRowStyles = css`
  display: flex;
  align-items: baseline;
  gap: 8px;
  white-space: nowrap;
`;

export const lapDeltaStyles = css`
  color: #475569;
  font-size: 0.9rem;
`;

export const fastestLapPillStyles = css`
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

export const fastestLapDotStyles = css`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #0b1021;
  opacity: 0.7;
`;

export const lapEventsPillStyles = css`
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

export const chevronStyles = css`
  display: inline-block;
  transition: transform 0.18s ease;
  color: #475569;
  font-weight: 700;
`;

export const chevronOpenStyles = css`
  transform: rotate(90deg);
`;

export const lapActionButtonStyles = css`
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

export const lapEventsPanelStyles = css`
  border-top: 1px solid #e2e8f4;
  padding-top: 8px;
`;

export const lapEventsListStyles = css`
  display: grid;
  gap: 8px;
  background: #fff;
  border: 1px dashed #d7deed;
  border-radius: 10px;
  padding: 10px;
`;

export const lapEventRowStyles = css`
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

export const lapEventOffsetStyles = css`
  padding: 4px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  border: 1px solid #e2e8f4;
  font-variant-numeric: tabular-nums;
  color: #0f172a;
`;

export const lapEventTypeStyles = css`
  font-weight: 700;
  color: #0f172a;
`;

export const lapEventValueStyles = css`
  justify-self: end;
  color: #334155;
  font-weight: 600;

  @media (max-width: 640px) {
    justify-self: start;
  }
`;

export const lapEventsEmptyStyles = css`
  margin: 0;
  color: #475569;
`;

export const lapHelperTextStyles = css`
  margin: 12px 0 0;
  color: #334155;
  background-color: #eef2ff;
  border: 1px solid #cbd5e1;
  padding: 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const errorStyles = css`
  margin: 0 0 10px;
  color: #b91c1c;
  font-weight: 700;
`;

export const inputFieldStyles = css`
  margin-bottom: 10px;

  label {
    display: block;
    margin-bottom: 4px;
    font-weight: 600;
    color: #0f172a;
  }

  input,
  select {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #e2e8f4;
    border-radius: 10px;
    font-size: 0.95rem;
    color: #0f172a;
    background: #fff;
  }
`;
