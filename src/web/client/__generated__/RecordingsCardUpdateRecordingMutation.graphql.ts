/**
 * @generated SignedSource<<865aa4830334b16ddf992324f8dc9f64>>
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
export type RecordingsCardUpdateRecordingMutation$variables = {
  input: UpdateTrackRecordingInput;
};
export type RecordingsCardUpdateRecordingMutation$data = {
  readonly updateTrackRecording: {
    readonly recording: {
      readonly fps: number | null | undefined;
      readonly id: string;
      readonly lapOneOffset: number;
      readonly updatedAt: string;
    };
  };
};
export type RecordingsCardUpdateRecordingMutation = {
  response: RecordingsCardUpdateRecordingMutation$data;
  variables: RecordingsCardUpdateRecordingMutation$variables;
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
    "name": "RecordingsCardUpdateRecordingMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "RecordingsCardUpdateRecordingMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "1331d1328c0ba9694b4c4c2af226dd75",
    "id": null,
    "metadata": {},
    "name": "RecordingsCardUpdateRecordingMutation",
    "operationKind": "mutation",
    "text": "mutation RecordingsCardUpdateRecordingMutation(\n  $input: UpdateTrackRecordingInput!\n) {\n  updateTrackRecording(input: $input) {\n    recording {\n      id\n      lapOneOffset\n      fps\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "98709078dd85f69fa8175d6bf87f84e0";

export default node;
