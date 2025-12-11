/**
 * @generated SignedSource<<07541b97b3642c7ceac23a3f0948a63b>>
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
        readonly laps: ReadonlyArray<{
          readonly id: string;
          readonly personalBest: number | null | undefined;
        }>;
        readonly notes: string | null | undefined;
        readonly track: {
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
};
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
                    {
                      "alias": null,
                      "args": null,
                      "kind": "ScalarField",
                      "name": "name",
                      "storageKey": null
                    },
                    (v0/*: any*/)
                  ],
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

(node as any).hash = "c495aed0d408367bd7d03d2c5729856f";

export default node;
