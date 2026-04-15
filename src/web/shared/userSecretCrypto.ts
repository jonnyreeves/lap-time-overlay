import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const USER_SECRET_ENCRYPTION_KEY_ENV = "USER_SECRET_ENCRYPTION_KEY";
const USER_SECRET_FORMAT_VERSION = "v1";
const IV_BYTES = 12;
const USER_SECRET_ENCRYPTION_KEY_BYTES = 32;

export class UserSecretConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserSecretConfigError";
  }
}

export type UserSecretPayloadSummary = {
  version: string | null;
  segmentCount: number;
  ivBytes: number | null;
  authTagBytes: number | null;
  ciphertextBytes: number | null;
};

export class UserSecretDecryptionError extends Error {
  readonly reason: "INVALID_PAYLOAD" | "DECRYPT_FAILED" | "EMPTY_PLAINTEXT";
  readonly payloadSummary: UserSecretPayloadSummary;
  readonly cause?: unknown;

  constructor(
    message: string,
    input: {
      reason: UserSecretDecryptionError["reason"];
      payloadSummary: UserSecretPayloadSummary;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = "UserSecretDecryptionError";
    this.reason = input.reason;
    this.payloadSummary = input.payloadSummary;
    this.cause = input.cause;
  }
}

function decodeBase64Url(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64");
}

function encodeBase64Url(value: Buffer): string {
  return value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function safeDecodeBase64UrlBytes(value: string | undefined): number | null {
  if (!value) return null;
  try {
    return decodeBase64Url(value).length;
  } catch {
    return null;
  }
}

function summarizeEncryptedUserSecretPayload(encoded: string): UserSecretPayloadSummary {
  const [version, ivRaw, authTagRaw, ciphertextRaw] = encoded.split(":");
  return {
    version: version || null,
    segmentCount: encoded.split(":").length,
    ivBytes: safeDecodeBase64UrlBytes(ivRaw),
    authTagBytes: safeDecodeBase64UrlBytes(authTagRaw),
    ciphertextBytes: safeDecodeBase64UrlBytes(ciphertextRaw),
  };
}

export function validateUserSecretEncryptionKey(): Buffer {
  const raw = process.env[USER_SECRET_ENCRYPTION_KEY_ENV]?.trim() ?? "";
  if (!raw) {
    throw new UserSecretConfigError(
      `Missing ${USER_SECRET_ENCRYPTION_KEY_ENV} environment variable`
    );
  }

  const key = decodeBase64Url(raw);
  if (key.length !== USER_SECRET_ENCRYPTION_KEY_BYTES) {
    throw new UserSecretConfigError(
      `${USER_SECRET_ENCRYPTION_KEY_ENV} must decode to exactly ${USER_SECRET_ENCRYPTION_KEY_BYTES} bytes`
    );
  }

  return key;
}

export function generateUserSecretEncryptionKey(): string {
  return randomBytes(USER_SECRET_ENCRYPTION_KEY_BYTES).toString("base64url");
}

export function generateUserSecretEncryptionKeyCandidates(count = 3): string[] {
  const candidates = new Set<string>();
  while (candidates.size < count) {
    candidates.add(generateUserSecretEncryptionKey());
  }
  return [...candidates];
}

export function encryptUserSecret(value: string): string {
  const plaintext = value.trim();
  if (!plaintext) {
    throw new UserSecretConfigError("Cannot encrypt an empty user secret");
  }

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", validateUserSecretEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    USER_SECRET_FORMAT_VERSION,
    encodeBase64Url(iv),
    encodeBase64Url(authTag),
    encodeBase64Url(ciphertext),
  ].join(":");
}

export function decryptUserSecret(encoded: string): string {
  const [version, ivRaw, authTagRaw, ciphertextRaw] = encoded.split(":");
  const payloadSummary = summarizeEncryptedUserSecretPayload(encoded);
  if (
    version !== USER_SECRET_FORMAT_VERSION ||
    !ivRaw ||
    !authTagRaw ||
    !ciphertextRaw
  ) {
    throw new UserSecretDecryptionError("Invalid encrypted user secret payload", {
      reason: "INVALID_PAYLOAD",
      payloadSummary,
    });
  }

  const key = validateUserSecretEncryptionKey();
  let plaintext: string;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, decodeBase64Url(ivRaw));
    decipher.setAuthTag(decodeBase64Url(authTagRaw));
    plaintext = Buffer.concat([
      decipher.update(decodeBase64Url(ciphertextRaw)),
      decipher.final(),
    ]).toString("utf8");
  } catch (error) {
    throw new UserSecretDecryptionError("Unable to decrypt user secret", {
      reason: "DECRYPT_FAILED",
      payloadSummary,
      cause: error,
    });
  }

  if (!plaintext.trim()) {
    throw new UserSecretDecryptionError("Decrypted user secret was empty", {
      reason: "EMPTY_PLAINTEXT",
      payloadSummary,
    });
  }

  return plaintext;
}
