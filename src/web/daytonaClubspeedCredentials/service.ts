import {
  userDaytonaClubspeedCredentialsRepository,
  type UserDaytonaClubspeedCredentialRecord,
} from "../../db/user_daytona_clubspeed_credentials.js";
import { SessionImportError } from "../sessionImport/types.js";
import {
  decryptUserSecret,
  encryptUserSecret,
  UserSecretDecryptionError,
} from "../shared/userSecretCrypto.js";

export type DaytonaClubspeedCredentials = {
  username: string;
  password: string;
};

export type DaytonaClubspeedCredentialStatus = {
  configured: boolean;
  username: string | null;
  lastValidatedAt: number | null;
  lastValidationError: string | null;
};

export const DAYTONA_CLUBSPEED_CREDENTIALS_UNREADABLE_MESSAGE =
  "Saved Daytona Club Speed credentials cannot be decrypted. They may have been saved with a previous USER_SECRET_ENCRYPTION_KEY. Re-enter them in your profile to recover.";

function normalizeCredentialValue(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function logCredentialDecryptionFailure(
  record: UserDaytonaClubspeedCredentialRecord,
  field: "username" | "password",
  operation: "status" | "credentials",
  error: UserSecretDecryptionError
): void {
  console.warn("Failed to decrypt Daytona Club Speed credential", {
    userId: record.userId,
    field,
    operation,
    reason: error.reason,
    payloadSummary: error.payloadSummary,
    credentialCreatedAt: record.createdAt,
    credentialUpdatedAt: record.updatedAt,
  });
}

function decryptCredentialField(
  record: UserDaytonaClubspeedCredentialRecord,
  field: "username" | "password",
  operation: "status" | "credentials"
): string {
  const encrypted =
    field === "username" ? record.usernameEncrypted : record.passwordEncrypted;
  try {
    return decryptUserSecret(encrypted);
  } catch (error) {
    if (error instanceof UserSecretDecryptionError) {
      logCredentialDecryptionFailure(record, field, operation, error);
      throw new SessionImportError(
        DAYTONA_CLUBSPEED_CREDENTIALS_UNREADABLE_MESSAGE,
        "CONFIG_REQUIRED"
      );
    }
    throw error;
  }
}

function toStatus(
  record: UserDaytonaClubspeedCredentialRecord | null
): DaytonaClubspeedCredentialStatus {
  if (!record) {
    return {
      configured: false,
      username: null,
      lastValidatedAt: null,
      lastValidationError: null,
    };
  }

  let username: string | null;
  let lastValidationError = record.lastValidationError;
  try {
    username = decryptCredentialField(record, "username", "status");
  } catch (error) {
    if (!(error instanceof SessionImportError)) {
      throw error;
    }
    username = null;
    lastValidationError = DAYTONA_CLUBSPEED_CREDENTIALS_UNREADABLE_MESSAGE;
  }

  return {
    configured: true,
    username,
    lastValidatedAt: record.lastValidatedAt,
    lastValidationError,
  };
}

export function getViewerDaytonaClubspeedCredentialStatus(
  userId: string
): DaytonaClubspeedCredentialStatus {
  return toStatus(userDaytonaClubspeedCredentialsRepository.findByUserId(userId));
}

export function getViewerDaytonaClubspeedCredentialsOrThrow(
  userId: string
): DaytonaClubspeedCredentials {
  const record = userDaytonaClubspeedCredentialsRepository.findByUserId(userId);
  if (!record) {
    throw new SessionImportError(
      "Daytona Club Speed credentials are not configured. Add them in your profile.",
      "CONFIG_REQUIRED"
    );
  }

  return {
    username: decryptCredentialField(record, "username", "credentials"),
    password: decryptCredentialField(record, "password", "credentials"),
  };
}

export function saveViewerDaytonaClubspeedCredentials(
  userId: string,
  usernameRaw: string,
  passwordRaw: string,
  now = Date.now()
): DaytonaClubspeedCredentialStatus {
  const username = normalizeCredentialValue(usernameRaw);
  const password = normalizeCredentialValue(passwordRaw);
  if (!username || !password) {
    throw new SessionImportError(
      "Daytona Club Speed username and password are required",
      "CONFIG_REQUIRED"
    );
  }

  const record = userDaytonaClubspeedCredentialsRepository.upsert(
    userId,
    encryptUserSecret(username),
    encryptUserSecret(password),
    now
  );

  return toStatus(record);
}

export function deleteViewerDaytonaClubspeedCredentials(userId: string): boolean {
  return userDaytonaClubspeedCredentialsRepository.delete(userId);
}

export function markViewerDaytonaClubspeedCredentialsValidated(
  userId: string,
  now = Date.now()
): DaytonaClubspeedCredentialStatus {
  const updated = userDaytonaClubspeedCredentialsRepository.updateValidation(
    userId,
    { lastValidatedAt: now, lastValidationError: null },
    now
  );
  return toStatus(updated);
}

export function markViewerDaytonaClubspeedCredentialInvalid(
  userId: string,
  errorMessage: string,
  now = Date.now()
): DaytonaClubspeedCredentialStatus {
  const updated = userDaytonaClubspeedCredentialsRepository.updateValidation(
    userId,
    { lastValidatedAt: null, lastValidationError: errorMessage },
    now
  );
  return toStatus(updated);
}
