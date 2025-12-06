/**
 * @generated SignedSource<<7ebb887d6fe883dd98a164b75d295773>>
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
export type RecordingsCardStartUploadMutation$variables = {
  input: StartTrackRecordingUploadInput;
};
export type RecordingsCardStartUploadMutation$data = {
  readonly startTrackRecordingUpload: {
    readonly recording: {
      readonly combineProgress: number | null | undefined;
      readonly id: string;
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
export type RecordingsCardStartUploadMutation = {
  response: RecordingsCardStartUploadMutation$data;
  variables: RecordingsCardStartUploadMutation$variables;
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
    "name": "RecordingsCardStartUploadMutation",
    "selections": (v4/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "RecordingsCardStartUploadMutation",
    "selections": (v4/*: any*/)
  },
  "params": {
    "cacheID": "58ec8fd04c8d1ed72135e010fe9cd3c0",
    "id": null,
    "metadata": {},
    "name": "RecordingsCardStartUploadMutation",
    "operationKind": "mutation",
    "text": "mutation RecordingsCardStartUploadMutation(\n  $input: StartTrackRecordingUploadInput!\n) {\n  startTrackRecordingUpload(input: $input) {\n    recording {\n      id\n      status\n      combineProgress\n      uploadProgress {\n        uploadedBytes\n        totalBytes\n      }\n    }\n    uploadTargets {\n      id\n      fileName\n      sizeBytes\n      uploadedBytes\n      status\n      ordinal\n      uploadUrl\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "5152aad903f3c8ebda17da1a7cdb9f60";

export default node;
