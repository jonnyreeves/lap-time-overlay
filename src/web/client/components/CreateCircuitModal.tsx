// src/web/client/components/CreateCircuitModal.tsx
import { css } from "@emotion/react";
import { useState } from "react";
import { graphql, useMutation } from "react-relay";

interface CreateCircuitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCircuitCreated: () => void;
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

const modalContentStyles = css`
  background: white;
  padding: 30px;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  position: relative;
`;

const inputFieldStyles = css`
  margin-bottom: 15px;

  label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #333;
  }

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
      border-color: #6366f1;
      outline: none;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }
  }
`;

const buttonGroupStyles = css`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const baseButtonStyles = css`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
`;

const primaryButtonStyles = css`
  ${baseButtonStyles}
  background-color: #6366f1;
  color: white;

  &:hover {
    background-color: #4f46e5;
  }
`;

const secondaryButtonStyles = css`
  ${baseButtonStyles}
  background-color: #e2e8f4;
  color: #333;

  &:hover {
    background-color: #cbd5e1;
  }
`;

const CreateCircuitMutation = graphql`
  mutation CreateCircuitModalCreateCircuitMutation($input: CreateCircuitInput!) {
    createCircuit(input: $input) {
      circuit {
        id
        name
        heroImage
      }
    }
  }
`;

export function CreateCircuitModal({ isOpen, onClose, onCircuitCreated }: CreateCircuitModalProps) {
  const [circuitName, setCircuitName] = useState("");
  const [heroImage, setHeroImage] = useState(""); // Assuming heroImage is a URL string for now

  const [commit, isInFlight] = useMutation(CreateCircuitMutation);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    commit({
      variables: {
        input: {
          name: circuitName,
          heroImage: heroImage || null, // Pass null if empty string
        },
      },
      onCompleted: () => {
        setCircuitName("");
        setHeroImage("");
        onCircuitCreated();
        onClose();
      },
      onError: (error) => {
        console.error("Error creating circuit:", error);
        // TODO: Display error to user
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div css={modalOverlayStyles} onClick={onClose}>
      <div css={modalContentStyles} onClick={(e) => e.stopPropagation()}>
        <h2>Create New Circuit</h2>
        <form onSubmit={handleSubmit}>
          <div css={inputFieldStyles}>
            <label htmlFor="circuit-name">Circuit Name</label>
            <input
              id="circuit-name"
              type="text"
              value={circuitName}
              onChange={(e) => setCircuitName(e.target.value)}
              required
              disabled={isInFlight}
            />
          </div>
          <div css={inputFieldStyles}>
            <label htmlFor="hero-image">Hero Image URL (Optional)</label>
            <input
              id="hero-image"
              type="text"
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              disabled={isInFlight}
            />
          </div>
          <div css={buttonGroupStyles}>
            <button
              type="button"
              css={secondaryButtonStyles}
              onClick={onClose}
              disabled={isInFlight}
            >
              Cancel
            </button>
            <button
              type="submit"
              css={primaryButtonStyles}
              disabled={isInFlight || !circuitName}
            >
              {isInFlight ? "Creating..." : "Create Circuit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}