import { css } from "@emotion/react";
import { useState } from "react";
import { graphql, useMutation } from "react-relay";
import { Modal } from "./Modal";

interface CreateTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackCreated: () => void;
}

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

const kartListStyles = css`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
`;

const kartRowStyles = css`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const kartNameInputStyles = css`
  flex: 1;
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
`;

const removeKartButtonStyles = css`
  padding: 8px 10px;
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecdd3;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;

  &:hover {
    background-color: #fecdd3;
    border-color: #fca5a5;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const addKartButtonStyles = css`
  padding: 8px 12px;
  background-color: #e2e8f4;
  color: #0b1021;
  border: 1px solid #d7deed;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;

  &:hover {
    background-color: #cbd5e1;
    border-color: #cbd5e1;
  }

  &:disabled {
    background-color: #e2e8f4;
    color: #94a3b8;
    border-color: #d7deed;
    cursor: not-allowed;
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

const CreateTrackMutation = graphql`
  mutation CreateTrackModalCreateTrackMutation($input: CreateCircuitInput!) {
    createTrack: createCircuit(input: $input) {
      track: circuit {
        id
        name
        heroImage
        karts {
          id
          name
        }
        trackLayouts {
          id
          name
        }
      }
    }
  }
`;

export function CreateTrackModal({ isOpen, onClose, onTrackCreated }: CreateTrackModalProps) {
  const [trackName, setTrackName] = useState("");
  const [heroImage, setHeroImage] = useState(""); // Assuming heroImage is a URL string for now
  const [kartNames, setKartNames] = useState<string[]>([""]);
  const [trackLayoutNames, setTrackLayoutNames] = useState<string[]>([""]);
  const [formError, setFormError] = useState<string | null>(null);

  const [commit, isInFlight] = useMutation(CreateTrackMutation);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const hasKartNames = kartNames.length > 0 && kartNames.every((name) => name.trim().length > 0);
  const hasLayoutNames =
    trackLayoutNames.length > 0 && trackLayoutNames.every((name) => name.trim().length > 0);
  const isCreateDisabled = isInFlight || !trackName.trim() || !hasKartNames || !hasLayoutNames;

  const handleAddKart = () => {
    setKartNames((current) => [...current, ""]);
    setFormError(null);
  };

  const handleRemoveKart = (index: number) => {
    if (kartNames.length === 1) return;
    setKartNames((current) => current.filter((_, idx) => idx !== index));
    setFormError(null);
  };

  const handleKartNameChange = (index: number, value: string) => {
    setKartNames((current) => current.map((name, idx) => (idx === index ? value : name)));
    if (formError) {
      setFormError(null);
    }
  };

  const handleAddTrackLayout = () => {
    setTrackLayoutNames((current) => [...current, ""]);
    setFormError(null);
  };

  const handleRemoveTrackLayout = (index: number) => {
    if (trackLayoutNames.length === 1) return;
    setTrackLayoutNames((current) => current.filter((_, idx) => idx !== index));
    setFormError(null);
  };

  const handleTrackLayoutNameChange = (index: number, value: string) => {
    setTrackLayoutNames((current) => current.map((name, idx) => (idx === index ? value : name)));
    if (formError) {
      setFormError(null);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    setFormError(null);

    const trimmedKartNames = kartNames.map((name) => name.trim());
    if (trimmedKartNames.some((name) => !name)) {
      setFormError("Add a name for each kart at this track.");
      return;
    }
    if (trimmedKartNames.length === 0) {
      setFormError("Add at least one kart for this track.");
      return;
    }

    const trimmedTrackLayoutNames = trackLayoutNames.map((name) => name.trim());
    if (trimmedTrackLayoutNames.some((name) => !name)) {
      setFormError("Add a name for each track layout at this track.");
      return;
    }
    if (trimmedTrackLayoutNames.length === 0) {
      setFormError("Add at least one track layout for this track.");
      return;
    }

    const trimmedHeroImage = heroImage.trim();

    commit({
      variables: {
        input: {
          name: trackName.trim(),
          heroImage: trimmedHeroImage || null, // Pass null if empty string
          karts: trimmedKartNames.map((name) => ({ name })),
          trackLayouts: trimmedTrackLayoutNames.map((name) => ({ name })),
        },
      },
      onCompleted: () => {
        setTrackName("");
        setHeroImage("");
        setKartNames([""]);
        setTrackLayoutNames([""]);
        setFormError(null);
        onTrackCreated();
        handleClose();
      },
      onError: (error) => {
        console.error("Error creating track:", error);
        setFormError(error.message);
      },
    });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Track">
      <form onSubmit={handleSubmit}>
        {formError ? <p css={{ color: "#b91c1c", marginBottom: 10 }}>{formError}</p> : null}
        <div css={inputFieldStyles}>
          <label htmlFor="track-name">Track Name</label>
          <input
            id="track-name"
            type="text"
            value={trackName}
            onChange={(e) => setTrackName(e.target.value)}
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
        <div css={inputFieldStyles}>
          <label htmlFor="kart-names">Kart Types</label>
          <div css={kartListStyles}>
            {kartNames.map((name, index) => (
              <div key={`kart-${index}`} css={kartRowStyles}>
                <input
                  id={index === 0 ? "kart-names" : undefined}
                  type="text"
                  css={kartNameInputStyles}
                  value={name}
                  onChange={(e) => handleKartNameChange(index, e.target.value)}
                  placeholder="e.g. 4-stroke rental"
                  disabled={isInFlight}
                />
                <button
                  type="button"
                  css={removeKartButtonStyles}
                  onClick={() => handleRemoveKart(index)}
                  disabled={isInFlight || kartNames.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <div css={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" css={addKartButtonStyles} onClick={handleAddKart} disabled={isInFlight}>
                Add Kart
              </button>
            </div>
          </div>
        </div>
        <div css={inputFieldStyles}>
          <label htmlFor="track-layout-names">Track Layouts</label>
          <div css={kartListStyles}>
            {trackLayoutNames.map((name, index) => (
              <div key={`layout-${index}`} css={kartRowStyles}>
                <input
                  id={index === 0 ? "track-layout-names" : undefined}
                  type="text"
                  css={kartNameInputStyles}
                  value={name}
                  onChange={(e) => handleTrackLayoutNameChange(index, e.target.value)}
                  placeholder="e.g. GP Layout"
                  disabled={isInFlight}
                />
                <button
                  type="button"
                  css={removeKartButtonStyles}
                  onClick={() => handleRemoveTrackLayout(index)}
                  disabled={isInFlight || trackLayoutNames.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <div css={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                css={addKartButtonStyles}
                onClick={handleAddTrackLayout}
                disabled={isInFlight}
              >
                Add Track Layout
              </button>
            </div>
          </div>
        </div>
        <div css={buttonGroupStyles}>
          <button
            type="button"
            css={secondaryButtonStyles}
            onClick={handleClose}
            disabled={isInFlight}
          >
            Cancel
          </button>
          <button
            type="submit"
            css={primaryButtonStyles}
            disabled={isCreateDisabled}
          >
            {isInFlight ? "Creating..." : "Create Track"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
