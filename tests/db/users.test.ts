import assert from "assert";
import { describe, it, beforeEach } from "vitest";
import { getDb, setDb } from "../../src/db/client.js";
import { createUser, findUserById, findUserByUsername, normalizeUsername, type UserRecord } from "../../src/db/users.js";
import Database from "better-sqlite3";
import { migration } from "../../src/db/migrations/01_create_users.js";

describe("users", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    setDb(db);
    migration.up(db); // Apply user migration
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
