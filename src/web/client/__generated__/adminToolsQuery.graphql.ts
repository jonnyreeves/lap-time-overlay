/**
 * @generated SignedSource<<6bbe48274639f5a357f5df596bebfce2>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type AdminTempDirName = "PREVIEWS" | "RENDERS" | "UPLOADS" | "%future added value";
export type RenderJobType = "COMBINE" | "OVERLAY" | "%future added value";
export type TrackRecordingStatus = "COMBINING" | "FAILED" | "PENDING_UPLOAD" | "READY" | "UPLOADING" | "%future added value";
export type VideoAccelerationBackend = "NONE" | "QSV" | "VAAPI" | "%future added value";
export type adminToolsQuery$variables = Record<PropertyKey, never>;
export type adminToolsQuery$data = {
  readonly adminOrphanedMedia: ReadonlyArray<{
    readonly mediaId: string;
    readonly modifiedAt: string;
    readonly sizeBytes: number;
  }>;
  readonly adminRecordingHealth: ReadonlyArray<{
    readonly count: number;
    readonly status: TrackRecordingStatus;
  }>;
  readonly adminRenderJobs: ReadonlyArray<{
    readonly description: string | null | undefined;
    readonly progress: number;
    readonly recordingId: string;
    readonly sessionId: string | null | undefined;
    readonly startedAt: string;
    readonly type: RenderJobType;
    readonly userId: string;
    readonly username: string | null | undefined;
  }>;
  readonly adminTempCleanupSchedule: {
    readonly days: ReadonlyArray<number>;
    readonly enabled: boolean;
    readonly hour: number;
    readonly lastRunAt: string | null | undefined;
    readonly nextRunAt: string | null | undefined;
  };
  readonly adminTempDirs: ReadonlyArray<{
    readonly fileCount: number;
    readonly name: AdminTempDirName;
    readonly path: string;
    readonly sizeBytes: number;
  }>;
  readonly adminUserMediaLibraries: ReadonlyArray<{
    readonly recordingCount: number;
    readonly sizeBytes: number;
    readonly userId: string;
    readonly username: string;
  }>;
  readonly adminUsers: ReadonlyArray<{
    readonly createdAt: string;
    readonly id: string;
    readonly isAdmin: boolean;
    readonly username: string;
  }>;
  readonly adminVideoAcceleration: {
    readonly available: boolean;
    readonly backend: VideoAccelerationBackend;
    readonly circuitBreakerActive: boolean;
    readonly circuitResetAt: string | null | undefined;
    readonly details: {
      readonly ffmpegHasEncoder: {
        readonly h264_qsv: boolean;
        readonly h264_vaapi: boolean;
        readonly hevc_qsv: boolean;
        readonly hevc_vaapi: boolean;
      };
      readonly ffmpegHasHwaccel: {
        readonly qsv: boolean;
        readonly vaapi: boolean;
      };
      readonly hasCard0: boolean;
      readonly hasDri: boolean;
      readonly hasRenderD128: boolean;
      readonly probeErrors: ReadonlyArray<string>;
    };
    readonly effectiveBackend: VideoAccelerationBackend;
    readonly preferHardwareEncoding: boolean;
    readonly probing: boolean;
  };
};
export type adminToolsQuery = {
  response: adminToolsQuery$data;
  variables: adminToolsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "sizeBytes",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "userId",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "username",
  "storageKey": null
},
v3 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "AdminOrphanedMedia",
    "kind": "LinkedField",
    "name": "adminOrphanedMedia",
    "plural": true,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "mediaId",
        "storageKey": null
      },
      (v0/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "modifiedAt",
        "storageKey": null
      }
    ],
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "concreteType": "AdminTempDir",
    "kind": "LinkedField",
    "name": "adminTempDirs",
    "plural": true,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "name",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "path",
        "storageKey": null
      },
      (v0/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "fileCount",
        "storageKey": null
      }
    ],
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "concreteType": "AdminRecordingHealth",
    "kind": "LinkedField",
    "name": "adminRecordingHealth",
    "plural": true,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "status",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "count",
        "storageKey": null
      }
    ],
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "concreteType": "AdminRenderJob",
    "kind": "LinkedField",
    "name": "adminRenderJobs",
    "plural": true,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "recordingId",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "sessionId",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "description",
        "storageKey": null
      },
      (v1/*: any*/),
      (v2/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "type",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "progress",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "startedAt",
        "storageKey": null
      }
    ],
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "concreteType": "AdminUserMediaLibrary",
    "kind": "LinkedField",
    "name": "adminUserMediaLibraries",
    "plural": true,
    "selections": [
      (v1/*: any*/),
      (v2/*: any*/),
      (v0/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "recordingCount",
        "storageKey": null
      }
    ],
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "concreteType": "AdminUser",
    "kind": "LinkedField",
    "name": "adminUsers",
    "plural": true,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "id",
        "storageKey": null
      },
      (v2/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "createdAt",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "isAdmin",
        "storageKey": null
      }
    ],
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "concreteType": "TempCleanupSchedule",
    "kind": "LinkedField",
    "name": "adminTempCleanupSchedule",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "hour",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "days",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "enabled",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "lastRunAt",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "nextRunAt",
        "storageKey": null
      }
    ],
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "concreteType": "VideoAccelerationStatus",
    "kind": "LinkedField",
    "name": "adminVideoAcceleration",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "available",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "backend",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "effectiveBackend",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "preferHardwareEncoding",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "probing",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "circuitBreakerActive",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "circuitResetAt",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "VideoAccelerationDetails",
        "kind": "LinkedField",
        "name": "details",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "hasDri",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "hasRenderD128",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "hasCard0",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "VideoAccelerationHwaccel",
            "kind": "LinkedField",
            "name": "ffmpegHasHwaccel",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "qsv",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "vaapi",
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "VideoAccelerationEncoders",
            "kind": "LinkedField",
            "name": "ffmpegHasEncoder",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "h264_qsv",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "h264_vaapi",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "hevc_qsv",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "hevc_vaapi",
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "probeErrors",
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
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "adminToolsQuery",
    "selections": (v3/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "adminToolsQuery",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "5b44e971002db876bd69522bdf1f6298",
    "id": null,
    "metadata": {},
    "name": "adminToolsQuery",
    "operationKind": "query",
    "text": "query adminToolsQuery {\n  adminOrphanedMedia {\n    mediaId\n    sizeBytes\n    modifiedAt\n  }\n  adminTempDirs {\n    name\n    path\n    sizeBytes\n    fileCount\n  }\n  adminRecordingHealth {\n    status\n    count\n  }\n  adminRenderJobs {\n    recordingId\n    sessionId\n    description\n    userId\n    username\n    type\n    progress\n    startedAt\n  }\n  adminUserMediaLibraries {\n    userId\n    username\n    sizeBytes\n    recordingCount\n  }\n  adminUsers {\n    id\n    username\n    createdAt\n    isAdmin\n  }\n  adminTempCleanupSchedule {\n    hour\n    days\n    enabled\n    lastRunAt\n    nextRunAt\n  }\n  adminVideoAcceleration {\n    available\n    backend\n    effectiveBackend\n    preferHardwareEncoding\n    probing\n    circuitBreakerActive\n    circuitResetAt\n    details {\n      hasDri\n      hasRenderD128\n      hasCard0\n      ffmpegHasHwaccel {\n        qsv\n        vaapi\n      }\n      ffmpegHasEncoder {\n        h264_qsv\n        h264_vaapi\n        hevc_qsv\n        hevc_vaapi\n      }\n      probeErrors\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "4a89453239b61412924b23c9cd6c04b1";

export default node;
