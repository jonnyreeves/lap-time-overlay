import {
  userDaytonaClubspeedCredentialsRepository,
  type UserDaytonaClubspeedCredentialRecord,
} from "../../db/user_daytona_clubspeed_credentials.js";
import { SessionImportError } from "../sessionImport/types.js";
import {
  decryptUserSecret,
  encryptUserSecret,
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

function normalizeCredentialValue(value: string | null | undefined): string {
  return value?.trim() ?? "";
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

  return {
    configured: true,
    username: decryptUserSecret(record.usernameEncrypted),
    lastValidatedAt: record.lastValidatedAt,
    lastValidationError: record.lastValidationError,
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
    username: decryptUserSecret(record.usernameEncrypted),
    password: decryptUserSecret(record.passwordEncrypted),
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
