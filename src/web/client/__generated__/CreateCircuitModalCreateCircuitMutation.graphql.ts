/**
 * @generated SignedSource<<bc6fd68532278992147f3904cee06a3b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateCircuitInput = {
  heroImage?: string | null | undefined;
  name: string;
};
export type CreateCircuitModalCreateCircuitMutation$variables = {
  input: CreateCircuitInput;
};
export type CreateCircuitModalCreateCircuitMutation$data = {
  readonly createCircuit: {
    readonly circuit: {
      readonly heroImage: string | null | undefined;
      readonly id: string;
      readonly name: string;
    };
  };
};
export type CreateCircuitModalCreateCircuitMutation = {
  response: CreateCircuitModalCreateCircuitMutation$data;
  variables: CreateCircuitModalCreateCircuitMutation$variables;
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
    "concreteType": "CreateCircuitPayload",
    "kind": "LinkedField",
    "name": "createCircuit",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Circuit",
        "kind": "LinkedField",
        "name": "circuit",
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
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "heroImage",
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
    "name": "CreateCircuitModalCreateCircuitMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CreateCircuitModalCreateCircuitMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "82364c556389d53ba07acd482ec4e2c4",
    "id": null,
    "metadata": {},
    "name": "CreateCircuitModalCreateCircuitMutation",
    "operationKind": "mutation",
    "text": "mutation CreateCircuitModalCreateCircuitMutation(\n  $input: CreateCircuitInput!\n) {\n  createCircuit(input: $input) {\n    circuit {\n      id\n      name\n      heroImage\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "0566c2d2e4cb0defb5405f62b7711e84";

export default node;
