/**
 * @generated SignedSource<<eca860c40d2994f5bf48c06cf810c4cd>>
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
    readonly " $fragmentSpreads": FragmentRefs<"TrackDetailsCard_track" | "TrackKartsCard_track" | "TrackLayoutCard_track" | "TrackPersonalBestsCard_track" | "TrackVisitStatsCard_track">;
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
],
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "conditions",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "concreteType": "Kart",
  "kind": "LinkedField",
  "name": "kart",
  "plural": false,
  "selections": (v5/*: any*/),
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "concreteType": "TrackLayout",
  "kind": "LinkedField",
  "name": "trackLayout",
  "plural": false,
  "selections": (v5/*: any*/),
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "count",
  "storageKey": null
};
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
            "name": "TrackDetailsCard_track"
          },
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
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "TrackVisitStatsCard_track"
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
            "kind": "ScalarField",
            "name": "postcode",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "isIndoors",
            "storageKey": null
          },
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
              (v6/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "lapTime",
                "storageKey": null
              },
              (v7/*: any*/),
              (v8/*: any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TrackSessionStats",
            "kind": "LinkedField",
            "name": "sessionStats",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "totalSessions",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "TrackSessionKartStat",
                "kind": "LinkedField",
                "name": "byKart",
                "plural": true,
                "selections": [
                  (v9/*: any*/),
                  (v7/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "TrackSessionLayoutStat",
                "kind": "LinkedField",
                "name": "byTrackLayout",
                "plural": true,
                "selections": [
                  (v9/*: any*/),
                  (v8/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "TrackSessionConditionStat",
                "kind": "LinkedField",
                "name": "byCondition",
                "plural": true,
                "selections": [
                  (v6/*: any*/),
                  (v9/*: any*/)
                ],
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
    "cacheID": "2772559ae02573ab35dcade0048285f5",
    "id": null,
    "metadata": {},
    "name": "TrackViewPageQuery",
    "operationKind": "query",
    "text": "query TrackViewPageQuery(\n  $trackId: ID!\n) {\n  track(id: $trackId) {\n    id\n    name\n    heroImage\n    ...TrackDetailsCard_track\n    ...TrackKartsCard_track\n    ...TrackLayoutCard_track\n    ...TrackPersonalBestsCard_track\n    ...TrackVisitStatsCard_track\n  }\n}\n\nfragment TrackDetailsCard_track on Track {\n  id\n  name\n  postcode\n  isIndoors\n}\n\nfragment TrackKartsCard_track on Track {\n  id\n  name\n  karts {\n    id\n    name\n  }\n}\n\nfragment TrackLayoutCard_track on Track {\n  id\n  name\n  trackLayouts {\n    id\n    name\n  }\n}\n\nfragment TrackPersonalBestsCard_track on Track {\n  id\n  name\n  heroImage\n  postcode\n  personalBestEntries {\n    trackSessionId\n    conditions\n    lapTime\n    kart {\n      id\n      name\n    }\n    trackLayout {\n      id\n      name\n    }\n  }\n}\n\nfragment TrackVisitStatsCard_track on Track {\n  id\n  name\n  sessionStats {\n    totalSessions\n    byKart {\n      count\n      kart {\n        id\n        name\n      }\n    }\n    byTrackLayout {\n      count\n      trackLayout {\n        id\n        name\n      }\n    }\n    byCondition {\n      conditions\n      count\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "ad11ee369ce75762a61e5bba94de8580";

export default node;
