import { css } from "@emotion/react";

export const modalOverlayStyles = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 24px;
`;

export const modalContentStyles = css`
  background: white;
  padding: 30px;
  border-radius: 10px;
  width: 90%;
  box-sizing: border-box;
  max-width: 920px;
  max-height: calc(100vh - 48px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const modalBodyStyles = css`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
`;

export const inputFieldStyles = css`
  margin-top: 15px;

  label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #333;
  }

  textarea,
  select {
    width: 100%;
    padding: 12px;
    border: 1px solid #e2e8f4;
    border-radius: 8px;
    font-size: 1rem;
    color: #0b1021;
    background-color: #f7faff;
    transition: border-color 0.2s ease-in-out;

    &:focus {
      border-color: #6366f1;
      outline: none;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }
  }

  textarea {
    min-height: 220px;
    resize: vertical;
  }
`;

export const buttonGroupStyles = css`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  flex: 0 0 auto;
`;

const baseButtonStyles = css`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
`;

export const primaryButtonStyles = css`
  ${baseButtonStyles}
  background-color: #6366f1;
  color: white;

  &:hover {
    background-color: #4f46e5;
  }

  &:disabled {
    background-color: #a5b4fc;
    cursor: not-allowed;
  }
`;

export const secondaryButtonStyles = css`
  ${baseButtonStyles}
  background-color: #e2e8f4;
  color: #333;

  &:hover {
    background-color: #cbd5e1;
  }
`;

export const previewStyles = css`
  padding: 12px;
  border: 1px solid #e2e8f4;
  border-radius: 8px;
  background-color: #f8fafc;
  display: grid;
  gap: 20px;
`;

export const previewColumnsStyles = css`
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  gap: 24px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

export const previewColumnStyles = css`
  display: grid;
  gap: 10px;
  align-content: start;
`;

export const lapListStyles = css`
  max-height: 160px;
  overflow: auto;
  padding: 10px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e2e8f4;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.9rem;
  line-height: 1.4;
`;

export const selectStyles = css`
  margin-top: 10px;

  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
  }

  select {
    width: 100%;
    padding: 10px;
    border: 1px solid #e2e8f4;
    border-radius: 8px;
    font-size: 1rem;
    background: #fff;
  }
`;

export const inlineMetadataSelectStyles = css`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  label {
    display: inline-flex;
    align-items: center;
    margin: 0;
    font-weight: 700;
    color: #0f172a;
  }

  select {
    min-width: 140px;
    max-width: 220px;
    padding: 6px 32px 6px 10px;
    border: 1px solid #d8e0f0;
    border-radius: 8px;
    font-size: 0.95rem;
    line-height: 1.2;
    background: #fff;
  }
`;

export const stepIntroStyles = css`
  margin-bottom: 16px;
  color: #475569;
`;

export const errorTextStyles = css`
  color: #b91c1c;
  margin-top: 8px;
`;

export const loadingRowStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #334155;
`;

export const spinnerStyles = css`
  width: 14px;
  height: 14px;
  border: 2px solid #cbd5e1;
  border-top-color: #6366f1;
  border-radius: 999px;
  animation: import-spinner-rotate 0.8s linear infinite;

  @keyframes import-spinner-rotate {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
`;

export const sourceGridStyles = css`
  display: grid;
  gap: 12px;
`;

export const sourceCardStyles = (selected: boolean) => css`
  border: 1px solid ${selected ? "#6366f1" : "#e2e8f4"};
  background: ${selected ? "#eef2ff" : "#f8fafc"};
  border-radius: 10px;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
`;

export const sourceTitleStyles = css`
  display: block;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 4px;
`;

export const sourceBodyStyles = css`
  color: #475569;
  line-height: 1.4;
`;

export const compactActionRowStyles = css`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 0;

  button {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #0f172a;
    padding: 6px 10px;
    cursor: pointer;

    &:disabled {
      color: #94a3b8;
      cursor: not-allowed;
    }
  }
`;

export const daytonaBulkStepStyles = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
`;

export const sessionTableStyles = css`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;

  th,
  td {
    border-bottom: 1px solid #e2e8f4;
    padding: 8px;
    text-align: left;
    vertical-align: middle;
  }

  th {
    color: #475569;
    font-weight: 700;
    position: sticky;
    top: 0;
    z-index: 1;
    background: #fff;
  }

  tr[aria-disabled="true"] {
    color: #94a3b8;
  }
`;

export const sessionTableViewportStyles = css`
  flex: 0 1 220px;
  min-height: 150px;
  max-height: min(30vh, 320px);
  overflow: auto;
  border: 1px solid #e2e8f4;
  border-radius: 8px;
`;

export const mappingGridStyles = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  padding: 12px 0;
  border-top: 1px solid #e2e8f4;
  border-bottom: 1px solid #e2e8f4;

  strong {
    grid-column: 1 / -1;
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const mappingRowStyles = css`
  display: grid;
  gap: 6px;
  align-content: start;

  label {
    font-weight: 700;
    color: #0f172a;
  }

  select {
    width: 100%;
    padding: 10px;
    border: 1px solid #e2e8f4;
    border-radius: 8px;
    background: #fff;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const mappingErrorStyles = css`
  grid-column: 1 / -1;
  color: #b91c1c;
  margin: 0;
`;

export const progressBarOuterStyles = css`
  height: 10px;
  border-radius: 8px;
  background: #e2e8f4;
  overflow: hidden;
`;

export const progressBarInnerStyles = (percent: number) => css`
  height: 100%;
  width: ${percent}%;
  background: #6366f1;
  transition: width 0.2s ease;
`;

export const resultListStyles = css`
  display: grid;
  gap: 8px;
  margin-top: 14px;
  max-height: 220px;
  overflow: auto;
`;

export const resultRowStyles = css`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f4;
`;
