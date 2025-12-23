import { hashPassword, verifyPassword } from "./password.js";
import {
  createSession,
  deleteSession,
  getSession,
  slideSession,
} from "../../db/sessions.js";
import {
  createUser,
  findUserById,
  findUserByUsername,
  listUsers,
  normalizeUsername,
  countAdminUsers,
  updateUserAdminStatus,
  type UserRecord,
} from "../../db/users.js";

export interface PublicUser {
  id: string;
  username: string;
  createdAt: number;
  isAdmin: boolean;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
  expiresAt: number;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: "VALIDATION_FAILED" | "INVALID_CREDENTIALS" | "USER_EXISTS"
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    isAdmin: user.isAdmin,
  };
}

export function validateCredentials(
  usernameRaw: string,
  password: string
): { username: string } {
  const username = usernameRaw.trim();
  const normalized = normalizeUsername(username);
  const usernamePattern = /^[a-z0-9._-]{3,32}$/;
  if (!usernamePattern.test(normalized)) {
    throw new AuthError(
      "Username must be 3-32 chars (a-z, 0-9, ., _, -)",
      "VALIDATION_FAILED"
    );
  }
  if (password.length < 3) {
    throw new AuthError("Password must be at least 3 characters", "VALIDATION_FAILED");
  }
  return { username };
}

export function registerUser(
  usernameRaw: string,
  password: string,
  now = Date.now()
): AuthResult {
  const { username } = validateCredentials(usernameRaw, password);
  const existing = findUserByUsername(username);
  if (existing) {
    throw new AuthError("User already exists", "USER_EXISTS");
  }
  const passwordHash = hashPassword(password);
  const user = createUser(username, passwordHash, now);
  const session = createSession(user.id, now);
  return { user: toPublicUser(user), token: session.token, expiresAt: session.expiresAt };
}

export function loginUser(
  usernameRaw: string,
  password: string,
  now = Date.now()
): AuthResult {
  validateCredentials(usernameRaw, password);
  const user = findUserByUsername(usernameRaw);
  if (!user) {
    throw new AuthError("Invalid credentials", "INVALID_CREDENTIALS");
  }
  const ok = verifyPassword(password, user.passwordHash);
  if (!ok) {
    throw new AuthError("Invalid credentials", "INVALID_CREDENTIALS");
  }
  const session = createSession(user.id, now);
  return { user: toPublicUser(user), token: session.token, expiresAt: session.expiresAt };
}

export function loadUserFromSession(
  token: string,
  now = Date.now()
): { user: PublicUser; expiresAt: number } | null {
  const session = getSession(token);
  if (!session) return null;
  if (session.expiresAt <= now) {
    endSession(token);
    return null;
  }
  const user = findUserById(session.userId);
  if (!user) return null;
  return { user: toPublicUser(user), expiresAt: session.expiresAt };
}

export function refreshSession(token: string, now = Date.now()): number | null {
  return slideSession(token, now);
}

export function endSession(token: string): void {
  deleteSession(token);
}

export function listPublicUsers(): PublicUser[] {
  return listUsers().map(toPublicUser);
}

export function listLocalUsers(): UserRecord[] {
  return listUsers();
}

export function getAdminUserCount(): number {
  return countAdminUsers();
}

export function setUserAdminFlag(userId: string, isAdmin: boolean): UserRecord | null {
  return updateUserAdminStatus(userId, isAdmin);
}

export function getUserById(userId: string): UserRecord | null {
  return findUserById(userId);
}
