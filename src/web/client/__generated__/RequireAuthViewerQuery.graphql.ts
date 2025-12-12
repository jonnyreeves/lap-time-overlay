/**
 * @generated SignedSource<<d51cb3c8a3c9ffd2f0b803a521fd0396>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type RequireAuthViewerQuery$variables = Record<PropertyKey, never>;
export type RequireAuthViewerQuery$data = {
  readonly viewer: {
    readonly " $fragmentSpreads": FragmentRefs<"HomePage_viewer" | "SiteHeader_viewer">;
  } | null | undefined;
};
export type RequireAuthViewerQuery = {
  response: RequireAuthViewerQuery$data;
  variables: RequireAuthViewerQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 5
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "personalBest",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "concreteType": "PageInfo",
  "kind": "LinkedField",
  "name": "pageInfo",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "endCursor",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "hasNextPage",
      "storageKey": null
    }
  ],
  "storageKey": null
},
v7 = [
  (v0/*: any*/),
  (v2/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "RequireAuthViewerQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "viewer",
        "plural": false,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "HomePage_viewer"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "SiteHeader_viewer"
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
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "RequireAuthViewerQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "viewer",
        "plural": false,
        "selections": [
          (v0/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "username",
            "storageKey": null
          },
          {
            "alias": null,
            "args": (v1/*: any*/),
            "concreteType": "TrackConnection",
            "kind": "LinkedField",
            "name": "recentTracks",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "TrackEdge",
                "kind": "LinkedField",
                "name": "edges",
                "plural": true,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Track",
                    "kind": "LinkedField",
                    "name": "node",
                    "plural": false,
                    "selections": [
                      (v0/*: any*/),
                      (v2/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "heroImage",
                        "storageKey": null
                      },
                      (v3/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "personalBestDry",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "personalBestWet",
                        "storageKey": null
                      },
                      (v4/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v5/*: any*/)
                ],
                "storageKey": null
              },
              (v6/*: any*/)
            ],
            "storageKey": "recentTracks(first:5)"
          },
          {
            "alias": null,
            "args": (v1/*: any*/),
            "filters": null,
            "handle": "connection",
            "key": "RecentTracksCard_recentTracks",
            "kind": "LinkedHandle",
            "name": "recentTracks"
          },
          {
            "alias": null,
            "args": (v1/*: any*/),
            "concreteType": "TrackSessionConnection",
            "kind": "LinkedField",
            "name": "recentTrackSessions",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "TrackSessionEdge",
                "kind": "LinkedField",
                "name": "edges",
                "plural": true,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "TrackSession",
                    "kind": "LinkedField",
                    "name": "node",
                    "plural": false,
                    "selections": [
                      (v0/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "date",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "format",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "classification",
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
                        "name": "notes",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "Track",
                        "kind": "LinkedField",
                        "name": "track",
                        "plural": false,
                        "selections": [
                          (v2/*: any*/),
                          (v0/*: any*/)
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
                        "selections": (v7/*: any*/),
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "Kart",
                        "kind": "LinkedField",
                        "name": "kart",
                        "plural": false,
                        "selections": (v7/*: any*/),
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": [
                          {
                            "kind": "Literal",
                            "name": "first",
                            "value": 1
                          }
                        ],
                        "concreteType": "Lap",
                        "kind": "LinkedField",
                        "name": "laps",
                        "plural": true,
                        "selections": [
                          (v3/*: any*/),
                          (v0/*: any*/)
                        ],
                        "storageKey": "laps(first:1)"
                      },
                      (v4/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v5/*: any*/)
                ],
                "storageKey": null
              },
              (v6/*: any*/)
            ],
            "storageKey": "recentTrackSessions(first:5)"
          },
          {
            "alias": null,
            "args": (v1/*: any*/),
            "filters": null,
            "handle": "connection",
            "key": "RecentSessionsCard_recentTrackSessions",
            "kind": "LinkedHandle",
            "name": "recentTrackSessions"
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "9624361351ca7bc2b7fb353ffd053e8a",
    "id": null,
    "metadata": {},
    "name": "RequireAuthViewerQuery",
    "operationKind": "query",
    "text": "query RequireAuthViewerQuery {\n  viewer {\n    ...HomePage_viewer\n    ...SiteHeader_viewer\n    id\n  }\n}\n\nfragment HomePage_viewer on User {\n  id\n  username\n  ...RecentTracksCard_viewer\n  ...RecentSessionsCard_viewer\n}\n\nfragment RecentSessionsCard_viewer on User {\n  id\n  recentTrackSessions(first: 5) {\n    edges {\n      node {\n        id\n        date\n        format\n        classification\n        conditions\n        notes\n        track {\n          name\n          id\n        }\n        trackLayout {\n          id\n          name\n        }\n        kart {\n          id\n          name\n        }\n        laps(first: 1) {\n          personalBest\n          id\n        }\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment RecentTracksCard_viewer on User {\n  id\n  recentTracks(first: 5) {\n    edges {\n      node {\n        id\n        name\n        heroImage\n        personalBest\n        personalBestDry\n        personalBestWet\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment SiteHeader_viewer on User {\n  id\n  username\n}\n"
  }
};
})();

(node as any).hash = "26381b15cc55842b9b8b203dcf6b33ba";

export default node;
