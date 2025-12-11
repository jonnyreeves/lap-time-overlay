/**
 * @generated SignedSource<<e3cce0ae563b17ec9e318a87025aa71e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TrackViewPageQuery$variables = {
  trackId: string;
};
export type TrackViewPageQuery$data = {
  readonly track: {
    readonly id: string;
    readonly name: string;
    readonly " $fragmentSpreads": FragmentRefs<"TrackKartsCard_circuit" | "TrackLayoutCard_circuit">;
  } | null | undefined;
};
export type TrackViewPageQuery = {
  response: TrackViewPageQuery$data;
  variables: TrackViewPageQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "trackId"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "trackId"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v4 = [
  (v2/*: any*/),
  (v3/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "TrackViewPageQuery",
    "selections": [
      {
        "alias": "track",
        "args": (v1/*: any*/),
        "concreteType": "Circuit",
        "kind": "LinkedField",
        "name": "circuit",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          (v3/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "TrackKartsCard_circuit"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "TrackLayoutCard_circuit"
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TrackViewPageQuery",
    "selections": [
      {
        "alias": "track",
        "args": (v1/*: any*/),
        "concreteType": "Circuit",
        "kind": "LinkedField",
        "name": "circuit",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          (v3/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Kart",
            "kind": "LinkedField",
            "name": "karts",
            "plural": true,
            "selections": (v4/*: any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TrackLayout",
            "kind": "LinkedField",
            "name": "trackLayouts",
            "plural": true,
            "selections": (v4/*: any*/),
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "60372da2b227b02212a710e771dd7d65",
    "id": null,
    "metadata": {},
    "name": "TrackViewPageQuery",
    "operationKind": "query",
    "text": "query TrackViewPageQuery(\n  $trackId: ID!\n) {\n  track: circuit(id: $trackId) {\n    id\n    name\n    ...TrackKartsCard_circuit\n    ...TrackLayoutCard_circuit\n  }\n}\n\nfragment TrackKartsCard_circuit on Circuit {\n  id\n  name\n  karts {\n    id\n    name\n  }\n}\n\nfragment TrackLayoutCard_circuit on Circuit {\n  id\n  name\n  trackLayouts {\n    id\n    name\n  }\n}\n"
  }
};
})();

(node as any).hash = "91e9ed8d64d8cf3535bcf14db02500f6";

export default node;
