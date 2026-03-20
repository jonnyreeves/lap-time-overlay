/**
 * @generated SignedSource<<625391ecc2baea306a5e9b69f75a3487>>
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
export type SessionPerformanceExclusionReason = "INVALID" | "OUTLIER" | "OUT_LAP" | "%future added value";
export type TrackRecordingStatus = "COMBINING" | "FAILED" | "PENDING_UPLOAD" | "READY" | "UPLOADING" | "%future added value";
export type viewSessionQuery$variables = {
  id: string;
  rivalName: string;
};
export type viewSessionQuery$data = {
  readonly trackSession: {
    readonly classification: number;
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
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "rivalName"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "date",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "format",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "classification",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "kartNumber",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "postcode",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isIndoors",
  "storageKey": null
},
v9 = [
  (v1/*: any*/),
  (v6/*: any*/)
],
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "label",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "headline",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "lapNumber",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "bestLap",
  "storageKey": null
},
v15 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "gapToP1",
  "storageKey": null
},
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cleanLapRatioPct",
  "storageKey": null
},
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v18 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v19 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "sizeBytes",
  "storageKey": null
},
v20 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "uploadedBytes",
  "storageKey": null
},
v21 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 50
  }
],
v22 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "time",
  "storageKey": null
},
v23 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "delta",
  "storageKey": null
},
v24 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "fastest5Avg",
  "storageKey": null
},
v25 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "fastest10Avg",
  "storageKey": null
},
v26 = [
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
v27 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "overallMean",
  "storageKey": null
},
v28 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "overallMedian",
  "storageKey": null
},
v29 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "slowLapSpread",
  "storageKey": null
},
v30 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "validLapCount",
    "storageKey": null
  },
  (v14/*: any*/),
  (v24/*: any*/),
  (v25/*: any*/),
  {
    "alias": null,
    "args": null,
    "concreteType": "RivalRollingWindow",
    "kind": "LinkedField",
    "name": "bestRolling5",
    "plural": false,
    "selections": (v26/*: any*/),
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "concreteType": "RivalRollingWindow",
    "kind": "LinkedField",
    "name": "bestRolling10",
    "plural": false,
    "selections": (v26/*: any*/),
    "storageKey": null
  },
  (v27/*: any*/),
  (v28/*: any*/),
  (v29/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "quickWindowCount",
    "storageKey": null
  }
],
v31 = [
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
      (v1/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/),
      (v4/*: any*/),
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
        "name": "notes",
        "storageKey": null
      },
      (v5/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "Track",
        "kind": "LinkedField",
        "name": "track",
        "plural": false,
        "selections": [
          (v1/*: any*/),
          (v6/*: any*/),
          (v7/*: any*/),
          (v8/*: any*/)
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
        "selections": (v9/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "Kart",
        "kind": "LinkedField",
        "name": "kart",
        "plural": false,
        "selections": (v9/*: any*/),
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
        "concreteType": "TrackSessionPerformance",
        "kind": "LinkedField",
        "name": "sessionPerformance",
        "plural": false,
        "selections": [
          (v3/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "score",
            "storageKey": null
          },
          (v10/*: any*/),
          (v11/*: any*/),
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
              (v12/*: any*/),
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
              (v10/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "weight",
                "storageKey": null
              },
              (v13/*: any*/),
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
              (v14/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "rankByBestLap",
                "storageKey": null
              },
              (v15/*: any*/),
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
              (v16/*: any*/)
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
              (v14/*: any*/),
              (v15/*: any*/),
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
              (v16/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      (v17/*: any*/),
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
          (v1/*: any*/),
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
          (v18/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "error",
            "storageKey": null
          },
          (v19/*: any*/),
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
          (v17/*: any*/),
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
              (v20/*: any*/),
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
            "args": (v21/*: any*/),
            "concreteType": "RecordingUploadTarget",
            "kind": "LinkedField",
            "name": "uploadTargets",
            "plural": true,
            "selections": [
              (v1/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "fileName",
                "storageKey": null
              },
              (v19/*: any*/),
              (v20/*: any*/),
              (v18/*: any*/),
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
        "args": (v21/*: any*/),
        "concreteType": "Lap",
        "kind": "LinkedField",
        "name": "laps",
        "plural": true,
        "selections": [
          (v1/*: any*/),
          (v12/*: any*/),
          (v22/*: any*/),
          {
            "alias": null,
            "args": (v21/*: any*/),
            "concreteType": "LapEvent",
            "kind": "LinkedField",
            "name": "lapEvents",
            "plural": true,
            "selections": [
              (v1/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "offset",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "event",
                "storageKey": null
              },
              (v13/*: any*/)
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
          (v1/*: any*/),
          (v6/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
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
              (v12/*: any*/),
              (v22/*: any*/)
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
              (v12/*: any*/),
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
              (v23/*: any*/),
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
            "concreteType": "RivalTrend",
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
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "sampleCount",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "slope",
                "storageKey": null
              },
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
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "sessionId",
                    "storageKey": null
                  },
                  (v2/*: any*/),
                  (v23/*: any*/)
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
                "selections": (v30/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "RivalDriverPace",
                "kind": "LinkedField",
                "name": "rival",
                "plural": false,
                "selections": (v30/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "RivalPaceDeltas",
                "kind": "LinkedField",
                "name": "deltas",
                "plural": false,
                "selections": [
                  (v14/*: any*/),
                  (v24/*: any*/),
                  (v25/*: any*/),
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
                  (v27/*: any*/),
                  (v28/*: any*/),
                  (v29/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "quickWindowCutoff",
                "storageKey": null
              },
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
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "ceilingVerdict",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "sustainedVerdict",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "robustnessVerdict",
                "storageKey": null
              },
              (v11/*: any*/)
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
      (v1/*: any*/),
      (v6/*: any*/),
      (v7/*: any*/),
      (v8/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "Kart",
        "kind": "LinkedField",
        "name": "karts",
        "plural": true,
        "selections": (v9/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "TrackLayout",
        "kind": "LinkedField",
        "name": "trackLayouts",
        "plural": true,
        "selections": (v9/*: any*/),
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "viewSessionQuery",
    "selections": (v31/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "viewSessionQuery",
    "selections": (v31/*: any*/)
  },
  "params": {
    "cacheID": "f7bfc8d712511c44aae996676ab07248",
    "id": null,
    "metadata": {},
    "name": "viewSessionQuery",
    "operationKind": "query",
    "text": "query viewSessionQuery(\n  $id: ID!\n  $rivalName: String!\n) {\n  trackSession(id: $id) {\n    id\n    date\n    format\n    classification\n    fastestLap\n    conditions\n    temperature\n    notes\n    kartNumber\n    track {\n      id\n      name\n      postcode\n      isIndoors\n    }\n    trackLayout {\n      id\n      name\n    }\n    kart {\n      id\n      name\n    }\n    sessionPerformanceScore\n    sessionPerformance {\n      format\n      score\n      label\n      headline\n      cleanLapCount\n      excludedLapCount\n      cleanLapNumbers\n      excludedLaps {\n        lapNumber\n        reason\n      }\n      scoreComponents {\n        key\n        label\n        weight\n        value\n        contribution\n      }\n      representativePace\n      thresholdLapTime\n      highlightLapNumbers\n      qualifyingKpis {\n        bestLap\n        rankByBestLap\n        gapToP1\n        gapToP3\n        top3Average\n        top3Spread\n        secondLapDelta\n        pushRatePct\n        cleanLapRatioPct\n      }\n      practiceRaceKpis {\n        bestLap\n        gapToP1\n        top5Average\n        top10Average\n        cleanLapStdDev\n        longestConsistentStintLaps\n        longestConsistentStintStartLap\n        longestConsistentStintEndLap\n        lapsWithinThresholdPct\n        cleanLapRatioPct\n      }\n    }\n    createdAt\n    updatedAt\n    trackRecordings(first: 20) {\n      id\n      description\n      mediaId\n      status\n      error\n      sizeBytes\n      overlayBurned\n      isPrimary\n      showInMediaLibrary\n      lapOneOffset\n      durationMs\n      fps\n      createdAt\n      combineProgress\n      uploadProgress {\n        uploadedBytes\n        totalBytes\n      }\n      uploadTargets(first: 50) {\n        id\n        fileName\n        sizeBytes\n        uploadedBytes\n        status\n        ordinal\n        uploadToken\n      }\n    }\n    laps(first: 50) {\n      id\n      lapNumber\n      time\n      lapEvents(first: 50) {\n        id\n        offset\n        event\n        value\n      }\n    }\n    participants {\n      id\n      name\n      classification\n      kartNumber\n      isSelf\n      laps {\n        lapNumber\n        time\n      }\n    }\n    rivalAnalysis(rivalName: $rivalName) {\n      rivalName\n      lapComparisons {\n        lapNumber\n        selfLap\n        rivalLap\n        delta\n        cumulativeDelta\n        outcome\n      }\n      sessionInsights {\n        fasterLapCount\n        slowerLapCount\n        tieCount\n        longestGainStreak\n        longestLossStreak\n        medianDelta\n        consistencyGap\n        insightLabel\n      }\n      trend {\n        direction\n        sampleCount\n        slope\n        firstDelta\n        latestDelta\n        points {\n          sessionId\n          date\n          delta\n        }\n      }\n      paceInsights {\n        self {\n          validLapCount\n          bestLap\n          fastest5Avg\n          fastest10Avg\n          bestRolling5 {\n            average\n            startLapNumber\n            endLapNumber\n          }\n          bestRolling10 {\n            average\n            startLapNumber\n            endLapNumber\n          }\n          overallMean\n          overallMedian\n          slowLapSpread\n          quickWindowCount\n        }\n        rival {\n          validLapCount\n          bestLap\n          fastest5Avg\n          fastest10Avg\n          bestRolling5 {\n            average\n            startLapNumber\n            endLapNumber\n          }\n          bestRolling10 {\n            average\n            startLapNumber\n            endLapNumber\n          }\n          overallMean\n          overallMedian\n          slowLapSpread\n          quickWindowCount\n        }\n        deltas {\n          bestLap\n          fastest5Avg\n          fastest10Avg\n          bestRolling5Avg\n          bestRolling10Avg\n          overallMean\n          overallMedian\n          slowLapSpread\n        }\n        quickWindowCutoff\n        quickWindowSelfCount\n        quickWindowRivalCount\n        ceilingVerdict\n        sustainedVerdict\n        robustnessVerdict\n        headline\n      }\n    }\n  }\n  tracks {\n    id\n    name\n    postcode\n    isIndoors\n    karts {\n      id\n      name\n    }\n    trackLayouts {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "e86a78a6b6bc5ffca4503c3a016b8f21";

export default node;
