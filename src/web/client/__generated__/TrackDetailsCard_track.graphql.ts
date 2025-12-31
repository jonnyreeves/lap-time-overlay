/**
 * @generated SignedSource<<86074f96e9518855f1650b6b9a62ac7d>>
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
  readonly isIndoors: boolean;
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
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "isIndoors",
      "storageKey": null
    }
  ],
  "type": "Track",
  "abstractKey": null
};

(node as any).hash = "c77b88e5bace5af07f32c1ac57c0e815";

export default node;
