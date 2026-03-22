/**
 * @generated SignedSource<<50846b4baf76f863202d17b955ed2152>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type RecordingUploadStatus = "FAILED" | "PENDING" | "UPLOADED" | "UPLOADING" | "%future added value";
export type RivalInsightLabel = "CONSISTENTLY_SLOWER" | "MIXED_OR_NEUTRAL" | "MIXED_WITH_FASTER_PHASES" | "%future added value";
export type RivalLapOutcome = "FASTER" | "SLOWER" | "TIE" | "%future added value";
export type RivalPaceVerdict = "INSUFFICIENT" | "NEUTRAL" | "RIVAL_ADVANTAGE" | "SELF_ADVANTAGE" | "%future added value";
export type RivalRobustnessVerdict = "INSUFFICIENT" | "RIVAL_MORE_ROBUST" | "SELF_MORE_ROBUST" | "SIMILAR" | "%future added value";
export type RivalTrendDirection = "CLOSING" | "FLAT" | "INSUFFICIENT" | "WIDENING" | "%future added value";
export type SelfComparisonConfidence = "HIGH" | "MEDIUM" | "%future added value";
export type SelfComparisonInsightLabel = "COMPARISON_ADVANTAGE" | "CURRENT_ADVANTAGE" | "MIXED_OR_NEUTRAL" | "%future added value";
export type SelfComparisonLapOutcome = "COMPARISON_FASTER" | "CURRENT_FASTER" | "TIE" | "%future added value";
export type SelfComparisonPaceVerdict = "COMPARISON_ADVANTAGE" | "CURRENT_ADVANTAGE" | "INSUFFICIENT" | "NEUTRAL" | "%future added value";
export type SelfComparisonRobustnessVerdict = "COMPARISON_MORE_ROBUST" | "CURRENT_MORE_ROBUST" | "INSUFFICIENT" | "SIMILAR" | "%future added value";
export type SelfComparisonTrendDirection = "FLAT" | "IMPROVING" | "INSUFFICIENT" | "REGRESSING" | "%future added value";
export type SelfComparisonTrendMetric = "BEST_LAP" | "FASTEST_10_AVG" | "FASTEST_5_AVG" | "%future added value";
export type SessionPerformanceExclusionReason = "INVALID" | "OUTLIER" | "OUT_LAP" | "%future added value";
export type TrackRecordingStatus = "COMBINING" | "FAILED" | "PENDING_UPLOAD" | "READY" | "UPLOADING" | "%future added value";
export type viewSessionQuery$variables = {
  compareToSessionId?: string | null | undefined;
  id: string;
  rivalName: string;
};
export type viewSessionQuery$data = {
  readonly trackSession: {
    readonly classification: number;
    readonly comparableSelfSessions: ReadonlyArray<{
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
    }>;
    readonly conditions: string;
    readonly createdAt: string;
    readonly date: string;
    readonly fastestLap: number | null | undefined;
    readonly format: string;
    readonly id: string;
    readonly kart: {
      readonly id: string;
      readonly name: string;
    } | null | undefined;
    readonly kartNumber: string | null | undefined;
    readonly laps: ReadonlyArray<{
      readonly id: string;
      readonly lapEvents: ReadonlyArray<{
        readonly event: string;
        readonly id: string;
        readonly offset: number;
        readonly value: string;
      }>;
      readonly lapNumber: number;
      readonly time: number;
    }>;
    readonly notes: string | null | undefined;
    readonly participants: ReadonlyArray<{
      readonly classification: number | null | undefined;
      readonly id: string;
      readonly isSelf: boolean;
      readonly kartNumber: string | null | undefined;
      readonly laps: ReadonlyArray<{
        readonly lapNumber: number;
        readonly time: number;
      }>;
      readonly name: string;
    }>;
    readonly rivalAnalysis: {
      readonly lapComparisons: ReadonlyArray<{
        readonly cumulativeDelta: number;
        readonly delta: number;
        readonly lapNumber: number;
        readonly outcome: RivalLapOutcome;
        readonly rivalLap: number;
        readonly selfLap: number;
      }>;
      readonly paceInsights: {
        readonly ceilingVerdict: RivalPaceVerdict;
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
        readonly quickWindowCutoff: number | null | undefined;
        readonly quickWindowRivalCount: number;
        readonly quickWindowSelfCount: number;
        readonly rival: {
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
          readonly overallMean: number | null | undefined;
          readonly overallMedian: number | null | undefined;
          readonly quickWindowCount: number;
          readonly slowLapSpread: number | null | undefined;
          readonly validLapCount: number;
        };
        readonly robustnessVerdict: RivalRobustnessVerdict;
        readonly self: {
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
          readonly overallMean: number | null | undefined;
          readonly overallMedian: number | null | undefined;
          readonly quickWindowCount: number;
          readonly slowLapSpread: number | null | undefined;
          readonly validLapCount: number;
        };
        readonly sustainedVerdict: RivalPaceVerdict;
      };
      readonly rivalName: string;
      readonly sessionInsights: {
        readonly consistencyGap: number | null | undefined;
        readonly fasterLapCount: number;
        readonly insightLabel: RivalInsightLabel;
        readonly longestGainStreak: number;
        readonly longestLossStreak: number;
        readonly medianDelta: number | null | undefined;
        readonly slowerLapCount: number;
        readonly tieCount: number;
      };
      readonly trend: {
        readonly direction: RivalTrendDirection;
        readonly firstDelta: number | null | undefined;
        readonly latestDelta: number | null | undefined;
        readonly points: ReadonlyArray<{
          readonly date: string;
          readonly delta: number;
          readonly sessionId: string;
        }>;
        readonly sampleCount: number;
        readonly slope: number | null | undefined;
      };
    } | null | undefined;
    readonly selfComparison: {
      readonly classificationDelta: number | null | undefined;
      readonly coachingSignals: {
        readonly comparison: {
          readonly averageRecoveryAfterSlowLap: number | null | undefined;
          readonly finalRolling5Avg: number | null | undefined;
          readonly firstLapWithin103Pct: number | null | undefined;
          readonly lapEventCount: number;
          readonly lapEventSummaries: ReadonlyArray<{
            readonly averageLapNumber: number | null | undefined;
            readonly averageOffset: number | null | undefined;
            readonly count: number;
            readonly event: string;
          }>;
          readonly lapsWithinPoint2OfBest: number;
          readonly lapsWithinPoint5OfBest: number;
          readonly stintFade: number | null | undefined;
        };
        readonly current: {
          readonly averageRecoveryAfterSlowLap: number | null | undefined;
          readonly finalRolling5Avg: number | null | undefined;
          readonly firstLapWithin103Pct: number | null | undefined;
          readonly lapEventCount: number;
          readonly lapEventSummaries: ReadonlyArray<{
            readonly averageLapNumber: number | null | undefined;
            readonly averageOffset: number | null | undefined;
            readonly count: number;
            readonly event: string;
          }>;
          readonly lapsWithinPoint2OfBest: number;
          readonly lapsWithinPoint5OfBest: number;
          readonly stintFade: number | null | undefined;
        };
        readonly deltas: {
          readonly averageRecoveryAfterSlowLap: number | null | undefined;
          readonly finalRolling5Avg: number | null | undefined;
          readonly firstLapWithin103Pct: number | null | undefined;
          readonly lapEventCount: number;
          readonly lapsWithinPoint2OfBest: number;
          readonly lapsWithinPoint5OfBest: number;
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
        readonly ceilingVerdict: SelfComparisonPaceVerdict;
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
          readonly overallMean: number | null | undefined;
          readonly overallMedian: number | null | undefined;
          readonly quickWindowCount: number;
          readonly slowLapSpread: number | null | undefined;
          readonly validLapCount: number;
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
          readonly overallMean: number | null | undefined;
          readonly overallMedian: number | null | undefined;
          readonly quickWindowCount: number;
          readonly slowLapSpread: number | null | undefined;
          readonly validLapCount: number;
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
        readonly quickWindowComparisonCount: number;
        readonly quickWindowCurrentCount: number;
        readonly quickWindowCutoff: number | null | undefined;
        readonly robustnessVerdict: SelfComparisonRobustnessVerdict;
        readonly sustainedVerdict: SelfComparisonPaceVerdict;
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
        readonly firstValue: number | null | undefined;
        readonly latestValue: number | null | undefined;
        readonly metric: SelfComparisonTrendMetric | null | undefined;
        readonly points: ReadonlyArray<{
          readonly date: string;
          readonly isCurrent: boolean;
          readonly metric: SelfComparisonTrendMetric;
          readonly sessionId: string;
          readonly value: number;
        }>;
        readonly sampleCount: number;
        readonly slope: number | null | undefined;
      };
    } | null | undefined;
    readonly sessionPerformance: {
      readonly cleanLapCount: number;
      readonly cleanLapNumbers: ReadonlyArray<number>;
      readonly excludedLapCount: number;
      readonly excludedLaps: ReadonlyArray<{
        readonly lapNumber: number;
        readonly reason: SessionPerformanceExclusionReason;
      }>;
      readonly format: string;
      readonly headline: string;
      readonly highlightLapNumbers: ReadonlyArray<number>;
      readonly label: string;
      readonly practiceRaceKpis: {
        readonly bestLap: number | null | undefined;
        readonly cleanLapRatioPct: number | null | undefined;
        readonly cleanLapStdDev: number | null | undefined;
        readonly gapToP1: number | null | undefined;
        readonly lapsWithinThresholdPct: number | null | undefined;
        readonly longestConsistentStintEndLap: number | null | undefined;
        readonly longestConsistentStintLaps: number | null | undefined;
        readonly longestConsistentStintStartLap: number | null | undefined;
        readonly top10Average: number | null | undefined;
        readonly top5Average: number | null | undefined;
      } | null | undefined;
      readonly qualifyingKpis: {
        readonly bestLap: number | null | undefined;
        readonly cleanLapRatioPct: number | null | undefined;
        readonly gapToP1: number | null | undefined;
        readonly gapToP3: number | null | undefined;
        readonly pushRatePct: number | null | undefined;
        readonly rankByBestLap: number | null | undefined;
        readonly secondLapDelta: number | null | undefined;
        readonly top3Average: number | null | undefined;
        readonly top3Spread: number | null | undefined;
      } | null | undefined;
      readonly representativePace: number | null | undefined;
      readonly score: number | null | undefined;
      readonly scoreComponents: ReadonlyArray<{
        readonly contribution: number | null | undefined;
        readonly key: string;
        readonly label: string;
        readonly value: number | null | undefined;
        readonly weight: number;
      }>;
      readonly thresholdLapTime: number | null | undefined;
    };
    readonly sessionPerformanceScore: number | null | undefined;
    readonly temperature: string | null | undefined;
    readonly track: {
      readonly id: string;
      readonly isIndoors: boolean;
      readonly name: string;
      readonly postcode: string | null | undefined;
    };
    readonly trackLayout: {
      readonly id: string;
      readonly name: string;
    };
    readonly trackRecordings: ReadonlyArray<{
      readonly combineProgress: number | null | undefined;
      readonly createdAt: string;
      readonly description: string | null | undefined;
      readonly durationMs: number | null | undefined;
      readonly error: string | null | undefined;
      readonly fps: number | null | undefined;
      readonly id: string;
      readonly isPrimary: boolean;
      readonly lapOneOffset: number;
      readonly mediaId: string;
      readonly overlayBurned: boolean;
      readonly showInMediaLibrary: boolean;
      readonly sizeBytes: number | null | undefined;
      readonly status: TrackRecordingStatus;
      readonly uploadProgress: {
        readonly totalBytes: number | null | undefined;
        readonly uploadedBytes: number;
      };
      readonly uploadTargets: ReadonlyArray<{
        readonly fileName: string;
        readonly id: string;
        readonly ordinal: number;
        readonly sizeBytes: number | null | undefined;
        readonly status: RecordingUploadStatus;
        readonly uploadToken: string;
        readonly uploadedBytes: number;
      }>;
    }>;
    readonly updatedAt: string;
  };
  readonly tracks: ReadonlyArray<{
    readonly id: string;
    readonly isIndoors: boolean;
    readonly karts: ReadonlyArray<{
      readonly id: string;
      readonly name: string;
    }>;
    readonly name: string;
    readonly postcode: string | null | undefined;
    readonly trackLayouts: ReadonlyArray<{
      readonly id: string;
      readonly name: string;
    }>;
  }>;
};
export type viewSessionQuery = {
  response: viewSessionQuery$data;
  variables: viewSessionQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "compareToSessionId"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "id"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "rivalName"
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "date",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "format",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "classification",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "fastestLap",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "conditions",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "temperature",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "kartNumber",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "postcode",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isIndoors",
  "storageKey": null
},
v14 = [
  (v3/*: any*/),
  (v11/*: any*/)
],
v15 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "sessionPerformanceScore",
  "storageKey": null
},
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "label",
  "storageKey": null
},
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "headline",
  "storageKey": null
},
v18 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "lapNumber",
  "storageKey": null
},
v19 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v20 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "bestLap",
  "storageKey": null
},
v21 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "gapToP1",
  "storageKey": null
},
v22 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cleanLapRatioPct",
  "storageKey": null
},
v23 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v24 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v25 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "sizeBytes",
  "storageKey": null
},
v26 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "uploadedBytes",
  "storageKey": null
},
v27 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 50
  }
],
v28 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "time",
  "storageKey": null
},
v29 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "event",
  "storageKey": null
},
v30 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "sessionId",
  "storageKey": null
},
v31 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "confidence",
  "storageKey": null
},
v32 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "confidenceReasons",
  "storageKey": null
},
v33 = [
  (v30/*: any*/),
  (v4/*: any*/),
  (v6/*: any*/),
  (v7/*: any*/),
  (v15/*: any*/),
  (v8/*: any*/),
  (v9/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "isDefault",
    "storageKey": null
  },
  (v31/*: any*/),
  (v32/*: any*/)
],
v34 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "delta",
  "storageKey": null
},
v35 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cumulativeDelta",
  "storageKey": null
},
v36 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "outcome",
  "storageKey": null
},
v37 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "tieCount",
  "storageKey": null
},
v38 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "medianDelta",
  "storageKey": null
},
v39 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "consistencyGap",
  "storageKey": null
},
v40 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "insightLabel",
  "storageKey": null
},
v41 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "validLapCount",
  "storageKey": null
},
v42 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "fastest5Avg",
  "storageKey": null
},
v43 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "fastest10Avg",
  "storageKey": null
},
v44 = [
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
v45 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "overallMean",
  "storageKey": null
},
v46 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "overallMedian",
  "storageKey": null
},
v47 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "slowLapSpread",
  "storageKey": null
},
v48 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "quickWindowCount",
  "storageKey": null
},
v49 = [
  (v41/*: any*/),
  (v20/*: any*/),
  (v42/*: any*/),
  (v43/*: any*/),
  {
    "alias": null,
    "args": null,
    "concreteType": "SelfComparisonRollingWindow",
    "kind": "LinkedField",
    "name": "bestRolling5",
    "plural": false,
    "selections": (v44/*: any*/),
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "concreteType": "SelfComparisonRollingWindow",
    "kind": "LinkedField",
    "name": "bestRolling10",
    "plural": false,
    "selections": (v44/*: any*/),
    "storageKey": null
  },
  (v45/*: any*/),
  (v46/*: any*/),
  (v47/*: any*/),
  (v48/*: any*/)
],
v50 = [
  (v20/*: any*/),
  (v42/*: any*/),
  (v43/*: any*/),
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
  (v45/*: any*/),
  (v46/*: any*/),
  (v47/*: any*/)
],
v51 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "quickWindowCutoff",
  "storageKey": null
},
v52 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "ceilingVerdict",
  "storageKey": null
},
v53 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "sustainedVerdict",
  "storageKey": null
},
v54 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "robustnessVerdict",
  "storageKey": null
},
v55 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "firstLapWithin103Pct",
  "storageKey": null
},
v56 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "finalRolling5Avg",
  "storageKey": null
},
v57 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "stintFade",
  "storageKey": null
},
v58 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "lapsWithinPoint2OfBest",
  "storageKey": null
},
v59 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "lapsWithinPoint5OfBest",
  "storageKey": null
},
v60 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "averageRecoveryAfterSlowLap",
  "storageKey": null
},
v61 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "lapEventCount",
  "storageKey": null
},
v62 = [
  (v55/*: any*/),
  (v56/*: any*/),
  (v57/*: any*/),
  (v58/*: any*/),
  (v59/*: any*/),
  (v60/*: any*/),
  (v61/*: any*/),
  {
    "alias": null,
    "args": null,
    "concreteType": "SelfComparisonLapEventSummary",
    "kind": "LinkedField",
    "name": "lapEventSummaries",
    "plural": true,
    "selections": [
      (v29/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "count",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "averageOffset",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "averageLapNumber",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
],
v63 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "direction",
  "storageKey": null
},
v64 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "sampleCount",
  "storageKey": null
},
v65 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "slope",
  "storageKey": null
},
v66 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "metric",
  "storageKey": null
},
v67 = [
  (v41/*: any*/),
  (v20/*: any*/),
  (v42/*: any*/),
  (v43/*: any*/),
  {
    "alias": null,
    "args": null,
    "concreteType": "RivalRollingWindow",
    "kind": "LinkedField",
    "name": "bestRolling5",
    "plural": false,
    "selections": (v44/*: any*/),
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "concreteType": "RivalRollingWindow",
    "kind": "LinkedField",
    "name": "bestRolling10",
    "plural": false,
    "selections": (v44/*: any*/),
    "storageKey": null
  },
  (v45/*: any*/),
  (v46/*: any*/),
  (v47/*: any*/),
  (v48/*: any*/)
],
v68 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "concreteType": "TrackSession",
    "kind": "LinkedField",
    "name": "trackSession",
    "plural": false,
    "selections": [
      (v3/*: any*/),
      (v4/*: any*/),
      (v5/*: any*/),
      (v6/*: any*/),
      (v7/*: any*/),
      (v8/*: any*/),
      (v9/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "notes",
        "storageKey": null
      },
      (v10/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "Track",
        "kind": "LinkedField",
        "name": "track",
        "plural": false,
        "selections": [
          (v3/*: any*/),
          (v11/*: any*/),
          (v12/*: any*/),
          (v13/*: any*/)
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "TrackLayout",
        "kind": "LinkedField",
        "name": "trackLayout",
        "plural": false,
        "selections": (v14/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "Kart",
        "kind": "LinkedField",
        "name": "kart",
        "plural": false,
        "selections": (v14/*: any*/),
        "storageKey": null
      },
      (v15/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "TrackSessionPerformance",
        "kind": "LinkedField",
        "name": "sessionPerformance",
        "plural": false,
        "selections": [
          (v5/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "score",
            "storageKey": null
          },
          (v16/*: any*/),
          (v17/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "cleanLapCount",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "excludedLapCount",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "cleanLapNumbers",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "SessionPerformanceExcludedLap",
            "kind": "LinkedField",
            "name": "excludedLaps",
            "plural": true,
            "selections": [
              (v18/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "reason",
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "SessionPerformanceScoreComponent",
            "kind": "LinkedField",
            "name": "scoreComponents",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "key",
                "storageKey": null
              },
              (v16/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "weight",
                "storageKey": null
              },
              (v19/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "contribution",
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "representativePace",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "thresholdLapTime",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "highlightLapNumbers",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TrackSessionQualifyingPerformanceKpis",
            "kind": "LinkedField",
            "name": "qualifyingKpis",
            "plural": false,
            "selections": [
              (v20/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "rankByBestLap",
                "storageKey": null
              },
              (v21/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "gapToP3",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "top3Average",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "top3Spread",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "secondLapDelta",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "pushRatePct",
                "storageKey": null
              },
              (v22/*: any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TrackSessionPracticeRacePerformanceKpis",
            "kind": "LinkedField",
            "name": "practiceRaceKpis",
            "plural": false,
            "selections": [
              (v20/*: any*/),
              (v21/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "top5Average",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "top10Average",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "cleanLapStdDev",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "longestConsistentStintLaps",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "longestConsistentStintStartLap",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "longestConsistentStintEndLap",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "lapsWithinThresholdPct",
                "storageKey": null
              },
              (v22/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      (v23/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "updatedAt",
        "storageKey": null
      },
      {
        "alias": null,
        "args": [
          {
            "kind": "Literal",
            "name": "first",
            "value": 20
          }
        ],
        "concreteType": "TrackRecording",
        "kind": "LinkedField",
        "name": "trackRecordings",
        "plural": true,
        "selections": [
          (v3/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "description",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "mediaId",
            "storageKey": null
          },
          (v24/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "error",
            "storageKey": null
          },
          (v25/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "overlayBurned",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "isPrimary",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "showInMediaLibrary",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "lapOneOffset",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "durationMs",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "fps",
            "storageKey": null
          },
          (v23/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "combineProgress",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "RecordingUploadProgress",
            "kind": "LinkedField",
            "name": "uploadProgress",
            "plural": false,
            "selections": [
              (v26/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "totalBytes",
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": (v27/*: any*/),
            "concreteType": "RecordingUploadTarget",
            "kind": "LinkedField",
            "name": "uploadTargets",
            "plural": true,
            "selections": [
              (v3/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "fileName",
                "storageKey": null
              },
              (v25/*: any*/),
              (v26/*: any*/),
              (v24/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "ordinal",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "uploadToken",
                "storageKey": null
              }
            ],
            "storageKey": "uploadTargets(first:50)"
          }
        ],
        "storageKey": "trackRecordings(first:20)"
      },
      {
        "alias": null,
        "args": (v27/*: any*/),
        "concreteType": "Lap",
        "kind": "LinkedField",
        "name": "laps",
        "plural": true,
        "selections": [
          (v3/*: any*/),
          (v18/*: any*/),
          (v28/*: any*/),
          {
            "alias": null,
            "args": (v27/*: any*/),
            "concreteType": "LapEvent",
            "kind": "LinkedField",
            "name": "lapEvents",
            "plural": true,
            "selections": [
              (v3/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "offset",
                "storageKey": null
              },
              (v29/*: any*/),
              (v19/*: any*/)
            ],
            "storageKey": "lapEvents(first:50)"
          }
        ],
        "storageKey": "laps(first:50)"
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "TrackSessionParticipant",
        "kind": "LinkedField",
        "name": "participants",
        "plural": true,
        "selections": [
          (v3/*: any*/),
          (v11/*: any*/),
          (v6/*: any*/),
          (v10/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "isSelf",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TrackSessionParticipantLap",
            "kind": "LinkedField",
            "name": "laps",
            "plural": true,
            "selections": [
              (v18/*: any*/),
              (v28/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "ComparableSelfSession",
        "kind": "LinkedField",
        "name": "comparableSelfSessions",
        "plural": true,
        "selections": (v33/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": [
          {
            "kind": "Variable",
            "name": "compareToSessionId",
            "variableName": "compareToSessionId"
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
            "selections": (v33/*: any*/),
            "storageKey": null
          },
          (v31/*: any*/),
          (v32/*: any*/),
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
              (v18/*: any*/),
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
              (v34/*: any*/),
              (v35/*: any*/),
              (v36/*: any*/)
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
              (v37/*: any*/),
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
              (v38/*: any*/),
              (v39/*: any*/),
              (v40/*: any*/)
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
                "selections": (v49/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "SelfComparisonDriverPace",
                "kind": "LinkedField",
                "name": "comparison",
                "plural": false,
                "selections": (v49/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "SelfComparisonPaceDeltas",
                "kind": "LinkedField",
                "name": "deltas",
                "plural": false,
                "selections": (v50/*: any*/),
                "storageKey": null
              },
              (v51/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "quickWindowCurrentCount",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "quickWindowComparisonCount",
                "storageKey": null
              },
              (v52/*: any*/),
              (v53/*: any*/),
              (v54/*: any*/),
              (v17/*: any*/)
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
                "concreteType": "SelfComparisonCoachingSnapshot",
                "kind": "LinkedField",
                "name": "current",
                "plural": false,
                "selections": (v62/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "SelfComparisonCoachingSnapshot",
                "kind": "LinkedField",
                "name": "comparison",
                "plural": false,
                "selections": (v62/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "SelfComparisonCoachingDeltas",
                "kind": "LinkedField",
                "name": "deltas",
                "plural": false,
                "selections": [
                  (v55/*: any*/),
                  (v56/*: any*/),
                  (v57/*: any*/),
                  (v58/*: any*/),
                  (v59/*: any*/),
                  (v60/*: any*/),
                  (v61/*: any*/)
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
              (v63/*: any*/),
              (v64/*: any*/),
              (v65/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "firstValue",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "latestValue",
                "storageKey": null
              },
              (v66/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "SelfComparisonTrendPoint",
                "kind": "LinkedField",
                "name": "points",
                "plural": true,
                "selections": [
                  (v30/*: any*/),
                  (v4/*: any*/),
                  (v19/*: any*/),
                  (v66/*: any*/),
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
      },
      {
        "alias": null,
        "args": [
          {
            "kind": "Variable",
            "name": "rivalName",
            "variableName": "rivalName"
          }
        ],
        "concreteType": "RivalAnalysis",
        "kind": "LinkedField",
        "name": "rivalAnalysis",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "rivalName",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "RivalLapComparison",
            "kind": "LinkedField",
            "name": "lapComparisons",
            "plural": true,
            "selections": [
              (v18/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "selfLap",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "rivalLap",
                "storageKey": null
              },
              (v34/*: any*/),
              (v35/*: any*/),
              (v36/*: any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "RivalSessionInsights",
            "kind": "LinkedField",
            "name": "sessionInsights",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "fasterLapCount",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "slowerLapCount",
                "storageKey": null
              },
              (v37/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "longestGainStreak",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "longestLossStreak",
                "storageKey": null
              },
              (v38/*: any*/),
              (v39/*: any*/),
              (v40/*: any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "RivalTrend",
            "kind": "LinkedField",
            "name": "trend",
            "plural": false,
            "selections": [
              (v63/*: any*/),
              (v64/*: any*/),
              (v65/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "firstDelta",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "latestDelta",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "RivalTrendPoint",
                "kind": "LinkedField",
                "name": "points",
                "plural": true,
                "selections": [
                  (v30/*: any*/),
                  (v4/*: any*/),
                  (v34/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "RivalPaceInsights",
            "kind": "LinkedField",
            "name": "paceInsights",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "RivalDriverPace",
                "kind": "LinkedField",
                "name": "self",
                "plural": false,
                "selections": (v67/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "RivalDriverPace",
                "kind": "LinkedField",
                "name": "rival",
                "plural": false,
                "selections": (v67/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "RivalPaceDeltas",
                "kind": "LinkedField",
                "name": "deltas",
                "plural": false,
                "selections": (v50/*: any*/),
                "storageKey": null
              },
              (v51/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "quickWindowSelfCount",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "quickWindowRivalCount",
                "storageKey": null
              },
              (v52/*: any*/),
              (v53/*: any*/),
              (v54/*: any*/),
              (v17/*: any*/)
            ],
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
    "concreteType": "Track",
    "kind": "LinkedField",
    "name": "tracks",
    "plural": true,
    "selections": [
      (v3/*: any*/),
      (v11/*: any*/),
      (v12/*: any*/),
      (v13/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "Kart",
        "kind": "LinkedField",
        "name": "karts",
        "plural": true,
        "selections": (v14/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "TrackLayout",
        "kind": "LinkedField",
        "name": "trackLayouts",
        "plural": true,
        "selections": (v14/*: any*/),
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
      (v1/*: any*/),
      (v2/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "viewSessionQuery",
    "selections": (v68/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v2/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "viewSessionQuery",
    "selections": (v68/*: any*/)
  },
  "params": {
    "cacheID": "4bbd1003875ed12c41d3a23bd6e2ca96",
    "id": null,
    "metadata": {},
    "name": "viewSessionQuery",
    "operationKind": "query",
    "text": "query viewSessionQuery(\n  $id: ID!\n  $rivalName: String!\n  $compareToSessionId: ID\n) {\n  trackSession(id: $id) {\n    id\n    date\n    format\n    classification\n    fastestLap\n    conditions\n    temperature\n    notes\n    kartNumber\n    track {\n      id\n      name\n      postcode\n      isIndoors\n    }\n    trackLayout {\n      id\n      name\n    }\n    kart {\n      id\n      name\n    }\n    sessionPerformanceScore\n    sessionPerformance {\n      format\n      score\n      label\n      headline\n      cleanLapCount\n      excludedLapCount\n      cleanLapNumbers\n      excludedLaps {\n        lapNumber\n        reason\n      }\n      scoreComponents {\n        key\n        label\n        weight\n        value\n        contribution\n      }\n      representativePace\n      thresholdLapTime\n      highlightLapNumbers\n      qualifyingKpis {\n        bestLap\n        rankByBestLap\n        gapToP1\n        gapToP3\n        top3Average\n        top3Spread\n        secondLapDelta\n        pushRatePct\n        cleanLapRatioPct\n      }\n      practiceRaceKpis {\n        bestLap\n        gapToP1\n        top5Average\n        top10Average\n        cleanLapStdDev\n        longestConsistentStintLaps\n        longestConsistentStintStartLap\n        longestConsistentStintEndLap\n        lapsWithinThresholdPct\n        cleanLapRatioPct\n      }\n    }\n    createdAt\n    updatedAt\n    trackRecordings(first: 20) {\n      id\n      description\n      mediaId\n      status\n      error\n      sizeBytes\n      overlayBurned\n      isPrimary\n      showInMediaLibrary\n      lapOneOffset\n      durationMs\n      fps\n      createdAt\n      combineProgress\n      uploadProgress {\n        uploadedBytes\n        totalBytes\n      }\n      uploadTargets(first: 50) {\n        id\n        fileName\n        sizeBytes\n        uploadedBytes\n        status\n        ordinal\n        uploadToken\n      }\n    }\n    laps(first: 50) {\n      id\n      lapNumber\n      time\n      lapEvents(first: 50) {\n        id\n        offset\n        event\n        value\n      }\n    }\n    participants {\n      id\n      name\n      classification\n      kartNumber\n      isSelf\n      laps {\n        lapNumber\n        time\n      }\n    }\n    comparableSelfSessions {\n      sessionId\n      date\n      classification\n      fastestLap\n      sessionPerformanceScore\n      conditions\n      temperature\n      isDefault\n      confidence\n      confidenceReasons\n    }\n    selfComparison(compareToSessionId: $compareToSessionId) {\n      comparisonSession {\n        sessionId\n        date\n        classification\n        fastestLap\n        sessionPerformanceScore\n        conditions\n        temperature\n        isDefault\n        confidence\n        confidenceReasons\n      }\n      confidence\n      confidenceReasons\n      performanceScoreDelta\n      classificationDelta\n      lapComparisons {\n        lapNumber\n        currentLap\n        comparisonLap\n        delta\n        cumulativeDelta\n        outcome\n      }\n      sessionInsights {\n        currentFasterLapCount\n        comparisonFasterLapCount\n        tieCount\n        longestCurrentAdvantageStreak\n        longestComparisonAdvantageStreak\n        medianDelta\n        consistencyGap\n        insightLabel\n      }\n      paceInsights {\n        current {\n          validLapCount\n          bestLap\n          fastest5Avg\n          fastest10Avg\n          bestRolling5 {\n            average\n            startLapNumber\n            endLapNumber\n          }\n          bestRolling10 {\n            average\n            startLapNumber\n            endLapNumber\n          }\n          overallMean\n          overallMedian\n          slowLapSpread\n          quickWindowCount\n        }\n        comparison {\n          validLapCount\n          bestLap\n          fastest5Avg\n          fastest10Avg\n          bestRolling5 {\n            average\n            startLapNumber\n            endLapNumber\n          }\n          bestRolling10 {\n            average\n            startLapNumber\n            endLapNumber\n          }\n          overallMean\n          overallMedian\n          slowLapSpread\n          quickWindowCount\n        }\n        deltas {\n          bestLap\n          fastest5Avg\n          fastest10Avg\n          bestRolling5Avg\n          bestRolling10Avg\n          overallMean\n          overallMedian\n          slowLapSpread\n        }\n        quickWindowCutoff\n        quickWindowCurrentCount\n        quickWindowComparisonCount\n        ceilingVerdict\n        sustainedVerdict\n        robustnessVerdict\n        headline\n      }\n      coachingSignals {\n        current {\n          firstLapWithin103Pct\n          finalRolling5Avg\n          stintFade\n          lapsWithinPoint2OfBest\n          lapsWithinPoint5OfBest\n          averageRecoveryAfterSlowLap\n          lapEventCount\n          lapEventSummaries {\n            event\n            count\n            averageOffset\n            averageLapNumber\n          }\n        }\n        comparison {\n          firstLapWithin103Pct\n          finalRolling5Avg\n          stintFade\n          lapsWithinPoint2OfBest\n          lapsWithinPoint5OfBest\n          averageRecoveryAfterSlowLap\n          lapEventCount\n          lapEventSummaries {\n            event\n            count\n            averageOffset\n            averageLapNumber\n          }\n        }\n        deltas {\n          firstLapWithin103Pct\n          finalRolling5Avg\n          stintFade\n          lapsWithinPoint2OfBest\n          lapsWithinPoint5OfBest\n          averageRecoveryAfterSlowLap\n          lapEventCount\n        }\n      }\n      trend {\n        direction\n        sampleCount\n        slope\n        firstValue\n        latestValue\n        metric\n        points {\n          sessionId\n          date\n          value\n          metric\n          isCurrent\n        }\n      }\n    }\n    rivalAnalysis(rivalName: $rivalName) {\n      rivalName\n      lapComparisons {\n        lapNumber\n        selfLap\n        rivalLap\n        delta\n        cumulativeDelta\n        outcome\n      }\n      sessionInsights {\n        fasterLapCount\n        slowerLapCount\n        tieCount\n        longestGainStreak\n        longestLossStreak\n        medianDelta\n        consistencyGap\n        insightLabel\n      }\n      trend {\n        direction\n        sampleCount\n        slope\n        firstDelta\n        latestDelta\n        points {\n          sessionId\n          date\n          delta\n        }\n      }\n      paceInsights {\n        self {\n          validLapCount\n          bestLap\n          fastest5Avg\n          fastest10Avg\n          bestRolling5 {\n            average\n            startLapNumber\n            endLapNumber\n          }\n          bestRolling10 {\n            average\n            startLapNumber\n            endLapNumber\n          }\n          overallMean\n          overallMedian\n          slowLapSpread\n          quickWindowCount\n        }\n        rival {\n          validLapCount\n          bestLap\n          fastest5Avg\n          fastest10Avg\n          bestRolling5 {\n            average\n            startLapNumber\n            endLapNumber\n          }\n          bestRolling10 {\n            average\n            startLapNumber\n            endLapNumber\n          }\n          overallMean\n          overallMedian\n          slowLapSpread\n          quickWindowCount\n        }\n        deltas {\n          bestLap\n          fastest5Avg\n          fastest10Avg\n          bestRolling5Avg\n          bestRolling10Avg\n          overallMean\n          overallMedian\n          slowLapSpread\n        }\n        quickWindowCutoff\n        quickWindowSelfCount\n        quickWindowRivalCount\n        ceilingVerdict\n        sustainedVerdict\n        robustnessVerdict\n        headline\n      }\n    }\n  }\n  tracks {\n    id\n    name\n    postcode\n    isIndoors\n    karts {\n      id\n      name\n    }\n    trackLayouts {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "0adb89a0982d0ff7b2ad730584383395";

export default node;
