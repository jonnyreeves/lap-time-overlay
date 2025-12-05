import { describe, expect, it } from "vitest";
import {
  ConnectionHandler,
  Environment,
  Network,
  RecordSource,
  Store,
} from "relay-runtime";
import { prependCircuitForCreatedSession } from "../../../../src/web/client/routes/session/createUpdater.js";

function buildEnvironment() {
  return new Environment({
    network: Network.create(() => Promise.reject(new Error("not implemented"))),
    store: new Store(new RecordSource()),
  });
}

describe("prependCircuitForCreatedSession", () => {
  it("moves the circuit to the front without duplicating and trims to five", () => {
    const environment = buildEnvironment();
    const connectionId = ConnectionHandler.getConnectionID(
      "user:1",
      "RecentCircuitsCard_recentCircuits"
    );

    environment.commitUpdate((store) => {
      const root = store.getRoot();
      const viewer = store.create("user:1", "User");
      viewer.setValue("user:1", "id");
      root.setLinkedRecord(viewer, "viewer");

      const connection = store.create(connectionId, "CircuitConnection");
      const edges = [];
      for (let i = 0; i < 5; i++) {
        const circuit = store.create(`circuit:${i}`, "Circuit");
        circuit.setValue(`circuit:${i}`, "id");
        circuit.setValue(`Circuit ${i}`, "name");
        const edge = ConnectionHandler.createEdge(store, connection, circuit, "CircuitEdge");
        edges.push(edge);
      }
      connection.setLinkedRecords(edges, "edges");
      viewer.setLinkedRecord(connection, "__RecentCircuitsCard_recentCircuits_connection");
    });

    environment.commitUpdate((store) => {
      const payload = store.create("payload:1", "CreateTrackSessionPayload");
      const newSession = store.create("session:new", "TrackSession");
      const circuit = store.get("circuit:2");
      if (!circuit) throw new Error("circuit not seeded");
      circuit.setValue("Updated Circuit", "name");
      newSession.setLinkedRecord(circuit, "circuit");
      payload.setLinkedRecord(newSession, "trackSession");
      store.getRoot().setLinkedRecord(payload, "createTrackSession");

      prependCircuitForCreatedSession(store, "user:1");
    });

    environment.commitUpdate((store) => {
      const viewer = store.get("user:1");
      const connection = viewer
        ? ConnectionHandler.getConnection(viewer, "RecentCircuitsCard_recentCircuits")
        : null;
      const edges = connection?.getLinkedRecords("edges") ?? [];
      const ids = edges
        .map((edge) => edge?.getLinkedRecord("node")?.getDataID())
        .filter(Boolean);

      expect(ids).toEqual(["circuit:2", "circuit:0", "circuit:1", "circuit:3", "circuit:4"]);
    });
  });
});
