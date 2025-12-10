/**
 * @generated SignedSource<<b74f197c24b9830f0e887ce39e872fa4>>
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
export type CircuitKartsCardUpdateKartNameMutation$variables = {
  input: UpdateKartInput;
};
export type CircuitKartsCardUpdateKartNameMutation$data = {
  readonly updateKart: {
    readonly kart: {
      readonly id: string;
      readonly name: string;
    };
  };
};
export type CircuitKartsCardUpdateKartNameMutation = {
  response: CircuitKartsCardUpdateKartNameMutation$data;
  variables: CircuitKartsCardUpdateKartNameMutation$variables;
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
    "name": "CircuitKartsCardUpdateKartNameMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CircuitKartsCardUpdateKartNameMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "9d1d0e1130d234a8b1fee9cb770f3c1c",
    "id": null,
    "metadata": {},
    "name": "CircuitKartsCardUpdateKartNameMutation",
    "operationKind": "mutation",
    "text": "mutation CircuitKartsCardUpdateKartNameMutation(\n  $input: UpdateKartInput!\n) {\n  updateKart(input: $input) {\n    kart {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "43309a5299090e11e1956ce8896df4af";

export default node;
