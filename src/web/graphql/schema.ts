import { readFileSync } from "fs";
import { GraphQLError, buildSchema, type GraphQLSchema } from "graphql";
import { resolve as pathResolve } from "path";
import type { GraphQLContext } from "./context.js";
import { circuitResolvers } from "./resolvers/circuit.js";
import {
  type CreateTrackSessionInputArgs,
  type TrackSessionArgs,
  type UpdateTrackSessionInputArgs,
  trackSessionResolvers,
} from "./resolvers/trackSession.js";
import { authResolvers } from "./resolvers/auth.js";

const schemaFileContents = readFileSync(
  pathResolve(process.cwd(), "schema.graphql"),
  { encoding: "utf8" },
);

export const schema: GraphQLSchema = buildSchema(schemaFileContents);

export const rootValue = {
  viewer: authResolvers.viewer,
  circuits: circuitResolvers.circuits,
  trackSession: trackSessionResolvers.trackSession,
  register: authResolvers.register,
  login: authResolvers.login,
  logout: authResolvers.logout,
  createCircuit: (
    args: { input?: { name?: string; heroImage?: string } },
    context: GraphQLContext
  ) => circuitResolvers.createCircuit(args, context),
  createTrackSession: trackSessionResolvers.createTrackSession,
  updateTrackSession: trackSessionResolvers.updateTrackSession,
};
