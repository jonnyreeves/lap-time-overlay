/**
 * @generated SignedSource<<3a9caeff0359b47afe8da89fa4918d11>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateTrackRecordingInput = {
  id: string;
  lapOneOffset: number;
};
export type PrimaryRecordingCardUpdateRecordingMutation$variables = {
  input: UpdateTrackRecordingInput;
};
export type PrimaryRecordingCardUpdateRecordingMutation$data = {
  readonly updateTrackRecording: {
    readonly recording: {
      readonly fps: number | null | undefined;
      readonly id: string;
      readonly lapOneOffset: number;
      readonly updatedAt: string;
    };
  };
};
export type PrimaryRecordingCardUpdateRecordingMutation = {
  response: PrimaryRecordingCardUpdateRecordingMutation$data;
  variables: PrimaryRecordingCardUpdateRecordingMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "UpdateTrackRecordingPayload",
    "kind": "LinkedField",
    "name": "updateTrackRecording",
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
            "name": "lapOneOffset",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "fps",
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
    "name": "PrimaryRecordingCardUpdateRecordingMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "PrimaryRecordingCardUpdateRecordingMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "61848f39b796724aae7e35ea42ff1d96",
    "id": null,
    "metadata": {},
    "name": "PrimaryRecordingCardUpdateRecordingMutation",
    "operationKind": "mutation",
    "text": "mutation PrimaryRecordingCardUpdateRecordingMutation(\n  $input: UpdateTrackRecordingInput!\n) {\n  updateTrackRecording(input: $input) {\n    recording {\n      id\n      lapOneOffset\n      fps\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "46959a23a3f39a9119b609f85c05e959";

export default node;
