import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const DEFAULT_SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, keyLength: 64 };

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(
    password,
    salt,
    DEFAULT_SCRYPT_PARAMS.keyLength,
    DEFAULT_SCRYPT_PARAMS
  );
  const saltB64 = salt.toString("base64");
  const keyB64 = key.toString("base64");
  return `scrypt:${DEFAULT_SCRYPT_PARAMS.N}:${DEFAULT_SCRYPT_PARAMS.r}:${DEFAULT_SCRYPT_PARAMS.p}:${saltB64}:${keyB64}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const parts = encoded.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, NRaw, rRaw, pRaw, saltB64, keyB64] = parts;
  const N = Number(NRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) {
    return false;
  }

  try {
    const salt = Buffer.from(saltB64, "base64");
    const key = Buffer.from(keyB64, "base64");
    const derived = scryptSync(password, salt, key.length, { N, r, p });
    return timingSafeEqual(key, derived);
  } catch {
    return false;
  }
}
