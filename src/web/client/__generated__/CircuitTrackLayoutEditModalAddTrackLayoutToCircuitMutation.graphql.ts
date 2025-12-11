/**
 * @generated SignedSource<<b0e5b7fb91115204324bb8c023b56f90>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateTrackLayoutInput = {
  name: string;
};
export type CircuitTrackLayoutEditModalAddTrackLayoutToCircuitMutation$variables = {
  circuitId: string;
  input: CreateTrackLayoutInput;
};
export type CircuitTrackLayoutEditModalAddTrackLayoutToCircuitMutation$data = {
  readonly addTrackLayoutToCircuit: {
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
export type CircuitTrackLayoutEditModalAddTrackLayoutToCircuitMutation = {
  response: CircuitTrackLayoutEditModalAddTrackLayoutToCircuitMutation$data;
  variables: CircuitTrackLayoutEditModalAddTrackLayoutToCircuitMutation$variables;
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
    "name": "input"
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
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "AddTrackLayoutToCircuitPayload",
    "kind": "LinkedField",
    "name": "addTrackLayoutToCircuit",
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
    "name": "CircuitTrackLayoutEditModalAddTrackLayoutToCircuitMutation",
    "selections": (v3/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CircuitTrackLayoutEditModalAddTrackLayoutToCircuitMutation",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "4fd01ddb75977fe86b47e0ce0bd0baf2",
    "id": null,
    "metadata": {},
    "name": "CircuitTrackLayoutEditModalAddTrackLayoutToCircuitMutation",
    "operationKind": "mutation",
    "text": "mutation CircuitTrackLayoutEditModalAddTrackLayoutToCircuitMutation(\n  $circuitId: ID!\n  $input: CreateTrackLayoutInput!\n) {\n  addTrackLayoutToCircuit(circuitId: $circuitId, input: $input) {\n    circuit {\n      id\n      trackLayouts {\n        id\n        name\n      }\n    }\n    trackLayout {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "6289aa72368f3b78c7db1ec6b2bafee0";

export default node;
