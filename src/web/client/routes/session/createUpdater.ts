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
  const existingEdges = connection.getLinkedRecords("edges") ?? [];
  const newId = payload.getValue("id");
  const filteredEdges = existingEdges.filter((existingEdge) => {
    const node = existingEdge?.getLinkedRecord("node");
    return node?.getValue("id") !== newId;
  });

  ConnectionHandler.insertEdgeBefore(connection, edge);

  const nextEdges = connection.getLinkedRecords("edges");
  if (nextEdges) {
    const deduped = [nextEdges[0], ...filteredEdges].slice(0, maxItems);
    connection.setLinkedRecords(deduped, "edges");
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
