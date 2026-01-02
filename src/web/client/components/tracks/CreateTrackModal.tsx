import { Modal } from "../Modal";
import { CreateTrackForm } from "./CreateTrackForm.js";

interface CreateTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackCreated: () => void;
}

export function CreateTrackModal({ isOpen, onClose, onTrackCreated }: CreateTrackModalProps) {
  const handleSuccess = (_trackId: string) => {
    onTrackCreated();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Track">
      <CreateTrackForm onCancel={onClose} onSuccess={handleSuccess} />
    </Modal>
  );
}
