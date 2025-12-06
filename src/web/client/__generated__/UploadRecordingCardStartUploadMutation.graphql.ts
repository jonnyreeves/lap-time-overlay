/**
 * @generated SignedSource<<a1c9d744c21ee23b49c2eff30c9a76d7>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type RecordingUploadStatus = "FAILED" | "PENDING" | "UPLOADED" | "UPLOADING" | "%future added value";
export type TrackRecordingStatus = "COMBINING" | "FAILED" | "PENDING_UPLOAD" | "READY" | "UPLOADING" | "%future added value";
export type StartTrackRecordingUploadInput = {
  description?: string | null | undefined;
  lapOneOffset?: number | null | undefined;
  sessionId: string;
  sources: ReadonlyArray<RecordingSourceInput>;
};
export type RecordingSourceInput = {
  fileName: string;
  sizeBytes?: number | null | undefined;
};
export type UploadRecordingCardStartUploadMutation$variables = {
  input: StartTrackRecordingUploadInput;
};
export type UploadRecordingCardStartUploadMutation$data = {
  readonly startTrackRecordingUpload: {
    readonly recording: {
      readonly combineProgress: number | null | undefined;
      readonly id: string;
      readonly isPrimary: boolean;
      readonly status: TrackRecordingStatus;
      readonly uploadProgress: {
        readonly totalBytes: number | null | undefined;
        readonly uploadedBytes: number;
      };
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
  };
};
export type UploadRecordingCardStartUploadMutation = {
  response: UploadRecordingCardStartUploadMutation$data;
  variables: UploadRecordingCardStartUploadMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
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
  "name": "status",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "uploadedBytes",
  "storageKey": null
},
v4 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "StartTrackRecordingUploadPayload",
    "kind": "LinkedField",
    "name": "startTrackRecordingUpload",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "TrackRecording",
        "kind": "LinkedField",
        "name": "recording",
        "plural": false,
        "selections": [
          (v1/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "isPrimary",
            "storageKey": null
          },
          (v2/*: any*/),
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
              (v3/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "totalBytes",
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
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "sizeBytes",
            "storageKey": null
          },
          (v3/*: any*/),
          (v2/*: any*/),
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
    "name": "UploadRecordingCardStartUploadMutation",
    "selections": (v4/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "UploadRecordingCardStartUploadMutation",
    "selections": (v4/*: any*/)
  },
  "params": {
    "cacheID": "b59344c147eaaa98517679623db13721",
    "id": null,
    "metadata": {},
    "name": "UploadRecordingCardStartUploadMutation",
    "operationKind": "mutation",
    "text": "mutation UploadRecordingCardStartUploadMutation(\n  $input: StartTrackRecordingUploadInput!\n) {\n  startTrackRecordingUpload(input: $input) {\n    recording {\n      id\n      isPrimary\n      status\n      combineProgress\n      uploadProgress {\n        uploadedBytes\n        totalBytes\n      }\n    }\n    uploadTargets {\n      id\n      fileName\n      sizeBytes\n      uploadedBytes\n      status\n      ordinal\n      uploadUrl\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "bf6ab9c652d3fac532f7d1745f4b287c";

export default node;
