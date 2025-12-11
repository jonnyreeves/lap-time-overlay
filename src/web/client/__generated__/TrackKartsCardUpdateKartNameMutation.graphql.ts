/**
 * @generated SignedSource<<91d6ad0a7d7aea1a3b7e3f087ee9cca8>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateKartInput = {
  id: string;
  name: string;
};
export type TrackKartsCardUpdateKartNameMutation$variables = {
  input: UpdateKartInput;
};
export type TrackKartsCardUpdateKartNameMutation$data = {
  readonly updateKart: {
    readonly kart: {
      readonly id: string;
      readonly name: string;
    };
  };
};
export type TrackKartsCardUpdateKartNameMutation = {
  response: TrackKartsCardUpdateKartNameMutation$data;
  variables: TrackKartsCardUpdateKartNameMutation$variables;
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
    "concreteType": "UpdateKartPayload",
    "kind": "LinkedField",
    "name": "updateKart",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Kart",
        "kind": "LinkedField",
        "name": "kart",
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
            "name": "name",
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
    "name": "TrackKartsCardUpdateKartNameMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TrackKartsCardUpdateKartNameMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "27931d9d2032b57e7479cce5bfe6ffd0",
    "id": null,
    "metadata": {},
    "name": "TrackKartsCardUpdateKartNameMutation",
    "operationKind": "mutation",
    "text": "mutation TrackKartsCardUpdateKartNameMutation(\n  $input: UpdateKartInput!\n) {\n  updateKart(input: $input) {\n    kart {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "878480ca98cba4b20f3bc9a2ca326067";

export default node;
