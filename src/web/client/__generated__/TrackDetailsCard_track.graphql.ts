/**
 * @generated SignedSource<<abe1ef4f9caf8288f3fa8ebf14bd3ffb>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TrackDetailsCard_track$data = {
  readonly id: string;
  readonly name: string;
  readonly postcode: string | null | undefined;
  readonly " $fragmentType": "TrackDetailsCard_track";
};
export type TrackDetailsCard_track$key = {
  readonly " $data"?: TrackDetailsCard_track$data;
  readonly " $fragmentSpreads": FragmentRefs<"TrackDetailsCard_track">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "TrackDetailsCard_track",
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
      "name": "postcode",
      "storageKey": null
    }
  ],
  "type": "Track",
  "abstractKey": null
};

(node as any).hash = "599b4df254b44678cc284d98973a01d0";

export default node;
