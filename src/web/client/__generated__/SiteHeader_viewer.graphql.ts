/**
 * @generated SignedSource<<91a49781b36e0a6e71b1fb968d60676e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type SiteHeader_viewer$data = {
  readonly id: string;
  readonly username: string;
  readonly " $fragmentType": "SiteHeader_viewer";
};
export type SiteHeader_viewer$key = {
  readonly " $data"?: SiteHeader_viewer$data;
  readonly " $fragmentSpreads": FragmentRefs<"SiteHeader_viewer">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "SiteHeader_viewer",
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
    }
  ],
  "type": "User",
  "abstractKey": null
};

(node as any).hash = "d1cf6dd2f2ae6246cf46d4dea8531c18";

export default node;
