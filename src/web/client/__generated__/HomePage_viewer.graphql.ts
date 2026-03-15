/**
 * @generated SignedSource<<ff2c61b2973a52a549e5876193cce497>>
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
  readonly " $fragmentSpreads": FragmentRefs<"RecentSessionsCard_viewer" | "RecentTracksCard_viewer" | "RivalsTeaserCard_viewer">;
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
      "name": "RivalsTeaserCard_viewer"
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

(node as any).hash = "f678a51b12225baa6643703b86575f1a";

export default node;
