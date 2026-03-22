/**
 * @generated SignedSource<<2d42d32b896fa60f75328373c436c06d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type SelfComparisonConfidence = "HIGH" | "MEDIUM" | "%future added value";
export type SelfComparisonInsightLabel = "COMPARISON_ADVANTAGE" | "CURRENT_ADVANTAGE" | "MIXED_OR_NEUTRAL" | "%future added value";
export type SelfComparisonLapOutcome = "COMPARISON_FASTER" | "CURRENT_FASTER" | "TIE" | "%future added value";
export type SelfComparisonTrendDirection = "FLAT" | "IMPROVING" | "INSUFFICIENT" | "REGRESSING" | "%future added value";
export type SelfComparisonTrendMetric = "BEST_LAP" | "FASTEST_10_AVG" | "FASTEST_5_AVG" | "%future added value";
export type TrackSessionComparisonCardQuery$variables = {
  baselineSessionId?: string | null | undefined;
  currentSessionId: string;
};
export type TrackSessionComparisonCardQuery$data = {
  readonly trackSession: {
    readonly id: string;
    readonly selfComparison: {
      readonly classificationDelta: number | null | undefined;
      readonly coachingSignals: {
        readonly deltas: {
          readonly firstLapWithin103Pct: number | null | undefined;
          readonly lapsWithinPoint2OfBest: number;
          readonly stintFade: number | null | undefined;
        };
      };
      readonly comparisonSession: {
        readonly classification: number;
        readonly conditions: string;
        readonly confidence: SelfComparisonConfidence;
        readonly confidenceReasons: ReadonlyArray<string>;
        readonly date: string;
        readonly fastestLap: number | null | undefined;
        readonly isDefault: boolean;
        readonly sessionId: string;
        readonly sessionPerformanceScore: number | null | undefined;
        readonly temperature: string | null | undefined;
      };
      readonly confidence: SelfComparisonConfidence;
      readonly confidenceReasons: ReadonlyArray<string>;
      readonly lapComparisons: ReadonlyArray<{
        readonly comparisonLap: number;
        readonly cumulativeDelta: number;
        readonly currentLap: number;
        readonly delta: number;
        readonly lapNumber: number;
        readonly outcome: SelfComparisonLapOutcome;
      }>;
      readonly paceInsights: {
        readonly comparison: {
          readonly bestLap: number | null | undefined;
          readonly bestRolling10: {
            readonly average: number;
            readonly endLapNumber: number;
            readonly startLapNumber: number;
          } | null | undefined;
          readonly bestRolling5: {
            readonly average: number;
            readonly endLapNumber: number;
            readonly startLapNumber: number;
          } | null | undefined;
          readonly fastest10Avg: number | null | undefined;
          readonly fastest5Avg: number | null | undefined;
        };
        readonly current: {
          readonly bestLap: number | null | undefined;
          readonly bestRolling10: {
            readonly average: number;
            readonly endLapNumber: number;
            readonly startLapNumber: number;
          } | null | undefined;
          readonly bestRolling5: {
            readonly average: number;
            readonly endLapNumber: number;
            readonly startLapNumber: number;
          } | null | undefined;
          readonly fastest10Avg: number | null | undefined;
          readonly fastest5Avg: number | null | undefined;
        };
        readonly deltas: {
          readonly bestLap: number | null | undefined;
          readonly bestRolling10Avg: number | null | undefined;
          readonly bestRolling5Avg: number | null | undefined;
          readonly fastest10Avg: number | null | undefined;
          readonly fastest5Avg: number | null | undefined;
          readonly overallMean: number | null | undefined;
          readonly overallMedian: number | null | undefined;
          readonly slowLapSpread: number | null | undefined;
        };
        readonly headline: string;
      };
      readonly performanceScoreDelta: number | null | undefined;
      readonly sessionInsights: {
        readonly comparisonFasterLapCount: number;
        readonly consistencyGap: number | null | undefined;
        readonly currentFasterLapCount: number;
        readonly insightLabel: SelfComparisonInsightLabel;
        readonly longestComparisonAdvantageStreak: number;
        readonly longestCurrentAdvantageStreak: number;
        readonly medianDelta: number | null | undefined;
        readonly tieCount: number;
      };
      readonly trend: {
        readonly direction: SelfComparisonTrendDirection;
        readonly metric: SelfComparisonTrendMetric | null | undefined;
        readonly points: ReadonlyArray<{
          readonly date: string;
          readonly isCurrent: boolean;
          readonly metric: SelfComparisonTrendMetric;
          readonly sessionId: string;
          readonly value: number;
        }>;
      };
    } | null | undefined;
  };
};
export type TrackSessionComparisonCardQuery = {
  response: TrackSessionComparisonCardQuery$data;
  variables: TrackSessionComparisonCardQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "baselineSessionId"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "currentSessionId"
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "sessionId",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "date",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "confidence",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "confidenceReasons",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "bestLap",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "fastest5Avg",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "fastest10Avg",
  "storageKey": null
},
v9 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "average",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "startLapNumber",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "endLapNumber",
    "storageKey": null
  }
],
v10 = [
  (v6/*: any*/),
  (v7/*: any*/),
  (v8/*: any*/),
  {
    "alias": null,
    "args": null,
    "concreteType": "SelfComparisonRollingWindow",
    "kind": "LinkedField",
    "name": "bestRolling5",
    "plural": false,
    "selections": (v9/*: any*/),
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "concreteType": "SelfComparisonRollingWindow",
    "kind": "LinkedField",
    "name": "bestRolling10",
    "plural": false,
    "selections": (v9/*: any*/),
    "storageKey": null
  }
],
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "metric",
  "storageKey": null
},
v12 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "currentSessionId"
      }
    ],
    "concreteType": "TrackSession",
    "kind": "LinkedField",
    "name": "trackSession",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "id",
        "storageKey": null
      },
      {
        "alias": null,
        "args": [
          {
            "kind": "Variable",
            "name": "compareToSessionId",
            "variableName": "baselineSessionId"
          }
        ],
        "concreteType": "SelfSessionComparison",
        "kind": "LinkedField",
        "name": "selfComparison",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "ComparableSelfSession",
            "kind": "LinkedField",
            "name": "comparisonSession",
            "plural": false,
            "selections": [
              (v2/*: any*/),
              (v3/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "classification",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "fastestLap",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "sessionPerformanceScore",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "conditions",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "temperature",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "isDefault",
                "storageKey": null
              },
              (v4/*: any*/),
              (v5/*: any*/)
            ],
            "storageKey": null
          },
          (v4/*: any*/),
          (v5/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "performanceScoreDelta",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "classificationDelta",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "SelfComparisonLapComparison",
            "kind": "LinkedField",
            "name": "lapComparisons",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "lapNumber",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "currentLap",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "comparisonLap",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "delta",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "cumulativeDelta",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "outcome",
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "SelfComparisonSessionInsights",
            "kind": "LinkedField",
            "name": "sessionInsights",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "currentFasterLapCount",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "comparisonFasterLapCount",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "tieCount",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "longestCurrentAdvantageStreak",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "longestComparisonAdvantageStreak",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "medianDelta",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "consistencyGap",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "insightLabel",
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "SelfComparisonPaceInsights",
            "kind": "LinkedField",
            "name": "paceInsights",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "SelfComparisonDriverPace",
                "kind": "LinkedField",
                "name": "current",
                "plural": false,
                "selections": (v10/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "SelfComparisonDriverPace",
                "kind": "LinkedField",
                "name": "comparison",
                "plural": false,
                "selections": (v10/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "SelfComparisonPaceDeltas",
                "kind": "LinkedField",
                "name": "deltas",
                "plural": false,
                "selections": [
                  (v6/*: any*/),
                  (v7/*: any*/),
                  (v8/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "bestRolling5Avg",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "bestRolling10Avg",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "overallMean",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "overallMedian",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "slowLapSpread",
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "headline",
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "SelfComparisonCoachingSignals",
            "kind": "LinkedField",
            "name": "coachingSignals",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "SelfComparisonCoachingDeltas",
                "kind": "LinkedField",
                "name": "deltas",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "firstLapWithin103Pct",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "lapsWithinPoint2OfBest",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "stintFade",
                    "storageKey": null
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "SelfComparisonTrend",
            "kind": "LinkedField",
            "name": "trend",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "direction",
                "storageKey": null
              },
              (v11/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "SelfComparisonTrendPoint",
                "kind": "LinkedField",
                "name": "points",
                "plural": true,
                "selections": [
                  (v2/*: any*/),
                  (v3/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "value",
                    "storageKey": null
                  },
                  (v11/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "isCurrent",
                    "storageKey": null
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "TrackSessionComparisonCardQuery",
    "selections": (v12/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "TrackSessionComparisonCardQuery",
    "selections": (v12/*: any*/)
  },
  "params": {
    "cacheID": "05ee3b25c8c47179513d7266f2cadef9",
    "id": null,
    "metadata": {},
    "name": "TrackSessionComparisonCardQuery",
    "operationKind": "query",
    "text": "query TrackSessionComparisonCardQuery(\n  $currentSessionId: ID!\n  $baselineSessionId: ID\n) {\n  trackSession(id: $currentSessionId) {\n    id\n    selfComparison(compareToSessionId: $baselineSessionId) {\n      comparisonSession {\n        sessionId\n        date\n        classification\n        fastestLap\n        sessionPerformanceScore\n        conditions\n        temperature\n        isDefault\n        confidence\n        confidenceReasons\n      }\n      confidence\n      confidenceReasons\n      performanceScoreDelta\n      classificationDelta\n      lapComparisons {\n        lapNumber\n        currentLap\n        comparisonLap\n        delta\n        cumulativeDelta\n        outcome\n      }\n      sessionInsights {\n        currentFasterLapCount\n        comparisonFasterLapCount\n        tieCount\n        longestCurrentAdvantageStreak\n        longestComparisonAdvantageStreak\n        medianDelta\n        consistencyGap\n        insightLabel\n      }\n      paceInsights {\n        current {\n          bestLap\n          fastest5Avg\n          fastest10Avg\n          bestRolling5 {\n            average\n            startLapNumber\n            endLapNumber\n          }\n          bestRolling10 {\n            average\n            startLapNumber\n            endLapNumber\n          }\n        }\n        comparison {\n          bestLap\n          fastest5Avg\n          fastest10Avg\n          bestRolling5 {\n            average\n            startLapNumber\n            endLapNumber\n          }\n          bestRolling10 {\n            average\n            startLapNumber\n            endLapNumber\n          }\n        }\n        deltas {\n          bestLap\n          fastest5Avg\n          fastest10Avg\n          bestRolling5Avg\n          bestRolling10Avg\n          overallMean\n          overallMedian\n          slowLapSpread\n        }\n        headline\n      }\n      coachingSignals {\n        deltas {\n          firstLapWithin103Pct\n          lapsWithinPoint2OfBest\n          stintFade\n        }\n      }\n      trend {\n        direction\n        metric\n        points {\n          sessionId\n          date\n          value\n          metric\n          isCurrent\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "994b13d46df86f2a80abf982b184bc8c";

export default node;
