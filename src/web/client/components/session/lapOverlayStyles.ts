import { css } from "@emotion/react";

export const overlayStyles = css`
  position: absolute;
  top: calc(10px * var(--lap-overlay-scale, 1));
  right: calc(10px * var(--lap-overlay-scale, 1));
  color: #ffd500;
  pointer-events: none;
  display: grid;
  gap: calc(4px * var(--lap-overlay-scale, 1));
  z-index: 2;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);
  justify-items: end;
  background: rgba(0, 0, 0, 0.6);
  padding: calc(8px * var(--lap-overlay-scale, 1)) calc(10px * var(--lap-overlay-scale, 1));
  border-radius: calc(8px * var(--lap-overlay-scale, 1));
  transform-origin: top right;

  .lap-label {
    display: inline-flex;
    align-items: baseline;
    gap: calc(8px * var(--lap-overlay-scale, 1));
    font-size: calc(15px * var(--lap-overlay-scale, 1));
    letter-spacing: 0.01em;
    line-height: 1.2;
    white-space: nowrap;
  }

  .lap-position {
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
  }

  .lap-time {
    font-size: calc(20px * var(--lap-overlay-scale, 1));
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.01em;
  }

  .current-lap {
    display: grid;
    gap: calc(2px * var(--lap-overlay-scale, 1));
    justify-items: end;
  }

  .previous-lap {
    display: grid;
    gap: calc(2px * var(--lap-overlay-scale, 1));
    justify-items: end;
    padding-top: calc(6px * var(--lap-overlay-scale, 1));
    margin-top: calc(2px * var(--lap-overlay-scale, 1));
    border-top: 1px solid rgba(255, 255, 255, 0.18);
    color: #e2e8f0;
  }

  .previous-label {
    font-size: calc(12px * var(--lap-overlay-scale, 1));
    letter-spacing: 0.01em;
    color: #cbd5e1;
  }

  .previous-time {
    font-size: calc(16px * var(--lap-overlay-scale, 1));
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.01em;
    color: #e2e8f0;
  }

  .previous-delta {
    margin-left: calc(6px * var(--lap-overlay-scale, 1));
    font-size: calc(14px * var(--lap-overlay-scale, 1));
    color: #e2e8f0;
  }

  .previous-lap[data-tone="faster"] .previous-delta {
    color: #22c55e;
  }

  .previous-lap[data-tone="slower"] .previous-delta {
    color: #ef4444;
  }

  .previous-lap[data-tone="fastest"] .previous-delta {
    color: #a855f7;
  }

  .delta-stack {
    display: grid;
    gap: calc(4px * var(--lap-overlay-scale, 1));
    justify-items: end;
    margin-top: calc(4px * var(--lap-overlay-scale, 1));
  }

  .delta-row {
    display: inline-flex;
    align-items: baseline;
    gap: calc(8px * var(--lap-overlay-scale, 1));
  }

  .delta-label {
    font-size: calc(12px * var(--lap-overlay-scale, 1));
    letter-spacing: 0.01em;
    color: #cbd5e1;
  }

  .delta-value {
    font-size: calc(16px * var(--lap-overlay-scale, 1));
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.01em;
    color: #e2e8f0;
  }

  .delta-value[data-trend="ahead"] {
    color: #22c55e;
  }

  .delta-value[data-trend="behind"] {
    color: #ef4444;
  }

  .delta-value[data-trend="even"] {
    color: #e2e8f0;
  }

  .delta-value[data-trend="fastest"] {
    color: #a855f7;
  }
`;
