/**
 * @generated SignedSource<<55668ea2cdd3f3ee9750dab8b2cc4333>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CircuitTrackLayoutsCardRemoveTrackLayoutFromCircuitMutation$variables = {
  circuitId: string;
  trackLayoutId: string;
};
export type CircuitTrackLayoutsCardRemoveTrackLayoutFromCircuitMutation$data = {
  readonly removeTrackLayoutFromCircuit: {
    readonly circuit: {
      readonly id: string;
      readonly trackLayouts: ReadonlyArray<{
        readonly id: string;
        readonly name: string;
      }>;
    };
    readonly trackLayout: {
      readonly id: string;
      readonly name: string;
    };
  };
};
export type CircuitTrackLayoutsCardRemoveTrackLayoutFromCircuitMutation = {
  response: CircuitTrackLayoutsCardRemoveTrackLayoutFromCircuitMutation$data;
  variables: CircuitTrackLayoutsCardRemoveTrackLayoutFromCircuitMutation$variables;
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
    "name": "trackLayoutId"
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
  (v1/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "name",
    "storageKey": null
  }
],
v3 = [
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
        "name": "trackLayoutId",
        "variableName": "trackLayoutId"
      }
    ],
    "concreteType": "RemoveTrackLayoutFromCircuitPayload",
    "kind": "LinkedField",
    "name": "removeTrackLayoutFromCircuit",
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
            "concreteType": "TrackLayout",
            "kind": "LinkedField",
            "name": "trackLayouts",
            "plural": true,
            "selections": (v2/*: any*/),
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "TrackLayout",
        "kind": "LinkedField",
        "name": "trackLayout",
        "plural": false,
        "selections": (v2/*: any*/),
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
    "name": "CircuitTrackLayoutsCardRemoveTrackLayoutFromCircuitMutation",
    "selections": (v3/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CircuitTrackLayoutsCardRemoveTrackLayoutFromCircuitMutation",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "89187cbc1c0865e2bb8b7d36a712a2f1",
    "id": null,
    "metadata": {},
    "name": "CircuitTrackLayoutsCardRemoveTrackLayoutFromCircuitMutation",
    "operationKind": "mutation",
    "text": "mutation CircuitTrackLayoutsCardRemoveTrackLayoutFromCircuitMutation(\n  $circuitId: ID!\n  $trackLayoutId: ID!\n) {\n  removeTrackLayoutFromCircuit(circuitId: $circuitId, trackLayoutId: $trackLayoutId) {\n    circuit {\n      id\n      trackLayouts {\n        id\n        name\n      }\n    }\n    trackLayout {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "207e7bfbdfa3042f3fc58327e63d3d38";

export default node;
