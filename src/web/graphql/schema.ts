import { readFileSync } from "fs";
import { buildSchema, type GraphQLSchema } from "graphql";
import { resolve as pathResolve } from "path";
import { authResolvers } from "./resolvers/auth.js";
import { circuitResolvers } from "./resolvers/circuit.js";
import {
  trackSessionResolvers
} from "./resolvers/trackSession.js";
import { trackRecordingResolvers } from "./resolvers/trackRecording.js";
import { viewerResolvers } from "./resolvers/viewer.js";

const schemaFileContents = readFileSync(
  pathResolve(process.cwd(), "schema.graphql"),
  { encoding: "utf8" },
);

export const schema: GraphQLSchema = buildSchema(schemaFileContents);

export const rootValue = {
  viewer: viewerResolvers.viewer,
  circuits: circuitResolvers.circuits,
  trackSession: trackSessionResolvers.trackSession,
  circuit: circuitResolvers.circuit,
  register: authResolvers.register,
  login: authResolvers.login,
  logout: authResolvers.logout,
  createCircuit: circuitResolvers.createCircuit,
  createTrackSession: trackSessionResolvers.createTrackSession,
  updateTrackSession: trackSessionResolvers.updateTrackSession,
  updateTrackSessionLaps: trackSessionResolvers.updateTrackSessionLaps,
  startTrackRecordingUpload: trackRecordingResolvers.startTrackRecordingUpload,
  markPrimaryTrackRecording: trackRecordingResolvers.markPrimaryTrackRecording,
  updateTrackRecording: trackRecordingResolvers.updateTrackRecording,
  deleteTrackRecording: trackRecordingResolvers.deleteTrackRecording,
  createKart: circuitResolvers.createKart,
  updateKart: circuitResolvers.updateKart,
  deleteKart: circuitResolvers.deleteKart,
  addKartToCircuit: circuitResolvers.addKartToCircuit,
  removeKartFromCircuit: circuitResolvers.removeKartFromCircuit,
};
