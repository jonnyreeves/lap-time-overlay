/**
 * @generated SignedSource<<07db1f723c4e79517ea2be612054febf>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateKartInput = {
  name: string;
};
export type CircuitKartEditModalCreateKartMutation$variables = {
  input: CreateKartInput;
};
export type CircuitKartEditModalCreateKartMutation$data = {
  readonly createKart: {
    readonly kart: {
      readonly id: string;
      readonly name: string;
    };
  };
};
export type CircuitKartEditModalCreateKartMutation = {
  response: CircuitKartEditModalCreateKartMutation$data;
  variables: CircuitKartEditModalCreateKartMutation$variables;
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
    "concreteType": "CreateKartPayload",
    "kind": "LinkedField",
    "name": "createKart",
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
    "name": "CircuitKartEditModalCreateKartMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CircuitKartEditModalCreateKartMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "e5f0ec89859e4e6c7b444e6a475d6370",
    "id": null,
    "metadata": {},
    "name": "CircuitKartEditModalCreateKartMutation",
    "operationKind": "mutation",
    "text": "mutation CircuitKartEditModalCreateKartMutation(\n  $input: CreateKartInput!\n) {\n  createKart(input: $input) {\n    kart {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "c9205f48eedc724911ff9ecd896d4762";

export default node;
