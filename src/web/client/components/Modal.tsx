import { css } from "@emotion/react";
import React from "react";
import ReactDOM from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const modalOverlayStyles = css`
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
`;

const modalContentStyles = (maxWidth?: string) => css`
  background: white;
  padding: 30px;
  border-radius: 10px;
  width: 90%;
  max-width: ${maxWidth || '600px'};
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const modalHeaderStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #0f172a;
  }
  button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #64748b;
    &:hover {
      color: #334155;
    }
  }
`;

export function Modal({ isOpen, onClose, title, children, maxWidth }: ModalProps) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div css={modalOverlayStyles} onClick={onClose}>
      <div css={modalContentStyles(maxWidth)} onClick={(e) => e.stopPropagation()}>
        <div css={modalHeaderStyles}>
          <h2>{title}</h2>
          <button onClick={onClose}>&times;</button>
        </div>
        {children}
      </div>
    </div>,
    document.body // Append to body
  );
}
