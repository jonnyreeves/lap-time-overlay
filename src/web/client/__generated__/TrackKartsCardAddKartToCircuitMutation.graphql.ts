/**
 * @generated SignedSource<<7a0e4e446a84fb0168b9b16eb7003f73>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TrackKartsCardAddKartToCircuitMutation$variables = {
  circuitId: string;
  kartId: string;
};
export type TrackKartsCardAddKartToCircuitMutation$data = {
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
export type TrackKartsCardAddKartToCircuitMutation = {
  response: TrackKartsCardAddKartToCircuitMutation$data;
  variables: TrackKartsCardAddKartToCircuitMutation$variables;
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
    "name": "TrackKartsCardAddKartToCircuitMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TrackKartsCardAddKartToCircuitMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "7660755f27f13c198fbc0611ba2ba5b9",
    "id": null,
    "metadata": {},
    "name": "TrackKartsCardAddKartToCircuitMutation",
    "operationKind": "mutation",
    "text": "mutation TrackKartsCardAddKartToCircuitMutation(\n  $circuitId: ID!\n  $kartId: ID!\n) {\n  addKartToCircuit(circuitId: $circuitId, kartId: $kartId) {\n    circuit {\n      id\n      karts {\n        id\n        name\n      }\n    }\n    kart {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "670b29d89708b6f07f38a8acd2c8395f";

export default node;
