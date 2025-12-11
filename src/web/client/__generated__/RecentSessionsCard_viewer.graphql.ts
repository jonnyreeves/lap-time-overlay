/**
 * @generated SignedSource<<7b594eaabbd4d00060f17c38dbd5bee4>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type RecentSessionsCard_viewer$data = {
  readonly id: string;
  readonly recentTrackSessions: {
    readonly edges: ReadonlyArray<{
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
        readonly notes: string | null | undefined;
        readonly track: {
          readonly id: string;
          readonly name: string;
        };
        readonly trackLayout: {
          readonly id: string;
          readonly name: string;
        };
      };
    }>;
  };
  readonly " $fragmentType": "RecentSessionsCard_viewer";
};
export type RecentSessionsCard_viewer$key = {
  readonly " $data"?: RecentSessionsCard_viewer$data;
  readonly " $fragmentSpreads": FragmentRefs<"RecentSessionsCard_viewer">;
};

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v2 = [
  (v0/*: any*/),
  (v1/*: any*/)
];
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "connection": [
      {
        "count": null,
        "cursor": null,
        "direction": "forward",
        "path": [
          "recentTrackSessions"
        ]
      }
    ]
  },
  "name": "RecentSessionsCard_viewer",
  "selections": [
    (v0/*: any*/),
    {
      "alias": "recentTrackSessions",
      "args": null,
      "concreteType": "TrackSessionConnection",
      "kind": "LinkedField",
      "name": "__RecentSessionsCard_recentTrackSessions_connection",
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
                  "alias": "track",
                  "args": null,
                  "concreteType": "Circuit",
                  "kind": "LinkedField",
                  "name": "circuit",
                  "plural": false,
                  "selections": [
                    (v1/*: any*/),
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
                    {
                      "alias": null,
                      "args": null,
                      "kind": "ScalarField",
                      "name": "personalBest",
                      "storageKey": null
                    },
                    (v0/*: any*/)
                  ],
                  "storageKey": "laps(first:1)"
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
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "cursor",
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
        }
      ],
      "storageKey": null
    }
  ],
  "type": "User",
  "abstractKey": null
};
})();

(node as any).hash = "1d0e98cf41dbca73f0663d92af51dc75";

export default node;
