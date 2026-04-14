import { afterEach, describe, expect, it } from "vitest";
import { setupTestDb, teardownTestDb } from "../../db/test_setup.js";
import {
  getWeatherApiKey,
  getWeatherApiSettings,
  setWeatherApiKey,
} from "../../../src/web/settings/weatherApi.js";

describe("weather API settings", () => {
  afterEach(() => {
    teardownTestDb();
  });

  it("stores the WeatherAPI key in app settings", () => {
    setupTestDb();

    expect(getWeatherApiKey()).toBeNull();
    expect(getWeatherApiSettings()).toEqual({ configured: false, updatedAt: null });

    const saved = setWeatherApiKey(" test-key ");
    expect(saved.configured).toBe(true);
    expect(saved.updatedAt).toEqual(expect.any(Number));
    expect(getWeatherApiKey()).toBe("test-key");
    expect(getWeatherApiSettings().configured).toBe(true);
  });

  it("treats a blank key as unconfigured", () => {
    setupTestDb();

    const saved = setWeatherApiKey("   ");
    expect(saved.configured).toBe(false);
    expect(getWeatherApiKey()).toBeNull();
    expect(getWeatherApiSettings().configured).toBe(false);
  });
});
