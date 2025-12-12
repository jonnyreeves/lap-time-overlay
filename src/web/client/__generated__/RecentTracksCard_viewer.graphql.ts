/**
 * @generated SignedSource<<5347b66b6d25066fd0c92c46616fd8be>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type RecentTracksCard_viewer$data = {
  readonly id: string;
  readonly recentTracks: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly heroImage: string | null | undefined;
        readonly id: string;
        readonly name: string;
        readonly personalBestEntries: ReadonlyArray<{
          readonly conditions: string;
          readonly kart: {
            readonly id: string;
            readonly name: string;
          };
          readonly lapTime: number;
          readonly trackLayout: {
            readonly id: string;
            readonly name: string;
          };
          readonly trackSessionId: string;
        }>;
      };
    }>;
  };
  readonly " $fragmentType": "RecentTracksCard_viewer";
};
export type RecentTracksCard_viewer$key = {
  readonly " $data"?: RecentTracksCard_viewer$data;
  readonly " $fragmentSpreads": FragmentRefs<"RecentTracksCard_viewer">;
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
          "recentTracks"
        ]
      }
    ]
  },
  "name": "RecentTracksCard_viewer",
  "selections": [
    (v0/*: any*/),
    {
      "alias": "recentTracks",
      "args": null,
      "concreteType": "TrackConnection",
      "kind": "LinkedField",
      "name": "__RecentTracksCard_recentTracks_connection",
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
                (v1/*: any*/),
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "heroImage",
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
                    }
                  ],
                  "storageKey": null
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

(node as any).hash = "f39c39f29f2581f28b6016e376822f3b";

export default node;
