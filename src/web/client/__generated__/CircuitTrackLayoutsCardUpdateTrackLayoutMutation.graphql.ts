/**
 * @generated SignedSource<<a22c3c0c0b8bdcef6e48213630c39387>>
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
export type CircuitTrackLayoutsCardUpdateTrackLayoutMutation$variables = {
  input: UpdateTrackLayoutInput;
};
export type CircuitTrackLayoutsCardUpdateTrackLayoutMutation$data = {
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
export type CircuitTrackLayoutsCardUpdateTrackLayoutMutation = {
  response: CircuitTrackLayoutsCardUpdateTrackLayoutMutation$data;
  variables: CircuitTrackLayoutsCardUpdateTrackLayoutMutation$variables;
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
    "name": "CircuitTrackLayoutsCardUpdateTrackLayoutMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CircuitTrackLayoutsCardUpdateTrackLayoutMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "d9c9747dae77ed9f4c8ddd8337d4bc6c",
    "id": null,
    "metadata": {},
    "name": "CircuitTrackLayoutsCardUpdateTrackLayoutMutation",
    "operationKind": "mutation",
    "text": "mutation CircuitTrackLayoutsCardUpdateTrackLayoutMutation(\n  $input: UpdateTrackLayoutInput!\n) {\n  updateTrackLayout(input: $input) {\n    trackLayout {\n      id\n      name\n      circuit {\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "4e5d89e7dab24646de20ec00b10bce3d";

export default node;
