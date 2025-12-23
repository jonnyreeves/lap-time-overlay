/**
 * @generated SignedSource<<79ed1d59103182e33a5b8d4ce7b64eb9>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ConsistencyExclusionReason = "INVALID" | "OUTLIER" | "OUT_LAP" | "%future added value";
export type RecordingUploadStatus = "FAILED" | "PENDING" | "UPLOADED" | "UPLOADING" | "%future added value";
export type TrackRecordingStatus = "COMBINING" | "FAILED" | "PENDING_UPLOAD" | "READY" | "UPLOADING" | "%future added value";
export type viewSessionQuery$variables = {
  id: string;
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
    readonly track: {
      readonly id: string;
      readonly name: string;
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
        readonly uploadUrl: string | null | undefined;
        readonly uploadedBytes: number;
      }>;
    }>;
    readonly updatedAt: string;
  };
  readonly tracks: ReadonlyArray<{
    readonly id: string;
    readonly karts: ReadonlyArray<{
      readonly id: string;
      readonly name: string;
    }>;
    readonly name: string;
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
  "name": "name",
  "storageKey": null
},
v3 = [
  (v1/*: any*/),
  (v2/*: any*/)
],
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "lapNumber",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "sizeBytes",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "uploadedBytes",
  "storageKey": null
},
v9 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 50
  }
],
v10 = [
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
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "date",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "format",
        "storageKey": null
      },
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
        "name": "conditions",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "notes",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "Track",
        "kind": "LinkedField",
        "name": "track",
        "plural": false,
        "selections": (v3/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "TrackLayout",
        "kind": "LinkedField",
        "name": "trackLayout",
        "plural": false,
        "selections": (v3/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "Kart",
        "kind": "LinkedField",
        "name": "kart",
        "plural": false,
        "selections": (v3/*: any*/),
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
              (v4/*: any*/),
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
      (v5/*: any*/),
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
          (v6/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "error",
            "storageKey": null
          },
          (v7/*: any*/),
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
          (v5/*: any*/),
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
              (v8/*: any*/),
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
            "args": (v9/*: any*/),
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
              (v7/*: any*/),
              (v8/*: any*/),
              (v6/*: any*/),
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
                "name": "uploadUrl",
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
        "args": (v9/*: any*/),
        "concreteType": "Lap",
        "kind": "LinkedField",
        "name": "laps",
        "plural": true,
        "selections": [
          (v1/*: any*/),
          (v4/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "time",
            "storageKey": null
          },
          {
            "alias": null,
            "args": (v9/*: any*/),
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
      (v2/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "Kart",
        "kind": "LinkedField",
        "name": "karts",
        "plural": true,
        "selections": (v3/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "TrackLayout",
        "kind": "LinkedField",
        "name": "trackLayouts",
        "plural": true,
        "selections": (v3/*: any*/),
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
    "selections": (v10/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "viewSessionQuery",
    "selections": (v10/*: any*/)
  },
  "params": {
    "cacheID": "3ba6ffdc54b8050ad0f6a880de5fa9fa",
    "id": null,
    "metadata": {},
    "name": "viewSessionQuery",
    "operationKind": "query",
    "text": "query viewSessionQuery(\n  $id: ID!\n) {\n  trackSession(id: $id) {\n    id\n    date\n    format\n    classification\n    fastestLap\n    conditions\n    notes\n    track {\n      id\n      name\n    }\n    trackLayout {\n      id\n      name\n    }\n    kart {\n      id\n      name\n    }\n    consistencyScore\n    consistency {\n      score\n      label\n      mean\n      stdDev\n      cvPct\n      median\n      windowPct\n      cleanLapCount\n      excludedLapCount\n      totalValidLapCount\n      usableLapNumbers\n      excludedLaps {\n        lapNumber\n        reason\n      }\n    }\n    createdAt\n    updatedAt\n    trackRecordings(first: 20) {\n      id\n      description\n      mediaId\n      status\n      error\n      sizeBytes\n      overlayBurned\n      isPrimary\n      lapOneOffset\n      durationMs\n      fps\n      createdAt\n      combineProgress\n      uploadProgress {\n        uploadedBytes\n        totalBytes\n      }\n      uploadTargets(first: 50) {\n        id\n        fileName\n        sizeBytes\n        uploadedBytes\n        status\n        ordinal\n        uploadUrl\n      }\n    }\n    laps(first: 50) {\n      id\n      lapNumber\n      time\n      lapEvents(first: 50) {\n        id\n        offset\n        event\n        value\n      }\n    }\n  }\n  tracks {\n    id\n    name\n    karts {\n      id\n      name\n    }\n    trackLayouts {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "094c9cf27e874e81998ad914a611c926";

export default node;
