/**
 * @generated SignedSource<<e5889aebf5ea618f2e9b360a4f409291>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TrackKartsCardRemoveKartFromCircuitMutation$variables = {
  circuitId: string;
  kartId: string;
};
export type TrackKartsCardRemoveKartFromCircuitMutation$data = {
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
export type TrackKartsCardRemoveKartFromCircuitMutation = {
  response: TrackKartsCardRemoveKartFromCircuitMutation$data;
  variables: TrackKartsCardRemoveKartFromCircuitMutation$variables;
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
    "name": "TrackKartsCardRemoveKartFromCircuitMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TrackKartsCardRemoveKartFromCircuitMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "f9bc3f57544dc02f8ad37e8ead3165a4",
    "id": null,
    "metadata": {},
    "name": "TrackKartsCardRemoveKartFromCircuitMutation",
    "operationKind": "mutation",
    "text": "mutation TrackKartsCardRemoveKartFromCircuitMutation(\n  $circuitId: ID!\n  $kartId: ID!\n) {\n  removeKartFromCircuit(circuitId: $circuitId, kartId: $kartId) {\n    circuit {\n      id\n      karts {\n        id\n        name\n      }\n    }\n    kart {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "0c50d55a3ab4641a0e9359d48c201852";

export default node;
