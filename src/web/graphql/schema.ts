import { buildSchema, type GraphQLSchema } from "graphql";

export const schema: GraphQLSchema = buildSchema(`
  type Query {
    hello: String!
  }
`);

export const rootValue = {
  hello: () => "Hello from Lap Time Overlap!",
};
