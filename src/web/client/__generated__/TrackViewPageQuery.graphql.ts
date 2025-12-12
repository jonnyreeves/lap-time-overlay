/**
 * @generated SignedSource<<d0f575db2fd0de567a3ef55169b7c22f>>
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
    readonly heroImage: string | null | undefined;
    readonly id: string;
    readonly name: string;
    readonly " $fragmentSpreads": FragmentRefs<"TrackKartsCard_track" | "TrackLayoutCard_track" | "TrackPersonalBestsCard_track">;
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
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "heroImage",
  "storageKey": null
},
v5 = [
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
          (v4/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "TrackKartsCard_track"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "TrackLayoutCard_track"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "TrackPersonalBestsCard_track"
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
          (v4/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Kart",
            "kind": "LinkedField",
            "name": "karts",
            "plural": true,
            "selections": (v5/*: any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TrackLayout",
            "kind": "LinkedField",
            "name": "trackLayouts",
            "plural": true,
            "selections": (v5/*: any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TrackPersonalBest",
            "kind": "LinkedField",
            "name": "personalBestEntries",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "trackSessionId",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "conditions",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "lapTime",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Kart",
                "kind": "LinkedField",
                "name": "kart",
                "plural": false,
                "selections": (v5/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "TrackLayout",
                "kind": "LinkedField",
                "name": "trackLayout",
                "plural": false,
                "selections": (v5/*: any*/),
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "0606107b312a13e2f4d4fb1ddf76ea11",
    "id": null,
    "metadata": {},
    "name": "TrackViewPageQuery",
    "operationKind": "query",
    "text": "query TrackViewPageQuery(\n  $trackId: ID!\n) {\n  track(id: $trackId) {\n    id\n    name\n    heroImage\n    ...TrackKartsCard_track\n    ...TrackLayoutCard_track\n    ...TrackPersonalBestsCard_track\n  }\n}\n\nfragment TrackKartsCard_track on Track {\n  id\n  name\n  karts {\n    id\n    name\n  }\n}\n\nfragment TrackLayoutCard_track on Track {\n  id\n  name\n  trackLayouts {\n    id\n    name\n  }\n}\n\nfragment TrackPersonalBestsCard_track on Track {\n  id\n  name\n  heroImage\n  personalBestEntries {\n    trackSessionId\n    conditions\n    lapTime\n    kart {\n      id\n      name\n    }\n    trackLayout {\n      id\n      name\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "7490c9d91f1b0728d869af569dab5781";

export default node;
