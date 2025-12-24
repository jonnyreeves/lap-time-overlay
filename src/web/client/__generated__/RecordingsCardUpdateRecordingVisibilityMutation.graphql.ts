/**
 * @generated SignedSource<<0c659e94d1493acd5be7aafc001473a4>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateTrackRecordingInput = {
  id: string;
  lapOneOffset?: number | null | undefined;
  showInMediaLibrary?: boolean | null | undefined;
};
export type RecordingsCardUpdateRecordingVisibilityMutation$variables = {
  input: UpdateTrackRecordingInput;
};
export type RecordingsCardUpdateRecordingVisibilityMutation$data = {
  readonly updateTrackRecording: {
    readonly recording: {
      readonly id: string;
      readonly showInMediaLibrary: boolean;
      readonly updatedAt: string;
    };
  };
};
export type RecordingsCardUpdateRecordingVisibilityMutation = {
  response: RecordingsCardUpdateRecordingVisibilityMutation$data;
  variables: RecordingsCardUpdateRecordingVisibilityMutation$variables;
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
            "name": "showInMediaLibrary",
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
    "name": "RecordingsCardUpdateRecordingVisibilityMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "RecordingsCardUpdateRecordingVisibilityMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "310df84097057366a19932f9e65e816e",
    "id": null,
    "metadata": {},
    "name": "RecordingsCardUpdateRecordingVisibilityMutation",
    "operationKind": "mutation",
    "text": "mutation RecordingsCardUpdateRecordingVisibilityMutation(\n  $input: UpdateTrackRecordingInput!\n) {\n  updateTrackRecording(input: $input) {\n    recording {\n      id\n      showInMediaLibrary\n      updatedAt\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "7890b047bd388779c22ec07fe62a0aff";

export default node;
