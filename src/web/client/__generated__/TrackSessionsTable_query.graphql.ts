/**
 * @generated SignedSource<<98902eca825832a04934afb98829d29c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TrackSessionsTable_query$data = {
  readonly viewer: {
    readonly id: string;
    readonly recentTrackSessions: {
      readonly edges: ReadonlyArray<{
        readonly cursor: string;
        readonly node: {
          readonly classification: number;
          readonly conditions: string;
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
      "defaultValue": 20,
      "kind": "LocalArgument",
      "name": "first"
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
      "concreteType": "User",
      "kind": "LinkedField",
      "name": "viewer",
      "plural": false,
      "selections": [
        (v1/*: any*/),
        {
          "alias": "recentTrackSessions",
          "args": null,
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
                      "selections": (v2/*: any*/),
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
                    },
                    {
                      "alias": null,
                      "args": null,
                      "concreteType": "Kart",
                      "kind": "LinkedField",
                      "name": "kart",
                      "plural": false,
                      "selections": (v2/*: any*/),
                      "storageKey": null
                    },
                    {
                      "alias": null,
                      "args": (v3/*: any*/),
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
                      "args": (v3/*: any*/),
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

(node as any).hash = "0bf6c5fb334a9f94d31699a6e708cc4a";

export default node;
