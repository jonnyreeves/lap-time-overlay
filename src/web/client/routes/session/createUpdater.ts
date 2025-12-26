import {
  ConnectionHandler,
  type RecordProxy,
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
  const filteredEdges: RecordProxy[] = [];
  existingEdges.forEach((existingEdge) => {
    if (!existingEdge) return;
    const node = existingEdge.getLinkedRecord("node");
    const nodeId = node?.getValue("id");
    if (
      typeof newId === "string" &&
      typeof nodeId === "string" &&
      nodeId === newId
    ) {
      return;
    }
    filteredEdges.push(existingEdge);
  });

  const sortedEdges = sortTrackSessionEdgesByDate([edge, ...filteredEdges]);
  connection.setLinkedRecords(sortedEdges.slice(0, maxItems), "edges");
}

export function prependTrackForCreatedSession(
  store: RecordSourceSelectorProxy | RecordSourceProxy,
  viewerRecordId: string,
  maxItems = 5
) {
  const viewerProxy = store.get(viewerRecordId);
  if (!viewerProxy) return;

  const connection = ConnectionHandler.getConnection(
    viewerProxy,
    "RecentTracksCard_recentTracks"
  );
  if (!connection) return;

  const createTrackSessionPayload =
    "getRootField" in store
      ? store.getRootField("createTrackSession")
      : store.getRoot().getLinkedRecord("createTrackSession");

  const track = createTrackSessionPayload?.getLinkedRecord("trackSession")?.getLinkedRecord("track");
  if (!track) return;

  const newTrackId = track.getValue("id");
  const existingEdges = connection.getLinkedRecords("edges") ?? [];
  const filteredEdges = existingEdges.filter((edge) => {
    const node = edge?.getLinkedRecord("node");
    return node?.getValue("id") !== newTrackId;
  });

  const edge = ConnectionHandler.createEdge(store, connection, track, "TrackEdge");
  const nextEdges = [edge, ...filteredEdges].slice(0, maxItems);
  connection.setLinkedRecords(nextEdges, "edges");
}

function sortTrackSessionEdgesByDate(edges: RecordProxy[]) {
  return [...edges].sort((a, b) => getTrackSessionEdgeTimestamp(b) - getTrackSessionEdgeTimestamp(a));
}

function getTrackSessionEdgeTimestamp(edge: RecordProxy) {
  const node = edge.getLinkedRecord("node");
  const rawValue = node?.getValue("date");
  if (typeof rawValue === "string") {
    const timestamp = Date.parse(rawValue);
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }
  return Number.NEGATIVE_INFINITY;
}
