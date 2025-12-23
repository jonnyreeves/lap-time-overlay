/**
 * @generated SignedSource<<3ce937234a97ba9b89074d77308e8efc>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type AdminTempDirName = "PREVIEWS" | "RENDERS" | "UPLOADS" | "%future added value";
export type TrackRecordingStatus = "COMBINING" | "FAILED" | "PENDING_UPLOAD" | "READY" | "UPLOADING" | "%future added value";
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
v1 = [
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
    "concreteType": "AdminUserMediaLibrary",
    "kind": "LinkedField",
    "name": "adminUserMediaLibraries",
    "plural": true,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "userId",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "username",
        "storageKey": null
      },
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
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "adminToolsQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "adminToolsQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "5e2064884def03409fa2476da3582dda",
    "id": null,
    "metadata": {},
    "name": "adminToolsQuery",
    "operationKind": "query",
    "text": "query adminToolsQuery {\n  adminOrphanedMedia {\n    mediaId\n    sizeBytes\n    modifiedAt\n  }\n  adminTempDirs {\n    name\n    path\n    sizeBytes\n    fileCount\n  }\n  adminRecordingHealth {\n    status\n    count\n  }\n  adminUserMediaLibraries {\n    userId\n    username\n    sizeBytes\n    recordingCount\n  }\n  adminTempCleanupSchedule {\n    hour\n    days\n    enabled\n    lastRunAt\n    nextRunAt\n  }\n}\n"
  }
};
})();

(node as any).hash = "aef0a9a3aa8ca5fe03091af5d7f58cd8";

export default node;
