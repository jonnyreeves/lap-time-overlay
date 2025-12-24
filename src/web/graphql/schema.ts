import { readFileSync } from "fs";
import { buildSchema, type GraphQLSchema } from "graphql";
import { resolve as pathResolve } from "path";
import { authResolvers } from "./resolvers/auth.js";
import { trackResolvers } from "./resolvers/track.js";
import { trackSessionResolvers } from "./resolvers/trackSession.js";
import { trackRecordingResolvers } from "./resolvers/trackRecording.js";
import { viewerResolvers } from "./resolvers/viewer.js";
import { adminResolvers } from "./resolvers/admin.js";

const schemaFileContents = readFileSync(
  pathResolve(process.cwd(), "schema.graphql"),
  { encoding: "utf8" },
);

export const schema: GraphQLSchema = buildSchema(schemaFileContents);

export const rootValue = {
  viewer: viewerResolvers.viewer,
  users: authResolvers.users,
  tracks: trackResolvers.tracks,
  trackSession: trackSessionResolvers.trackSession,
  track: trackResolvers.track,
  register: authResolvers.register,
  login: authResolvers.login,
  logout: authResolvers.logout,
  createTrack: trackResolvers.createTrack,
  createTrackSession: trackSessionResolvers.createTrackSession,
  updateTrackSession: trackSessionResolvers.updateTrackSession,
  updateTrackSessionLaps: trackSessionResolvers.updateTrackSessionLaps,
  deleteTrackSession: trackSessionResolvers.deleteTrackSession,
  startTrackRecordingUpload: trackRecordingResolvers.startTrackRecordingUpload,
  markPrimaryTrackRecording: trackRecordingResolvers.markPrimaryTrackRecording,
  updateTrackRecording: trackRecordingResolvers.updateTrackRecording,
  renderOverlayPreview: trackRecordingResolvers.renderOverlayPreview,
  burnRecordingOverlay: trackRecordingResolvers.burnRecordingOverlay,
  deleteTrackRecording: trackRecordingResolvers.deleteTrackRecording,
  createKart: trackResolvers.createKart,
  updateKart: trackResolvers.updateKart,
  deleteKart: trackResolvers.deleteKart,
  addKartToTrack: trackResolvers.addKartToTrack,
  removeKartFromTrack: trackResolvers.removeKartFromTrack,
  addTrackLayoutToTrack: trackResolvers.addTrackLayoutToTrack,
  updateTrackLayout: trackResolvers.updateTrackLayout,
  removeTrackLayoutFromTrack: trackResolvers.removeTrackLayoutFromTrack,
  adminOrphanedMedia: adminResolvers.adminOrphanedMedia,
  adminTempDirs: adminResolvers.adminTempDirs,
  adminRecordingHealth: adminResolvers.adminRecordingHealth,
  adminRenderJobs: adminResolvers.adminRenderJobs,
  adminUserMediaLibraries: adminResolvers.adminUserMediaLibraries,
  adminUsers: adminResolvers.adminUsers,
  adminTempCleanupSchedule: adminResolvers.adminTempCleanupSchedule,
  deleteOrphanedMedia: adminResolvers.deleteOrphanedMedia,
  emptyTempDir: adminResolvers.emptyTempDir,
  rebuildMediaLibraryProjectionAll: adminResolvers.rebuildMediaLibraryProjectionAll,
  cancelRenderJob: adminResolvers.cancelRenderJob,
  updateTempCleanupSchedule: adminResolvers.updateTempCleanupSchedule,
  runTempCleanup: adminResolvers.runTempCleanup,
  updateUserAdminStatus: adminResolvers.updateUserAdminStatus,
};
