/**
 * @generated SignedSource<<05de6c746c2f3114f40bd5cf51276516>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type RecordingsCardMarkPrimaryRecordingMutation$variables = {
  id: string;
};
export type RecordingsCardMarkPrimaryRecordingMutation$data = {
  readonly markPrimaryTrackRecording: {
    readonly recording: {
      readonly id: string;
      readonly isPrimary: boolean;
      readonly updatedAt: string;
    };
  };
};
export type RecordingsCardMarkPrimaryRecordingMutation = {
  response: RecordingsCardMarkPrimaryRecordingMutation$data;
  variables: RecordingsCardMarkPrimaryRecordingMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "concreteType": "MarkPrimaryTrackRecordingPayload",
    "kind": "LinkedField",
    "name": "markPrimaryTrackRecording",
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
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "id",
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
            "name": "updatedAt",
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
    "name": "RecordingsCardMarkPrimaryRecordingMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "RecordingsCardMarkPrimaryRecordingMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "1f2c319ccf7b16c2e882b7df6142bce8",
    "id": null,
    "metadata": {},
    "name": "RecordingsCardMarkPrimaryRecordingMutation",
    "operationKind": "mutation",
    "text": "mutation RecordingsCardMarkPrimaryRecordingMutation(\n  $id: ID!\n) {\n  markPrimaryTrackRecording(id: $id) {\n    recording {\n      id\n      isPrimary\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "772a36d5c4a812471617501b61ea3314";

export default node;
