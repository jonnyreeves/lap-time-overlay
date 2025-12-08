import { describe, expect, it } from "vitest";
import {
  ConnectionHandler,
  Environment,
  Network,
  RecordSource,
  Store,
} from "relay-runtime";
import { prependCreatedSessionToRecentSessions } from "../../../../src/web/client/routes/session/createUpdater.js";

function buildEnvironment() {
  return new Environment({
    network: Network.create(() => Promise.reject(new Error("not implemented"))),
    store: new Store(new RecordSource()),
  });
}

describe("prependCreatedSessionToRecentSessions", () => {
  it("prepends the created session and trims to five items", () => {
    const environment = buildEnvironment();
    const connectionId = ConnectionHandler.getConnectionID(
      "user:1",
      "RecentSessionsCard_recentTrackSessions"
    );

    // Seed viewer and existing connection with five sessions.
    environment.commitUpdate((store) => {
      const root = store.getRoot();
      const viewer = store.create("user:1", "User");
      viewer.setValue("user:1", "id");
      root.setLinkedRecord(viewer, "viewer");

      const connection = store.create(connectionId, "TrackSessionConnection");
      const edges = [];
      for (let i = 0; i < 5; i++) {
        const node = store.create(`session:${i}`, "TrackSession");
        node.setValue(`session:${i}`, "id");
        const edge = ConnectionHandler.createEdge(store, connection, node, "TrackSessionEdge");
        edges.push(edge);
      }
      connection.setLinkedRecords(edges, "edges");
      viewer.setLinkedRecord(connection, "__RecentSessionsCard_recentTrackSessions_connection");
    });

    // Simulate createTrackSession payload and run the updater.
    environment.commitUpdate((store) => {
      const payload = store.create("payload:1", "CreateTrackSessionPayload");
      const newSession = store.create("session:new", "TrackSession");
      newSession.setValue("session:new", "id");
      payload.setLinkedRecord(newSession, "trackSession");
      store.getRoot().setLinkedRecord(payload, "createTrackSession");

      prependCreatedSessionToRecentSessions(store, "user:1");
    });

    // Verify new ordering and trimming.
    environment.commitUpdate((store) => {
      const viewer = store.get("user:1");
      const connection = viewer
        ? ConnectionHandler.getConnection(viewer, "RecentSessionsCard_recentTrackSessions")
        : null;
      const edges = connection?.getLinkedRecords("edges") ?? [];
      const ids = edges
        .map((edge) => edge?.getLinkedRecord("node")?.getDataID())
        .filter(Boolean);

      expect(ids).toEqual(["session:new", "session:0", "session:1", "session:2", "session:3"]);
    });
  });

  it("does not duplicate when the session already exists in the connection", () => {
    const environment = buildEnvironment();
    const connectionId = ConnectionHandler.getConnectionID(
      "user:1",
      "RecentSessionsCard_recentTrackSessions"
    );

    environment.commitUpdate((store) => {
      const root = store.getRoot();
      const viewer = store.create("user:1", "User");
      viewer.setValue("user:1", "id");
      root.setLinkedRecord(viewer, "viewer");

      const connection = store.create(connectionId, "TrackSessionConnection");
      const existing = store.create("session:existing", "TrackSession");
      existing.setValue("session:existing", "id");
      const existingEdge = ConnectionHandler.createEdge(store, connection, existing, "TrackSessionEdge");
      connection.setLinkedRecords([existingEdge], "edges");
      viewer.setLinkedRecord(connection, "__RecentSessionsCard_recentTrackSessions_connection");

      const payload = store.create("payload:1", "CreateTrackSessionPayload");
      const newSession = store.get("session:existing");
      if (!newSession) {
        throw new Error("Expected existing session record");
      }
      payload.setLinkedRecord(newSession, "trackSession");
      store.getRoot().setLinkedRecord(payload, "createTrackSession");
    });

    environment.commitUpdate((store) => {
      prependCreatedSessionToRecentSessions(store, "user:1");
    });

    environment.commitUpdate((store) => {
      const viewer = store.get("user:1");
      const connection = viewer
        ? ConnectionHandler.getConnection(viewer, "RecentSessionsCard_recentTrackSessions")
        : null;
      const edges = connection?.getLinkedRecords("edges") ?? [];
      const ids = edges
        .map((edge) => edge?.getLinkedRecord("node")?.getDataID())
        .filter(Boolean);

      expect(ids).toEqual(["session:existing"]);
    });
  });
});
