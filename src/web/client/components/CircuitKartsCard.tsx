import { useState, useEffect } from "react";
import { graphql, useFragment, useMutation } from "react-relay";
import type { CircuitKartsCard_circuit$key } from "src/web/client/__generated__/CircuitKartsCard_circuit.graphql.ts";
import type { CircuitKartsCardAddKartToCircuitMutation } from "src/web/client/__generated__/CircuitKartsCardAddKartToCircuitMutation.graphql.ts";
import type { CircuitKartsCardRemoveKartFromCircuitMutation } from "src/web/client/__generated__/CircuitKartsCardRemoveKartFromCircuitMutation.graphql.ts";
import type { CircuitKartsCardDeleteKartMutation } from "src/web/client/__generated__/CircuitKartsCardDeleteKartMutation.graphql.ts";
import type { CircuitKartsCardUpdateKartNameMutation } from "src/web/client/__generated__/CircuitKartsCardUpdateKartNameMutation.graphql.ts";
import { Card } from "./Card.tsx";
import { IconButton } from "./IconButton.tsx";
import { CircuitKartEditModal } from "./CircuitKartEditModal.js";
import { actionsRowStyles, primaryButtonStyles } from "./session/sessionOverviewStyles.ts";
import { inlineActionButtonStyles, dangerInlineActionButtonStyles, kartListStyles, kartRowStyles, largeInlineActionButtonStyles } from "./inlineActionButtons.ts";

const CircuitKartsCardCircuitFragment = graphql`
  fragment CircuitKartsCard_circuit on Circuit {
    id
    name
    karts {
      id
      name
    }
  }
`;

const AddKartToCircuitMutation = graphql`
  mutation CircuitKartsCardAddKartToCircuitMutation($circuitId: ID!, $kartId: ID!) {
    addKartToCircuit(circuitId: $circuitId, kartId: $kartId) {
      circuit {
        id
        karts {
          id
          name
        }
      }
      kart {
        id
      }
    }
  }
`;

const RemoveKartFromCircuitMutation = graphql`
  mutation CircuitKartsCardRemoveKartFromCircuitMutation($circuitId: ID!, $kartId: ID!) {
    removeKartFromCircuit(circuitId: $circuitId, kartId: $kartId) {
      circuit {
        id
        karts {
          id
          name
        }
      }
      kart {
        id
      }
    }
  }
`;

const DeleteKartMutation = graphql`
  mutation CircuitKartsCardDeleteKartMutation($id: ID!) {
    deleteKart(id: $id) {
      success
    }
  }
`;

const UpdateKartNameMutation = graphql`
  mutation CircuitKartsCardUpdateKartNameMutation($input: UpdateKartInput!) {
    updateKart(input: $input) {
      kart {
        id
        name
      }
    }
  }
`;

type Props = {
  circuit: CircuitKartsCard_circuit$key;
};

export function CircuitKartsCard({ circuit: circuitKey }: Props) {
  const circuit = useFragment(CircuitKartsCardCircuitFragment, circuitKey);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddEditKartModal, setShowAddEditKartModal] = useState(false);
  const [kartToEdit, setKartToEdit] = useState<{ id: string; name: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editableKartNames, setEditableKartNames] = useState<Map<string, string>>(() => new Map());

  useEffect(() => {
    if (!isEditing) {
      // When not editing, reset editable names to current circuit karts
      const newMap = new Map();
      circuit.karts.forEach((kart) => newMap.set(kart.id, kart.name));
      setEditableKartNames(newMap);
    }
  }, [isEditing, circuit.karts]);

  const karts = circuit.karts;
  const formId = "circuit-karts-form";

  const [commitAddKartToCircuit, isAddingKartToCircuit] =
    useMutation<CircuitKartsCardAddKartToCircuitMutation>(AddKartToCircuitMutation);
  const [commitRemoveKartFromCircuit, isRemovingKartFromCircuit] =
    useMutation<CircuitKartsCardRemoveKartFromCircuitMutation>(RemoveKartFromCircuitMutation);
  const [commitDeleteKart, isDeletingKart] =
    useMutation<CircuitKartsCardDeleteKartMutation>(DeleteKartMutation);
  const [commitUpdateKartName, isUpdatingKartName] =
    useMutation<CircuitKartsCardUpdateKartNameMutation>(UpdateKartNameMutation);

  const isSaving = isAddingKartToCircuit || isRemovingKartFromCircuit || isDeletingKart || isUpdatingKartName;

  function handleEdit() {
    setIsEditing(true);
    setActionError(null);
  }

  function handleCancel() {
    setActionError(null);
    // Reset editable names to original circuit karts
    const newMap = new Map();
    circuit.karts.forEach((kart) => newMap.set(kart.id, kart.name));
    setEditableKartNames(newMap);
    setIsEditing(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setActionError(null);

    const pendingMutations: Promise<void>[] = [];

    for (const originalKart of circuit.karts) {
      const editedName = editableKartNames.get(originalKart.id);

      if (editedName != null && editedName !== originalKart.name) {
        if (!editedName.trim()) {
          setActionError(`Kart name cannot be empty for "${originalKart.name}".`);
          return;
        }

        pendingMutations.push(
          new Promise<void>((resolve, reject) => {
            commitUpdateKartName({
              variables: { input: { id: originalKart.id, name: editedName.trim() } },
              optimisticResponse: {
                updateKart: {
                  kart: { id: originalKart.id, name: editedName.trim(), __typename: "Kart" },
                  __typename: "UpdateKartPayload",
                },
              },
              onCompleted: () => resolve(),
              onError: (error) => reject(error),
            });
          })
        );
      }
    }

    try {
      if (pendingMutations.length > 0) {
        await Promise.all(pendingMutations);
      }
      setIsEditing(false);
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "An unknown error occurred.");
    }
  }

  function handleAddKart() {
    setKartToEdit(null); // Clear any previous kart for editing
    setShowAddEditKartModal(true);
  }

  function handleEditKart(kart: { id: string; name: string }) {
    setKartToEdit(kart);
    setShowAddEditKartModal(true);
  }

  function handleDeleteKart(kartId: string) {
    if (isSaving) return;
    setActionError(null);

    // First remove from circuit
    commitRemoveKartFromCircuit({
      variables: { circuitId: circuit.id, kartId },
      optimisticResponse: {
        removeKartFromCircuit: {
          circuit: {
            id: circuit.id,
            karts: circuit.karts.filter((k: { id: string }) => k.id !== kartId),
            __typename: "Circuit",
          },
          kart: { id: kartId, __typename: "Kart" },
          __typename: "RemoveKartFromCircuitPayload",
        },
      },
      onCompleted: (response) => {
        // Only delete kart if it's not part of any other circuit
        // This logic would ideally be handled on the server, but for now we'll do a simple check
        if (response?.removeKartFromCircuit?.kart?.id) {
          // Check if this kart is still associated with any other circuit.
          // This requires a new query or a way to get all circuit_karts for a kart.
          // For simplicity, we'll just delete the kart if it's no longer in *this* circuit.
          // A more robust solution would check if the kart is associated with ANY circuit.
          commitDeleteKart({
            variables: { id: kartId },
            optimisticResponse: {
              deleteKart: { success: true, __typename: "DeleteKartPayload" },
            },
            onCompleted: () => setActionError(null),
            onError: (error) => setActionError(error.message),
          });
        }
      },
      onError: (error) => {
        setActionError(error.message);
      },
    });
  }

  function handleCloseModal() {
    setShowAddEditKartModal(false);
    setKartToEdit(null);
    setActionError(null);
  }

  // Callback from CircuitKartEditModal when a new kart is created
  const onKartCreated = (newKartId: string, newKartName: string) => {
    if (!newKartId) return;

    // Add the newly created kart to this circuit
    commitAddKartToCircuit({
      variables: { circuitId: circuit.id, kartId: newKartId },
      optimisticResponse: {
        addKartToCircuit: {
          circuit: {
            id: circuit.id,
            karts: [...circuit.karts, { id: newKartId, name: newKartName, __typename: "Kart" }],
            __typename: "Circuit",
          },
          kart: { id: newKartId, __typename: "Kart" },
          __typename: "AddKartToCircuitPayload",
        },
      },
      onCompleted: () => setActionError(null),
      onError: (error) => setActionError(error.message),
    });
  };

  return (
    <>
      <Card
        title="Karts"
        rightHeaderContent={
          <div css={actionsRowStyles}>
            {isEditing ? (
              <>
                <button type="button" css={inlineActionButtonStyles} onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </button>
                <button
                  type="submit"
                  form={formId}
                  css={primaryButtonStyles}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <IconButton
                type="button"
                css={inlineActionButtonStyles}
                onClick={handleEdit}
                icon="✏️"
                disabled={isSaving}
              >
                Edit
              </IconButton>
            )}
          </div>
        }
      >
        <div>
          {actionError ? <p css={{ color: "red" }}>{actionError}</p> : null}
          <form id={formId} onSubmit={handleSubmit}>
            {karts.length === 0 ? (
              <p>No karts added to this circuit yet.</p>
            ) : (
              <ul css={kartListStyles}>
                {karts.map((kart: { id: string; name: string }) => (
                  <li key={kart.id} css={kartRowStyles}>
                    {isEditing ? (
                      <input
                        type="text"
                        css={{
                          // Minimal styling to fit within the row
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          padding: "6px 10px",
                          fontSize: "1rem",
                          fontWeight: "700",
                          color: "#0b132b",
                          flexGrow: 1,
                        }}
                        value={editableKartNames.get(kart.id) || ""}
                        onChange={(e) =>
                          setEditableKartNames((current) => new Map(current).set(kart.id, e.target.value))
                        }
                        disabled={isSaving}
                      />
                    ) : (
                      <div className="kart-name">{kart.name}</div>
                    )}
                    {isEditing && (
                      <div className="actions">
                        <button css={dangerInlineActionButtonStyles} onClick={() => handleDeleteKart(kart.id)} disabled={isSaving}>Delete</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {isEditing && (
              <div css={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                <IconButton
                  type="button"
                  css={largeInlineActionButtonStyles}
                  onClick={handleAddKart}
                  icon="+"
                  disabled={isSaving}
                >
                  Add Kart
                </IconButton>
              </div>
            )}
          </form>
        </div>
      </Card>

      {showAddEditKartModal && (
        <CircuitKartEditModal
          circuitId={circuit.id}
          kart={kartToEdit}
          onClose={handleCloseModal}
          onKartCreated={onKartCreated} // Pass callback for new kart creation
        />
      )}
    </>
  );
}
