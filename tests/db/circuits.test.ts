import assert from "assert";
import { describe, it, beforeEach } from "vitest";
import { getDb, setDb } from "../../src/db/client.js";
import { createCircuit, findCircuitById, findCircuitsByUserId, type CircuitRecord } from "../../src/db/circuits.js";
import { createUser, type UserRecord } from "../../src/web/auth/users.js";
import Database from "better-sqlite3";
import { migration } from "../../src/db/migrations/01_create_users.js";
import { migration as circuitMigration } from "../../src/db/migrations/03_create_circuits.js";


describe("circuits", () => {
  let user: UserRecord;
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    setDb(db);
    migration.up(db); // Apply user migration
    circuitMigration.up(db); // Apply circuit migration
    user = createUser("testuser", "hashedpassword");
  });

  it("can create a circuit", () => {
    const circuit = createCircuit("Test Circuit", user.id, "http://example.com/hero.jpg");
    assert.strictEqual(circuit.name, "Test Circuit");
    assert.strictEqual(circuit.userId, user.id);
    assert.strictEqual(circuit.heroImage, "http://example.com/hero.jpg");
    assert.ok(circuit.id);
    assert.ok(circuit.createdAt);
    assert.ok(circuit.updatedAt);
  });

  it("can create a circuit with null heroImage", () => {
    const circuit = createCircuit("Circuit without Hero", user.id);
    assert.strictEqual(circuit.name, "Circuit without Hero");
    assert.strictEqual(circuit.userId, user.id);
    assert.strictEqual(circuit.heroImage, null);
  });

  it("can find a circuit by id", () => {
    const createdCircuit = createCircuit("Findable Circuit", user.id);
    const foundCircuit = findCircuitById(createdCircuit.id);

    assert.deepStrictEqual(foundCircuit, createdCircuit);
  });

  it("returns null if circuit by id is not found", () => {
    const foundCircuit = findCircuitById("non-existent-id");
    assert.strictEqual(foundCircuit, null);
  });

  it("can find circuits by user id", () => {
    const circuit1 = createCircuit("User Circuit 1", user.id, null, Date.now() - 1000); // Older
    const circuit2 = createCircuit("User Circuit 2", user.id, null, Date.now());       // Newer
    const otherUser = createUser("otheruser", "hashedpassword"); // Create other user
    createCircuit("Other User Circuit", otherUser.id);

    const userCircuits = findCircuitsByUserId(user.id);
    assert.strictEqual(userCircuits.length, 2);
    assert.deepStrictEqual(userCircuits[0], circuit2); // Newest first
    assert.deepStrictEqual(userCircuits[1], circuit1);
  });

  it("returns empty array if no circuits found for user id", () => {
    const userCircuits = findCircuitsByUserId("non-existent-user");
    assert.deepStrictEqual(userCircuits, []);
  });

  it("deleting a user cascades to deleting their circuits", () => {
    const circuit = createCircuit("Circuit to be deleted", user.id);
    assert.ok(findCircuitById(circuit.id));

    // Simulate user deletion (direct SQL for now, as no deleteUser function exists)
    db.prepare(`DELETE FROM users WHERE id = ?`).run(user.id);

    assert.strictEqual(findCircuitById(circuit.id), null);
    assert.deepStrictEqual(findCircuitsByUserId(user.id), []);
  });
});
