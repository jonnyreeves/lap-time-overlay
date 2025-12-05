import assert from "assert";
import { describe, it, beforeEach } from "vitest";
import { getDb, setDb } from "../../src/db/client.js";
import Database from "better-sqlite3";
import { migration as circuitMigration } from "../../src/db/migrations/03_create_circuits.js";
import { createCircuit, findAllCircuits, findCircuitById, type CircuitRecord } from "../../src/db/circuits.js";

describe("circuits", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    setDb(db);
    circuitMigration.up(db);
  });

  it("can create a circuit", () => {
    const circuit = createCircuit("Test Circuit", "http://example.com/hero.jpg");
    assert.strictEqual(circuit.name, "Test Circuit");
    assert.strictEqual(circuit.heroImage, "http://example.com/hero.jpg");
    assert.ok(circuit.id);
    assert.ok(circuit.createdAt);
    assert.ok(circuit.updatedAt);
  });

  it("can create a circuit with null heroImage", () => {
    const circuit = createCircuit("Circuit without Hero");
    assert.strictEqual(circuit.heroImage, null);
  });

  it("can find a circuit by id", () => {
    const createdCircuit = createCircuit("Findable Circuit");
    const foundCircuit = findCircuitById(createdCircuit.id);

    assert.deepStrictEqual(foundCircuit, createdCircuit);
  });

  it("returns null if circuit by id is not found", () => {
    const foundCircuit = findCircuitById("non-existent-id");
    assert.strictEqual(foundCircuit, null);
  });

  it("returns all circuits ordered by creation time", () => {
    const now = Date.now();
    const circuit1 = createCircuit("Older Circuit", null, now - 1000);
    const circuit2 = createCircuit("Newer Circuit", null, now);

    const circuits: CircuitRecord[] = findAllCircuits();
    assert.strictEqual(circuits.length, 2);
    assert.deepStrictEqual(circuits[0], circuit2);
    assert.deepStrictEqual(circuits[1], circuit1);
  });
});
