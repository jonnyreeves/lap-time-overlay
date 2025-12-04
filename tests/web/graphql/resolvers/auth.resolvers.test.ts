import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockGraphQLContext } from "../context.mock.js";
import { rootValue } from "../../../../src/web/graphql/schema.js";

const registerUser = vi.hoisted(() => vi.fn());
const loginUser = vi.hoisted(() => vi.fn());
const endSession = vi.hoisted(() => vi.fn());

vi.mock("../../../../src/web/auth/service.js", () => ({
  registerUser,
  loginUser,
  endSession,
}));

describe("auth resolvers", () => {
  const { context: baseContext, repositories } = createMockGraphQLContext({
    sessionToken: "token-123",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("register validates required fields", () => {
    expect(() => rootValue.register({ input: {} }, baseContext as never)).toThrowError(
      "username and password are required"
    );
  });

  it("register sets cookie and returns payload", () => {
    registerUser.mockReturnValue({
      user: { id: "u1", username: "sam", createdAt: Date.now() },
      token: "t1",
      expiresAt: 1700000000000,
    });

    const result = rootValue.register(
      { input: { username: "sam", password: "pw" } },
      baseContext as never
    );

    expect(registerUser).toHaveBeenCalledWith("sam", "pw");
    expect(baseContext.setSessionCookie).toHaveBeenCalledWith("t1", 1700000000000);
    expect(result.user).toMatchObject({ id: "u1", username: "sam" });
    expect(result.sessionExpiresAt).toBe(new Date(1700000000000).toISOString());
  });

  it("login validates required fields", () => {
    expect(() => rootValue.login({ input: { username: "sam" } }, baseContext as never)).toThrowError(
      "username and password are required"
    );
  });

  it("login sets cookie and returns payload", () => {
    loginUser.mockReturnValue({
      user: { id: "u2", username: "alex", createdAt: Date.now() },
      token: "t2",
      expiresAt: 1800000000000,
    });

    const result = rootValue.login(
      { input: { username: "alex", password: "pw" } },
      baseContext as never
    );

    expect(loginUser).toHaveBeenCalledWith("alex", "pw");
    expect(baseContext.setSessionCookie).toHaveBeenCalledWith("t2", 1800000000000);
    expect(result.user).toMatchObject({ id: "u2", username: "alex" });
    expect(result.sessionExpiresAt).toBe(new Date(1800000000000).toISOString());
  });

  it("logout ends session when token present and clears cookie", () => {
    const result = rootValue.logout({}, baseContext as never);

    expect(endSession).toHaveBeenCalledWith("token-123");
    expect(baseContext.clearSessionCookie).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it("logout still clears cookie when no token", () => {
    const ctx = { ...baseContext, sessionToken: null };
    const result = rootValue.logout({}, ctx as never);

    expect(endSession).not.toHaveBeenCalled();
    expect(ctx.clearSessionCookie).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
});
