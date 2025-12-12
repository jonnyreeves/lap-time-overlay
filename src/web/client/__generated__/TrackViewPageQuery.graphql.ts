/**
 * @generated SignedSource<<78e5c19b1559671e57b78da6afa1daed>>
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
    readonly " $fragmentSpreads": FragmentRefs<"TrackKartsCard_track" | "TrackLayoutCard_track">;
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
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Track",
        "kind": "LinkedField",
        "name": "track",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          (v3/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "TrackKartsCard_track"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "TrackLayoutCard_track"
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
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Track",
        "kind": "LinkedField",
        "name": "track",
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
    "cacheID": "faec56fa45eb64e9dd71bec6360c3efe",
    "id": null,
    "metadata": {},
    "name": "TrackViewPageQuery",
    "operationKind": "query",
    "text": "query TrackViewPageQuery(\n  $trackId: ID!\n) {\n  track(id: $trackId) {\n    id\n    name\n    ...TrackKartsCard_track\n    ...TrackLayoutCard_track\n  }\n}\n\nfragment TrackKartsCard_track on Track {\n  id\n  name\n  karts {\n    id\n    name\n  }\n}\n\nfragment TrackLayoutCard_track on Track {\n  id\n  name\n  trackLayouts {\n    id\n    name\n  }\n}\n"
  }
};
})();

(node as any).hash = "3200e7e331860b84588c96e4b0b0bc64";

export default node;
