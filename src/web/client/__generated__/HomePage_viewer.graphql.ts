/**
 * @generated SignedSource<<5168d0132a44927a3283a479714c2451>>
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
  readonly " $fragmentSpreads": FragmentRefs<"RecentSessionsCard_viewer" | "RecentTracksCard_viewer">;
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
      "name": "RecentTracksCard_viewer"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "RecentSessionsCard_viewer"
    }
  ],
  "type": "User",
  "abstractKey": null
};

(node as any).hash = "c71a9c68ac135b797cf4b7f63a7ef0f5";

export default node;
