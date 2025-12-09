import assert from "assert";
import { describe, it, beforeEach, afterEach } from "vitest";
import { setupTestDb, teardownTestDb } from "../db/test_setup.js";
import { createUser, findUserById, findUserByUsername, normalizeUsername, type UserRecord } from "../../src/db/users.js";

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
});
