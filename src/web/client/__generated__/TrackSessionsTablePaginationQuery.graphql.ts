/**
 * @generated SignedSource<<89846167832af8d6836be47eaf1d7d6a>>
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
export type TrackSessionsTablePaginationQuery$variables = {
  after?: string | null | undefined;
  filter?: TrackSessionFilterInput | null | undefined;
  first?: number | null | undefined;
  sort?: TrackSessionSort | null | undefined;
};
export type TrackSessionsTablePaginationQuery$data = {
  readonly " $fragmentSpreads": FragmentRefs<"TrackSessionsTable_query">;
};
export type TrackSessionsTablePaginationQuery = {
  response: TrackSessionsTablePaginationQuery$data;
  variables: TrackSessionsTablePaginationQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "after"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "filter"
  },
  {
    "defaultValue": 20,
    "kind": "LocalArgument",
    "name": "first"
  },
  {
    "defaultValue": "DATE_DESC",
    "kind": "LocalArgument",
    "name": "sort"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "after",
    "variableName": "after"
  },
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
  "name": "isIndoors",
  "storageKey": null
},
v5 = [
  (v2/*: any*/),
  (v3/*: any*/)
],
v6 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 1
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "TrackSessionsTablePaginationQuery",
    "selections": [
      {
        "args": (v1/*: any*/),
        "kind": "FragmentSpread",
        "name": "TrackSessionsTable_query"
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TrackSessionsTablePaginationQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Track",
        "kind": "LinkedField",
        "name": "tracks",
        "plural": true,
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
          (v2/*: any*/),
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
                      (v2/*: any*/),
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
                        "selections": [
                          (v2/*: any*/),
                          (v3/*: any*/),
                          (v4/*: any*/)
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
                        "selections": (v5/*: any*/),
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
                        "kind": "ScalarField",
                        "name": "consistencyScore",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": (v6/*: any*/),
                        "concreteType": "Lap",
                        "kind": "LinkedField",
                        "name": "laps",
                        "plural": true,
                        "selections": [
                          (v2/*: any*/),
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
                        "args": (v6/*: any*/),
                        "concreteType": "TrackRecording",
                        "kind": "LinkedField",
                        "name": "trackRecordings",
                        "plural": true,
                        "selections": [
                          (v2/*: any*/)
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
            "args": (v1/*: any*/),
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
    "cacheID": "cb046c3a827109cd3c39e361ace2fa2c",
    "id": null,
    "metadata": {},
    "name": "TrackSessionsTablePaginationQuery",
    "operationKind": "query",
    "text": "query TrackSessionsTablePaginationQuery(\n  $after: String\n  $filter: TrackSessionFilterInput = null\n  $first: Int = 20\n  $sort: TrackSessionSort = DATE_DESC\n) {\n  ...TrackSessionsTable_query_3JsJJ3\n}\n\nfragment TrackSessionsTable_query_3JsJJ3 on Query {\n  tracks {\n    id\n    name\n    isIndoors\n    karts {\n      id\n      name\n    }\n    trackLayouts {\n      id\n      name\n    }\n  }\n  viewer {\n    id\n    recentTrackSessions(first: $first, after: $after, filter: $filter, sort: $sort) {\n      edges {\n        cursor\n        node {\n          id\n          date\n          format\n          classification\n          conditions\n          track {\n            id\n            name\n            isIndoors\n          }\n          trackLayout {\n            id\n            name\n          }\n          kart {\n            id\n            name\n          }\n          consistencyScore\n          laps(first: 1) {\n            id\n            personalBest\n          }\n          trackRecordings(first: 1) {\n            id\n          }\n          __typename\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "3654f2729911bd43b45201bd46e01d6f";

export default node;
