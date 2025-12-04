import { GraphQLError } from "graphql";
import { AuthError } from "../../auth/service.js";

export function toGraphQLError(err: unknown): GraphQLError {
  if (err instanceof GraphQLError) return err;
  if (err instanceof AuthError) {
    return new GraphQLError(err.message, {
      extensions: { code: "VALIDATION_FAILED" },
    });
  }
  console.error("Unexpected GraphQL auth error:", err);
  return new GraphQLError("Internal error", {
    extensions: { code: "INTERNAL_SERVER_ERROR" },
  });
}
