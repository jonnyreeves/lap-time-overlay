/**
 * @generated SignedSource<<cd08f824b895ed273319e17e78f492d7>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateTrackLayoutInput = {
  id: string;
  name: string;
};
export type TrackLayoutCardUpdateTrackLayoutMutation$variables = {
  input: UpdateTrackLayoutInput;
};
export type TrackLayoutCardUpdateTrackLayoutMutation$data = {
  readonly updateTrackLayout: {
    readonly trackLayout: {
      readonly circuit: {
        readonly id: string;
      };
      readonly id: string;
      readonly name: string;
    };
  };
};
export type TrackLayoutCardUpdateTrackLayoutMutation = {
  response: TrackLayoutCardUpdateTrackLayoutMutation$data;
  variables: TrackLayoutCardUpdateTrackLayoutMutation$variables;
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
v2 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "UpdateTrackLayoutPayload",
    "kind": "LinkedField",
    "name": "updateTrackLayout",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "TrackLayout",
        "kind": "LinkedField",
        "name": "trackLayout",
        "plural": false,
        "selections": [
          (v1/*: any*/),
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
            "concreteType": "Circuit",
            "kind": "LinkedField",
            "name": "circuit",
            "plural": false,
            "selections": [
              (v1/*: any*/)
            ],
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
    "name": "TrackLayoutCardUpdateTrackLayoutMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TrackLayoutCardUpdateTrackLayoutMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "37c76247b26bbbf44f95b97df49c048c",
    "id": null,
    "metadata": {},
    "name": "TrackLayoutCardUpdateTrackLayoutMutation",
    "operationKind": "mutation",
    "text": "mutation TrackLayoutCardUpdateTrackLayoutMutation(\n  $input: UpdateTrackLayoutInput!\n) {\n  updateTrackLayout(input: $input) {\n    trackLayout {\n      id\n      name\n      circuit {\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "0fe18e01ee9523219a8c9239ab6a820f";

export default node;
