/**
 * @generated SignedSource<<0f3d7a869b18051ee541f710a7ec90dd>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type listQuery$variables = {
  first?: number | null | undefined;
};
export type listQuery$data = {
  readonly " $fragmentSpreads": FragmentRefs<"TrackSessionsTable_query">;
};
export type listQuery = {
  response: listQuery$data;
  variables: listQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": 20,
    "kind": "LocalArgument",
    "name": "first"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "first"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = [
  (v2/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "name",
    "storageKey": null
  }
],
v4 = [
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
    "name": "listQuery",
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
    "name": "listQuery",
    "selections": [
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
                        "selections": (v3/*: any*/),
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "TrackLayout",
                        "kind": "LinkedField",
                        "name": "trackLayout",
                        "plural": false,
                        "selections": (v3/*: any*/),
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "Kart",
                        "kind": "LinkedField",
                        "name": "kart",
                        "plural": false,
                        "selections": (v3/*: any*/),
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": (v4/*: any*/),
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
                        "args": (v4/*: any*/),
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
            "filters": null,
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
    "cacheID": "b854089cb5fd579318d7bf5a9eda337d",
    "id": null,
    "metadata": {},
    "name": "listQuery",
    "operationKind": "query",
    "text": "query listQuery(\n  $first: Int = 20\n) {\n  ...TrackSessionsTable_query_3ASum4\n}\n\nfragment TrackSessionsTable_query_3ASum4 on Query {\n  viewer {\n    id\n    recentTrackSessions(first: $first) {\n      edges {\n        cursor\n        node {\n          id\n          date\n          format\n          classification\n          conditions\n          track {\n            id\n            name\n          }\n          trackLayout {\n            id\n            name\n          }\n          kart {\n            id\n            name\n          }\n          laps(first: 1) {\n            id\n            personalBest\n          }\n          trackRecordings(first: 1) {\n            id\n          }\n          __typename\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "c425ba9262fb98c95748008b4967f7e2";

export default node;
