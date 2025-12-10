import { css } from "@emotion/react";

export const sessionCardLayoutStyles = css`
  display: grid;
  gap: 14px;
`;

export const sessionInfoGridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
`;

export const infoTileStyles = css`
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f4;
  background: #f8fafc;
  display: grid;
  gap: 6px;

  .label {
    font-size: 0.85rem;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0;
  }

  .value {
    font-size: 1.05rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  .note {
    margin: 0;
    color: #475569;
    font-size: 0.9rem;
  }
`;

export const inputStyles = css`
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e2e8f4;
  border-radius: 10px;
  font-size: 0.95rem;
  color: #0f172a;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.14);
  }
`;

export const textareaStyles = css`
  ${inputStyles};
  min-height: 96px;
  resize: vertical;
`;

export const actionsRowStyles = css`
  display: flex;
  gap: 10px;
  align-items: center;
`;

export const primaryButtonStyles = css`
  padding: 8px 14px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: #4338ca;
  }

  &:disabled {
    background: #a5b4fc;
    cursor: not-allowed;
  }
`;


export const inlineHelpStyles = css`
  margin: 0;
  color: #b91c1c;
  font-weight: 600;
`;

export const notesStyles = css`
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px dashed #d7deed;
  background: #f8fafc;
  display: grid;
  gap: 6px;

  .label {
    margin: 0;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: #1f2937;
  }

  .body {
    margin: 0;
    color: #0f172a;
    white-space: pre-wrap;
  }

  .empty {
    color: #475569;
  }
`;
