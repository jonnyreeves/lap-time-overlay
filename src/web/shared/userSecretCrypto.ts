import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const USER_SECRET_ENCRYPTION_KEY_ENV = "USER_SECRET_ENCRYPTION_KEY";
const USER_SECRET_FORMAT_VERSION = "v1";
const IV_BYTES = 12;

export class UserSecretConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserSecretConfigError";
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

function getEncryptionKey(): Buffer {
  const raw = process.env[USER_SECRET_ENCRYPTION_KEY_ENV]?.trim() ?? "";
  if (!raw) {
    throw new UserSecretConfigError(
      `Missing ${USER_SECRET_ENCRYPTION_KEY_ENV} environment variable`
    );
  }

  const key = decodeBase64Url(raw);
  if (key.length !== 32) {
    throw new UserSecretConfigError(
      `${USER_SECRET_ENCRYPTION_KEY_ENV} must decode to exactly 32 bytes`
    );
  }

  return key;
}

export function encryptUserSecret(value: string): string {
  const plaintext = value.trim();
  if (!plaintext) {
    throw new UserSecretConfigError("Cannot encrypt an empty user secret");
  }

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
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
  if (
    version !== USER_SECRET_FORMAT_VERSION ||
    !ivRaw ||
    !authTagRaw ||
    !ciphertextRaw
  ) {
    throw new UserSecretConfigError("Invalid encrypted user secret payload");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    decodeBase64Url(ivRaw)
  );
  decipher.setAuthTag(decodeBase64Url(authTagRaw));
  const plaintext = Buffer.concat([
    decipher.update(decodeBase64Url(ciphertextRaw)),
    decipher.final(),
  ]).toString("utf8");

  if (!plaintext.trim()) {
    throw new UserSecretConfigError("Decrypted user secret was empty");
  }

  return plaintext;
}
