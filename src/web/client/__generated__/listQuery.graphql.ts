/**
 * @generated SignedSource<<1fe0c8fcfa0e4b998de9e5e5211d4011>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TrackSessionSort = "CONSISTENCY_ASC" | "CONSISTENCY_DESC" | "DATE_ASC" | "DATE_DESC" | "FASTEST_LAP_ASC" | "FASTEST_LAP_DESC" | "%future added value";
export type TrackSessionFilterInput = {
  conditions?: string | null | undefined;
  format?: string | null | undefined;
  kartId?: string | null | undefined;
  trackId?: string | null | undefined;
  trackLayoutId?: string | null | undefined;
};
export type listQuery$variables = {
  filter?: TrackSessionFilterInput | null | undefined;
  first?: number | null | undefined;
  sort?: TrackSessionSort | null | undefined;
};
export type listQuery$data = {
  readonly " $fragmentSpreads": FragmentRefs<"TrackSessionsTable_query">;
};
export type listQuery = {
  response: listQuery$data;
  variables: listQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "filter"
},
v1 = {
  "defaultValue": 20,
  "kind": "LocalArgument",
  "name": "first"
},
v2 = {
  "defaultValue": "DATE_DESC",
  "kind": "LocalArgument",
  "name": "sort"
},
v3 = [
  {
    "kind": "Variable",
    "name": "filter",
    "variableName": "filter"
  },
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "first"
  },
  {
    "kind": "Variable",
    "name": "sort",
    "variableName": "sort"
  }
],
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v6 = [
  (v4/*: any*/),
  (v5/*: any*/)
],
v7 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 1
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "listQuery",
    "selections": [
      {
        "args": (v3/*: any*/),
        "kind": "FragmentSpread",
        "name": "TrackSessionsTable_query"
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/),
      (v2/*: any*/)
    ],
    "kind": "Operation",
    "name": "listQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Track",
        "kind": "LinkedField",
        "name": "tracks",
        "plural": true,
        "selections": [
          (v4/*: any*/),
          (v5/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Kart",
            "kind": "LinkedField",
            "name": "karts",
            "plural": true,
            "selections": (v6/*: any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TrackLayout",
            "kind": "LinkedField",
            "name": "trackLayouts",
            "plural": true,
            "selections": (v6/*: any*/),
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "viewer",
        "plural": false,
        "selections": [
          (v4/*: any*/),
          {
            "alias": null,
            "args": (v3/*: any*/),
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
                    "kind": "ScalarField",
                    "name": "cursor",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "TrackSession",
                    "kind": "LinkedField",
                    "name": "node",
                    "plural": false,
                    "selections": [
                      (v4/*: any*/),
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
                        "concreteType": "Track",
                        "kind": "LinkedField",
                        "name": "track",
                        "plural": false,
                        "selections": (v6/*: any*/),
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "TrackLayout",
                        "kind": "LinkedField",
                        "name": "trackLayout",
                        "plural": false,
                        "selections": (v6/*: any*/),
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "Kart",
                        "kind": "LinkedField",
                        "name": "kart",
                        "plural": false,
                        "selections": (v6/*: any*/),
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "consistencyScore",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": (v7/*: any*/),
                        "concreteType": "Lap",
                        "kind": "LinkedField",
                        "name": "laps",
                        "plural": true,
                        "selections": [
                          (v4/*: any*/),
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "personalBest",
                            "storageKey": null
                          }
                        ],
                        "storageKey": "laps(first:1)"
                      },
                      {
                        "alias": null,
                        "args": (v7/*: any*/),
                        "concreteType": "TrackRecording",
                        "kind": "LinkedField",
                        "name": "trackRecordings",
                        "plural": true,
                        "selections": [
                          (v4/*: any*/)
                        ],
                        "storageKey": "trackRecordings(first:1)"
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "__typename",
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
                "concreteType": "PageInfo",
                "kind": "LinkedField",
                "name": "pageInfo",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "hasNextPage",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "endCursor",
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
            "args": (v3/*: any*/),
            "filters": [
              "filter",
              "sort"
            ],
            "handle": "connection",
            "key": "TrackSessionsTable_recentTrackSessions",
            "kind": "LinkedHandle",
            "name": "recentTrackSessions"
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "2ae3e20c2cb5a314645fb4536f0261c3",
    "id": null,
    "metadata": {},
    "name": "listQuery",
    "operationKind": "query",
    "text": "query listQuery(\n  $first: Int = 20\n  $filter: TrackSessionFilterInput\n  $sort: TrackSessionSort = DATE_DESC\n) {\n  ...TrackSessionsTable_query_1bvy9D\n}\n\nfragment TrackSessionsTable_query_1bvy9D on Query {\n  tracks {\n    id\n    name\n    karts {\n      id\n      name\n    }\n    trackLayouts {\n      id\n      name\n    }\n  }\n  viewer {\n    id\n    recentTrackSessions(first: $first, filter: $filter, sort: $sort) {\n      edges {\n        cursor\n        node {\n          id\n          date\n          format\n          classification\n          conditions\n          track {\n            id\n            name\n          }\n          trackLayout {\n            id\n            name\n          }\n          kart {\n            id\n            name\n          }\n          consistencyScore\n          laps(first: 1) {\n            id\n            personalBest\n          }\n          trackRecordings(first: 1) {\n            id\n          }\n          __typename\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "73594ac3a1ac52ca297c18c3a6877973";

export default node;
