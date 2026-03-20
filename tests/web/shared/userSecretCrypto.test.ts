import { afterEach, describe, expect, it } from "vitest";
import {
  decryptUserSecret,
  encryptUserSecret,
  UserSecretConfigError,
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

  it("fails clearly when the encryption key is missing", () => {
    delete process.env.USER_SECRET_ENCRYPTION_KEY;

    expect(() => encryptUserSecret("clubspeed-password")).toThrow(UserSecretConfigError);
    expect(() => encryptUserSecret("clubspeed-password")).toThrow(
      "Missing USER_SECRET_ENCRYPTION_KEY"
    );
  });

  it("fails clearly when the payload is malformed", () => {
    process.env.USER_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64url");

    expect(() => decryptUserSecret("bad-payload")).toThrow(UserSecretConfigError);
    expect(() => decryptUserSecret("bad-payload")).toThrow(
      "Invalid encrypted user secret payload"
    );
  });
});
