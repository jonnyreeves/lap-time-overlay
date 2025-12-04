import { vi } from "vitest";
import type { GraphQLContext } from "../../../src/web/graphql/context.js";
import { createMockRepositories } from "./repositories.mock.js";

type ContextOverrides = Partial<Omit<GraphQLContext, "repositories">> & {
  repositories?: ReturnType<typeof createMockRepositories>;
};

export function createMockGraphQLContext(overrides: ContextOverrides = {}) {
  const repositories = overrides.repositories ?? createMockRepositories();
  const context: GraphQLContext = {
    currentUser: null,
    sessionToken: null,
    setSessionCookie: vi.fn(),
    clearSessionCookie: vi.fn(),
    repositories,
    ...overrides,
  };

  return { context, repositories };
}
