import { describe, expect, it } from "vitest";
import {
  type SessionOverviewFormState,
  validateSessionOverviewForm,
} from "../../../../../src/web/client/components/session/sessionOverviewForm.js";

const baseForm: SessionOverviewFormState = {
  trackId: "c1",
  trackLayoutId: "l1",
  kartId: "k1",
  format: "Practice",
  date: "2024-01-01",
  time: "10:00",
  conditions: "Dry",
  classification: "1",
  fastestLap: "",
  notes: "Notes",
};

describe("validateSessionOverviewForm", () => {
  it("builds the payload when all fields are valid", () => {
    const result = validateSessionOverviewForm(baseForm);
    expect(result.error).toBeNull();
    expect(result.payload).toEqual({
      trackId: "c1",
      format: "Practice",
      date: "2024-01-01T10:00",
      classification: 1,
      conditions: "Dry",
      trackLayoutId: "l1",
      kartId: "k1",
      notes: "Notes",
      fastestLap: null,
    });
  });

  it("rejects when classification is below 1", () => {
    const result = validateSessionOverviewForm({ ...baseForm, classification: "0" });
    expect(result.error).toBe("Classification must be 1 or higher.");
  });

  it("rejects when date or time is missing", () => {
    const result = validateSessionOverviewForm({ ...baseForm, time: "" });
    expect(result.error).toBe("Please provide both date and start time.");
  });

  it("rejects when kart is missing", () => {
    const result = validateSessionOverviewForm({ ...baseForm, kartId: "" });
    expect(result.error).toBe("Please select a kart.");
  });
});
