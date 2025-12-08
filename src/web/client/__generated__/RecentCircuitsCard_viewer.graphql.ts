/**
 * @generated SignedSource<<581f4b3fd1dc1a14433e1c49b44359b1>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type RecentCircuitsCard_viewer$data = {
  readonly id: string;
  readonly recentCircuits: {
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
  readonly " $fragmentType": "RecentCircuitsCard_viewer";
};
export type RecentCircuitsCard_viewer$key = {
  readonly " $data"?: RecentCircuitsCard_viewer$data;
  readonly " $fragmentSpreads": FragmentRefs<"RecentCircuitsCard_viewer">;
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
          "recentCircuits"
        ]
      }
    ]
  },
  "name": "RecentCircuitsCard_viewer",
  "selections": [
    (v0/*: any*/),
    {
      "alias": "recentCircuits",
      "args": null,
      "concreteType": "CircuitConnection",
      "kind": "LinkedField",
      "name": "__RecentCircuitsCard_recentCircuits_connection",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "CircuitEdge",
          "kind": "LinkedField",
          "name": "edges",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "concreteType": "Circuit",
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

(node as any).hash = "4ce830057fb0ea4ba95aefce110e31c2";

export default node;
