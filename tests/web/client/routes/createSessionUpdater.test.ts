import { describe, expect, it } from "vitest";
import {
  ConnectionHandler,
  Environment,
  Network,
  RecordSource,
  Store,
  type RecordProxy,
  type RecordSourceProxy,
} from "relay-runtime";
import { prependCreatedSessionToRecentSessions } from "../../../../src/web/client/routes/session/createUpdater.js";

function buildEnvironment() {
  return new Environment({
    network: Network.create(() => Promise.reject(new Error("not implemented"))),
    store: new Store(new RecordSource()),
  });
}

function createSessionEdge(
  store: RecordSourceProxy,
  connection: RecordProxy,
  id: string,
  date: string
) {
  const node = store.create(id, "TrackSession");
  node.setValue(id, "id");
  node.setValue(date, "date");
  return ConnectionHandler.createEdge(store, connection, node, "TrackSessionEdge");
}

function getRecentSessionIds(store: RecordSourceProxy, viewerId: string) {
  const viewer = store.get(viewerId);
  const connection = viewer
    ? ConnectionHandler.getConnection(viewer, "RecentSessionsCard_recentTrackSessions")
    : null;
  const edges = connection?.getLinkedRecords("edges") ?? [];
  return edges
    .map((edge) => edge?.getLinkedRecord("node")?.getDataID())
    .filter((id): id is string => Boolean(id));
}

describe("prependCreatedSessionToRecentSessions", () => {
  it("orders sessions by date when a newly created session is older than others", () => {
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
      const edges = [
        createSessionEdge(store, connection, "session:0", "2023-10-03"),
        createSessionEdge(store, connection, "session:1", "2023-10-01"),
      ];
      connection.setLinkedRecords(edges, "edges");
      viewer.setLinkedRecord(connection, "__RecentSessionsCard_recentTrackSessions_connection");
    });

    environment.commitUpdate((store) => {
      const payload = store.create("payload:1", "CreateTrackSessionPayload");
      const newSession = store.create("session:new", "TrackSession");
      newSession.setValue("session:new", "id");
      newSession.setValue("2023-10-02", "date");
      payload.setLinkedRecord(newSession, "trackSession");
      store.getRoot().setLinkedRecord(payload, "createTrackSession");

      prependCreatedSessionToRecentSessions(store, "user:1");
    });

    environment.commitUpdate((store) => {
      expect(getRecentSessionIds(store, "user:1")).toEqual([
        "session:0",
        "session:new",
        "session:1",
      ]);
    });
  });

  it("trims to five items after sorting by date", () => {
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
      const dates = [
        ["session:0", "2023-10-05"],
        ["session:1", "2023-10-04"],
        ["session:2", "2023-10-03"],
        ["session:3", "2023-10-02"],
        ["session:4", "2023-10-01"],
      ] as const;
      const edges = dates.map(([id, date]) => createSessionEdge(store, connection, id, date));
      connection.setLinkedRecords(edges, "edges");
      viewer.setLinkedRecord(connection, "__RecentSessionsCard_recentTrackSessions_connection");
    });

    environment.commitUpdate((store) => {
      const payload = store.create("payload:1", "CreateTrackSessionPayload");
      const newSession = store.create("session:new", "TrackSession");
      newSession.setValue("session:new", "id");
      newSession.setValue("2023-10-06", "date");
      payload.setLinkedRecord(newSession, "trackSession");
      store.getRoot().setLinkedRecord(payload, "createTrackSession");

      prependCreatedSessionToRecentSessions(store, "user:1");
    });

    environment.commitUpdate((store) => {
      expect(getRecentSessionIds(store, "user:1")).toEqual([
        "session:new",
        "session:0",
        "session:1",
        "session:2",
        "session:3",
      ]);
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
      existing.setValue("2023-10-01", "date");
      const existingEdge = ConnectionHandler.createEdge(store, connection, existing, "TrackSessionEdge");
      connection.setLinkedRecords([existingEdge], "edges");
      viewer.setLinkedRecord(connection, "__RecentSessionsCard_recentTrackSessions_connection");

      const payload = store.create("payload:1", "CreateTrackSessionPayload");
      payload.setLinkedRecord(existing, "trackSession");
      store.getRoot().setLinkedRecord(payload, "createTrackSession");
    });

    environment.commitUpdate((store) => {
      prependCreatedSessionToRecentSessions(store, "user:1");
    });

    environment.commitUpdate((store) => {
      expect(getRecentSessionIds(store, "user:1")).toEqual(["session:existing"]);
    });
  });
});
