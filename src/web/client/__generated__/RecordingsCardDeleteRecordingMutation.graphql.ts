/**
 * @generated SignedSource<<6fb4f9ebec9a8a1a51b05eace70a1b32>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type RecordingsCardDeleteRecordingMutation$variables = {
  id: string;
};
export type RecordingsCardDeleteRecordingMutation$data = {
  readonly deleteTrackRecording: {
    readonly success: boolean;
  };
};
export type RecordingsCardDeleteRecordingMutation = {
  response: RecordingsCardDeleteRecordingMutation$data;
  variables: RecordingsCardDeleteRecordingMutation$variables;
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
    "concreteType": "DeleteTrackRecordingPayload",
    "kind": "LinkedField",
    "name": "deleteTrackRecording",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "success",
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
    "name": "RecordingsCardDeleteRecordingMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "RecordingsCardDeleteRecordingMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "4fd7a2a06925615236bbf1fd2650613b",
    "id": null,
    "metadata": {},
    "name": "RecordingsCardDeleteRecordingMutation",
    "operationKind": "mutation",
    "text": "mutation RecordingsCardDeleteRecordingMutation(\n  $id: ID!\n) {\n  deleteTrackRecording(id: $id) {\n    success\n  }\n}\n"
  }
};
})();

(node as any).hash = "e815e616ae7a3c38d78eb8f754d4b49e";

export default node;
