/**
 * @generated SignedSource<<1d54d1dbf5dc5d843e21003a743e680a>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TrackLayoutCardRemoveTrackLayoutFromCircuitMutation$variables = {
  circuitId: string;
  trackLayoutId: string;
};
export type TrackLayoutCardRemoveTrackLayoutFromCircuitMutation$data = {
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
export type TrackLayoutCardRemoveTrackLayoutFromCircuitMutation = {
  response: TrackLayoutCardRemoveTrackLayoutFromCircuitMutation$data;
  variables: TrackLayoutCardRemoveTrackLayoutFromCircuitMutation$variables;
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
    "name": "TrackLayoutCardRemoveTrackLayoutFromCircuitMutation",
    "selections": (v3/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TrackLayoutCardRemoveTrackLayoutFromCircuitMutation",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "c72bc7c500ea507b2ba9ba117153462c",
    "id": null,
    "metadata": {},
    "name": "TrackLayoutCardRemoveTrackLayoutFromCircuitMutation",
    "operationKind": "mutation",
    "text": "mutation TrackLayoutCardRemoveTrackLayoutFromCircuitMutation(\n  $circuitId: ID!\n  $trackLayoutId: ID!\n) {\n  removeTrackLayoutFromCircuit(circuitId: $circuitId, trackLayoutId: $trackLayoutId) {\n    circuit {\n      id\n      trackLayouts {\n        id\n        name\n      }\n    }\n    trackLayout {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "48ae9917eac432987c9a29206ffcd8bd";

export default node;
