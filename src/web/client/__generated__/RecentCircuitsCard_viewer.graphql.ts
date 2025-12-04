/**
 * @generated SignedSource<<085f8f0eb0088039ea897a6027247852>>
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
    readonly personalBest: number | null | undefined;
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
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "personalBest",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "User",
  "abstractKey": null
};

(node as any).hash = "0c8a30b93930bb8516dae36231008696";

export default node;
