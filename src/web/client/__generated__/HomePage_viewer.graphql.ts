/**
 * @generated SignedSource<<8bd27ea4ac06b8df1cc8c2609c140c47>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type HomePage_viewer$data = {
  readonly id: string;
  readonly username: string;
  readonly " $fragmentSpreads": FragmentRefs<"RecentCircuitsCard_viewer">;
  readonly " $fragmentType": "HomePage_viewer";
};
export type HomePage_viewer$key = {
  readonly " $data"?: HomePage_viewer$data;
  readonly " $fragmentSpreads": FragmentRefs<"HomePage_viewer">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "HomePage_viewer",
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
      "name": "username",
      "storageKey": null
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "RecentCircuitsCard_viewer"
    }
  ],
  "type": "User",
  "abstractKey": null
};

(node as any).hash = "9bb7a53c1c2a0cc72595cd5f8063afdb";

export default node;
