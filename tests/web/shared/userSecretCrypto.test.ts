import { afterEach, describe, expect, it } from "vitest";
import {
  decryptUserSecret,
  encryptUserSecret,
  generateUserSecretEncryptionKeyCandidates,
  UserSecretConfigError,
  UserSecretDecryptionError,
  validateUserSecretEncryptionKey,
} from "../../../src/web/shared/userSecretCrypto.js";

const originalKey = process.env.USER_SECRET_ENCRYPTION_KEY;

describe("userSecretCrypto", () => {
  afterEach(() => {
    if (originalKey == null) {
      delete process.env.USER_SECRET_ENCRYPTION_KEY;
    } else {
      process.env.USER_SECRET_ENCRYPTION_KEY = originalKey;
    }
  });

  it("encrypts and decrypts user secrets", () => {
    process.env.USER_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64url");

    const encrypted = encryptUserSecret("clubspeed-password");

    expect(encrypted).not.toContain("clubspeed-password");
    expect(decryptUserSecret(encrypted)).toBe("clubspeed-password");
  });

  it("validates a 32-byte encryption key", () => {
    process.env.USER_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64url");

    expect(validateUserSecretEncryptionKey()).toHaveLength(32);
  });

  it("fails clearly when validating a missing encryption key", () => {
    delete process.env.USER_SECRET_ENCRYPTION_KEY;

    expect(() => validateUserSecretEncryptionKey()).toThrow(UserSecretConfigError);
    expect(() => validateUserSecretEncryptionKey()).toThrow(
      "Missing USER_SECRET_ENCRYPTION_KEY"
    );
  });

  it("fails clearly when validating an incorrectly sized encryption key", () => {
    process.env.USER_SECRET_ENCRYPTION_KEY = Buffer.alloc(31, 7).toString("base64url");

    expect(() => validateUserSecretEncryptionKey()).toThrow(UserSecretConfigError);
    expect(() => validateUserSecretEncryptionKey()).toThrow(
      "USER_SECRET_ENCRYPTION_KEY must decode to exactly 32 bytes"
    );
  });

  it("generates three unique valid encryption key candidates", () => {
    const candidates = generateUserSecretEncryptionKeyCandidates();

    expect(candidates).toHaveLength(3);
    expect(new Set(candidates).size).toBe(3);
    for (const candidate of candidates) {
      expect(Buffer.from(candidate, "base64url")).toHaveLength(32);
    }
  });

  it("fails clearly when the encryption key is missing", () => {
    delete process.env.USER_SECRET_ENCRYPTION_KEY;

    expect(() => encryptUserSecret("clubspeed-password")).toThrow(UserSecretConfigError);
    expect(() => encryptUserSecret("clubspeed-password")).toThrow(
      "Missing USER_SECRET_ENCRYPTION_KEY"
    );
  });

  it("fails clearly when the payload is malformed", () => {
    process.env.USER_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64url");

    expect(() => decryptUserSecret("bad-payload")).toThrow(UserSecretDecryptionError);
    expect(() => decryptUserSecret("bad-payload")).toThrow(
      "Invalid encrypted user secret payload"
    );
  });

  it("fails with safe metadata when the encryption key changed", () => {
    process.env.USER_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64url");
    const encrypted = encryptUserSecret("clubspeed-password");

    process.env.USER_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 10).toString("base64url");

    let thrown: unknown;
    try {
      decryptUserSecret(encrypted);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(UserSecretDecryptionError);
    expect(thrown).toMatchObject({
      reason: "DECRYPT_FAILED",
      payloadSummary: {
        version: "v1",
        segmentCount: 4,
        ivBytes: 12,
        authTagBytes: 16,
      },
    });
  });
});
