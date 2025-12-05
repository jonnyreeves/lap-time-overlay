import {
  ConnectionHandler,
  type RecordSourceProxy,
  type RecordSourceSelectorProxy,
} from "relay-runtime";

export function prependCreatedSessionToRecentSessions(
  store: RecordSourceSelectorProxy | RecordSourceProxy,
  viewerRecordId: string,
  maxItems = 5
) {
  const viewerProxy = store.get(viewerRecordId);
  if (!viewerProxy) return;

  const connection = ConnectionHandler.getConnection(
    viewerProxy,
    "RecentSessionsCard_recentTrackSessions"
  );
  if (!connection) return;

  const createTrackSessionPayload =
    "getRootField" in store
      ? store.getRootField("createTrackSession")
      : store.getRoot().getLinkedRecord("createTrackSession");

  const payload = createTrackSessionPayload?.getLinkedRecord("trackSession");
  if (!payload) return;

  const edge = ConnectionHandler.createEdge(store, connection, payload, "TrackSessionEdge");
  ConnectionHandler.insertEdgeBefore(connection, edge);

  const edges = connection.getLinkedRecords("edges");
  if (edges && edges.length > maxItems) {
    connection.setLinkedRecords(edges.slice(0, maxItems), "edges");
  }
}

export function prependCircuitForCreatedSession(
  store: RecordSourceSelectorProxy | RecordSourceProxy,
  viewerRecordId: string,
  maxItems = 5
) {
  const viewerProxy = store.get(viewerRecordId);
  if (!viewerProxy) return;

  const connection = ConnectionHandler.getConnection(
    viewerProxy,
    "RecentCircuitsCard_recentCircuits"
  );
  if (!connection) return;

  const createTrackSessionPayload =
    "getRootField" in store
      ? store.getRootField("createTrackSession")
      : store.getRoot().getLinkedRecord("createTrackSession");

  const circuit = createTrackSessionPayload?.getLinkedRecord("trackSession")?.getLinkedRecord("circuit");
  if (!circuit) return;

  const newCircuitId = circuit.getValue("id");
  const existingEdges = connection.getLinkedRecords("edges") ?? [];
  const filteredEdges = existingEdges.filter((edge) => {
    const node = edge?.getLinkedRecord("node");
    return node?.getValue("id") !== newCircuitId;
  });

  const edge = ConnectionHandler.createEdge(store, connection, circuit, "CircuitEdge");
  const nextEdges = [edge, ...filteredEdges].slice(0, maxItems);
  connection.setLinkedRecords(nextEdges, "edges");
}
