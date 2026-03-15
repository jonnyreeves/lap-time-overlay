/**
 * @generated SignedSource<<3695d7656475f42e6d1110c22c507dab>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ConsistencyExclusionReason = "INVALID" | "OUTLIER" | "OUT_LAP" | "%future added value";
export type RecordingUploadStatus = "FAILED" | "PENDING" | "UPLOADED" | "UPLOADING" | "%future added value";
export type RivalInsightLabel = "CONSISTENTLY_SLOWER" | "MIXED_OR_NEUTRAL" | "MIXED_WITH_FASTER_PHASES" | "%future added value";
export type RivalLapOutcome = "FASTER" | "SLOWER" | "TIE" | "%future added value";
export type RivalTrendDirection = "CLOSING" | "FLAT" | "INSUFFICIENT" | "WIDENING" | "%future added value";
export type TrackRecordingStatus = "COMBINING" | "FAILED" | "PENDING_UPLOAD" | "READY" | "UPLOADING" | "%future added value";
export type viewSessionQuery$variables = {
  id: string;
  rivalName: string;
};
export type viewSessionQuery$data = {
  readonly trackSession: {
    readonly classification: number;
    readonly conditions: string;
    readonly consistency: {
      readonly cleanLapCount: number;
      readonly cvPct: number | null | undefined;
      readonly excludedLapCount: number;
      readonly excludedLaps: ReadonlyArray<{
        readonly lapNumber: number;
        readonly reason: ConsistencyExclusionReason;
      }>;
      readonly label: string;
      readonly mean: number | null | undefined;
      readonly median: number | null | undefined;
      readonly score: number | null | undefined;
      readonly stdDev: number | null | undefined;
      readonly totalValidLapCount: number;
      readonly usableLapNumbers: ReadonlyArray<number>;
      readonly windowPct: number | null | undefined;
    };
    readonly consistencyScore: number | null | undefined;
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
  "name": "classification",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "kartNumber",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "postcode",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isIndoors",
  "storageKey": null
},
v8 = [
  (v1/*: any*/),
  (v5/*: any*/)
],
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "lapNumber",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "sizeBytes",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "uploadedBytes",
  "storageKey": null
},
v14 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 50
  }
],
v15 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "time",
  "storageKey": null
},
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "delta",
  "storageKey": null
},
v17 = [
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
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "format",
        "storageKey": null
      },
      (v3/*: any*/),
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
      (v4/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "Track",
        "kind": "LinkedField",
        "name": "track",
        "plural": false,
        "selections": [
          (v1/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          (v7/*: any*/)
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
        "selections": (v8/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "Kart",
        "kind": "LinkedField",
        "name": "kart",
        "plural": false,
        "selections": (v8/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "consistencyScore",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "TrackSessionConsistency",
        "kind": "LinkedField",
        "name": "consistency",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "score",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "label",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "mean",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "stdDev",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "cvPct",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "median",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "windowPct",
            "storageKey": null
          },
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
            "name": "totalValidLapCount",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "usableLapNumbers",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "ConsistencyExcludedLap",
            "kind": "LinkedField",
            "name": "excludedLaps",
            "plural": true,
            "selections": [
              (v9/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "reason",
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      (v10/*: any*/),
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
          (v11/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "error",
            "storageKey": null
          },
          (v12/*: any*/),
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
          (v10/*: any*/),
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
              (v13/*: any*/),
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
            "args": (v14/*: any*/),
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
              (v12/*: any*/),
              (v13/*: any*/),
              (v11/*: any*/),
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
        "args": (v14/*: any*/),
        "concreteType": "Lap",
        "kind": "LinkedField",
        "name": "laps",
        "plural": true,
        "selections": [
          (v1/*: any*/),
          (v9/*: any*/),
          (v15/*: any*/),
          {
            "alias": null,
            "args": (v14/*: any*/),
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
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "value",
                "storageKey": null
              }
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
          (v5/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
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
              (v9/*: any*/),
              (v15/*: any*/)
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
              (v9/*: any*/),
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
              (v16/*: any*/),
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
                  (v16/*: any*/)
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
      (v5/*: any*/),
      (v6/*: any*/),
      (v7/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "Kart",
        "kind": "LinkedField",
        "name": "karts",
        "plural": true,
        "selections": (v8/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "TrackLayout",
        "kind": "LinkedField",
        "name": "trackLayouts",
        "plural": true,
        "selections": (v8/*: any*/),
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
    "selections": (v17/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "viewSessionQuery",
    "selections": (v17/*: any*/)
  },
  "params": {
    "cacheID": "65ab531d75e15a4114fb4742923607fb",
    "id": null,
    "metadata": {},
    "name": "viewSessionQuery",
    "operationKind": "query",
    "text": "query viewSessionQuery(\n  $id: ID!\n  $rivalName: String!\n) {\n  trackSession(id: $id) {\n    id\n    date\n    format\n    classification\n    fastestLap\n    conditions\n    temperature\n    notes\n    kartNumber\n    track {\n      id\n      name\n      postcode\n      isIndoors\n    }\n    trackLayout {\n      id\n      name\n    }\n    kart {\n      id\n      name\n    }\n    consistencyScore\n    consistency {\n      score\n      label\n      mean\n      stdDev\n      cvPct\n      median\n      windowPct\n      cleanLapCount\n      excludedLapCount\n      totalValidLapCount\n      usableLapNumbers\n      excludedLaps {\n        lapNumber\n        reason\n      }\n    }\n    createdAt\n    updatedAt\n    trackRecordings(first: 20) {\n      id\n      description\n      mediaId\n      status\n      error\n      sizeBytes\n      overlayBurned\n      isPrimary\n      showInMediaLibrary\n      lapOneOffset\n      durationMs\n      fps\n      createdAt\n      combineProgress\n      uploadProgress {\n        uploadedBytes\n        totalBytes\n      }\n      uploadTargets(first: 50) {\n        id\n        fileName\n        sizeBytes\n        uploadedBytes\n        status\n        ordinal\n        uploadToken\n      }\n    }\n    laps(first: 50) {\n      id\n      lapNumber\n      time\n      lapEvents(first: 50) {\n        id\n        offset\n        event\n        value\n      }\n    }\n    participants {\n      id\n      name\n      classification\n      kartNumber\n      isSelf\n      laps {\n        lapNumber\n        time\n      }\n    }\n    rivalAnalysis(rivalName: $rivalName) {\n      rivalName\n      lapComparisons {\n        lapNumber\n        selfLap\n        rivalLap\n        delta\n        cumulativeDelta\n        outcome\n      }\n      sessionInsights {\n        fasterLapCount\n        slowerLapCount\n        tieCount\n        longestGainStreak\n        longestLossStreak\n        medianDelta\n        consistencyGap\n        insightLabel\n      }\n      trend {\n        direction\n        sampleCount\n        slope\n        firstDelta\n        latestDelta\n        points {\n          sessionId\n          date\n          delta\n        }\n      }\n    }\n  }\n  tracks {\n    id\n    name\n    postcode\n    isIndoors\n    karts {\n      id\n      name\n    }\n    trackLayouts {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "429214c3eb64639a8fb87e691de51a9f";

export default node;
