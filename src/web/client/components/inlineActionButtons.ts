import { css } from "@emotion/react";

export const inlineActionButtonStyles = css`
  padding: 8px 12px;
  background: #e2e8f4;
  color: #0f172a;
  border: 1px solid #d7deed;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    background: #d1d9e6;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export const dangerInlineActionButtonStyles = css`
  padding: 8px 12px;
  background: #fee2e2;
  color: #ef4444;
  border: 1px solid #fecaca;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #fca5a5;
    color: #b91c1c;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export const kartListStyles = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
`;

export const kartRowStyles = css`
  display: grid;
  grid-template-columns: 1fr auto; /* Kart name on left, buttons on right */
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-radius: 14px;
  border: 1px solid #e2e8f4;
  background: linear-gradient(135deg, #f9fbff, #f3f6ff);
  box-shadow: 0 8px 24px rgba(26, 32, 44, 0.06);

  .kart-name {
    font-size: 1.05rem;
    font-weight: 700;
    color: #0b132b;
  }

  .actions {
    display: flex;
    gap: 8px;
  }
`;

export const largeInlineActionButtonStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid #d7deed;
  background: #e2e8f4;
  color: #0f172a;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;

  &:hover {
    background: #d1d9e6;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;


