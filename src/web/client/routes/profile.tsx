import { css } from "@emotion/react";
import { useEffect, useState } from "react";
import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
import type { profileQuery } from "../__generated__/profileQuery.graphql.js";
import type { profileSaveViewerDaytonaClubspeedCredentialsMutation } from "../__generated__/profileSaveViewerDaytonaClubspeedCredentialsMutation.graphql.js";
import type { profileTestViewerDaytonaClubspeedCredentialsMutation } from "../__generated__/profileTestViewerDaytonaClubspeedCredentialsMutation.graphql.js";
import type { profileDeleteViewerDaytonaClubspeedCredentialsMutation } from "../__generated__/profileDeleteViewerDaytonaClubspeedCredentialsMutation.graphql.js";
import { Card } from "../components/Card.js";
import { inlineActionButtonStyles } from "../components/inlineActionButtons.ts";
import { useBreadcrumbs } from "../hooks/useBreadcrumbs.js";

const ProfileQuery = graphql`
  query profileQuery {
    viewer {
      id
      username
      daytonaClubspeedCredentialStatus {
        configured
        username
        lastValidatedAt
        lastValidationError
      }
    }
  }
`;

const SaveCredentialsMutation = graphql`
  mutation profileSaveViewerDaytonaClubspeedCredentialsMutation(
    $input: SaveViewerDaytonaClubspeedCredentialsInput!
  ) {
    saveViewerDaytonaClubspeedCredentials(input: $input) {
      status {
        configured
        username
        lastValidatedAt
        lastValidationError
      }
    }
  }
`;

const TestCredentialsMutation = graphql`
  mutation profileTestViewerDaytonaClubspeedCredentialsMutation {
    testViewerDaytonaClubspeedCredentials {
      status {
        configured
        username
        lastValidatedAt
        lastValidationError
      }
    }
  }
`;

const DeleteCredentialsMutation = graphql`
  mutation profileDeleteViewerDaytonaClubspeedCredentialsMutation {
    deleteViewerDaytonaClubspeedCredentials {
      success
      status {
        configured
        username
        lastValidatedAt
        lastValidationError
      }
    }
  }
`;

const pageStyles = css`
  display: grid;
  gap: 20px;
`;

const providerCardStyles = css`
  display: grid;
  gap: 16px;
`;

const fieldGroupStyles = css`
  display: grid;
  gap: 14px;

  label {
    display: grid;
    gap: 6px;
    font-weight: 600;
    color: #0f172a;
  }

  input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d7e1f0;
    border-radius: 8px;
    font-size: 1rem;
    background: #f8fafc;
    color: #0b1021;
  }
`;

const actionsStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const statusGridStyles = css`
  display: grid;
  gap: 8px;
  color: #334155;
`;

const helperTextStyles = css`
  margin: 0;
  color: #475569;
`;

const successTextStyles = css`
  margin: 0;
  color: #166534;
`;

const errorTextStyles = css`
  margin: 0;
  color: #b91c1c;
`;

const warningTextStyles = css`
  margin: 0;
  color: #92400e;
`;

export default function ProfileRoute() {
  const [fetchKey, setFetchKey] = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const { setBreadcrumbs } = useBreadcrumbs();

  const data = useLazyLoadQuery<profileQuery>(
    ProfileQuery,
    {},
    {
      fetchPolicy: "store-and-network",
      UNSTABLE_renderPolicy: "full",
      fetchKey,
    }
  );
  const [commitSave, isSaving] =
    useMutation<profileSaveViewerDaytonaClubspeedCredentialsMutation>(SaveCredentialsMutation);
  const [commitTest, isTesting] =
    useMutation<profileTestViewerDaytonaClubspeedCredentialsMutation>(TestCredentialsMutation);
  const [commitDelete, isDeleting] =
    useMutation<profileDeleteViewerDaytonaClubspeedCredentialsMutation>(DeleteCredentialsMutation);

  const credentialStatus = data.viewer?.daytonaClubspeedCredentialStatus ?? null;
  const isBusy = isSaving || isTesting || isDeleting;
  const savedUsername = credentialStatus?.username?.trim() ?? "";
  const usernameDraft = username.trim();
  const passwordDraft = password.trim();
  const hasUnreadableSavedCredentials =
    credentialStatus?.configured === true &&
    !credentialStatus.username &&
    credentialStatus.lastValidationError?.includes("cannot be decrypted");
  const hasUnsavedCredentialEdits = usernameDraft !== savedUsername || Boolean(passwordDraft);
  const savedUsernameLabel =
    credentialStatus?.username ??
    (credentialStatus?.configured ? "Needs re-entry" : "Not configured");
  const credentialStatusLabel = hasUnreadableSavedCredentials
    ? "Needs re-entry"
    : credentialStatus?.configured
      ? "Configured"
      : "Not configured";
  const testConnectionDisabledReason = isBusy
    ? "Wait for the current action to finish."
    : !credentialStatus?.configured
      ? "Save credentials before testing saved credentials."
      : hasUnreadableSavedCredentials
        ? "Re-enter and save credentials before testing saved credentials."
        : hasUnsavedCredentialEdits
          ? "Save changes before testing saved credentials."
          : null;
  const isTestConnectionDisabled = Boolean(testConnectionDisabledReason);

  useEffect(() => {
    setBreadcrumbs([{ label: "Profile" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    setUsername(credentialStatus?.username ?? "");
    setPassword("");
  }, [credentialStatus?.username]);

  const refresh = () => {
    setFetchKey((current) => current + 1);
  };

  const handleSave = () => {
    setFeedback(null);
    commitSave({
      variables: {
        input: {
          username: username.trim(),
          password: password.trim(),
        },
      },
      onCompleted: () => {
        setPassword("");
        setFeedback({
          type: "success",
          message: "Daytona Club Speed credentials tested and saved.",
        });
        refresh();
      },
      onError: (error) => {
        setFeedback({ type: "error", message: error.message || "Unable to save credentials." });
      },
    });
  };

  const handleTest = () => {
    setFeedback(null);
    commitTest({
      variables: {},
      onCompleted: () => {
        setFeedback({ type: "success", message: "Daytona Club Speed login succeeded." });
        refresh();
      },
      onError: (error) => {
        setFeedback({ type: "error", message: error.message || "Unable to test credentials." });
        refresh();
      },
    });
  };

  const handleDelete = () => {
    setFeedback(null);
    commitDelete({
      variables: {},
      onCompleted: () => {
        setUsername("");
        setPassword("");
        setFeedback({ type: "success", message: "Daytona Club Speed credentials deleted." });
        refresh();
      },
      onError: (error) => {
        setFeedback({ type: "error", message: error.message || "Unable to delete credentials." });
      },
    });
  };

  const formattedLastValidatedAt = credentialStatus?.lastValidatedAt
    ? new Date(credentialStatus.lastValidatedAt).toLocaleString()
    : "Not yet tested";

  return (
    <div css={pageStyles}>
      <Card title="Profile">
        <p css={helperTextStyles}>
          Manage data-provider credentials used by import integrations.
        </p>
      </Card>

      <Card title="Daytona Club Speed">
        <div css={providerCardStyles}>
          <p css={helperTextStyles}>
            Configure Daytona Sandown Park Club Speed credentials for session import.
          </p>

          <div css={statusGridStyles}>
            <div>
              <strong>Status:</strong> {credentialStatusLabel}
            </div>
            <div>
              <strong>Saved username:</strong> {savedUsernameLabel}
            </div>
            <div>
              <strong>Last successful test:</strong> {formattedLastValidatedAt}
            </div>
            <div>
              <strong>Last validation error:</strong>{" "}
              {credentialStatus?.lastValidationError ?? "None"}
            </div>
          </div>

          {hasUnreadableSavedCredentials ? (
            <p css={warningTextStyles}>
              Saved credentials were encrypted with a previous key. Enter both username and
              password, then save to test and recover, or delete the saved credentials.
            </p>
          ) : null}

          <div css={fieldGroupStyles}>
            <label htmlFor="profile-daytona-username">
              Username
              <input
                id="profile-daytona-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={isBusy}
                autoComplete="username"
                placeholder={hasUnreadableSavedCredentials ? "Enter username to recover" : ""}
              />
            </label>

            <label htmlFor="profile-daytona-password">
              Password
              <input
                id="profile-daytona-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isBusy}
                autoComplete="current-password"
                placeholder={
                  hasUnreadableSavedCredentials
                    ? "Enter password to recover"
                    : credentialStatus?.configured
                      ? "Enter a new password to replace"
                      : ""
                }
              />
            </label>
          </div>

          {hasUnreadableSavedCredentials ? (
            <p css={helperTextStyles}>
              Credentials are tested before saving and will replace the unreadable saved
              credentials.
            </p>
          ) : hasUnsavedCredentialEdits ? (
            <p css={helperTextStyles}>
              Credentials are tested before saving. Invalid credentials will not be stored.
            </p>
          ) : (
            <p css={helperTextStyles}>
              Credentials are tested before saving. Test saved credentials checks the
              credentials currently stored for your account.
            </p>
          )}

          {feedback ? (
            <p css={feedback.type === "success" ? successTextStyles : errorTextStyles}>
              {feedback.message}
            </p>
          ) : null}

          <div css={actionsStyles}>
            <button
              type="button"
              css={inlineActionButtonStyles}
              onClick={handleSave}
              disabled={isBusy || !username.trim() || !password.trim()}
            >
              {isSaving ? "Testing and saving..." : "Save credentials"}
            </button>
            <span title={testConnectionDisabledReason ?? undefined}>
              <button
                type="button"
                css={inlineActionButtonStyles}
                onClick={handleTest}
                disabled={isTestConnectionDisabled}
              >
                {isTesting ? "Testing..." : "Test saved credentials"}
              </button>
            </span>
            <button
              type="button"
              css={inlineActionButtonStyles}
              onClick={handleDelete}
              disabled={isBusy || !credentialStatus?.configured}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
