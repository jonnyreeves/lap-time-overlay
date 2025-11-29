/**
 * @generated SignedSource<<2ffbda4852c1c64171500650cb8aa6f7>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type RecentCircuitsCard_viewer$data = {
  readonly recentCircuits: ReadonlyArray<{
    readonly heroImage: string | null | undefined;
    readonly id: string;
    readonly name: string;
  }>;
  readonly " $fragmentType": "RecentCircuitsCard_viewer";
};
export type RecentCircuitsCard_viewer$key = {
  readonly " $data"?: RecentCircuitsCard_viewer$data;
  readonly " $fragmentSpreads": FragmentRefs<"RecentCircuitsCard_viewer">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "RecentCircuitsCard_viewer",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "Circuit",
      "kind": "LinkedField",
      "name": "recentCircuits",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "id",
          "storageKey": null
        },
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
        }
      ],
      "storageKey": null
    }
  ],
  "type": "User",
  "abstractKey": null
};

(node as any).hash = "e4031c335da515eb18274b1c8c55fda0";

export default node;
