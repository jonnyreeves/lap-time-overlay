/**
 * @generated SignedSource<<532a1c139105b0434cdd6ab05089de5f>>
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
  readonly adminTempDirs: ReadonlyArray<{
    readonly fileCount: number;
    readonly name: AdminTempDirName;
    readonly path: string;
    readonly sizeBytes: number;
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
    "cacheID": "1ccdd842b7ea532738c15f771c92d48d",
    "id": null,
    "metadata": {},
    "name": "adminToolsQuery",
    "operationKind": "query",
    "text": "query adminToolsQuery {\n  adminOrphanedMedia {\n    mediaId\n    sizeBytes\n    modifiedAt\n  }\n  adminTempDirs {\n    name\n    path\n    sizeBytes\n    fileCount\n  }\n  adminRecordingHealth {\n    status\n    count\n  }\n}\n"
  }
};
})();

(node as any).hash = "992d7dcd62acd15408c6da97f660f299";

export default node;
