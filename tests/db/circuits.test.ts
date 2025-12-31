import assert from "assert";
import { describe, it, beforeEach, afterEach } from "vitest";
import { setupTestDb, teardownTestDb } from "../db/test_setup.js";
import { createTrack, findAllTracks, findTrackById, type TrackRecord } from "../../src/db/tracks.js";

describe("tracks", () => {
  beforeEach(() => {
    setupTestDb();
  });

  afterEach(() => {
    teardownTestDb();
  });

  it("can create a track", () => {
    const track = createTrack("Test Circuit", "http://example.com/hero.jpg", undefined, "SW1A 1AA");
    assert.strictEqual(track.name, "Test Circuit");
    assert.strictEqual(track.heroImage, "http://example.com/hero.jpg");
    assert.strictEqual(track.postcode, "SW1A 1AA");
    assert.ok(track.id);
    assert.ok(track.createdAt);
    assert.ok(track.updatedAt);
  });

  it("can create a track with null heroImage", () => {
    const track = createTrack("Circuit without Hero");
    assert.strictEqual(track.heroImage, null);
    assert.strictEqual(track.postcode, null);
  });

  it("can find a track by id", () => {
    const createdCircuit = createTrack("Findable Circuit");
    const foundCircuit = findTrackById(createdCircuit.id);

    assert.deepStrictEqual(foundCircuit, createdCircuit);
  });

  it("returns null if track by id is not found", () => {
    const foundCircuit = findTrackById("non-existent-id");
    assert.strictEqual(foundCircuit, null);
  });

  it("returns all tracks ordered by creation time", () => {
    const now = Date.now();
    const track1 = createTrack("Older Circuit", null, now - 1000);
    const track2 = createTrack("Newer Circuit", null, now);

    const tracks: TrackRecord[] = findAllTracks();
    assert.strictEqual(tracks.length, 2);
    assert.deepStrictEqual(tracks[0], track2);
    assert.deepStrictEqual(tracks[1], track1);
  });
});
