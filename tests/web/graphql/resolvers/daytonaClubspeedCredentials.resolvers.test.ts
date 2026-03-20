import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  deleteViewerDaytonaClubspeedCredentialsMock,
  getViewerDaytonaClubspeedCredentialStatusMock,
  getViewerDaytonaClubspeedCredentialsOrThrowMock,
  markViewerDaytonaClubspeedCredentialInvalidMock,
  markViewerDaytonaClubspeedCredentialsValidatedMock,
  saveViewerDaytonaClubspeedCredentialsMock,
} = vi.hoisted(() => ({
  deleteViewerDaytonaClubspeedCredentialsMock: vi.fn(),
  getViewerDaytonaClubspeedCredentialStatusMock: vi.fn(),
  getViewerDaytonaClubspeedCredentialsOrThrowMock: vi.fn(),
  markViewerDaytonaClubspeedCredentialInvalidMock: vi.fn(),
  markViewerDaytonaClubspeedCredentialsValidatedMock: vi.fn(),
  saveViewerDaytonaClubspeedCredentialsMock: vi.fn(),
}));

const {
  fetchDaytonaClubspeedSessionsMock,
  importDaytonaClubspeedSessionMock,
  importTrackSessionFromSourceMock,
} = vi.hoisted(() => ({
  fetchDaytonaClubspeedSessionsMock: vi.fn(),
  importDaytonaClubspeedSessionMock: vi.fn(),
  importTrackSessionFromSourceMock: vi.fn(),
}));

vi.mock("../../../../src/web/daytonaClubspeedCredentials/service.js", () => ({
  deleteViewerDaytonaClubspeedCredentials: deleteViewerDaytonaClubspeedCredentialsMock,
  getViewerDaytonaClubspeedCredentialStatus: getViewerDaytonaClubspeedCredentialStatusMock,
  getViewerDaytonaClubspeedCredentialsOrThrow: getViewerDaytonaClubspeedCredentialsOrThrowMock,
  markViewerDaytonaClubspeedCredentialInvalid: markViewerDaytonaClubspeedCredentialInvalidMock,
  markViewerDaytonaClubspeedCredentialsValidated: markViewerDaytonaClubspeedCredentialsValidatedMock,
  saveViewerDaytonaClubspeedCredentials: saveViewerDaytonaClubspeedCredentialsMock,
}));

vi.mock("../../../../src/web/sessionImport/service.js", () => ({
  fetchDaytonaClubspeedSessions: fetchDaytonaClubspeedSessionsMock,
  importDaytonaClubspeedSession: importDaytonaClubspeedSessionMock,
  importTrackSessionFromSource: importTrackSessionFromSourceMock,
}));

import { createMockGraphQLContext } from "../context.mock.js";
import { rootValue } from "../../../../src/web/graphql/schema.js";
import { SessionImportError } from "../../../../src/web/sessionImport/types.js";

describe("daytona clubspeed credential resolvers", () => {
  const { context } = createMockGraphQLContext({
    currentUser: { id: "user-1", username: "sam", createdAt: Date.now(), isAdmin: true },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    getViewerDaytonaClubspeedCredentialStatusMock.mockReturnValue({
      configured: true,
      username: "clubspeed-user",
      lastValidatedAt: 1700000000000,
      lastValidationError: null,
    });
    getViewerDaytonaClubspeedCredentialsOrThrowMock.mockReturnValue({
      username: "clubspeed-user",
      password: "clubspeed-pass",
    });
  });

  it("saveViewerDaytonaClubspeedCredentials requires authentication", () => {
    expect(() =>
      rootValue.saveViewerDaytonaClubspeedCredentials(
        { input: { username: "u", password: "p" } },
        { ...context, currentUser: null }
      )
    ).toThrowError("Authentication required");
  });

  it("saveViewerDaytonaClubspeedCredentials validates input", () => {
    expect(() =>
      rootValue.saveViewerDaytonaClubspeedCredentials(
        { input: { username: "clubspeed-user", password: "" } },
        context
      )
    ).toThrowError("Daytona Club Speed username and password are required");
  });

  it("saveViewerDaytonaClubspeedCredentials delegates to the credential service", async () => {
    const result = await rootValue.saveViewerDaytonaClubspeedCredentials(
      { input: { username: "clubspeed-user", password: "clubspeed-pass" } },
      context
    );

    expect(saveViewerDaytonaClubspeedCredentialsMock).toHaveBeenCalledWith(
      "user-1",
      "clubspeed-user",
      "clubspeed-pass"
    );
    expect(result).toEqual({
      status: {
        configured: true,
        username: "clubspeed-user",
        lastValidatedAt: "2023-11-14T22:13:20.000Z",
        lastValidationError: null,
      },
    });
  });

  it("testViewerDaytonaClubspeedCredentials validates and clears status on success", async () => {
    fetchDaytonaClubspeedSessionsMock.mockResolvedValueOnce([]);

    const result = await rootValue.testViewerDaytonaClubspeedCredentials({}, context);

    expect(fetchDaytonaClubspeedSessionsMock).toHaveBeenCalledWith({
      username: "clubspeed-user",
      password: "clubspeed-pass",
    });
    expect(markViewerDaytonaClubspeedCredentialsValidatedMock).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({
      status: {
        configured: true,
        username: "clubspeed-user",
        lastValidatedAt: "2023-11-14T22:13:20.000Z",
        lastValidationError: null,
      },
    });
  });

  it("testViewerDaytonaClubspeedCredentials records invalid credential failures", async () => {
    fetchDaytonaClubspeedSessionsMock.mockRejectedValueOnce(
      new SessionImportError("Invalid Daytona Club Speed credentials", "INVALID_CREDENTIALS")
    );

    await expect(rootValue.testViewerDaytonaClubspeedCredentials({}, context)).rejects.toThrowError(
      "Invalid Daytona Club Speed credentials"
    );

    expect(markViewerDaytonaClubspeedCredentialInvalidMock).toHaveBeenCalledWith(
      "user-1",
      "Invalid Daytona Club Speed credentials"
    );
  });

  it("deleteViewerDaytonaClubspeedCredentials removes saved credentials", async () => {
    deleteViewerDaytonaClubspeedCredentialsMock.mockReturnValueOnce(true);
    getViewerDaytonaClubspeedCredentialStatusMock.mockReturnValueOnce({
      configured: false,
      username: null,
      lastValidatedAt: null,
      lastValidationError: null,
    });

    const result = await rootValue.deleteViewerDaytonaClubspeedCredentials({}, context);

    expect(deleteViewerDaytonaClubspeedCredentialsMock).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({
      success: true,
      status: {
        configured: false,
        username: null,
        lastValidatedAt: null,
        lastValidationError: null,
      },
    });
  });
});
