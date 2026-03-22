import { describe, expect, it } from "vitest";
import {
  getInitialTrackComparisonSelection,
  normalizeTrackComparisonSelection,
  type TrackComparisonScopeState,
} from "../../../../../src/web/client/components/tracks/trackComparisonState.js";

const scopes: TrackComparisonScopeState[] = [
  {
    key: "gp:k1:Practice",
    sessions: [
      { sessionId: "s3", date: "2024-03-12", isDefaultCurrent: true, isDefaultBaseline: false },
      { sessionId: "s2", date: "2024-03-05", isDefaultCurrent: false, isDefaultBaseline: true },
      { sessionId: "s1", date: "2024-02-26", isDefaultCurrent: false, isDefaultBaseline: false },
    ],
  },
  {
    key: "indy:k2:Race",
    sessions: [{ sessionId: "s4", date: "2024-03-08", isDefaultCurrent: true, isDefaultBaseline: false }],
  },
];

describe("trackComparisonState", () => {
  it("picks the top scope and its default current/baseline sessions", () => {
    expect(getInitialTrackComparisonSelection(scopes)).toEqual({
      scopeKey: "gp:k1:Practice",
      currentSessionId: "s3",
      baselineSessionId: "s2",
    });
  });

  it("resets to default selections when the chosen scope disappears", () => {
    expect(
      normalizeTrackComparisonSelection(scopes, {
        scopeKey: "missing",
        currentSessionId: "missing",
        baselineSessionId: "missing",
      })
    ).toEqual({
      scopeKey: "gp:k1:Practice",
      currentSessionId: "s3",
      baselineSessionId: "s2",
    });
  });

  it("drops invalid baseline selections and leaves single-session scopes without a baseline", () => {
    expect(
      normalizeTrackComparisonSelection(scopes, {
        scopeKey: "indy:k2:Race",
        currentSessionId: "s4",
        baselineSessionId: "s4",
      })
    ).toEqual({
      scopeKey: "indy:k2:Race",
      currentSessionId: "s4",
      baselineSessionId: "",
    });
  });
});
