export type TrackComparisonScopeState = {
  key: string;
  sessions: ReadonlyArray<{
    sessionId: string;
    date: string;
    isDefaultCurrent: boolean;
    isDefaultBaseline: boolean;
  }>;
};

export type TrackComparisonSelectionState = {
  scopeKey: string;
  currentSessionId: string;
  baselineSessionId: string;
};

export function getDefaultScopeKey(scopes: ReadonlyArray<TrackComparisonScopeState>): string {
  return scopes[0]?.key ?? "";
}

export function getScopeByKey(
  scopes: ReadonlyArray<TrackComparisonScopeState>,
  scopeKey: string
): TrackComparisonScopeState | null {
  return scopes.find((scope) => scope.key === scopeKey) ?? null;
}

export function getDefaultCurrentSessionId(scope: TrackComparisonScopeState | null): string {
  if (!scope) return "";
  return scope.sessions.find((session) => session.isDefaultCurrent)?.sessionId ?? scope.sessions[0]?.sessionId ?? "";
}

export function getDefaultBaselineSessionId(
  scope: TrackComparisonScopeState | null,
  currentSessionId?: string
): string {
  if (!scope) return "";
  const currentId = currentSessionId ?? getDefaultCurrentSessionId(scope);
  const currentSession = scope.sessions.find((session) => session.sessionId === currentId) ?? null;
  const currentTime = currentSession ? Date.parse(currentSession.date) : Number.NaN;
  return (
    scope.sessions.find(
      (session) => session.isDefaultBaseline && session.sessionId !== currentId
    )?.sessionId ??
    scope.sessions.find(
      (session) =>
        session.sessionId !== currentId &&
        Number.isFinite(currentTime) &&
        Date.parse(session.date) < currentTime
    )?.sessionId ??
    scope.sessions.find((session) => session.sessionId !== currentId)?.sessionId ??
    ""
  );
}

export function getInitialTrackComparisonSelection(
  scopes: ReadonlyArray<TrackComparisonScopeState>
): TrackComparisonSelectionState {
  const scopeKey = getDefaultScopeKey(scopes);
  const scope = getScopeByKey(scopes, scopeKey);
  const currentSessionId = getDefaultCurrentSessionId(scope);
  return {
    scopeKey,
    currentSessionId,
    baselineSessionId: getDefaultBaselineSessionId(scope, currentSessionId),
  };
}

export function normalizeTrackComparisonSelection(
  scopes: ReadonlyArray<TrackComparisonScopeState>,
  current: TrackComparisonSelectionState
): TrackComparisonSelectionState {
  const scope = getScopeByKey(scopes, current.scopeKey);
  if (!scope) {
    return getInitialTrackComparisonSelection(scopes);
  }

  const currentSessionId = scope.sessions.some((session) => session.sessionId === current.currentSessionId)
    ? current.currentSessionId
    : getDefaultCurrentSessionId(scope);

  const baselineSessionId =
    current.baselineSessionId &&
    current.baselineSessionId !== currentSessionId &&
    scope.sessions.some((session) => session.sessionId === current.baselineSessionId)
      ? current.baselineSessionId
      : getDefaultBaselineSessionId(scope, currentSessionId);

  return {
    scopeKey: scope.key,
    currentSessionId,
    baselineSessionId,
  };
}
