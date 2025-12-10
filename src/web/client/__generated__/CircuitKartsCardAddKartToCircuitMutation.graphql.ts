/**
 * @generated SignedSource<<6471f5b39ee111bbf4d6daa561027bce>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CircuitKartsCardAddKartToCircuitMutation$variables = {
  circuitId: string;
  kartId: string;
};
export type CircuitKartsCardAddKartToCircuitMutation$data = {
  readonly addKartToCircuit: {
    readonly circuit: {
      readonly id: string;
      readonly karts: ReadonlyArray<{
        readonly id: string;
        readonly name: string;
      }>;
    };
    readonly kart: {
      readonly id: string;
    };
  };
};
export type CircuitKartsCardAddKartToCircuitMutation = {
  response: CircuitKartsCardAddKartToCircuitMutation$data;
  variables: CircuitKartsCardAddKartToCircuitMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "circuitId"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "kartId"
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
        "name": "circuitId",
        "variableName": "circuitId"
      },
      {
        "kind": "Variable",
        "name": "kartId",
        "variableName": "kartId"
      }
    ],
    "concreteType": "AddKartToCircuitPayload",
    "kind": "LinkedField",
    "name": "addKartToCircuit",
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
          (v1/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Kart",
            "kind": "LinkedField",
            "name": "karts",
            "plural": true,
            "selections": [
              (v1/*: any*/),
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
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "Kart",
        "kind": "LinkedField",
        "name": "kart",
        "plural": false,
        "selections": [
          (v1/*: any*/)
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
    "name": "CircuitKartsCardAddKartToCircuitMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CircuitKartsCardAddKartToCircuitMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "eda2f0a0ad7280da4e7c55ec02fe5123",
    "id": null,
    "metadata": {},
    "name": "CircuitKartsCardAddKartToCircuitMutation",
    "operationKind": "mutation",
    "text": "mutation CircuitKartsCardAddKartToCircuitMutation(\n  $circuitId: ID!\n  $kartId: ID!\n) {\n  addKartToCircuit(circuitId: $circuitId, kartId: $kartId) {\n    circuit {\n      id\n      karts {\n        id\n        name\n      }\n    }\n    kart {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "1d0dba27747500dfb67b81d9603908f8";

export default node;
