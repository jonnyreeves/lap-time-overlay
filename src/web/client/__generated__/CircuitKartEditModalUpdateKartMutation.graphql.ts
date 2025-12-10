/**
 * @generated SignedSource<<e03e51af24a68bad493c126686e33f91>>
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
export type CircuitKartEditModalUpdateKartMutation$variables = {
  input: UpdateKartInput;
};
export type CircuitKartEditModalUpdateKartMutation$data = {
  readonly updateKart: {
    readonly kart: {
      readonly id: string;
      readonly name: string;
    };
  };
};
export type CircuitKartEditModalUpdateKartMutation = {
  response: CircuitKartEditModalUpdateKartMutation$data;
  variables: CircuitKartEditModalUpdateKartMutation$variables;
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
    "name": "CircuitKartEditModalUpdateKartMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CircuitKartEditModalUpdateKartMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "0d6330a92d95bd5de05cf05b0bc3cad3",
    "id": null,
    "metadata": {},
    "name": "CircuitKartEditModalUpdateKartMutation",
    "operationKind": "mutation",
    "text": "mutation CircuitKartEditModalUpdateKartMutation(\n  $input: UpdateKartInput!\n) {\n  updateKart(input: $input) {\n    kart {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "74cf5df8f024ed1eaf23990232315a60";

export default node;
