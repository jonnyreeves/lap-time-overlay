/**
 * @generated SignedSource<<0dabf851d9ffda533ea15a9985b71761>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TrackSessionsTable_query$data = {
  readonly tracks: ReadonlyArray<{
    readonly id: string;
    readonly karts: ReadonlyArray<{
      readonly id: string;
      readonly name: string;
    }>;
    readonly name: string;
    readonly trackLayouts: ReadonlyArray<{
      readonly id: string;
      readonly name: string;
    }>;
  }>;
  readonly viewer: {
    readonly id: string;
    readonly recentTrackSessions: {
      readonly edges: ReadonlyArray<{
        readonly cursor: string;
        readonly node: {
          readonly classification: number;
          readonly conditions: string;
          readonly consistencyScore: number | null | undefined;
          readonly date: string;
          readonly format: string;
          readonly id: string;
          readonly kart: {
            readonly id: string;
            readonly name: string;
          } | null | undefined;
          readonly laps: ReadonlyArray<{
            readonly id: string;
            readonly personalBest: number | null | undefined;
          }>;
          readonly track: {
            readonly id: string;
            readonly name: string;
          };
          readonly trackLayout: {
            readonly id: string;
            readonly name: string;
          };
          readonly trackRecordings: ReadonlyArray<{
            readonly id: string;
          }>;
        };
      }>;
      readonly pageInfo: {
        readonly endCursor: string | null | undefined;
        readonly hasNextPage: boolean;
      };
    };
  } | null | undefined;
  readonly " $fragmentType": "TrackSessionsTable_query";
};
export type TrackSessionsTable_query$key = {
  readonly " $data"?: TrackSessionsTable_query$data;
  readonly " $fragmentSpreads": FragmentRefs<"TrackSessionsTable_query">;
};

import TrackSessionsTablePaginationQuery_graphql from './TrackSessionsTablePaginationQuery.graphql';

const node: ReaderFragment = (function(){
var v0 = [
  "viewer",
  "recentTrackSessions"
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v3 = [
  (v1/*: any*/),
  (v2/*: any*/)
],
v4 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 1
  }
];
return {
  "argumentDefinitions": [
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
  "kind": "Fragment",
  "metadata": {
    "connection": [
      {
        "count": "first",
        "cursor": "after",
        "direction": "forward",
        "path": (v0/*: any*/)
      }
    ],
    "refetch": {
      "connection": {
        "forward": {
          "count": "first",
          "cursor": "after"
        },
        "backward": null,
        "path": (v0/*: any*/)
      },
      "fragmentPathInResult": [],
      "operation": TrackSessionsTablePaginationQuery_graphql
    }
  },
  "name": "TrackSessionsTable_query",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "Track",
      "kind": "LinkedField",
      "name": "tracks",
      "plural": true,
      "selections": [
        (v1/*: any*/),
        (v2/*: any*/),
        {
          "alias": null,
          "args": null,
          "concreteType": "Kart",
          "kind": "LinkedField",
          "name": "karts",
          "plural": true,
          "selections": (v3/*: any*/),
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "TrackLayout",
          "kind": "LinkedField",
          "name": "trackLayouts",
          "plural": true,
          "selections": (v3/*: any*/),
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
        (v1/*: any*/),
        {
          "alias": "recentTrackSessions",
          "args": [
            {
              "kind": "Variable",
              "name": "filter",
              "variableName": "filter"
            },
            {
              "kind": "Variable",
              "name": "sort",
              "variableName": "sort"
            }
          ],
          "concreteType": "TrackSessionConnection",
          "kind": "LinkedField",
          "name": "__TrackSessionsTable_recentTrackSessions_connection",
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
                    (v1/*: any*/),
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
                      "args": null,
                      "kind": "ScalarField",
                      "name": "consistencyScore",
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
                        (v1/*: any*/),
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
                        (v1/*: any*/)
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
        }
      ],
      "storageKey": null
    }
  ],
  "type": "Query",
  "abstractKey": null
};
})();

(node as any).hash = "10c57a1e80830a03d556ab6456481f3d";

export default node;
