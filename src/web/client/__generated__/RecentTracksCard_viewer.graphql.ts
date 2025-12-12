/**
 * @generated SignedSource<<29ad018b2a59f33deb5cab5ee475eb3a>>
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
        readonly personalBest: number | null | undefined;
        readonly personalBestDry: number | null | undefined;
        readonly personalBestWet: number | null | undefined;
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
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "name",
                  "storageKey": null
                },
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
                  "kind": "ScalarField",
                  "name": "personalBest",
                  "storageKey": null
                },
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

(node as any).hash = "c6f653c88620e4196bc994e3bba84a52";

export default node;
