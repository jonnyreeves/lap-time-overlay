import assert from "assert";
import { describe, it, beforeEach, afterEach } from "vitest";
import { setupTestDb, teardownTestDb } from "../db/test_setup.js";
import {
  createUser,
  findUserById,
  findUserByUsername,
  listUsers,
  normalizeUsername,
  countAdminUsers,
  updateUserAdminStatus,
  type UserRecord,
} from "../../src/db/users.js";

describe("users", () => {
  beforeEach(() => {
    setupTestDb();
  });

  afterEach(() => {
    teardownTestDb();
  });

  it("can create a user", () => {
    const user = createUser("testuser", "hashedpassword");
    assert.strictEqual(user.username, "testuser");
    assert.strictEqual(user.passwordHash, "hashedpassword");
    assert.ok(user.id);
    assert.ok(user.createdAt);
    assert.ok(user.updatedAt);
    assert.strictEqual(user.isAdmin, true);
  });

  it("normalizes username correctly", () => {
    assert.strictEqual(normalizeUsername("  TESTUser123  "), "testuser123");
  });

  it("can find a user by username", () => {
    const createdUser = createUser("findme", "hash");
    const foundUser = findUserByUsername("FindMe"); // Test case-insensitivity

    assert.deepStrictEqual(foundUser, createdUser);
  });

  it("returns null if user by username is not found", () => {
    const foundUser = findUserByUsername("nonexistent");
    assert.strictEqual(foundUser, null);
  });

  it("can find a user by id", () => {
    const createdUser = createUser("idtest", "hash");
    const foundUser = findUserById(createdUser.id);

    assert.deepStrictEqual(foundUser, createdUser);
  });

  it("returns null if user by id is not found", () => {
    const foundUser = findUserById("non-existent-id");
    assert.strictEqual(foundUser, null);
  });

  it("lists users sorted by username", () => {
    const first = createUser("zeta", "hash1");
    const second = createUser("alpha", "hash2");

    const users = listUsers();
    assert.deepStrictEqual(
      users.map((u) => u.id),
      [second.id, first.id]
    );
  });

  it("counts admins separately from regular users", () => {
    createUser("admin", "hash");
    createUser("nonadmin", "hash", undefined, false);
    assert.strictEqual(countAdminUsers(), 1);
  });

  it("updates the admin flag for a user", () => {
    const user = createUser("toggle", "hash");
    assert.strictEqual(user.isAdmin, true);
    const updated = updateUserAdminStatus(user.id, false);
    assert.strictEqual(updated?.isAdmin, false);
    assert.strictEqual(countAdminUsers(), 0);
  });
});
