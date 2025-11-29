/**
 * @generated SignedSource<<f5e08e048b03e57b6480032a55e9adef>>
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
  readonly " $fragmentSpreads": FragmentRefs<"RecentCircuitsCard_viewer" | "RecentSessionsCard_viewer">;
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

(node as any).hash = "c39b2ddb6dec9bd05585b4c324827994";

export default node;
