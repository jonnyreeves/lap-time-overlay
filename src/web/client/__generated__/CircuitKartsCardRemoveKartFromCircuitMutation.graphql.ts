/**
 * @generated SignedSource<<2c40d2a3095d8bc987409ed6a08e35b3>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CircuitKartsCardRemoveKartFromCircuitMutation$variables = {
  circuitId: string;
  kartId: string;
};
export type CircuitKartsCardRemoveKartFromCircuitMutation$data = {
  readonly removeKartFromCircuit: {
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
export type CircuitKartsCardRemoveKartFromCircuitMutation = {
  response: CircuitKartsCardRemoveKartFromCircuitMutation$data;
  variables: CircuitKartsCardRemoveKartFromCircuitMutation$variables;
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
    "concreteType": "RemoveKartFromCircuitPayload",
    "kind": "LinkedField",
    "name": "removeKartFromCircuit",
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
    "name": "CircuitKartsCardRemoveKartFromCircuitMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CircuitKartsCardRemoveKartFromCircuitMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "4df2bfe8c6b37cdf8defc6f3bcfa1f63",
    "id": null,
    "metadata": {},
    "name": "CircuitKartsCardRemoveKartFromCircuitMutation",
    "operationKind": "mutation",
    "text": "mutation CircuitKartsCardRemoveKartFromCircuitMutation(\n  $circuitId: ID!\n  $kartId: ID!\n) {\n  removeKartFromCircuit(circuitId: $circuitId, kartId: $kartId) {\n    circuit {\n      id\n      karts {\n        id\n        name\n      }\n    }\n    kart {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "ea8c592d2ae04a4ba1b9f1d5b127ec00";

export default node;
